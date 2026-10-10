#!/usr/bin/env python3
# ============================================================
# ODIN OD-1 — sinal Nino 3.4 a partir do NOAA OISST v2.1 (AWS Open Data)
# ------------------------------------------------------------
# 1. lista os arquivos diarios no bucket publico (sem conta AWS);
# 2. escolhe, para cada dia, o arquivo definitivo se existir, senao o
#    preliminar (marcado como tal);
# 3. calcula a media ponderada por area da variavel "anom" na caixa
#    Nino 3.4, para os ultimos 90 dias disponiveis;
# 4. gate deterministico; so grava o JSON se passar. Falha nunca
#    sobrescreve o arquivo anterior.
#
# Sinal de MONITORAMENTO: nao e ONI/RONI (indices oficiais NOAA/CPC).
# Uso: python3 scripts/oisst/fetch_oisst.py
# Env: ODIN_DATA_DIR (padrao public/data), OISST_PREFIX_TEMPLATE
# ============================================================
from __future__ import annotations

import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enso_core as core  # noqa: E402

BUCKET_URL = "https://noaa-cdr-sea-surface-temp-optimum-interpolation-pds.s3.amazonaws.com"
PREFIX_TEMPLATE = os.environ.get("OISST_PREFIX_TEMPLATE", "data/v2.1/avhrr/{yyyymm}/")
FILE_RE = re.compile(r"oisst-avhrr-v02r01\.(\d{8})(_preliminary)?\.nc$")
OUT_DIR = Path(os.environ.get("ODIN_DATA_DIR", "public/data"))
OUT_FILE = OUT_DIR / "enso-oisst.json"
HTTP_ATTEMPTS = 2
HTTP_WAIT_S = 10
HTTP_TIMEOUT_S = 60
S3_NS = "{http://s3.amazonaws.com/doc/2006-03-01/}"


def log(msg: str) -> None:
    print(f"[oisst] {msg}", flush=True)


def http_get(url: str, params: dict | None = None) -> bytes:
    """GET com no maximo 2 tentativas; erro sobe para o chamador."""
    import requests

    last: Exception | None = None
    for attempt in range(1, HTTP_ATTEMPTS + 1):
        try:
            r = requests.get(url, params=params, timeout=HTTP_TIMEOUT_S)
            r.raise_for_status()
            return r.content
        except Exception as err:  # rede, 4xx/5xx
            last = err
            if attempt < HTTP_ATTEMPTS:
                log(f"falha ({type(err).__name__}) em {url} — nova tentativa em {HTTP_WAIT_S}s")
                time.sleep(HTTP_WAIT_S)
    raise RuntimeError(f"download falhou após {HTTP_ATTEMPTS} tentativas: {url} ({last})")


def parse_listing(xml_bytes: bytes) -> tuple[list[str], str | None]:
    """ListObjectsV2 -> (chaves, token da proxima pagina ou None)."""
    root = ET.fromstring(xml_bytes)
    keys = [el.text for el in root.iter(f"{S3_NS}Key") if el.text]
    truncated = (root.findtext(f"{S3_NS}IsTruncated") or "false").lower() == "true"
    token = root.findtext(f"{S3_NS}NextContinuationToken") if truncated else None
    return keys, token


def list_keys(prefix: str) -> list[str]:
    keys: list[str] = []
    token = None
    while True:
        params = {"list-type": "2", "prefix": prefix}
        if token:
            params["continuation-token"] = token
        page, token = parse_listing(http_get(BUCKET_URL + "/", params))
        keys += page
        if not token:
            return keys


def month_prefixes(start: date, end: date) -> list[str]:
    out, cur = [], date(start.year, start.month, 1)
    while cur <= end:
        out.append(PREFIX_TEMPLATE.format(yyyymm=cur.strftime("%Y%m")))
        cur = date(cur.year + (cur.month == 12), cur.month % 12 + 1, 1)
    return out


def choose_files(keys: list[str]) -> dict[date, tuple[str, bool]]:
    """Por dia: definitivo se existir, senao preliminar. -> {dia: (chave, preliminar?)}"""
    chosen: dict[date, tuple[str, bool]] = {}
    for key in keys:
        m = FILE_RE.search(key)
        if not m:
            continue
        d = datetime.strptime(m.group(1), "%Y%m%d").date()
        prelim = m.group(2) is not None
        if d not in chosen or (chosen[d][1] and not prelim):
            chosen[d] = (key, prelim)
    return chosen


