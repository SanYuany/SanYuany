import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const base=process.env.BASE_URL;const out=path.resolve(process.env.EVIDENCE_DIR||'public-evidence');fs.mkdirSync(out,{recursive:true});
const report={base,checkedAt:new Date().toISOString(),checks:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960},acceptDownloads:true});page.on('pageerror',e=>report.errors.push(e.message));
const shot=async name=>{const c=await page.context().newCDPSession(page);const r=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));await c.detach();};
try{
 const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});assert.equal(response.status(),200);assert.match(await page.title(),/SwitchBot Living World/);report.checks.push('Direct HTTP page is SwitchBot, not an intermediary');
 await page.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true',null,{timeout:90000});assert.equal(await page.locator('#fallback').isVisible(),false);
 const releaseResponse=await page.request.get(new URL('release.json',base+'/').href);assert.equal(releaseResponse.status(),200);const release=await releaseResponse.json();report.sourceSha=release.sourceSha;
 for(const file of ['src/app.js','src/world.js','src/export.js']){const r=await page.request.get(new URL(file,base+'/').href);assert.equal(r.status(),200);const sha=createHash('sha256').update(await r.body()).digest('hex');assert.equal(sha,createHash('sha256').update(fs.readFileSync(file)).digest('hex'));assert.equal(sha,release.files[file]);}report.checks.push('Production assets match the verified source bytes');
 await page.evaluate(()=>window.__app.seek(0,true));const start=await page.evaluate(()=>window.__livingWorld.snapshot());await shot('public-desktop-overview');
 await page.evaluate(()=>window.__app.seek(.71,true));await page.waitForTimeout(700);const home=await page.evaluate(()=>window.__livingWorld.snapshot());assert.ok(Math.hypot(...home.camera.map((x,i)=>x-start.camera[i]))>3);assert.ok(home.state.living>.9);assert.ok(home.triangles>5000);await shot('public-desktop-coming-home');report.checks.push('Actual 3D geometry, camera and lighting operate online');
 await page.locator('#planNav').click();await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');assert.equal(await page.evaluate(()=>window.__currentPlan.products.find(x=>x.id==='curtain').toBuy),3);
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:25000}),page.locator('#exportPlan').click()]);await download.saveAs(path.join(out,'public-plan.html'));assert.match(fs.readFileSync(path.join(out,'public-plan.html'),'utf8'),/data-buy="3"/);report.checks.push('Production plan quantity and file download work');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__app.seek(.21,true));await page.waitForTimeout(700);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('public-mobile-morning');report.checks.push('Portrait camera and no mobile horizontal overflow');
 assert.deepEqual(report.errors,[]);report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.stack;try{await shot('public-failure');}catch{};}
finally{fs.writeFileSync(path.join(out,'public-report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));if(report.result!=='PASS')process.exit(1);
