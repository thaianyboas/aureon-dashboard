import subprocess,sys,tempfile,shutil
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class ReleaseGateTests(unittest.TestCase):
 def test_gate_explicitly_blocks_unverified_release(self):
  p=subprocess.run([sys.executable,str(ROOT/'tests/check_release_readiness.py')],capture_output=True,text=True)
  self.assertNotEqual(p.returncode,0)
  self.assertIn('BLOCKED: Modified frontend build verified',p.stdout)
  self.assertIn('BLOCKED: Home Assistant runtime integration verified',p.stdout)
 def test_public_has_no_private_plan(self):
  p=subprocess.run([sys.executable,str(ROOT/'tests/check_public_distribution.py'),str(ROOT)],capture_output=True,text=True)
  self.assertEqual(p.returncode,0,p.stdout+p.stderr)
 def test_ha_source_and_editor_preserved(self):
  self.assertTrue((ROOT/'neonplan3d-main/frontend/src/components/editor.ts').is_file())
  self.assertTrue((ROOT/'neonplan3d-main/custom_components/neonplan3d/manifest.json').is_file())
if __name__=='__main__':unittest.main()
