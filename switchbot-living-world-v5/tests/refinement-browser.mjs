import {chromium} from 'playwright';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const root=process.env.PROJECT_ROOT||process.cwd(),out=path.join(root,'evidence','refinement');fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4185/';
const report={version:'5.1.0',checkedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[],status:'RUNNING'};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const check=(name,v)=>{assert.ok(v,name);report.checks.push({name,status:'PASS'});console.log('PASS',name);};
const ctx=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true,deviceScaleFactor:1});const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(45000);
async function ready(p,url){await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>window.__livingWorld?.finish&&window.__cinematic?.ready&&window.__spatial?.ready,null,{timeout:90000});await p.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();document.documentElement.style.scrollBehavior='auto';});}
async function shot(name,p=page){const session=await p.context().newCDPSession(p);try{const r=await session.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));report.screenshots.push(name+'.png');}finally{await session.detach();}}
async function seek(p){await page.evaluate(p=>{window.__app.setMode('story',false);window.__livingWorld.setFloor('all');window.__app.seek(p,true);window.__livingWorld.renderAt(p);},p);await page.waitForTimeout(100);return page.evaluate(()=>window.__livingWorld.snapshot());}
try{
 await ready(page,base);const first=await seek(0);await shot('01-overview');const uuid=await page.evaluate(()=>window.__livingWorld.house.root.uuid);
 check('Actual WebGL context with non-empty 3D geometry',first.triangles>5000&&!first.contextLost);
 check('Four original procedural bump maps generated locally',first.architecture.originalProceduralMaps===4);
 check('Wood and upholstery have actual bump-map materials',await page.evaluate(()=>Boolean(window.__livingWorld.house.materials.oak.bumpMap&&window.__livingWorld.house.materials.cream.bumpMap)));
 await page.locator('#exploreNav').click();await page.locator('[data-room="outside"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:45000});
 const outside=await page.evaluate(()=>window.__livingWorld.snapshot());check('Finished exterior is attached to the same original house',outside.architecture.finishedExterior&&(await page.evaluate(()=>window.__livingWorld.house.root.uuid))===uuid);
 check('Exterior shows real roof and facade',await page.evaluate(()=>window.__livingWorld.house.roofGroup.visible&&window.__livingWorld.finish.upper.visible&&window.__livingWorld.finish.lower.visible));await shot('02-finished-exterior');
 const previous=outside.camera;await page.mouse.move(850,450);await page.mouse.down();await page.mouse.move(1050,440,{steps:8});await page.mouse.up();await page.waitForTimeout(600);
 check('Exterior rotates a perspective camera in real 3D',await page.evaluate(a=>Math.hypot(...window.__livingWorld.camera.position.toArray().map((v,i)=>v-a[i]))>.1,previous));await shot('03-exterior-rotated');
 await page.locator('[data-room="bedroom"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:45000});
 check('Entering bedroom hides facade and roof; does not leave an obstruction',await page.evaluate(()=>!window.__livingWorld.finish.upper.visible&&!window.__livingWorld.house.roofGroup.visible&&!window.__livingWorld.house.floor1.visible));await shot('04-bedroom-explore');
 const a=await seek(.22);await shot('05-morning');const b=await seek(.71);await shot('06-living');const n=await seek(.993);await shot('07-night');
 check('Camera enters two rooms with preserved curtain and light dynamics',a.camera[2]<3.45&&b.camera[2]<3.45&&a.state.curtain>.98&&b.state.living>.9&&n.state.living<.02);
 await page.locator('#planNav').click();await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');
 check('Planner still subtracts already-owned curtain motors',await page.evaluate(()=>window.__currentPlan.products.find(x=>x.id==='curtain').toBuy===3));
 const pending=page.waitForEvent('download',{timeout:45000});await page.locator('#exportPlan').click();const download=await pending;await download.saveAs(path.join(out,'example-plan.html'));check('Saved plan remains a real downloadable HTML file',fs.statSync(path.join(out,'example-plan.html')).size>2000);
 await page.setViewportSize({width:390,height:844});await seek(.22);await shot('08-mobile-morning');await seek(.71);await shot('09-mobile-living');
 check('390px layout has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('#exploreNav').click();await page.locator('[data-room="outside"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:45000});await shot('10-mobile-exterior');
 check('Mobile shows a live finished exterior',await page.evaluate(()=>window.__livingWorld.finish.lower.visible&&!window.__livingWorld.renderer.getContext().isContextLost()));
 const offline=await browser.newContext({offline:true,viewport:{width:1024,height:700}});const op=await offline.newPage();const requests=[];op.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await ready(op,pathToFileURL(path.join(root,'portable/SwitchBot-Living-World-V5.html')).href);check('Portable bundle still renders without outside requests',requests.length===0&&(await op.evaluate(()=>window.__livingWorld.snapshot().triangles))>5000);await offline.close();
 check('No unhandled JavaScript errors',report.errors.length===0);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;console.error(e);try{await shot('failure');}catch{}}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
if(report.status!=='PASS')process.exitCode=1;
