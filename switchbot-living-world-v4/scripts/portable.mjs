import {build} from 'esbuild';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.join(root,'portable');fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/spatial-view.css'),'utf8');
const result=await build({entryPoints:[path.join(root,'src/app.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,legalComments:'inline',plugins:[{name:'local-three-and-styles',setup(b){
 b.onResolve({filter:/^three$/},()=>({path:path.join(root,'vendor/three/three.module.min.js')}));
 b.onResolve({filter:/^three\/addons\//},a=>({path:path.join(root,'vendor/three/addons',a.path.slice('three/addons/'.length))}));
 b.onLoad({filter:/spatial-view\.js$/},a=>{let s=fs.readFileSync(a.path,'utf8');s=s.split('\n').filter(l=>!l.startsWith("const style=document.createElement('link')")).join('\n');s=s.replace("if(new URLSearchParams(location.search).get('view')==='3d')","if(location.protocol==='file:'||new URLSearchParams(location.search).get('view')==='3d')");return{contents:s,loader:'js'};});
}}]});
let js=result.outputFiles[0].text;
js+="\nif(location.protocol==='file:'){document.querySelector('#sharePlan').textContent='プランを共有（ファイル） ↗';document.querySelector('#sharePlan').onclick=()=>document.querySelector('#exportPlan').click();}";
const facts=fs.readFileSync(path.join(root,'docs/FACTS.html'),'utf8');const factBody=facts.slice(facts.indexOf('<h1>')).replace(/<\/html>\s*$/,'').replace('href="../vendor/three/LICENSE"','href="#three-license"');
const license=fs.readFileSync(path.join(root,'vendor/three/LICENSE'),'utf8').replaceAll('&','&amp;').replaceAll('<','&lt;');
const info=`<section id="facts-inline" style="padding:40px max(24px,6vw);max-width:1100px;margin:auto;line-height:1.8"><details><summary style="cursor:pointer;padding:20px">機能の出典・対応条件・ライセンス</summary>${factBody}<pre id="three-license" style="white-space:pre-wrap;font-size:11px">${license}</pre></details></section>`;
const single=html.replace('<link rel="stylesheet" href="./src/styles.css">',()=>'<style>'+css+'</style>').replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace('href="./docs/FACTS.html"','href="#facts-inline"').replace('</footer>',()=>'</footer>'+info).replace('<script type="module" src="./src/app.js"></script>',()=>'<script>'+js.replaceAll('</script','<\\/script')+'</script>');
assert.ok(!single.includes('type="importmap"'));assert.ok(!single.includes('type="module" src='));assert.ok(single.includes('worldCanvas'));
const name='SwitchBot-Living-World-3D.html';fs.writeFileSync(path.join(out,name),single);fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({file:name,sourceSha:process.env.SOURCE_SHA||process.env.GITHUB_SHA,bytes:Buffer.byteLength(single),sha256:createHash('sha256').update(single).digest('hex'),generatedAt:new Date().toISOString(),presentation:'Real-time interactive 3D. On local-file launch, opens directly into the orbitable house. Simplified product geometry, not CAD.'},null,2));console.log('Portable 3D:',Buffer.byteLength(single),'bytes');
