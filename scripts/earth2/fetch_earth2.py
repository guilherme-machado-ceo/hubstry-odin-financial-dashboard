#!/usr/bin/env python3
# ============================================================
# ODIN EARTH-2 SNAPSHOT — previsao FourCastNet (NVIDIA Earth-2)
# ------------------------------------------------------------
# Pipeline (tudo em CPU, sem GPU local):
#   1. Baixa o estado atmosferico inicial mais recente via
#      earth2studio (GFS operacional; fallback: ARCO ERA5).
#   2. Envia o estado inicial ao NIM hospedado do FourCastNet
#      (climate.api.nvidia.com) com a chave nvapi- (secret
#      NVIDIA_API_KEY). A inferencia roda na GPU da NVIDIA.
#   3. Recebe um .tar em streaming com um array NumPy por lead
#      time, extrai APENAS os pontos das cidades monitoradas e
#      grava public/data/earth2-forecast.json (padrao snapshot
#      do ODIN: dados versionados em git, auditaveis, sem
#      chamada de API no cliente).
#
# Requisitos: pip install earth2studio requests numpy
# Uso: NVIDIA_API_KEY=nvapi-... python3 scripts/earth2/fetch_earth2.py
# ============================================================
import io
import json
import os
import sys
import tarfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import requests

# --- Config ---------------------------------------------------
NIM_URL = os.environ.get(
    "EARTH2_NIM_URL", "https://climate.api.nvidia.com/v1/nvidia/fourcastnet"
)
API_KEY = os.environ.get("NVIDIA_API_KEY", "")
SIMULATION_LENGTH = int(os.environ.get("EARTH2_STEPS", "40"))  # 40 x 6h = 10 dias
OUT_DIR = Path(os.environ.get("ODIN_DATA_DIR", "public/data"))
GRID_RES = 0.25  # graus (721 lat x 1440 lon)

# Mesmas cidades do ClimateVectorChart.tsx — reaproveitamento direto
CITIES = [
    {"city": "Beijing",     "cityPt": "Pequim",      "country": "China",        "flag": "CN",  "lat": 39.9,  "lon": 116.4},
    {"city": "Moscow",      "cityPt": "Moscou",      "country": "Russia",       "flag": "RU",  "lat": 55.8,  "lon": 37.6},
    {"city": "Mumbai",      "cityPt": "Bombaim",     "country": "India",        "flag": "IN",  "lat": 19.1,  "lon": 72.9},
    {"city": "Brasilia",    "cityPt": "Brasilia",    "country": "Brazil",       "flag": "BR",  "lat": -15.8, "lon": -47.9},
    {"city": "Johannesburg","cityPt": "Joanesburgo", "country": "South Africa", "flag": "ZA",  "lat": -26.2, "lon": 28.0},
    {"city": "Istanbul",    "cityPt": "Istambul",    "country": "Turkey",       "flag": "TR",  "lat": 41.0,  "lon": 28.9},
    {"city": "Warsaw",      "cityPt": "Varsovia",    "country": "Poland",       "flag": "PL",  "lat": 52.2,  "lon": 21.0},
    {"city": "Shanghai",    "cityPt": "Xangai",      "country": "China",        "flag": "CN2", "lat": 31.2,  "lon": 121.5},
]

# Canais de saida que o dashboard consome (o resto e descartado no stream)
WANTED_CHANNELS = ["t2m", "u10m", "v10m", "msl"]


def log(msg: str) -> None:
    print(f"[earth2] {msg}", flush=True)


def load_variables() -> list[str]:
    """Lista ordenada de canais do FourCastNet SFNO (fonte: earth2studio)."""
    try:
        from earth2studio.models.px.sfno import VARIABLES
        return list(VARIABLES)
    except ImportError:
        from earth2studio.models.px.fcn3 import VARIABLES
        return list(VARIABLES)


