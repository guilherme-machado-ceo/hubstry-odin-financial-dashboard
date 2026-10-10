#!/usr/bin/env python3
"""Diagnostico (nao bloqueia): compara o sinal OISST calculado com a serie
semanal oficial NOAA/CPC (wksst9120.for, OISST v2.1, base 1991-2020).

Para o dia mais recente do JSON, rebaixa o arquivo e calcula a media
ponderada da TEMPERATURA ABSOLUTA (sst) e da ANOMALIA (anom) na caixa;
compara com SST e SSTA da semana CPC mais proxima. Se a temperatura
absoluta bate e a anomalia nao, a diferenca esta na climatologia de
referencia do campo "anom" do arquivo.

Uso: python3 scripts/oisst/diag_cpc.py public/data/enso-oisst.json
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enso_core as core  # noqa: E402
import fetch_oisst as f  # noqa: E402

CPC_URL = "https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for"
LINE_RE = re.compile(r"^\s*(\d{2}[A-Z]{3}\d{4})\s+(.*)$")
NUM_RE = re.compile(r"-?\d+\.\d")


def notice(title: str, msg: str) -> None:
    print(f"::notice title={title}::{msg}", flush=True)


def parse_cpc(text: str) -> dict[date, tuple[float, float]]:
    """{centro da semana: (SST Nino3.4, SSTA Nino3.4)}"""
    out = {}
    for line in text.splitlines():
        m = LINE_RE.match(line)
        if not m:
            continue
        nums = [float(x) for x in NUM_RE.findall(m.group(2))]
        if len(nums) >= 8:
            out[datetime.strptime(m.group(1), "%d%b%Y").date()] = (nums[4], nums[5])
    return out


def box_mean(ds, name: str, lat, lon) -> float:
    field = ds.variables[name][:]
    while field.ndim > 2:
        field = field[0]
    return core.area_weighted_box_mean(field, lat, lon)["value"]


def main() -> int:
    import netCDF4

    payload = json.loads(Path(sys.argv[1]).read_text())
    series = {date.fromisoformat(p["date"]): p for p in payload["series"]}
    last = max(series)
    key = f.PREFIX_TEMPLATE.format(yyyymm=last.strftime("%Y%m")) + series[last]["file"]

    with netCDF4.Dataset("x.nc", mode="r", memory=f.http_get(f"{f.BUCKET_URL}/{key}")) as ds:
        lat = np.asarray(ds.variables["lat"][:], dtype="float64")
        lon = np.asarray(ds.variables["lon"][:], dtype="float64")
        sst, anom = box_mean(ds, "sst", lat, lon), box_mean(ds, "anom", lat, lon)
        attrs = {f"global:{k}": str(ds.getncattr(k)) for k in ds.ncattrs()}
        vattrs = {f"anom:{k}": str(ds.variables["anom"].getncattr(k)) for k in ds.variables["anom"].ncattrs()}
    notice("OISST arquivo", f"{series[last]['file']} · sst {sst:.2f} °C · anom {anom:+.2f} °C · referência implícita (sst−anom) {sst - anom:.2f} °C")
    found = core.extract_climatology({**attrs, **vattrs})
    notice("OISST climatologia", (f"declarada em '{found['attribute']}': \"{found['statement']}\" · período {found['period']} "
                                  f"× CPC {core.CPC_REFERENCE_PERIOD} (referências distintas; diagnóstico não bloqueante)")
           if found else "nenhuma declaração encontrada nos metadados")

    cpc = parse_cpc(f.http_get(CPC_URL).decode("latin-1"))
    if not cpc:
        notice("CPC", "série semanal não pôde ser lida")
        return 0
    week = min(cpc, key=lambda d: abs((d - last).days))
    c_sst, c_ssta = cpc[week]
    notice("CPC semana mais próxima", f"{week} · SST {c_sst:.1f} °C · SSTA {c_ssta:+.1f} °C · referência implícita {c_sst - c_ssta:.1f} °C (base {core.CPC_REFERENCE_PERIOD})")

    rows = []
    for wk in sorted(d for d in cpc if d - timedelta(days=3) in series and d + timedelta(days=3) in series)[-6:]:
        ours = np.mean([series[wk + timedelta(days=k)]["anomC"] for k in range(-3, 4)])
        rows.append(f"{wk:%d/%m}: ODIN {ours:+.2f} × CPC {cpc[wk][1]:+.1f} (Δ {ours - cpc[wk][1]:+.2f})")
    notice("Comparação semanal Niño 3.4", " · ".join(rows) if rows else "sem semanas completas na janela")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as err:  # diagnostico nunca derruba o job
        notice("Diagnóstico CPC", f"falhou: {type(err).__name__}: {err}")
        sys.exit(0)
