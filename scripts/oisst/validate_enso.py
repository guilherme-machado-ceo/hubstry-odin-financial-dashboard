#!/usr/bin/env python3
"""Gate independente do sinal Nino 3.4 (OISST).

Uso: python3 scripts/oisst/validate_enso.py public/data/enso-oisst.json
Saida 0 = PASS; 1 = BLOQUEADO (motivos listados).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import enso_core as core  # noqa: E402


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    payload = json.loads(Path(sys.argv[1]).read_text())
    errors = core.validate(payload)
    if errors:
        print(f"BLOQUEADO {sys.argv[1]} — {len(errors)} problema(s):")
        for e in errors[:60]:
            print(f"  - {e}")
        return 1
    print(f"PASS {sys.argv[1]} — {payload['windowDays']} dias até {payload['latestDate']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
