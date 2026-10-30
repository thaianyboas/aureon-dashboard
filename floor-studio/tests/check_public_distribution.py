#!/usr/bin/env python3
"""Fail closed if a public AUREON source tree contains personal presets or licensed packs."""
from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
violations=[]
private_tokens=('aureon_apartamento_neonplan_import','apartment-preset','planta do ap','quarto_quarto')
private_extensions={'.fp3dpack','.key','.license'}
for p in root.rglob('*'):
    if not p.is_file(): continue
    rel=p.relative_to(root).as_posix().lower()
    if any(t in rel for t in private_tokens) or p.suffix.lower() in private_extensions:
        violations.append(rel)
    if rel.endswith('.json') and 'frontend/' not in rel and 'node_modules/' not in rel:
        try:
            data=__import__('json').loads(p.read_text(encoding='utf-8'))
            if isinstance(data,dict) and data.get('format')=='neonplan-import' and data.get('floors'):
                violations.append(rel+' (personal preset candidate)')
        except (ValueError,UnicodeError,OSError): pass
if violations:
    print('FAIL: public distribution contains private or licensed assets:')
    for v in sorted(set(violations)): print(' -',v)
    sys.exit(1)
print('PASS: no personal apartment presets or licensed pack files in public source')
