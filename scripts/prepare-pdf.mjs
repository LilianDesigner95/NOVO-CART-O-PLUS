import {mkdirSync,copyFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);
const root=dirname(require.resolve('pdfjs-dist/package.json'));
mkdirSync('public/vendor',{recursive:true});
for(const file of ['pdf.mjs','pdf.worker.mjs'])copyFileSync(join(root,'build',file),join('public/vendor',file));
