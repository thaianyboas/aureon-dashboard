import unittest, subprocess, sys, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GATE=ROOT/'tests/check_release_readiness.py'
BUILD=ROOT/'tests/verify_frontend_build.py'
class ExtendedIntegrity(unittest.TestCase):
 def test_build_includes_dashboard_and_configs(self):
  code=BUILD.read_text()
  for filename in ('package.json','package-lock.json','tsconfig.json','build.mjs','aureon-dashboard.js'):
   self.assertIn(filename,code)
 def test_gate_requires_exact_source_inventory(self):
  self.assertIn("set(data['sources']) != expected_sources",GATE.read_text())
 def test_runtime_requires_actual_named_checks(self):
  code=GATE.read_text()
  for name in ('floor_view','editor_admin','editor_nonadmin_denied','project_persistence','module_permissions'):
   self.assertIn(name,code)
 def test_release_remains_blocked(self):
  p=subprocess.run([sys.executable,str(GATE)],cwd=ROOT,capture_output=True,text=True)
  self.assertNotEqual(p.returncode,0)
  self.assertIn('BLOCKED: Home Assistant runtime integration verified',p.stdout)
if __name__=='__main__':unittest.main()
