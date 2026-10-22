// Dependency-free static review of the new public surface and shared navigation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(root), html=files.filter(f=>f.endsWith('.html'));
const read=f=>fs.readFileSync(f,'utf8');
let refs=0;
for(const file of html){
 const source=read(file), ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,`Duplicate ID in ${path.relative(root,file)}`);
 for(const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const url=match[1];
  if(/^(?:https?:|mailto:|tel:|data:)/.test(url))continue;
  const [raw,fragment]=url.split('#');
  let target=raw?path.resolve(path.dirname(file),decodeURIComponent(raw.split('?')[0])):file;
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  assert(fs.existsSync(target),`Missing ${url} in ${path.relative(root,file)}`);
  if(fragment&&target.endsWith('.html'))assert(read(target).includes(`id="${fragment}"`),`Missing anchor ${url} in ${path.relative(root,file)}`);
  refs++;
 }
}
const showcase=files.filter(f=>f.includes(`${path.sep}southern-surface${path.sep}`)&&/\.(?:html|js|mjs|css|svg|md)$/.test(f));
for(const file of showcase){
 const source=read(file);
 assert(!/(?:postgres(?:ql)?:\/\/|-----BEGIN [A-Z ]*PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/.test(source),`Credential-like value in ${path.relative(root,file)}`);
 assert(!/(?:C:[\\/]dev[\\/]|\/api\/|\/admin\b|process\.env|import\.meta\.env)/i.test(source),`Operational detail in ${path.relative(root,file)}`);
 if(file.includes(`${path.sep}demo${path.sep}`)&&/\.(?:js|mjs)$/.test(file)){
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|serviceWorker)\b/.test(source),`Network-capable API in ${path.relative(root,file)}`);
  assert(!/https?:\/\//.test(source),`External URL in demo script ${path.relative(root,file)}`);
  assert(!/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(source),`Persistent demo state in ${path.relative(root,file)}`);
 }
}
const demo=read(path.join(root,'southern-surface/demo/index.html'));
for(const directive of ["default-src 'none'","connect-src 'none'","form-action 'none'","object-src 'none'","base-uri 'none'"])assert(demo.includes(directive),`Missing CSP ${directive}`);
assert(demo.includes('fictional data'),'Missing fictional-data notice');
assert(read(path.join(root,'sitemap.xml')).includes('https://carsonmcrae.github.io/southern-surface/'),'Missing sitemap entry');
console.log(`PASS: ${html.length} HTML pages, ${refs} local references/anchors, ${showcase.length} showcase text files; CSP, no-network, no-storage and sensitive-pattern checks.`);
