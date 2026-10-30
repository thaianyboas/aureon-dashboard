// Semantic source comparison only; it does not claim runtime behavior from source equality.
import {collect} from './neonplan-ast.mjs';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
const [original,candidate,out]=process.argv.slice(2);if(!out)throw Error('original candidate output.json required');
const digest=s=>createHash('sha256').update(s).digest('hex');

const before=collect(resolve(original)),after=collect(resolve(candidate)),rows=[];
for(const key of new Set([...Object.keys(before),...Object.keys(after)])){const a=before[key],b=after[key];rows.push({symbol:key,original_line:a?.line,candidate_line:b?.line,original_sha256:a?digest(a.canonical):undefined,candidate_sha256:b?digest(b.canonical):undefined,status:!a?'added':!b?'missing':a.canonical===b.canonical?'preserved':'modified'});}
writeFileSync(out,JSON.stringify({scope:'AST printer with comments removed; runtime fidelity requires browser evidence',summary:rows.reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{}),symbols:rows},null,2)+'\n');console.log(JSON.stringify({symbols:rows.length,editor:rows.filter(r=>r.symbol.startsWith('components/editor.ts::')).reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{})}));
