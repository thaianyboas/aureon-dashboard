import unittest, subprocess, sys, json, tempfile, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GATE=ROOT/'tests/check_release_readiness.py'
MARKER=ROOT/'BUILD_VERIFIED.json'
class Integrity(unittest.TestCase):
 def test_no_build_marker(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)
   (root/'tests').mkdir()
   gate=root/'tests/check_release_readiness.py'
   shutil.copyfile(GATE,gate)
   self.assertFalse((root/'BUILD_VERIFIED.json').exists())
   result=subprocess.run([sys.executable,str(gate)],capture_output=True,text=True)
   self.assertIn('BLOCKED: Modified frontend build verified',result.stdout)
 def test_build_script_clears_stale_marker(self):
  code=(ROOT/'tests/verify_frontend_build.py').read_text()
  self.assertIn('marker.unlink(missing_ok=True)',code)
  self.assertIn("['npm','run','typecheck']",code)
  self.assertIn("['npm','run','build']",code)
 def test_gate_checks_hashes(self):
  code=GATE.read_text()
  self.assertIn('hashlib.sha256(path.read_bytes()).hexdigest()!=digest',code)
  self.assertIn('path.is_relative_to(root.resolve())',code)
if __name__=='__main__':unittest.main()
