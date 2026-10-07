"""Testes offline do pipeline AIFS (sem rede).

Uso: python3 -m unittest discover -s scripts/forecast -p "test_*.py"
"""
from __future__ import annotations

import copy
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import aifs_core as core  # noqa: E402

INIT = datetime(2026, 10, 7, 6, tzinfo=timezone.utc)
NOW = INIT + timedelta(hours=9)
HORIZON = 24


def synthetic_series(horizon: int = HORIZON) -> dict[str, list[dict]]:
    """Valores plausiveis por latitude, ja nas unidades do GRIB (K, m/s, Pa)."""
    series = {}
    for c in core.CITIES:
        base_k = 273.15 + 28 - abs(c["lat"]) * 0.35
        series[c["city"]] = [
            core.to_point(INIT, h, base_k + (h % 12) * 0.2, 3.0, 4.0, 101_300 + h)
            for h in range(0, horizon + 1, 6)
        ]
    return series


def good_payload() -> dict:
    return core.build_payload(INIT, HORIZON, HORIZON, synthetic_series(), now=NOW)


class TestConversion(unittest.TestCase):
    def test_units(self):
        p = core.to_point(INIT, 6, 293.15, 3.0, 4.0, 101_325.0)
        self.assertEqual(p["t2mC"], 20.0)
        self.assertEqual(p["wind10mMs"], 5.0)
        self.assertEqual(p["mslHPa"], 1013.2)
        self.assertEqual(p["time"], "2026-10-07T12:00:00Z")

    def test_schema_matches_frontend(self):
        """Mesmos campos que a interface Earth2Snapshot do site consome."""
        p = good_payload()
        for key in ("updatedAt", "source", "sourceUrl", "model", "initTime", "horizonHours"):
            self.assertIn(key, p)
        city = p["data"]["cities"][0]
        for key in ("city", "cityPt", "country", "flag", "lat", "lon", "forecast", "riskScore", "type"):
            self.assertIn(key, city)
        self.assertIn("CC BY 4.0", p["attribution"])


class TestRisk(unittest.TestCase):
    def test_same_formula_as_earth2(self):
        pts = [{"t2mC": 40.0, "wind10mMs": 5.0, "mslHPa": 1010.0},
               {"t2mC": 30.0, "wind10mMs": 5.0, "mslHPa": 1000.0}]
        self.assertEqual(core.risk_from_forecast(pts), {"riskScore": 74, "type": "heat"})
        pts[0]["wind10mMs"] = 20.0
        self.assertEqual(core.risk_from_forecast(pts)["type"], "storm")
        self.assertEqual(core.risk_from_forecast(pts[:1]), {"riskScore": 0, "type": "normal"})


class TestGate(unittest.TestCase):
    def test_pass(self):
        self.assertEqual(core.validate(good_payload(), now=NOW), [])

    def assertBlocks(self, payload, fragment, now=NOW):
        errors = core.validate(payload, now=now)
        self.assertTrue(any(fragment in e for e in errors), f"esperava '{fragment}' em {errors}")

    def test_kelvin_not_converted(self):
        p = good_payload()
        p["data"]["cities"][0]["forecast"][0]["t2mC"] = 290.0
        self.assertBlocks(p, "temperatura fora da faixa")

    def test_pascal_not_converted(self):
        p = good_payload()
        p["data"]["cities"][2]["forecast"][1]["mslHPa"] = 101_300.0
        self.assertBlocks(p, "pressao fora da faixa")

    def test_tropical_too_cold(self):
        p = good_payload()
        mumbai = next(c for c in p["data"]["cities"] if c["city"] == "Mumbai")
        mumbai["forecast"][0]["t2mC"] = 2.0
        self.assertBlocks(p, "cidade tropical")

    def test_jump(self):
        p = good_payload()
        p["data"]["cities"][1]["forecast"][2]["t2mC"] += 30
        self.assertBlocks(p, "salto de temperatura")

    def test_missing_city(self):
        p = good_payload()
        p["data"]["cities"].pop()
        self.assertBlocks(p, "cidades divergentes")

    def test_missing_step(self):
        p = good_payload()
        del p["data"]["cities"][0]["forecast"][-1]
        self.assertBlocks(p, "horizontes incompletos")

    def test_nan(self):
        p = good_payload()
        p["data"]["cities"][0]["forecast"][0]["wind10mMs"] = float("nan")
        self.assertBlocks(p, "nao numerico")

    def test_stale(self):
        self.assertBlocks(good_payload(), "previsao velha", now=INIT + timedelta(days=5))

    def test_future(self):
        self.assertBlocks(good_payload(), "no futuro", now=INIT - timedelta(hours=3))

    def test_wrong_valid_time(self):
        p = good_payload()
        p["data"]["cities"][0]["forecast"][1]["time"] = "2026-01-01T00:00:00Z"
        self.assertBlocks(p, "horario valido inconsistente")

    def test_bad_risk(self):
        p = copy.deepcopy(good_payload())
        p["data"]["cities"][0]["riskScore"] = 140
        self.assertBlocks(p, "riskScore invalido")


