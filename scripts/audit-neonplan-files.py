"""Inventory every ZIP member and compare exact bytes to the candidate, without running archive code."""
import argparse
import collections
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('archive', type=Path)
parser.add_argument('candidate', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
digest = lambda data: hashlib.sha256(data).hexdigest()
rows = []
original = set()
with zipfile.ZipFile(args.archive) as z:
    if z.testzip() is not None:
        raise RuntimeError('ZIP CRC failed')
    members = len(z.infolist())
    for item in z.infolist():
        if item.is_dir():
            continue
        parts = PurePosixPath(item.filename).parts
        if '..' in parts or not parts:
            raise ValueError('Unsafe member path')
        path = '/'.join(parts[1:])
        original.add(path)
        raw = z.read(item)
        target = args.candidate / path
        current = target.read_bytes() if target.is_file() else None
        rows.append({'path': path, 'original_sha256': digest(raw), 'candidate_sha256': digest(current) if current is not None else None, 'bytes': len(raw), 'status': 'missing' if current is None else 'identical' if raw == current else 'modified'})
for target in sorted(args.candidate.rglob('*')):
    path = target.relative_to(args.candidate)
    if not target.is_file() or any(p in {'node_modules', '__pycache__', '.pytest_cache', '.ruff_cache', '.git'} for p in path.parts) or path.suffix == '.pyc' or path.as_posix() in original:
        continue
    rows.append({'path': path.as_posix(), 'candidate_sha256': digest(target.read_bytes()), 'status': 'added'})
result = {'original_archive': args.archive.name, 'archive_sha256': digest(args.archive.read_bytes()), 'zip_members_crc_verified': members, 'version': json.loads((args.candidate / 'custom_components/neonplan3d/manifest.json').read_text())['version'], 'summary': dict(collections.Counter(r['status'] for r in rows)), 'files': rows}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'files'}))