def plan_window(chosen: dict[date, tuple[str, bool]]) -> list[date]:
    """Ultimos 90 dias terminando no dia mais recente. Lacuna = erro explicito."""
    if not chosen:
        raise RuntimeError("nenhum arquivo OISST encontrado na listagem (estrutura do bucket mudou?)")
    latest = max(chosen)
    days = [latest - timedelta(days=i) for i in range(core.WINDOW_DAYS - 1, -1, -1)]
    missing = [d.isoformat() for d in days if d not in chosen]
    if missing:
        raise RuntimeError(f"{len(missing)} dia(s) sem arquivo na janela de 90 dias: {', '.join(missing[:10])}"
                           + (" …" if len(missing) > 10 else "") + " — sem interpolação; nada gravado")
    return days


def read_anomaly(nc_bytes: bytes, name: str) -> tuple[dict, dict]:
    """Abre o netCDF em memoria; devolve (media da caixa, metadados da anomalia)."""
    import netCDF4

    with netCDF4.Dataset(name, mode="r", memory=nc_bytes) as ds:
        if "anom" not in ds.variables:
            raise RuntimeError(f"{name}: variável 'anom' ausente")
        var = ds.variables["anom"]
        lat = ds.variables["lat"][:].astype("float64")
        lon = ds.variables["lon"][:].astype("float64")
        field = var[:]
        while field.ndim > 2:  # (time, zlev, lat, lon) -> (lat, lon)
            field = field[0]
        stats = core.area_weighted_box_mean(field, np.asarray(lat), np.asarray(lon))
        gattrs = {k: str(ds.getncattr(k)) for k in ds.ncattrs()}
        vattrs = {k: str(var.getncattr(k)) for k in var.ncattrs()}
    clim = {k: v for k, v in {**gattrs, **vattrs}.items() if "climatolog" in k.lower() or "climatolog" in v.lower()}
    meta = {
        "variableLongName": vattrs.get("long_name"),
        "variableUnits": vattrs.get("units"),
        "productVersion": gattrs.get("product_version") or gattrs.get("version") or gattrs.get("id"),
        "climatologyAttributes": clim or None,
        "climatologyNote": core.climatology_note(clim or None),
    }
    return stats, meta


def collect(today: date | None = None) -> dict:
    today = today or datetime.now(timezone.utc).date()
    keys: list[str] = []
    for prefix in month_prefixes(today - timedelta(days=core.WINDOW_DAYS + 20), today):
        keys += list_keys(prefix)
    chosen = choose_files(keys)
    days = plan_window(chosen)
    log(f"janela {days[0]} → {days[-1]} ({len(days)} dias; "
        f"{sum(chosen[d][1] for d in days)} preliminares)")

    points, metas = [], []
    for d in days:
        key, prelim = chosen[d]
        name = key.rsplit("/", 1)[-1]
        stats, meta = read_anomaly(http_get(f"{BUCKET_URL}/{key}"), name)
        metas.append(meta)
        points.append({
            "date": d.isoformat(),
            "anomC": None if stats["value"] is None else round(stats["value"], 3),
            "preliminary": prelim,
            "file": name,
            "validCells": stats["validCells"],
            "totalCells": stats["totalCells"],
        })

    consistent = all(m == metas[0] for m in metas)
    if not consistent:
        log("ATENÇÃO: metadados da anomalia variam entre arquivos — o gate vai bloquear")
    metadata = {**metas[0], "consistentMetadata": consistent}
    return core.build_payload(points, metadata)



def main() -> int:
    try:
        payload = collect()
    except Exception as err:
        print(f"ATUALIZAÇÃO NÃO CONCLUÍDA — último snapshot válido preservado: {err}", file=sys.stderr)
        return 1
    errors = core.validate(payload)
    if errors:
        print("GATE BLOQUEOU — nada foi gravado:", file=sys.stderr)
        for e in errors[:40]:
            print(f"  - {e}", file=sys.stderr)
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False) + "\n")
    last = payload["series"][-1]
    src = payload["source"]
    log(f"OK {OUT_FILE} — {payload['latestDate']}: {last['anomC']:+.2f} °C "
        f"({'preliminar' if last['preliminary'] else 'definitivo'}); versão {src['productVersion']}; "
        f"variável '{src['variable']}' ({src['variableLongName']}, {src['variableUnits']})")
    log(f"climatologia: {src['climatologyNote']}")
    if os.environ.get("GITHUB_ACTIONS") == "true":
        vals = [p["anomC"] for p in payload["series"]]
        print(f"::notice title=Niño 3.4 OISST {payload['latestDate']}::"
              f"último {last['anomC']:+.2f} °C · mín 90d {min(vals):+.2f} · máx 90d {max(vals):+.2f} · "
              f"{sum(p['preliminary'] for p in payload['series'])} dias preliminares · "
              f"sinal de monitoramento, não ONI/RONI", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
