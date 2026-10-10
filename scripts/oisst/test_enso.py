"""Testes offline do sinal Nino 3.4 (OISST). Sem rede, sem espera real.

Uso: python3 -m unittest discover -s scripts/oisst -p "test_*.py"
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enso_core as core  # noqa: E402
import fetch_oisst  # noqa: E402

LAT = np.arange(-89.875, 90, 0.25)          # 720 centros, como o OISST
LON = np.arange(0.125, 360, 0.25)           # 1440 centros, 0-360
TODAY = date(2026, 10, 10)
META = {"variableLongName": "Daily sea surface temperature anomalies", "variableUnits": "Celsius",
        "productVersion": "Version v02r01", "climatologyAttributes": None,
        "climatologyNote": core.climatology_note(None), "consistentMetadata": True}


def make_nc(field2d: np.ndarray, lon=LON, version="Version v02r01", long_name="Daily sea surface temperature anomalies") -> bytes:
    """netCDF4 em memoria imitando o OISST: anom int16, scale 0.01, _FillValue -999."""
    import netCDF4

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "x.nc"
        with netCDF4.Dataset(path, "w") as ds:
            ds.product_version = version
            ds.createDimension("time", 1)
            ds.createDimension("zlev", 1)
            ds.createDimension("lat", len(LAT))
            ds.createDimension("lon", len(lon))
            ds.createVariable("lat", "f4", ("lat",))[:] = LAT
            ds.createVariable("lon", "f4", ("lon",))[:] = lon
            v = ds.createVariable("anom", "i2", ("time", "zlev", "lat", "lon"), fill_value=-999)
            v.long_name, v.units, v.scale_factor, v.add_offset = long_name, "Celsius", 0.01, 0.0
            v[0, 0, :, :] = np.ma.masked_invalid(field2d)
        return path.read_bytes()


def box_field(inside: float, outside: float = 9.0, lon=LON) -> np.ndarray:
    lat_ok, lon_ok = core.box_masks(LAT, lon)
    f = np.full((len(LAT), len(lon)), outside)
    f[np.ix_(lat_ok, lon_ok)] = inside
    return f


def good_points(n=core.WINDOW_DAYS, end=TODAY - timedelta(days=1)) -> list[dict]:
    return [{"date": (end - timedelta(days=n - 1 - i)).isoformat(), "anomC": 0.4 + i * 0.01,
             "preliminary": i >= n - 14, "file": f"oisst-avhrr-v02r01.{(end - timedelta(days=n - 1 - i)):%Y%m%d}.nc",
             "validCells": 8000, "totalCells": 8000} for i in range(n)]


class TestBoxMean(unittest.TestCase):
    def test_box_size(self):
        lat_ok, lon_ok = core.box_masks(LAT, LON)
        self.assertEqual((lat_ok.sum(), lon_ok.sum()), (40, 200))  # 5S-5N x 170W-120W

    def test_only_box_cells_used(self):
        r = core.area_weighted_box_mean(box_field(1.0), LAT, LON)
        self.assertAlmostEqual(r["value"], 1.0)
        self.assertEqual(r["validCells"], r["totalCells"])

    def test_minus180_convention(self):
        lon180 = np.where(LON > 180, LON - 360, LON)
        r = core.area_weighted_box_mean(box_field(-0.7, lon=lon180), LAT, lon180)
        self.assertAlmostEqual(r["value"], -0.7)

    def test_area_weighting(self):
        f = np.broadcast_to(np.abs(LAT)[:, None], (len(LAT), len(LON))).copy()
        r = core.area_weighted_box_mean(f, LAT, LON)
        lat_ok, _ = core.box_masks(LAT, LON)
        lats = LAT[lat_ok]
        expected = np.average(np.abs(lats), weights=np.cos(np.deg2rad(lats)))
        self.assertAlmostEqual(r["value"], expected, places=10)
        self.assertGreater(abs(r["value"] - np.abs(lats).mean()), 1e-5)  # difere da média simples

    def test_masked_cells_counted(self):
        f = box_field(1.0)
        lat_ok, lon_ok = core.box_masks(LAT, LON)
        f[np.where(lat_ok)[0][0], np.where(lon_ok)[0][0]] = np.nan
        r = core.area_weighted_box_mean(f, LAT, LON)
        self.assertEqual(r["validCells"], r["totalCells"] - 1)


class TestReadNetCDF(unittest.TestCase):
    def test_read_scaled_anomaly(self):
        stats, meta = fetch_oisst.read_anomaly(make_nc(box_field(1.23)), "oisst-avhrr-v02r01.20261009.nc")
        self.assertAlmostEqual(stats["value"], 1.23, places=6)
        self.assertEqual(meta["productVersion"], "Version v02r01")
        self.assertEqual(meta["variableUnits"], "Celsius")
        self.assertIn("não declara", meta["climatologyNote"])  # fixture sem atributo de climatologia


class TestGate(unittest.TestCase):
    def payload(self, pts=None, meta=None):
        return core.build_payload(good_points() if pts is None else pts, META if meta is None else meta)

    def blocks(self, payload, fragment):
        errs = core.validate(payload, today=TODAY)
        self.assertTrue(any(fragment in e for e in errs), f"esperava '{fragment}' em {errs}")

    def test_pass(self):
        self.assertEqual(core.validate(self.payload(), today=TODAY), [])

    def test_gap(self):
        pts = good_points(); del pts[40]
        self.blocks(self.payload(pts), "lacuna")

    def test_nan(self):
        pts = good_points(); pts[10]["anomC"] = float("nan")
        self.blocks(self.payload(pts), "não numérico")

    def test_range(self):
        pts = good_points(); pts[3]["anomC"] = 7.5
        self.blocks(self.payload(pts), "fora da faixa")

    def test_stale(self):
        self.blocks(self.payload(good_points(end=TODAY - timedelta(days=9))), "desatualizado")

    def test_incomplete_coverage(self):
        pts = good_points(); pts[5]["validCells"] = 7990
        self.blocks(self.payload(pts), "cobertura incompleta")

    def test_mixed_metadata(self):
        self.blocks(self.payload(meta={**META, "consistentMetadata": False}), "divergem")

    def test_missing_climatology_note(self):
        p = self.payload(); p["source"]["climatologyNote"] = ""
        self.blocks(p, "climatologia")

    def test_climatology_note_variants(self):
        self.assertIn("não declara", core.climatology_note(None))
        self.assertIn("declarada no arquivo", core.climatology_note({"climatology": "1991-2020"}))

    def test_missing_disclaimer(self):
        p = self.payload(); p["disclaimer"] = "x"
        self.blocks(p, "índices oficiais")


S3_XML = b"""<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <IsTruncated>false</IsTruncated>
  <Contents><Key>data/v2.1/avhrr/202610/oisst-avhrr-v02r01.20261008.nc</Key></Contents>
  <Contents><Key>data/v2.1/avhrr/202610/oisst-avhrr-v02r01.20261008_preliminary.nc</Key></Contents>
  <Contents><Key>data/v2.1/avhrr/202610/oisst-avhrr-v02r01.20261009_preliminary.nc</Key></Contents>
  <Contents><Key>data/v2.1/avhrr/202610/readme.txt</Key></Contents>
