#!/usr/bin/env python3
"""Build from source, fail closed, record content digests only after both commands succeed."""
import hashlib,json,subprocess,sys,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
front=root/'neonplan3d-main/frontend'
comp=root/'neonplan3d-main/custom_components/neonplan3d/frontend'
marker=root/'BUILD_VERIFIED.json'
marker.unlink(missing_ok=True)
for cmd in (['npm','run','typecheck'],['npm','run','build']):
 print('RUN:', ' '.join(cmd),flush=True)
 try: p=subprocess.run(cmd,cwd=front,check=False)
 except OSError as e: print('FAILED:',e,file=sys.stderr);sys.exit(1)
 if p.returncode: print('FAILED:',cmd,'exit',p.returncode,file=sys.stderr);sys.exit(p.returncode)
files=['neonplan3d.js','neonplan3d-3d.js','neonplan3d-editor.js','neonplan3d-card-editor.js']
if any(not (comp/x).is_file() for x in files):
 print('FAILED: required bundles missing',file=sys.stderr);sys.exit(1)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# Hash every build input, including configuration, lockfile, build script, and the AUREON shell.
source_files=sorted(p for p in (front/'src').rglob('*') if p.is_file())
source_files += [p for p in (front/'package.json',front/'package-lock.json',front/'tsconfig.json',front/'build.mjs',root/'aureon-dashboard.js') if p.is_file()]
source_files=sorted(set(source_files))
record={'schema':1,'verified_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'sources':{str(p.relative_to(root)):digest(p) for p in source_files},
 'bundles':{str((comp/x).relative_to(root)):digest(comp/x) for x in files}}
marker.write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n')
print('SUCCESS: build/typecheck verified; hashes recorded')
