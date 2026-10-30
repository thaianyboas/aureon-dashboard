#!/usr/bin/env python3
"""Ensure AUREON does not replace NeonPlan3D's native translation system."""
from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]/'neonplan3d-main'/'frontend'
i18n=(ROOT/'src'/'i18n.ts').read_text(encoding='utf-8')
match=re.search(r'export const EXTRA_LANGUAGES\s*=\s*\[([^]]+)\]',i18n)
assert match, 'Native NeonPlan3D language registry missing'
langs=re.findall(r'"([a-z]+)"',match.group(1))
assert len(langs)>=16 and 'pt' in langs, f'Unexpected native language list: {langs}'
for lang in langs:
    p=ROOT/'lang'/f'{lang}.json'
    assert p.is_file(), f'Missing original NeonPlan translation {p}'
    data=json.loads(p.read_text(encoding='utf-8'))
    assert isinstance(data,dict) and len(data)>100, f'Invalid/incomplete translation: {lang}'
assert 'loadLanguage(this.hass.language)' in (ROOT/'src'/'panel.ts').read_text(encoding='utf-8')
assert 'translate(hass:' in i18n and 'languageCode(' in i18n
print(f'PASS: NeonPlan3D native translation loader preserved; {len(langs)} additional languages + German/English; all JSON dictionaries parse.')
