// Package from the extension/ folder so manifest.json is at the ZIP root.
// No external build dependencies; use the Python zipfile standard library
// or your system ZIP tool if you prefer a fully automated pack step.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve('extension');
const output = resolve('dongo-adblocker-1.1.0.zip');
const py = `from pathlib import Path\nfrom zipfile import ZipFile, ZIP_DEFLATED\nroot=Path(${JSON.stringify(root)})\nwith ZipFile(${JSON.stringify(output)},'w',ZIP_DEFLATED) as z:\n    for p in sorted(root.rglob('*')):\n        if p.is_file(): z.write(p,p.relative_to(root))\nprint(${JSON.stringify(output)})`;
let completed = false;
for (const candidate of ['python', 'python3', 'py']) {
  try { execFileSync(candidate, ['-c', py], { stdio: 'inherit' }); completed = true; break; }
  catch { /* Try another Python command */ }
}
if (!completed) throw new Error('Python 3 is required for npm run pack.');
