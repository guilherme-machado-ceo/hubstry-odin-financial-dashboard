"""Nucleo puro do sinal Nino 3.4 (OISST) para o ODIN.

Sem rede: selecao da caixa, media ponderada por area, montagem do payload e
gate deterministico. E o que os testes exercitam.

IMPORTANTE (metodologia): o valor produzido aqui e um SINAL DIARIO DE
MONITORAMENTO derivado da anomalia do OISST v2.1. Nao e o ONI nem o RONI,
indices oficiais da NOAA/CPC, e nao declara El Nino ou La Nina.
"""
from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone

import numpy as np

WINDOW_DAYS = 90
MAX_AGE_DAYS = 5
ANOM_RANGE_C = (-5.0, 5.0)

# Caixa Nino 3.4: 5S-5N, 170W-120W  ->  190-240 graus Leste (convencao 0-360)
REGION = {
    "name": "Niño 3.4",
    "latMin": -5.0,
    "latMax": 5.0,
    "lonMin": 190.0,
    "lonMax": 240.0,
    "lonConvention": "0-360 °E (equivale a 170°W–120°W)",
    "cellSelection": "células da grade 0,25° cujo centro está dentro da caixa",
    "weighting": "média ponderada pela área: peso = cos(latitude do centro da célula)",
}

SOURCE = {
    "name": "NOAA OISST v2.1 (Optimum Interpolation Sea Surface Temperature)",
    "producer": "NOAA/NCEI",
    "distribution": "AWS Open Data — bucket noaa-cdr-sea-surface-temp-optimum-interpolation-pds (us-east-1, acesso anônimo)",
    "registryUrl": "https://registry.opendata.aws/noaa-cdr-oceanic/",
    "variable": "anom",
}

ATTRIBUTION = (
    "Dados: NOAA OISST v2.1 (NOAA/NCEI), via AWS Open Data. Valores derivados "
    "(média ponderada por área da anomalia na região Niño 3.4) calculados pela "
    "Hubstry; não são dados originais e inalterados da NOAA. A NOAA não endossa "
    "este produto."
)
DISCLAIMER = (
    "Sinal diário de monitoramento derivado do OISST v2.1. Não é o ONI nem o "
    "RONI e não declara El Niño ou La Niña; o status oficial do ENSO é publicado "
    "pela NOAA/CPC (https://www.cpc.ncep.noaa.gov/)."
)
INDICATOR = "nino34_oisst_daily_anomaly"

CLIMATOLOGY_UNDECLARED = (
    "O arquivo OISST não declara o período de referência (climatologia) da "
    "variável 'anom'. O valor é usado como fornecido, sem recálculo. Uma "
    "comparação semanal com a série da NOAA/CPC (base 1991–2020) roda como "
    "diagnóstico não bloqueante; o período de referência não é confirmado pela fonte."
)


def climatology_note(declared: dict | None) -> str:
    """Documenta a climatologia: declarada no arquivo ou explicitamente nao declarada."""
    if declared:
        pairs = "; ".join(f"{k}={v}" for k, v in sorted(declared.items()))
        return f"Climatologia declarada no arquivo OISST: {pairs}. O valor é usado como fornecido, sem recálculo."
    return CLIMATOLOGY_UNDECLARED


def normalize_lon(lon: np.ndarray) -> np.ndarray:
    """Qualquer convencao de longitude -> 0-360."""
    return np.mod(lon, 360.0)


