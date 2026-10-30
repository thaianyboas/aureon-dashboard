import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const source = 'floor-studio/neonplan3d-main/custom_components/neonplan3d';
const output = 'build/neonplan3d-hacs-integration-candidate';
const target = join(output, 'custom_components/neonplan3d');
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
if (manifest.domain !== 'neonplan3d' || !manifest.version || !manifest.config_flow) {
  throw new Error('Unexpected NeonPlan3D integration manifest');
}
for (const required of ['__init__.py', 'manifest.json', 'frontend/neonplan3d.js', 'frontend/neonplan3d-3d.js', 'frontend/neonplan3d-editor.js']) {
  if (!existsSync(join(source, required))) throw new Error('Missing integration file: ' + required);
}
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, 'custom_components'), { recursive: true });
cpSync(source, target, {
  recursive: true,
  filter: p => !p.split(/[\\/]/).some(x => ['__pycache__', '.pytest_cache', 'node_modules'].includes(x)) && !p.endsWith('.pyc')
});
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
walk(target);
writeFileSync(join(output, 'MANIFEST.json'), JSON.stringify({ domain: manifest.domain, version: manifest.version, files }, null, 2) + '\n');
execFileSync('python3', ['-m', 'compileall', '-q', target], { stdio: 'inherit' });
console.log('Separate HACS integration candidate packaged: ' + files.length + ' files. NOT INSTALLATION APPROVED.');
