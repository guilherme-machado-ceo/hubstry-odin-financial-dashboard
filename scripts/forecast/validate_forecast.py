#!/usr/bin/env python3
"""Gate deterministico de um snapshot de previsao (formato ODIN).

Uso: python3 scripts/forecast/validate_forecast.py public/data/aifs-forecast.json [--max-age-hours 48]
Saida 0 = PASS; 1 = BLOQUEADO (motivos listados).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import aifs_core as core  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--max-age-hours", type=float, default=48.0)
    args = ap.parse_args()

    payload = json.loads(Path(args.path).read_text())
    errors = core.validate(payload, max_age_hours=args.max_age_hours)
    if errors:
        print(f"BLOQUEADO {args.path} — {len(errors)} problema(s):")
        for e in errors[:60]:
            print(f"  - {e}")
        return 1
    print(f"PASS {args.path} — ciclo {payload['initTime']}, {payload['horizonHours']}h")
    return 0


if __name__ == "__main__":
    sys.exit(main())