def box_masks(lat: np.ndarray, lon: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lon360 = normalize_lon(lon)
    lat_ok = (lat >= REGION["latMin"]) & (lat <= REGION["latMax"])
    lon_ok = (lon360 >= REGION["lonMin"]) & (lon360 <= REGION["lonMax"])
    return lat_ok, lon_ok


def area_weighted_box_mean(field2d, lat: np.ndarray, lon: np.ndarray) -> dict:
    """Media da anomalia na caixa, ponderada por cos(lat). Celulas mascaradas
    (sem dado) ficam fora da media e sao contadas, para o gate decidir."""
    lat_ok, lon_ok = box_masks(lat, lon)
    sub = np.ma.masked_invalid(np.ma.asarray(field2d)[np.ix_(lat_ok, lon_ok)])
    total = int(sub.size)
    if total == 0:
        raise ValueError("caixa Niño 3.4 sem células na grade recebida")
    weights = np.broadcast_to(np.cos(np.deg2rad(lat[lat_ok]))[:, None], sub.shape)
    valid = ~np.ma.getmaskarray(sub)
    n_valid = int(valid.sum())
    if n_valid == 0:
        return {"value": None, "validCells": 0, "totalCells": total}
    data = np.ma.getdata(sub).astype("float64")
    w = np.where(valid, weights, 0.0)
    value = float((data * w).sum() / w.sum())
    return {"value": value, "validCells": n_valid, "totalCells": total}


def build_payload(points: list[dict], metadata: dict, now: datetime | None = None) -> dict:
    pts = sorted(points, key=lambda p: p["date"])
    return {
        "updatedAt": (now or datetime.now(timezone.utc)).isoformat(),
        "indicator": INDICATOR,
        "label": "Anomalia diária da temperatura da superfície do mar — Niño 3.4 (sinal de monitoramento)",
        "units": "°C",
        "windowDays": WINDOW_DAYS,
        "latestDate": pts[-1]["date"] if pts else None,
        "region": REGION,
        "source": {**SOURCE, **metadata},
        "attribution": ATTRIBUTION,
        "disclaimer": DISCLAIMER,
        "referenceBands": {
            "note": "faixas visuais de ±0,5 °C; não são classificação oficial",
            "warm": 0.5,
            "cool": -0.5,
        },
        "series": pts,
    }


def _finite(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def validate(payload: dict, today: date | None = None) -> list[str]:
    """Gate deterministico. Lista vazia = PASS. Nada de interpolar lacunas."""
    errors: list[str] = []
    today = today or datetime.now(timezone.utc).date()

    for key in ("indicator", "units", "windowDays", "latestDate", "region",
                "source", "attribution", "disclaimer", "series"):
        if key not in payload:
            errors.append(f"campo obrigatorio ausente: {key}")
    if errors:
        return errors
    if payload["indicator"] != INDICATOR:
        errors.append(f"indicador inesperado: {payload['indicator']!r}")
    if "ONI" not in payload["disclaimer"] or "NOAA/CPC" not in payload["disclaimer"]:
        errors.append("aviso de distinção em relação aos índices oficiais ausente")
    if "NOAA" not in payload["attribution"]:
        errors.append("atribuição à NOAA ausente")

    src = payload["source"]
    if src.get("variable") != "anom":
        errors.append(f"variável de origem inesperada: {src.get('variable')!r}")
    if src.get("consistentMetadata") is not True:
        errors.append("metadados da anomalia divergem entre arquivos (não misturar referências)")
    if not src.get("productVersion"):
        errors.append("versão do produto não registrada")
    if not src.get("climatologyNote"):
        errors.append("documentação da climatologia da anomalia ausente")

    series = payload["series"]
    window = payload["windowDays"]
    if len(series) != window:
        errors.append(f"série com {len(series)} dias; esperado {window} (lacunas não são interpoladas)")
    try:
        dates = [date.fromisoformat(p["date"]) for p in series]
    except (KeyError, ValueError):
        return errors + ["data inválida na série"]
    for prev, cur in zip(dates, dates[1:]):
        if cur - prev != timedelta(days=1):
            errors.append(f"lacuna ou fora de ordem entre {prev} e {cur}")
    if dates:
        if payload["latestDate"] != dates[-1].isoformat():
            errors.append("latestDate não corresponde ao último ponto da série")
        age = (today - dates[-1]).days
        if age > MAX_AGE_DAYS:
            errors.append(f"dado desatualizado: último dia {dates[-1]} ({age} dias; limite {MAX_AGE_DAYS})")
        if age < 0:
            errors.append(f"data no futuro: {dates[-1]}")

    lo, hi = ANOM_RANGE_C
    for p in series:
        tag = p.get("date", "?")
        v = p.get("anomC")
        if not _finite(v):
            errors.append(f"{tag}: valor ausente ou não numérico")
            continue
        if not lo <= v <= hi:
            errors.append(f"{tag}: anomalia fora da faixa plausível ({v} °C)")
        if p.get("validCells") != p.get("totalCells") or not p.get("totalCells"):
            errors.append(f"{tag}: cobertura incompleta da caixa ({p.get('validCells')}/{p.get('totalCells')} células)")
        if not isinstance(p.get("preliminary"), bool):
            errors.append(f"{tag}: indicação preliminar/definitivo ausente")
        if tag.replace("-", "") not in str(p.get("file", "")):
            errors.append(f"{tag}: arquivo de origem não corresponde à data")
    return errors