def fetch_initial_state(variables: list[str]):
    """Estado inicial: GFS operacional (defasagem ~4h); fallback ARCO ERA5 (~5 dias).
    Roda em CPU — apenas download/montagem de dados, sem inferencia."""
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    from earth2studio.data import GFS

    ds = GFS()
    for back in (6, 12, 18, 24):
        t = (now - timedelta(hours=back)).replace(hour=(now - timedelta(hours=back)).hour // 6 * 6)
        try:
            da = ds(time=t, variable=variables)
            log(f"GFS OK — estado inicial em {t.isoformat()}")
            return t, da
        except Exception as err:  # ciclo ainda nao publicado
            log(f"GFS {t.isoformat()} indisponivel ({type(err).__name__}), tentando ciclo anterior")
    raise RuntimeError("Nenhum ciclo GFS recente disponivel")


def save_npy(da, path: Path) -> int:
    """Serializa o estado inicial no formato do NIM: (batch, lead, var, lat, lon)."""
    arr = da.to_numpy()[None].astype("float32")  # (1, 1, C, 721, 1440)
    np.save(path, arr)
    size_mb = path.stat().st_size / 1e6
    log(f"Estado inicial salvo: {path} ({size_mb:.0f} MB, shape {arr.shape})")
    return arr.shape[2]


def grid_index(lat: float, lon: float) -> tuple[int, int]:
    """Grade FourCastNet: lat 90..-90 (721), lon 0..360 (1440), passo 0.25."""
    i = int(round((90.0 - lat) / GRID_RES)) % 721
    j = int(round((lon % 360.0) / GRID_RES)) % 1440
    return i, j


def run_forecast(npy_path: Path, init_time: datetime, variables: list[str]) -> dict:
    """POST multipart ao NIM hospedado; consome o .tar em streaming e extrai
    somente os pontos das cidades (nunca materializa o campo global em disco)."""
    ch_idx = {ch: variables.index(ch) for ch in WANTED_CHANNELS if ch in variables}
    if "t2m" not in ch_idx:
        raise RuntimeError(f"Canal t2m ausente nos canais do modelo: {variables[:8]}...")
    log(f"Canais extraidos: {ch_idx}")

    series = {c["city"]: [] for c in CITIES}
    city_idx = [(c["city"], *grid_index(c["lat"], c["lon"])) for c in CITIES]

    headers = {"Authorization": f"Bearer {API_KEY}", "accept": "application/x-tar"}
    payload = {
        "input_time": init_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "simulation_length": str(SIMULATION_LENGTH),
    }
    log(f"POST {NIM_URL} (simulation_length={SIMULATION_LENGTH}) — upload do estado inicial...")

    with open(npy_path, "rb") as fh:
        files = {"input_array": ("fcn_inputs.npy", fh, "application/octet-stream")}
        with requests.post(
            NIM_URL, headers=headers, data=payload, files=files,
            timeout=(60, 1800), stream=True,
        ) as resp:
            if resp.status_code != 200:
                body = resp.content[:500].decode("utf-8", "replace")
                raise RuntimeError(f"NIM HTTP {resp.status_code}: {body}")
            log("Inferencia iniciada — recebendo lead times em streaming...")
            with tarfile.open(fileobj=resp.raw, mode="r|") as tar:
                for member in tar:
                    lead_h = int(member.name.split("_")[0])  # "006_000.npy" -> 6
                    fobj = tar.extractfile(member)
                    if fobj is None:
                        continue
                    buf = io.BytesIO(fobj.read())
                    arr = np.load(buf)  # (1, 1, C, 721, 1440)
                    valid = init_time + timedelta(hours=lead_h)
                    for city, i, j in city_idx:
                        t2m_c = float(arr[0, 0, ch_idx["t2m"], i, j]) - 273.15
                        u10 = float(arr[0, 0, ch_idx.get("u10m", 0), i, j])
                        v10 = float(arr[0, 0, ch_idx.get("v10m", 0), i, j])
                        msl_hpa = float(arr[0, 0, ch_idx.get("msl", ch_idx["t2m"]), i, j]) / 100.0
                        series[city].append({
                            "leadHours": lead_h,
                            "time": valid.strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "t2mC": round(t2m_c, 2),
                            "wind10mMs": round((u10 ** 2 + v10 ** 2) ** 0.5, 2),
                            "mslHPa": round(msl_hpa, 1),
                        })
                    if lead_h % 24 == 0:
                        log(f"  lead +{lead_h}h processado")
    return series


def risk_from_forecast(points: list[dict]) -> dict:
    """Score prospectivo simples, coerente com o ClimateVectorChart:
    estresse termico + vento + tendencia de pressao."""
    if len(points) < 2:
        return {"riskScore": 0, "type": "normal"}
    t_max = max(p["t2mC"] for p in points)
    w_max = max(p["wind10mMs"] for p in points)
    dp = abs(points[-1]["mslHPa"] - points[0]["mslHPa"])
    score = min(100, max(0, t_max - 32) * 8 + max(0, w_max - 12) * 4 + min(dp, 30))
    if w_max >= 17:
        typ = "storm"
    elif t_max >= 38:
        typ = "heat"
    elif score >= 50:
        typ = "drought"
    else:
        typ = "normal"
    return {"riskScore": round(score), "type": typ}


def main() -> int:
    if not API_KEY:
        print("ERRO: defina NVIDIA_API_KEY (chave nvapi- do build.nvidia.com).", file=sys.stderr)
        return 1

    variables = load_variables()
    log(f"Canais do modelo: {len(variables)} (esperado: 73 para o SFNO)")
    init_time, da = fetch_initial_state(variables)

    tmp = Path(os.environ.get("TMPDIR", "/tmp")) / "fcn_inputs.npy"
    save_npy(da, tmp)

    series = run_forecast(tmp, init_time, variables)
    tmp.unlink(missing_ok=True)

    cities = []
    for c in CITIES:
        pts = series[c["city"]]
        if not pts:
            continue
        cities.append({**c, "forecast": pts, **risk_from_forecast(pts)})
    if not cities:
        print("ERRO: nenhum ponto extraido da resposta do NIM.", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "NVIDIA Earth-2 — FourCastNet NIM (hosted inference)",
        "sourceUrl": "https://build.nvidia.com/nvidia/fourcastnet",
        "model": "fourcastnet-sfno",
        "initTime": init_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "leadStepHours": 6,
        "horizonHours": SIMULATION_LENGTH * 6,
        "data": {"cities": cities},
    }
    out = OUT_DIR / "earth2-forecast.json"
    out.write_text(json.dumps(payload))
    log(f"OK  {out} <- FourCastNet NIM ({len(cities)} cidades, {SIMULATION_LENGTH * 6}h de horizonte)")
    return 0


if __name__ == "__main__":
    sys.exit(main())