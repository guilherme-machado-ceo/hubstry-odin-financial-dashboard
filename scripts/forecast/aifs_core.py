"""Nucleo puro da previsao ECMWF AIFS para o ODIN.

Sem rede e sem bibliotecas de GRIB: so cidades, montagem do payload, score de
risco e a validacao deterministica. E o que os testes exercitam.

O formato do JSON e o mesmo de public/data/earth2-forecast.json (interface
Earth2Snapshot em src/components/Earth2ForecastSection.tsx), para que a secao
do site possa trocar de fonte depois sem mudar componente.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

LEAD_STEP_HOURS = 6

SOURCE = "ECMWF AIFS Single — open data"
SOURCE_URL = "https://www.ecmwf.int/en/forecasts/datasets/open-data"
LICENSE = "CC BY 4.0"
ATTRIBUTION = (
    "© ECMWF (European Centre for Medium-Range Weather Forecasts). "
    "Fonte: www.ecmwf.int. Licença CC BY 4.0. Dados modificados: extração de "
    "pontos de 8 cidades e conversão de unidades pela Hubstry. O ECMWF não se "
    "responsabiliza por erros ou omissões."
)

# Mesmas cidades de scripts/earth2/fetch_earth2.py e do ClimateVectorChart.tsx
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

# Faixas fisicas (valores fora disso indicam unidade ou canal errado)
T2M_RANGE_C = (-70.0, 60.0)
WIND_RANGE_MS = (0.0, 75.0)
MSL_RANGE_HPA = (850.0, 1090.0)
# Variacao maxima plausivel em 6h num ponto
MAX_T2M_JUMP_C = 25.0
MAX_MSL_JUMP_HPA = 25.0
# Cidades tropicais (|lat| < 25) nao chegam a 5 °C — pega temperatura deslocada
TROPICAL_MIN_T2M_C = 5.0
RISK_TYPES = {"storm", "heat", "drought", "normal"}


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def to_point(init_time: datetime, lead_h: int, t2m_k: float, u10: float,
             v10: float, msl_pa: float) -> dict:
    """Converte as unidades do GRIB (K, m/s, Pa) para as do ODIN."""
    return {
        "leadHours": lead_h,
        "time": iso(init_time + timedelta(hours=lead_h)),
        "t2mC": round(t2m_k - 273.15, 2),
        "wind10mMs": round(math.hypot(u10, v10), 2),
        "mslHPa": round(msl_pa / 100.0, 1),
    }


def risk_from_forecast(points: list[dict]) -> dict:
    """Mesma formula de scripts/earth2/fetch_earth2.py (estresse termico +
    vento + tendencia de pressao), para manter o indice comparavel."""
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


def build_payload(init_time: datetime, horizon_hours: int,
                  requested_horizon_hours: int, series: dict[str, list[dict]],
                  now: datetime | None = None) -> dict:
    cities = []
    for c in CITIES:
        pts = sorted(series.get(c["city"], []), key=lambda p: p["leadHours"])
        cities.append({**c, "forecast": pts, **risk_from_forecast(pts)})
    return {
        "updatedAt": (now or datetime.now(timezone.utc)).isoformat(),
        "source": SOURCE,
        "sourceUrl": SOURCE_URL,
        "license": LICENSE,
        "attribution": ATTRIBUTION,
        "model": "aifs-single",
        "initTime": iso(init_time),
        "leadStepHours": LEAD_STEP_HOURS,
        "horizonHours": horizon_hours,
        "requestedHorizonHours": requested_horizon_hours,
        "data": {"cities": cities},
    }


def _finite(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def validate(payload: dict, now: datetime | None = None,
             max_age_hours: float = 48.0) -> list[str]:
    """Gate deterministico. Lista vazia = PASS. Cada string = um motivo de bloqueio."""
    errors: list[str] = []
    now = now or datetime.now(timezone.utc)

    for key in ("updatedAt", "source", "sourceUrl", "model", "initTime",
                "horizonHours", "data"):
        if key not in payload:
            errors.append(f"campo obrigatorio ausente: {key}")
    if errors:
        return errors

    try:
        init_time = parse_iso(payload["initTime"])
    except ValueError:
        return [f"initTime invalido: {payload['initTime']!r}"]
    age_h = (now - init_time).total_seconds() / 3600
    if age_h < -1:
        errors.append(f"initTime no futuro: {payload['initTime']}")
    elif age_h > max_age_hours:
        errors.append(f"previsao velha: initTime ha {age_h:.0f}h (limite {max_age_hours:.0f}h)")

    horizon = payload["horizonHours"]
    if not isinstance(horizon, int) or horizon <= 0 or horizon % LEAD_STEP_HOURS:
        return errors + [f"horizonHours invalido: {horizon!r}"]
    expected_leads = list(range(0, horizon + 1, LEAD_STEP_HOURS))

    cities = payload["data"].get("cities") or []
    got_names = [c.get("city") for c in cities]
    expected_names = [c["city"] for c in CITIES]
    if sorted(got_names) != sorted(expected_names):
        errors.append(f"cidades divergentes: esperado {expected_names}, recebido {got_names}")

    for c in cities:
        name = c.get("city", "?")
        pts = c.get("forecast") or []
        leads = [p.get("leadHours") for p in pts]
        if leads != expected_leads:
            errors.append(f"{name}: horizontes incompletos ou fora de ordem "
                          f"({len(leads)} de {len(expected_leads)})")
            continue
        prev = None
        for p in pts:
            tag = f"{name} +{p['leadHours']}h"
            t, w, m = p.get("t2mC"), p.get("wind10mMs"), p.get("mslHPa")
            if not all(_finite(v) for v in (t, w, m)):
                errors.append(f"{tag}: valor ausente ou nao numerico")
                prev = None
                continue
            if p.get("time") != iso(init_time + timedelta(hours=p["leadHours"])):
                errors.append(f"{tag}: horario valido inconsistente com initTime")
            if not T2M_RANGE_C[0] <= t <= T2M_RANGE_C[1]:
                errors.append(f"{tag}: temperatura fora da faixa fisica ({t} °C)")
            if not WIND_RANGE_MS[0] <= w <= WIND_RANGE_MS[1]:
                errors.append(f"{tag}: vento fora da faixa fisica ({w} m/s)")
            if not MSL_RANGE_HPA[0] <= m <= MSL_RANGE_HPA[1]:
                errors.append(f"{tag}: pressao fora da faixa fisica ({m} hPa)")
            if abs(c.get("lat", 90)) < 25 and t < TROPICAL_MIN_T2M_C:
                errors.append(f"{tag}: {t} °C implausivel para cidade tropical")
            if prev is not None:
                if abs(t - prev["t2mC"]) > MAX_T2M_JUMP_C:
                    errors.append(f"{tag}: salto de temperatura implausivel em 6h")
                if abs(m - prev["mslHPa"]) > MAX_MSL_JUMP_HPA:
                    errors.append(f"{tag}: salto de pressao implausivel em 6h")
            prev = p
        score = c.get("riskScore")
        if not _finite(score) or not 0 <= score <= 100:
            errors.append(f"{name}: riskScore invalido ({score!r})")
        if c.get("type") not in RISK_TYPES:
            errors.append(f"{name}: tipo de risco invalido ({c.get('type')!r})")

    return errors
