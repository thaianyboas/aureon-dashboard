import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/verify-build-evidence.mjs'], { stdio: 'inherit' });

// The package names the commit it was built from (MANIFEST.json source_commit, SOURCE_COMMIT). Uncommitted changes
// would make that a lie and the integration repository's guard fails ("package not built from SOURCE_COMMIT"):
// commit first, then package. AUREON_ALLOW_DIRTY_PACKAGE=1 is for local experiments only (marked in the manifest).
const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' }).split('\n').filter((l) => l.trim() && !/^\?\? build\//.test(l.slice(0)) && !l.slice(3).startsWith('build/'));
if (dirty.length && process.env.AUREON_ALLOW_DIRTY_PACKAGE !== '1') {
  console.error('Refusing to package: the working tree has uncommitted changes, so the package would not match HEAD.\n' + dirty.slice(0, 10).join('\n') + '\nCommit them first (or set AUREON_ALLOW_DIRTY_PACKAGE=1 for a local experiment that must not be published).');
  process.exit(1);
}

const source = 'floor-studio/neonplan3d-main/custom_components/neonplan3d';
const output = 'build/neonplan3d-hacs-integration-candidate';
const target = join(output, 'custom_components/neonplan3d');
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
if (manifest.domain !== 'neonplan3d' || !manifest.version || !manifest.config_flow) {
  throw new Error('Unexpected NeonPlan3D integration manifest');
}
for (const required of ['__init__.py', 'manifest.json', 'frontend/neonplan3d.js', 'frontend/neonplan3d-3d.js', 'frontend/neonplan3d-editor.js', 'frontend/neonplan3d-pathtrace.js', 'frontend/THIRD_PARTY_PATHTRACE.txt']) {
  if (!existsSync(join(source, required))) throw new Error('Missing integration file: ' + required);
}
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, 'custom_components'), { recursive: true });
cpSync(source, target, {
  recursive: true,
  filter: p => !p.split(/[\\/]/).some(x => ['__pycache__', '.pytest_cache', 'node_modules'].includes(x)) && !p.endsWith('.pyc')
});
cpSync('floor-studio/neonplan3d-main/LICENSE', join(output, 'LICENSE'));
writeFileSync(join(output, 'hacs.json'), JSON.stringify({ name: 'NeonPlan3D AUREON integration candidate', content_in_root: false, render_readme: true }, null, 2) + '\n');
writeFileSync(join(output, 'README.md'), '# NeonPlan3D AUREON integration candidate\n\nNOT RELEASED OR RUNTIME-VERIFIED. This is a separately packaged HACS integration candidate, not a dashboard update. Do not install until the Home Assistant acceptance tests and compatibility review pass. Original upstream licensing applies.\n');
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push({ path: path.slice(output.length + 1), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
  }
}
walk(output);
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync(join(output, 'MANIFEST.json'), JSON.stringify({ domain: manifest.domain, version: manifest.version, source_repository: 'thaianyboas/aureon-dashboard', source_commit: sourceCommit, ...(dirty.length ? { dirty_tree: true } : {}), installation_approved: false, files }, null, 2) + '\n');
// the pin travels with the package, so a copy can never pair files of one commit with the id of another
if (!dirty.length) writeFileSync(join(output, 'SOURCE_COMMIT'), sourceCommit + '\n');
execFileSync('python3', ['-m', 'compileall', '-q', target], { stdio: 'inherit', env: { ...process.env, PYTHONPYCACHEPREFIX: 'build/python-bytecode-cache' } });
console.log('Separate HACS integration candidate packaged: ' + files.length + ' files. NOT INSTALLATION APPROVED.');
