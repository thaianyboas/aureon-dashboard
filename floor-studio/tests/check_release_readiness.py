#!/usr/bin/env python3
"""Fail-closed gate for AUREON Floor Studio release candidates."""
from pathlib import Path
import sys,json,re,hashlib
root=Path(__file__).resolve().parents[1]
front=root/'neonplan3d-main/frontend'
comp=root/'neonplan3d-main/custom_components/neonplan3d'
checks=[]
def check(name,ok,reason=''):
 checks.append((name,bool(ok),reason))
 checkline='PASS' if ok else 'BLOCKED'
 print(f'{checkline}: {name}'+(f' — {reason}' if reason else ''))
check('Public dashboard JS', (root/'aureon-dashboard.js').is_file())
check('NeonPlan frontend sources', (front/'src/main.ts').is_file() and (front/'src/components/editor.ts').is_file())
check('HA integration manifest', (comp/'manifest.json').is_file())
check('No personal preset bundled', not any('apartamento_neonplan' in p.name.lower() for p in root.rglob('*') if p.is_file()))
check('No paid furniture pack bundled', not any(p.suffix.lower()=='.fp3dpack' for p in root.rglob('*') if p.is_file()))
# Frontend assets must be built from the modified sources, not merely copied from an older original release.
required=['neonplan3d.js','neonplan3d-3d.js','neonplan3d-editor.js','neonplan3d-card-editor.js']
missing=[f for f in required if not (comp/'frontend'/f).is_file()]
check('Required frontend bundles present',not missing, ', '.join(missing) if missing else '')
def verify_build_marker():
 marker=root/'BUILD_VERIFIED.json'
 if not marker.is_file(): return False
 try:
  data=json.loads(marker.read_text())
  if data.get('schema')!=1 or not data.get('sources') or not data.get('bundles'):return False
  expected_sources={str(p.relative_to(root)) for p in (front/'src').rglob('*') if p.is_file()}
  expected_sources.update(str(p.relative_to(root)) for p in (front/'package.json',front/'package-lock.json',front/'tsconfig.json',front/'build.mjs',root/'aureon-dashboard.js') if p.is_file())
  if set(data['sources']) != expected_sources:return False
  for group in ('sources','bundles'):
   for rel,digest in data[group].items():
    path=(root/rel).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():return False
    if hashlib.sha256(path.read_bytes()).hexdigest()!=digest:return False
  for f in required:
   if str((comp/'frontend'/f).relative_to(root)) not in data['bundles']:return False
  return True
 except (OSError,ValueError,TypeError,KeyError):return False
check('Modified frontend build verified',verify_build_marker(), 'Requires successful typecheck/build and matching source+bundle hashes')
# Do not accept a blank or hand-written flag as proof of runtime integration.
def runtime_evidence():
 path=root/'HA_RUNTIME_VERIFIED.json'
 if not path.is_file():return False
 try:
  data=json.loads(path.read_text())
  return (data.get('schema')==1 and data.get('environment')=='home_assistant' and
          data.get('tests')=={'floor_view':True,'editor_admin':True,'editor_nonadmin_denied':True,'project_persistence':True,'module_permissions':True} and
          isinstance(data.get('tested_at_utc'),str) and bool(data['tested_at_utc']))
 except (OSError,ValueError,TypeError):return False
check('Home Assistant runtime integration verified', runtime_evidence(), 'Requires actual HA testing; do not fabricate evidence')
print(f'READINESS: {sum(v for _,v,_ in checks)}/{len(checks)} gates passed')
sys.exit(0 if all(v for _,v,_ in checks) else 1)
