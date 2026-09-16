import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('switchbot-living-world-v5'),out=path.join(root,'evidence');fs.mkdirSync(out,{recursive:true});
const report={version:'5.0.0',checkedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[],states:{},note:'Actual Chromium software WebGL. Camera film is a deterministic sequence rendered by the website; not a claim of hardware-device frame rate.'};
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);report.checks.push({name,status:'PASS'});console.log('PASS',name);};
async function ready(p,url){await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true'&&window.__cinematic?.ready&&window.__spatial?.ready,null,{timeout:90000});await p.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();document.documentElement.style.scrollBehavior='auto';});}
async function shot(name,p=page){const session=await p.context().newCDPSession(p);const result=await session.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result.data,'base64'));await session.detach();report.screenshots.push(name+'.png');}
async function go(v){await page.evaluate(v=>{window.__app.setMode('story',false);window.__livingWorld.setFloor('all');window.__app.seek(v,true);window.__livingWorld.renderAt(v);},v);await page.waitForTimeout(150);return page.evaluate(()=>window.__livingWorld.snapshot());}
try{
 await ready(page,'http://127.0.0.1:4195/');
 for(const [name,p] of [['01-desktop-overview',0],['02-desktop-morning',.22],['03-desktop-leaving',.35],['04-desktop-entry',.60],['05-desktop-living',.71],['06-desktop-night',.993]]){report.states[name]=await go(p);await shot(name);}
 const a=report.states['01-desktop-overview'],morning=report.states['02-desktop-morning'],home=report.states['05-desktop-living'],night=report.states['06-desktop-night'];
 check('Real WebGL geometry renders without losing the context',a.triangles>5000&&!a.contextLost);
 check('Morning camera is inside the upper room',morning.camera[2]<3.45&&morning.camera[1]>3.5);
 check('Coming-home camera is inside the ground-floor living room',home.camera[2]<3.45&&home.camera[1]<3.1);
 check('Curtain physically opens and closes across the day',morning.state.curtain>.98&&night.state.curtain<.02);
 check('Door opens in the leaving chapter',report.states['03-desktop-leaving'].state.door>.7);
 check('Home lights brighten and night lights go down',home.state.living>.9&&night.state.living<.02);
 check('Static surfaces are batched, not hundreds of separate duplicate draws',a.drawCalls<450);
 check('Fallback does not cover the 3D view',!(await page.locator('#fallback').isVisible()));
 const reverse=await go(.22);check('Reverse scrub restores deterministic curtain and camera positions',Math.abs(reverse.state.curtain-morning.state.curtain)<.001&&Math.hypot(...reverse.camera.map((x,i)=>x-morning.camera[i]))<.1);
 await go(.05);await page.evaluate(()=>{const e=document.querySelector('#experience'),s=document.querySelector('#stage');window.scrollTo(0,e.offsetTop+.22*(e.offsetHeight-s.clientHeight));});await page.waitForFunction(()=>Math.abs(window.__livingWorld.targetProgress-.22)<.003,null,{timeout:20000});check('Native page scrolling drives the 3D journey',true);
 await go(.71);await page.locator('#solutionButton').click();check('Scene solution exposes official product links',(await page.locator('#dialogContent a[href^="https://www.switchbot.jp/"]').count())>=3);await page.keyboard.press('Escape');
 await page.locator('#exploreNav').click();await page.locator('[data-room="living"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:30000});await shot('07-desktop-explore-living');
 let s=await page.evaluate(()=>window.__livingWorld.snapshot());check('Explore selects the same model and actual first floor',s.mode==='explore'&&s.visible1&&!s.visible2);
 const cam=s.camera;await page.mouse.move(950,440);await page.mouse.down();await page.mouse.move(1160,468,{steps:14});await page.mouse.up();await page.waitForFunction(a=>Math.hypot(...window.__livingWorld.camera.position.toArray().map((x,i)=>x-a[i]))>.08,cam,{timeout:20000});check('Pointer drag rotates the actual perspective camera',true);
 await page.locator('[data-room="bedroom"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:30000});
 const before=await page.evaluate(()=>window.__livingWorld.state.curtain);await page.locator('#tryCurtain').click();await page.waitForFunction(v=>window.__livingWorld.state.curtain!==v,before,{timeout:20000});check('Try Curtain changes actual scene state',true);await shot('08-desktop-explore-bedroom');
 await page.locator('#planNav').click();await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');await page.locator('[data-owned="hub"]').fill('1');
 const plan=await page.evaluate(()=>window.__currentPlan);check('Plan counts split curtains and deducts owned devices once',plan.products.find(x=>x.id==='curtain').toBuy===3&&plan.products.find(x=>x.id==='hub').toBuy===0);
 await page.locator('#build').scrollIntoViewIfNeeded();await shot('09-desktop-plan');
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:30000}),page.locator('#exportPlan').click()]);await download.saveAs(path.join(out,'example-plan.html'));check('Plan export produces a usable file',fs.statSync(path.join(out,'example-plan.html')).size>2000);
 await page.locator('#homeLink').click();await go(.1);await page.locator('#playToggle').click();await page.waitForTimeout(2400);await page.locator('#playToggle').click();check('Autoplay advances in the live browser',(await page.evaluate(()=>window.__livingWorld.progress))>.12);
 await page.setViewportSize({width:390,height:844});
 for(const [name,p] of [['10-mobile-overview',0],['11-mobile-morning',.22],['12-mobile-living',.71],['13-mobile-night',.993]]){await go(p);await shot(name);}
 check('Portrait layout has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));check('Portrait maintains a live WebGL context',!(await page.evaluate(()=>window.__livingWorld.snapshot().contextLost)));
 await page.locator('#exploreNav').click();await page.locator('[data-room="bedroom"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:30000});await shot('14-mobile-explore');
 await page.locator('#planNav').click();await page.locator('#build').scrollIntoViewIfNeeded();await shot('15-mobile-plan');
 const offline=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,offline:true,acceptDownloads:true});const local=await offline.newPage();const requests=[];local.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});local.on('pageerror',e=>report.errors.push(e.message));
 await ready(local,pathToFileURL(path.join(root,'portable/SwitchBot-Living-World-V5.html')).href);await local.evaluate(()=>{window.__app.seek(.71,true);window.__livingWorld.renderAt(.71);});await shot('16-portable-offline-living',local);check('Portable HTML runs real 3D with browser offline',await local.evaluate(()=>window.__livingWorld.snapshot().triangles>5000));check('Portable runtime makes zero external HTTP requests',requests.length===0);await offline.close();
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const rp=await reduced.newPage();await ready(rp,'http://127.0.0.1:4195/');await rp.locator('#startExperience').click();check('Reduced-motion entry uses a chapter step instead of forced auto-flight',await rp.locator('#playToggle').getAttribute('aria-pressed')==='false');await reduced.close();
 check('No page JavaScript errors',report.errors.length===0);report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.stack;console.error(e);try{await shot('failure');}catch{}}
finally{fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
if(report.result!=='PASS')process.exitCode=1;