</ListBucketResult>"""


class TestListingAndFetch(unittest.TestCase):
    def setUp(self):
        self._orig = (fetch_oisst.list_keys, fetch_oisst.http_get, fetch_oisst.OUT_FILE, fetch_oisst.OUT_DIR)

    def tearDown(self):
        fetch_oisst.list_keys, fetch_oisst.http_get, fetch_oisst.OUT_FILE, fetch_oisst.OUT_DIR = self._orig

    def test_parse_and_prefer_final(self):
        keys, token = fetch_oisst.parse_listing(S3_XML)
        self.assertIsNone(token)
        chosen = fetch_oisst.choose_files(keys)
        self.assertEqual(chosen[date(2026, 10, 8)][1], False)   # definitivo vence o preliminar
        self.assertEqual(chosen[date(2026, 10, 9)][1], True)
        self.assertEqual(len(chosen), 2)

    def fake_bucket(self, days: list[date], fail_on: date | None = None, version_change_on: date | None = None):
        keys = [f"data/v2.1/avhrr/{d:%Y%m}/oisst-avhrr-v02r01.{d:%Y%m%d}{'_preliminary' if d > TODAY - timedelta(days=14) else ''}.nc"
                for d in days]
        cache: dict[str, bytes] = {}

        def list_keys(prefix):
            return [k for k in keys if k.startswith(prefix)]

        def http_get(url, params=None):
            key = url.split(".amazonaws.com/", 1)[1]
            d = datetime.strptime(fetch_oisst.FILE_RE.search(key).group(1), "%Y%m%d").date()
            if fail_on == d:
                raise RuntimeError("download falhou após 2 tentativas (simulado)")
            ver = "Version v02r02" if version_change_on and d >= version_change_on else "Version v02r01"
            tag = (d, ver)
            if tag not in cache:
                cache[tag] = make_nc(box_field(0.5), version=ver)
            return cache[tag]

        fetch_oisst.list_keys, fetch_oisst.http_get = list_keys, http_get

    def window(self, end=TODAY - timedelta(days=1)):
        return [end - timedelta(days=i) for i in range(core.WINDOW_DAYS - 1, -1, -1)]

    def test_end_to_end_pass(self):
        self.fake_bucket(self.window())
        payload = fetch_oisst.collect(today=TODAY)
        self.assertEqual(core.validate(payload, today=TODAY), [])
        self.assertAlmostEqual(payload["series"][-1]["anomC"], 0.5)
        self.assertTrue(payload["series"][-1]["preliminary"])
        self.assertFalse(payload["series"][0]["preliminary"])

    def test_missing_day_aborts(self):
        days = self.window(); del days[30]
        self.fake_bucket(days)
        with self.assertRaisesRegex(RuntimeError, "sem arquivo"):
            fetch_oisst.collect(today=TODAY)

    def test_version_mix_blocked(self):
        self.fake_bucket(self.window(), version_change_on=TODAY - timedelta(days=5))
        payload = fetch_oisst.collect(today=TODAY)
        self.assertTrue(any("divergem" in e for e in core.validate(payload, today=TODAY)))

    def test_download_failure_preserves_snapshot(self):
        self.fake_bucket(self.window(), fail_on=TODAY - timedelta(days=3))
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "enso-oisst.json"
            out.write_text('{"versao": "anterior"}')
            fetch_oisst.OUT_DIR, fetch_oisst.OUT_FILE = Path(tmp), out
            self.assertEqual(fetch_oisst.main(), 1)
            self.assertEqual(json.loads(out.read_text()), {"versao": "anterior"})


if __name__ == "__main__":
    unittest.main()
