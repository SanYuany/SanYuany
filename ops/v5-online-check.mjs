import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {chromium} from 'playwright';
const base=(process.env.BASE_URL||'http://127.0.0.1:4195').replace(/\/$/,'');
const out=path.resolve(process.env.EVIDENCE_DIR||'online-evidence');fs.mkdirSync(out,{recursive:true});
const report={url:base,version:'5.0.1',checkedAt:new Date().toISOString(),checks:[],errors:[],states:{}};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);console.log('PASS '+name);};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1120,height:800},deviceScaleFactor:1,acceptDownloads:true});const page=await ctx.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push(e.message));
async function shot(name){const c=await ctx.newCDPSession(page);const r=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));await c.detach();}
async function seek(p){return page.evaluate(p=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__app.setMode('story',false);window.__app.seek(p,true);window.__livingWorld.renderAt(p);return window.__livingWorld.snapshot();},p);}
try{
 const response=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:90000});check('Direct entry returns the SwitchBot site, not an interstitial',response.status()===200&&(await page.title()).includes('SwitchBot'));
 await page.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true'&&window.__cinematic?.ready&&window.__spatial?.ready,null,{timeout:90000});
 check('WebGL is running and fallback is not obscuring it',!await page.locator('#fallback').isVisible());
 const releaseResponse=await ctx.request.get(base+'/release.json');check('Release manifest is present',releaseResponse.ok());const release=await releaseResponse.json();check('Release identity is V5.0.1',release.version==='5.0.1');report.release=release;
 for(const f of ['src/world.js','src/timeline.js','src/app.js']){const r=await ctx.request.get(base+'/'+f);check('Hosted bytes match release: '+f,r.ok()&&createHash('sha256').update(await r.body()).digest('hex')===release.files[f]);}
 const start=await seek(0);await shot('01-desktop-overview');const morning=await seek(.22);await shot('02-desktop-morning');const home=await seek(.71);await shot('03-desktop-living');const night=await seek(.993);await shot('04-desktop-night');
 report.states={start,morning,home,night};check('Camera really enters the bedroom',morning.camera[2]<3.45&&morning.camera[1]>3.5);check('Camera really enters the living room',home.camera[2]<3.45&&home.camera[1]<3.1);check('Curtains and lights physically change',morning.state.curtain>.98&&night.state.curtain<.02&&home.state.living>.9&&night.state.living<.02);check('Geometry is not blank and WebGL context is alive',start.triangles>5000&&!night.contextLost);
 const reverse=await seek(.22);check('Reverse movement restores exact state',Math.hypot(...reverse.camera.map((x,i)=>x-morning.camera[i]))<.1);
 await page.locator('#exploreNav').click();await page.locator('[data-room="living"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:45000});check('Explore operates on the same first floor',await page.evaluate(()=>window.__livingWorld.mode==='explore'&&window.__livingWorld.house.floor1.visible&&!window.__livingWorld.house.floor2.visible));
 await page.locator('#planNav').click();await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');await page.locator('[data-owned="hub"]').fill('1');check('Planner deducts owned devices once',await page.evaluate(()=>window.__currentPlan.products.find(x=>x.id==='curtain').toBuy===3&&window.__currentPlan.products.find(x=>x.id==='hub').toBuy===0));
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:45000}),page.locator('#exportPlan').click()]);await download.saveAs(path.join(out,'example-plan.html'));check('Export produces a usable file',fs.statSync(path.join(out,'example-plan.html')).size>2000);
 await page.setViewportSize({width:390,height:844});await seek(.22);await shot('05-mobile-morning');await seek(.71);await shot('06-mobile-living');check('Mobile has real 3D and no horizontal overflow',await page.evaluate(()=>!window.__livingWorld.snapshot().contextLost&&document.documentElement.scrollWidth<=innerWidth+1));
 check('No page JavaScript errors',report.errors.length===0);report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e.stack||e);console.error(e);try{await shot('failure');}catch{}}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
if(report.result!=='PASS')process.exitCode=1;
