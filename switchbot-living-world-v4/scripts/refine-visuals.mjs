import fs from 'node:fs';import assert from 'node:assert/strict';
const appPath='src/app.js';let app=fs.readFileSync(appPath,'utf8');
if(!app.includes("from './export.js'")){
 app=app.replace("import {buildPlan,encodePlan,decodePlan} from './planner.js';","import {buildPlan,encodePlan,decodePlan} from './planner.js';\nimport {renderPlanDocument,downloadPlanDocument} from './export.js';");
 const a=app.indexOf("$('#exportPlan').onclick="),b=app.indexOf('let shared=',a);assert.ok(a>=0&&b>a,'Expected existing export handler');
 app=app.slice(0,a)+"$('#exportPlan').onclick=()=>{stopPlay();try{const plan=buildPlan(readInput());downloadPlanDocument(renderPlanDocument(plan));toast('プランのダウンロードを開始しました。');}catch(err){console.error('Plan export failed',err);toast('保存できませんでした。もう一度お試しください。');}};\n"+app.slice(b);fs.writeFileSync(appPath,app);
}
const testPath='tests/browser.mjs';let test=fs.readFileSync(testPath,'utf8');
if(!test.includes("process.env.SMOKE_ONLY"))test="if(process.env.SMOKE_ONLY==='1'){await import('./public.mjs');process.exit(0);}\n"+test;
test=test.replace("const out=path.resolve('evidence');","const out=path.resolve(process.env.EVIDENCE_DIR||'evidence');").replace("deviceScaleFactor:1});\nconst page","deviceScaleFactor:1,acceptDownloads:true});\nconst page");
test=test.replace("const downloadPromise=page.waitForEvent('download');await page.locator('#exportPlan').click();const download=await downloadPromise;","const [download]=await Promise.all([page.waitForEvent('download',{timeout:25000}),page.locator('#exportPlan').click()]);");
if(!test.includes('Export does not read pixels'))test=test.replace("await check('Consumer plan really exports a file',()=>assert.ok(existsSync(path.join(out,'example-consumer-plan.html'))));","await check('Consumer plan really exports a file',()=>assert.ok(existsSync(path.join(out,'example-consumer-plan.html'))));\n await check('Export does not read pixels from the GPU',async()=>{await page.evaluate(()=>{window.__livingWorld.canvas.toDataURL=()=>{throw new Error('GPU capture must not be used for export');};});const [d]=await Promise.all([page.waitForEvent('download',{timeout:25000}),page.locator('#exportPlan').click()]);await d.saveAs(path.join(out,'export-without-gpu.html'));});");
fs.writeFileSync(testPath,test);
const buildPath='scripts/build.mjs';let build=fs.readFileSync(buildPath,'utf8');
if(!build.includes('dist/release.json'))build+="\nconst proofFiles=['index.html','src/app.js','src/world.js','src/house.js','src/timeline.js','src/export.js','vendor/three/three.module.min.js'];\nwriteFileSync('dist/release.json',JSON.stringify({version:'4.1.0',sourceSha:process.env.RELEASE_SHA||process.env.GITHUB_SHA||'local-build',builtAt:new Date().toISOString(),files:Object.fromEntries(proofFiles.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]))},null,2));\n";
fs.writeFileSync(buildPath,build);
console.log('Export isolation and matching-byte production verification applied.');
