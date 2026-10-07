#!/usr/bin/env python3
# ============================================================
# ODIN AIFS SNAPSHOT — previsao por IA do ECMWF (AIFS Single)
# ------------------------------------------------------------
# Substituto sem GPU para o caminho Earth-2/FourCastNet, cujo
# endpoint hospedado deixou de aceitar estado inicial proprio.
# O ECMWF roda o modelo de IA (AIFS) nos supercomputadores dele
# e publica o resultado como dado aberto (CC BY 4.0). Aqui so:
#   1. descobrimos o ciclo mais recente com o horizonte completo;
#   2. baixamos 4 campos (2t, 10u, 10v, msl) de 6 em 6 horas;
#   3. lemos o ponto de grade mais proximo de cada cidade;
#   4. gravamos public/data/aifs-forecast.json e validamos.
# Roda em CPU, em poucos minutos, no GitHub Actions.
#
# Uso: python3 scripts/forecast/fetch_aifs.py
# Env: AIFS_HORIZON_HOURS (padrao 360 = 15 dias),
#      AIFS_SOURCES (padrao "aws,ecmwf"), ODIN_DATA_DIR
#
# Politica de rede (fail-fast + fallback): no maximo 2 tentativas por
# chamada, 30 s de espera entre elas, ignorando o Retry-After do servidor.
# Esgotou -> a fonte inteira e abandonada e a proxima e tentada do zero.
# (O padrao da biblioteca e 500 tentativas x 120 s: travava o workflow.)
# ============================================================
from __future__ import annotations

import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import aifs_core as core  # noqa: E402

PARAMS = ["2t", "10u", "10v", "msl"]
HORIZON_HOURS = int(os.environ.get("AIFS_HORIZON_HOURS", "360"))
SOURCES = [s.strip() for s in os.environ.get("AIFS_SOURCES", "aws,ecmwf").split(",") if s.strip()]
OUT_DIR = Path(os.environ.get("ODIN_DATA_DIR", "public/data"))
OUT_FILE = OUT_DIR / "aifs-forecast.json"
RETRY_ATTEMPTS = 2   # tentativas por chamada HTTP (inclui a primeira)
RETRY_WAIT_S = 30    # espera entre tentativas, em segundos


def log(msg: str) -> None:
    print(f"[aifs] {msg}", flush=True)


def make_client(source: str):
    """Cliente com retry curto: falha rapido para cair na fonte seguinte."""
    from ecmwf.opendata import Client

    return Client(
        source=source, model="aifs-single",
        maximum_retries=RETRY_ATTEMPTS, retry_after=RETRY_WAIT_S,
        use_server_retry_after=False,
    )


def download(target: Path) -> datetime:
    """Baixa o ciclo AIFS mais recente que ja tenha o horizonte completo.
    Tenta as fontes em ordem (espelho AWS primeiro; portal ECMWF como reserva)."""
    steps = list(range(0, HORIZON_HOURS + 1, core.LEAD_STEP_HOURS))
    last_err: Exception | None = None
    for source in SOURCES:
        # Descarta sobra de uma fonte anterior: a biblioteca retomaria o
        # arquivo parcial, misturando bytes de duas fontes no mesmo GRIB.
        target.unlink(missing_ok=True)
        try:
            client = make_client(source)
            # Ciclo mais recente em que o ULTIMO passo ja foi publicado
            run = client.latest(type="fc", stream="oper", step=HORIZON_HOURS, param="2t")
            log(f"fonte={source} ciclo={run.isoformat()} passos={len(steps)} campos={PARAMS}")
            client.retrieve(
                date=run, time=run.hour, type="fc", stream="oper",
                step=steps, param=PARAMS, target=str(target),
            )
            size_mb = target.stat().st_size / 1e6
            log(f"download OK: {size_mb:.0f} MB")
            return run.replace(tzinfo=timezone.utc)
        except Exception as err:  # fonte fora do ar ou ciclo incompleto
            last_err = err
            log(f"fonte={source} falhou ({type(err).__name__}: {err}) — tentando a proxima")
    target.unlink(missing_ok=True)
    raise RuntimeError(f"nenhuma fonte AIFS disponivel: {last_err}")


def extract(grib_path: Path, init_time: datetime) -> dict[str, list[dict]]:
    """Le o GRIB mensagem a mensagem e guarda so o ponto de cada cidade.
    O vizinho mais proximo vem do proprio eccodes, que conhece a grade."""
    import eccodes

    # values[(cidade, passo)][param] = valor
    values: dict[tuple[str, int], dict[str, float]] = {}
    seen_init: set[str] = set()
    with open(grib_path, "rb") as fh:
        while True:
            gid = eccodes.codes_grib_new_from_file(fh)
            if gid is None:
                break
            try:
                param = eccodes.codes_get(gid, "shortName")
                if param not in PARAMS:
                    continue
                step = int(eccodes.codes_get(gid, "step", int))
                seen_init.add(f"{eccodes.codes_get(gid, 'dataDate')}{eccodes.codes_get(gid, 'dataTime'):04d}")
                for c in core.CITIES:
                    nearest = eccodes.codes_grib_find_nearest(gid, c["lat"], c["lon"])[0]
                    values.setdefault((c["city"], step), {})[param] = float(nearest.value)
            finally:
                eccodes.codes_release(gid)

    expected_init = init_time.strftime("%Y%m%d%H%M")
    if seen_init != {expected_init}:
        raise RuntimeError(f"GRIB com ciclo inesperado: {sorted(seen_init)} (esperado {expected_init})")

    series: dict[str, list[dict]] = {c["city"]: [] for c in core.CITIES}
    for (city, step), v in sorted(values.items(), key=lambda kv: kv[0][1]):
        missing = [p for p in PARAMS if p not in v]
        if missing:
            log(f"{city} +{step}h sem {missing} — ponto descartado (o gate vai acusar)")
            continue
        series[city].append(core.to_point(init_time, step, v["2t"], v["10u"], v["10v"], v["msl"]))
    return series


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        grib = Path(tmp) / "aifs.grib2"
        init_time = download(grib)
        series = extract(grib, init_time)

    payload = core.build_payload(init_time, HORIZON_HOURS, HORIZON_HOURS, series)
    errors = core.validate(payload)
    if errors:
        print("GATE BLOQUEOU — nada foi gravado:", file=sys.stderr)
        for e in errors[:40]:
            print(f"  - {e}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
    log(f"OK {OUT_FILE} — ciclo {payload['initTime']}, {len(payload['data']['cities'])} cidades, "
        f"{HORIZON_HOURS}h de horizonte, gate PASS")
    resumo = []
    for c in payload["data"]["cities"]:
        temps = [p["t2mC"] for p in c["forecast"]]
        log(f"  {c['city']:<13} {min(temps):6.1f} a {max(temps):5.1f} °C  risco={c['riskScore']} ({c['type']})")
        resumo.append(f"{c['cityPt']} {min(temps):.0f}–{max(temps):.0f}°C")
    if os.environ.get("GITHUB_ACTIONS") == "true":
        # Aviso visivel na tela do PR/run, para conferencia humana de plausibilidade
        print(f"::notice title=AIFS {payload['initTime']}::" + " · ".join(resumo), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