try:
    import eccodes  # noqa: F401
    HAS_ECCODES = True
except Exception:  # pragma: no cover
    HAS_ECCODES = False


@unittest.skipUnless(HAS_ECCODES, "eccodes nao instalado")
class TestExtractFromGrib(unittest.TestCase):
    """Monta um GRIB2 sintetico na grade 0,25° e confere a leitura por cidade."""

    def _write_grib(self, path: Path, init: datetime, steps: list[int]) -> None:
        import eccodes
        import numpy as np

        lats = np.linspace(90, -90, 721)[:, None]
        lons = np.arange(0, 360, 0.25)[None, :]
        fields = {
            "2t": 273.15 + 28 - np.abs(lats) * 0.35 + 0 * lons,  # K, depende da latitude
            "10u": 3.0 + 0 * lats * lons,
            "10v": 4.0 + 0 * lats * lons,
            "msl": 101_000 + 0 * lats * lons + lons,              # Pa, depende da longitude
        }
        with open(path, "wb") as out:
            for step in steps:
                for name, arr in fields.items():
                    gid = eccodes.codes_grib_new_from_samples("regular_ll_sfc_grib2")
                    eccodes.codes_set_key_vals(gid, {
                        "Ni": 1440, "Nj": 721,
                        "latitudeOfFirstGridPointInDegrees": 90.0,
                        "longitudeOfFirstGridPointInDegrees": 0.0,
                        "latitudeOfLastGridPointInDegrees": -90.0,
                        "longitudeOfLastGridPointInDegrees": 359.75,
                        "iDirectionIncrementInDegrees": 0.25,
                        "jDirectionIncrementInDegrees": 0.25,
                        "dataDate": int(init.strftime("%Y%m%d")),
                        "dataTime": init.hour * 100,
                        "step": step,
                    })
                    eccodes.codes_set(gid, "shortName", name)
                    eccodes.codes_set_values(gid, arr.astype("float64").ravel())
                    eccodes.codes_write(gid, out)
                    eccodes.codes_release(gid)

    def test_extract_end_to_end(self):
        import fetch_aifs

        steps = [0, 6, 12]
        with tempfile.TemporaryDirectory() as tmp:
            grib = Path(tmp) / "x.grib2"
            self._write_grib(grib, INIT, steps)
            series = fetch_aifs.extract(grib, INIT)

        brasilia = series["Brasilia"]
        self.assertEqual([p["leadHours"] for p in brasilia], steps)
        # 28 - 15.75*0.35 ≈ 22.5 °C (ponto de grade mais proximo de -15.8)
        self.assertAlmostEqual(brasilia[0]["t2mC"], 28 - 15.75 * 0.35, delta=0.1)
        self.assertEqual(brasilia[0]["wind10mMs"], 5.0)
        # lon -47.9 -> 312.0 na grade 0..360: msl = 101000 + 312 Pa
        self.assertAlmostEqual(brasilia[0]["mslHPa"], (101_000 + 312.0) / 100, delta=0.05)

        payload = core.build_payload(INIT, 12, 12, series, now=NOW)
        self.assertEqual(core.validate(payload, now=NOW), [])

    def test_wrong_cycle_rejected(self):
        import fetch_aifs

        with tempfile.TemporaryDirectory() as tmp:
            grib = Path(tmp) / "x.grib2"
            self._write_grib(grib, INIT - timedelta(hours=6), [0])
            with self.assertRaises(RuntimeError):
                fetch_aifs.extract(grib, INIT)


if __name__ == "__main__":
    unittest.main()
