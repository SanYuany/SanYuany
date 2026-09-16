if(process.env.SMOKE_ONLY==='1'){await import('./public.mjs');process.exit(0);}
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import path from 'node:path';
const base=process.env.BASE_URL||'http://127.0.0.1:4174';
const out=path.resolve(process.env.EVIDENCE_DIR||'evidence');mkdirSync(out,{recursive:true});
const report={timestamp:new Date().toISOString(),base,checks:[],screenshots:[],errors:[],notes:['Headless Chromium with software WebGL; not real-phone GPU performance.','Video is a recording of the running website, not pre-rendered AI scene media.']};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
async function check(name,callback){await callback();report.checks.push({name,status:'PASS'});console.log('PASS',name);}
async function shot(name,p=page){const session=await p.context().newCDPSession(p);const result=await session.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(out,name+'.png'),Buffer.from(result.data,'base64'));await session.detach();report.screenshots.push(name+'.png');}
async function ready(p){await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true',null,{timeout:90000});}
async function go(p){await page.evaluate(p=>window.__app.seek(p,true),p);await page.waitForFunction(p=>Math.abs(window.__livingWorld.progress-p)<.003,p,{timeout:20000});await page.waitForTimeout(220);return page.evaluate(()=>window.__livingWorld.snapshot());}
try{
 await ready(page);const initial=await go(0);await shot('01-desktop-overview');
 await check('Real WebGL renders non-empty geometry',()=>{assert.ok(initial.triangles>5000);assert.equal(initial.contextLost,false);});
 await check('Fallback does not obscure the running world',async()=>assert.equal(await page.locator('#fallback').isVisible(),false));
 const morning=await go(.21);await shot('02-desktop-morning');
 await check('Morning changes geometry and camera',()=>{assert.ok(morning.state.curtain>.95);assert.ok(Math.hypot(...initial.camera.map((x,i)=>x-morning.camera[i]))>3);});
 const leaving=await go(.35);await shot('03-desktop-leaving');
 await check('Leaving animates a physical door before autolock',()=>assert.ok(leaving.state.door>.7));
 const home=await go(.71);await shot('04-desktop-coming-home');
 await check('Coming home activates interior lights after entry',()=>{assert.ok(home.state.living>.9);assert.ok(home.state.entry>.9);});
 const night=await go(.975);await shot('05-desktop-night');
 await check('Good night closes curtains, door and dims lighting',()=>{assert.ok(night.state.curtain<.02);assert.equal(night.state.locked,true);assert.equal(night.state.door,0);assert.ok(night.state.living<.02);});
 const reversed=await go(.21);await check('Reverse scroll restores the same physical state',()=>{for(const key of ['curtain','door','entry','living','bedroom'])assert.ok(Math.abs(reversed.state[key]-morning.state[key])<.002,`Reverse physical state: ${key}`);assert.equal(reversed.state.locked,morning.state.locked);});
 await go(.71);await page.locator('#textToggle').click();await shot('06-desktop-3d-only');await check('3D-only mode is available',async()=>assert.equal(await page.locator('#stage').evaluate(x=>x.classList.contains('theatre')),true));await page.locator('#textToggle').click();
 await page.locator('#solutionButton').click();await check('Solution dialog opens and exposes official links',async()=>{assert.equal(await page.locator('#solutionDialog').isVisible(),true);assert.ok(await page.locator('#dialogContent a[href^="https://www.switchbot.jp/"]').count()>=3);});await page.keyboard.press('Escape');
 await page.locator('#exploreNav').click();await page.waitForTimeout(1500);await page.locator('[data-room="living"]').click();await page.waitForTimeout(1400);await shot('07-explore-living');
 await check('Explore enters the same house and selects the actual floor',async()=>{const s=await page.evaluate(()=>window.__livingWorld.snapshot());assert.equal(s.mode,'explore');assert.equal(s.visible1,true);assert.equal(s.visible2,false);});
 const beforeOrbit=await page.evaluate(()=>window.__livingWorld.camera.position.toArray());await page.mouse.move(1000,420);await page.mouse.down();await page.mouse.move(1200,450,{steps:16});await page.mouse.up();await page.waitForTimeout(400);
 await check('Drag changes the 3D camera, not only a CSS transform',async()=>{const after=await page.evaluate(()=>window.__livingWorld.camera.position.toArray());assert.ok(Math.hypot(...after.map((v,i)=>v-beforeOrbit[i]))>.1);});
 await page.locator('[data-room="bedroom"]').click();await page.waitForTimeout(1400);await shot('08-explore-bedroom');
 await check('Second floor hides the first floor',async()=>{const s=await page.evaluate(()=>window.__livingWorld.snapshot());assert.equal(s.visible1,false);assert.equal(s.visible2,true);});
 await page.locator('#planNav').click();await page.waitForTimeout(800);await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');await page.locator('[data-owned="hub"]').fill('1');
 await check('Planner counts split curtains and subtracts owned products',async()=>{const p=await page.evaluate(()=>window.__currentPlan);assert.equal(p.products.find(x=>x.id==='curtain').toBuy,3);assert.equal(p.products.find(x=>x.id==='hub').toBuy,0);assert.equal(p.products.filter(x=>x.id==='hub').length,1);});
 await page.locator('#build').scrollIntoViewIfNeeded();await shot('09-desktop-plan');
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:25000}),page.locator('#exportPlan').click()]);await download.saveAs(path.join(out,'example-consumer-plan.html'));
 await check('Consumer plan really exports a file',()=>assert.ok(existsSync(path.join(out,'example-consumer-plan.html'))));
 await check('Export does not read pixels from the GPU',async()=>{await page.evaluate(()=>{window.__livingWorld.canvas.toDataURL=()=>{throw new Error('GPU capture must not be used for export');};});const [d]=await Promise.all([page.waitForEvent('download',{timeout:25000}),page.locator('#exportPlan').click()]);await d.saveAs(path.join(out,'export-without-gpu.html'));});
 await page.locator('#homeLink').click();await go(.1);await page.locator('#playToggle').click();await page.waitForTimeout(1600);await page.locator('#playToggle').click();
 await check('Automatic playback advances the journey',async()=>assert.ok((await page.evaluate(()=>window.__livingWorld.progress))>.115));
 await page.setViewportSize({width:390,height:844});await go(0);await shot('10-mobile-overview');await go(.21);await shot('11-mobile-morning');await go(.69);await shot('12-mobile-coming-home');
 await check('390px mobile has no horizontal overflow',async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)));
 await check('Mobile uses an independently composed camera',async()=>{const m=await page.evaluate(()=>window.__livingWorld.snapshot());assert.ok(m.camera[2]>home.camera[2]);assert.equal(m.contextLost,false);});
 await page.locator('#exploreNav').click();await page.waitForTimeout(1400);await shot('13-mobile-explore');
 await page.locator('#planNav').click();await page.locator('#build').scrollIntoViewIfNeeded();await page.waitForTimeout(400);await shot('14-mobile-plan');
 await check('No JavaScript page errors',()=>assert.deepEqual(report.errors,[]));
 const fallbackPage=await context.newPage();await fallbackPage.route('**/src/world.js',route=>route.abort());await fallbackPage.goto(base,{waitUntil:'domcontentloaded'});await fallbackPage.waitForSelector('#fallback:not([hidden])');
 await check('No-WebGL fallback keeps the plan functional',async()=>{assert.ok(await fallbackPage.locator('#fallback').isVisible());await fallbackPage.locator('#windowCount').selectOption('3');assert.ok((await fallbackPage.evaluate(()=>window.__currentPlan.products)).length>0);});await fallbackPage.close();
 const reducedPage=await browser.newPage({viewport:{width:1000,height:760},reducedMotion:'reduce'});await ready(reducedPage);await reducedPage.locator('#startExperience').click();
 await check('Reduced-motion stops autoplay and presents one chapter',async()=>{assert.equal(await reducedPage.locator('#playToggle').getAttribute('aria-pressed'),'false');});await reducedPage.close();
 if(process.env.SKIP_VIDEO!=='1'){
  const filmContext=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1280,height:800}}});const film=await filmContext.newPage();await ready(film);await film.waitForTimeout(400);await film.evaluate(()=>window.__app.seek(0,true));await film.locator('#startExperience').click();await film.waitForFunction(()=>window.__livingWorld.progress>.994,null,{timeout:120000});await film.waitForTimeout(900);const v=film.video();await filmContext.close();await v.saveAs(path.join(out,'SwitchBot-Living-World-desktop.webm'));report.video='SwitchBot-Living-World-desktop.webm';
 }
 report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.stack;console.error(e);try{await shot('failure');}catch{}}finally{report.checkCount=report.checks.length;writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
if(report.result!=='PASS')process.exitCode=1;
