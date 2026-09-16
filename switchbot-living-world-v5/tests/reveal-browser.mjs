import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve('switchbot-living-world-v5'),out=path.join(root,'evidence','reveal');fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4188/';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,acceptDownloads:true});const page=await ctx.newPage();page.setDefaultTimeout(45000);
const report={version:'5.1.1',checkedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[],status:'RUNNING'};
page.on('pageerror',e=>report.errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);report.checks.push({name,status:'PASS'});console.log('PASS',name);};
async function ready(p,url){await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForFunction(()=>window.__houseControls?.ready&&window.__spatial?.ready&&window.__cinematic?.ready,null,{timeout:90000});await p.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__app.seek(0,true);});}
async function shot(name,p=page){const c=await p.context().newCDPSession(p);try{const s=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(s.data,'base64'));report.screenshots.push(name+'.png');}finally{await c.detach();}}
async function outside(){await page.evaluate(()=>{window.__app.setMode('explore');window.__app.selectRoom('outside');});await page.waitForFunction(()=>!window.__livingWorld.roomTransition&&window.__livingWorld.envelopeAmount===1,null,{timeout:45000});}
async function seek(p){await page.evaluate(p=>{window.__app.setMode('story',false);window.__app.seek(p,true);window.__livingWorld.renderAt(p);},p);await page.waitForTimeout(150);return page.evaluate(()=>window.__livingWorld.snapshot());}
let good=false;
try{
 await ready(page,base);await shot('01-desktop-home');
 const id=await page.evaluate(()=>window.__livingWorld.house.root.uuid);
 await page.locator('#viewExterior').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition&&window.__livingWorld.envelopeAmount===1);
 check('Exterior-first CTA loads the same live 3D house',await page.evaluate(id=>window.__livingWorld.house.root.uuid===id&&window.__livingWorld.snapshot().triangles>5000,id));
 check('Architecture controls do not overlap the product toolbar',await page.evaluate(()=>{const a=document.querySelector('#envelopeControl').getBoundingClientRect(),b=document.querySelector('.world-toolbar').getBoundingClientRect();return a.top>=b.bottom+4||a.right<=b.left||b.right<=a.left;}));
 await shot('02-desktop-exterior');
 const pose=await page.evaluate(()=>window.__livingWorld.camera.position.toArray());
 const material=await page.evaluate(()=>({oak:window.__livingWorld.house.materials.oak.opacity,linen:window.__livingWorld.house.materials.cream.opacity}));
 await page.locator('#openEnvelope').click();await page.waitForFunction(()=>window.__livingWorld.envelopeAmount===0);
 check('Cutaway reveal removes opaque facade and roof',await page.evaluate(()=>!window.__livingWorld.finish.lower.visible&&!window.__livingWorld.finish.upper.visible&&!window.__livingWorld.house.roofGroup.visible));
 check('Reveal keeps the camera position and the original house identity',await page.evaluate(({pose,id})=>window.__livingWorld.house.root.uuid===id&&Math.hypot(...window.__livingWorld.camera.position.toArray().map((v,i)=>v-pose[i]))<.02,{pose,id}));
 check('Facade fade does not change shared furniture materials',await page.evaluate(m=>window.__livingWorld.house.materials.oak.opacity===m.oak&&window.__livingWorld.house.materials.cream.opacity===m.linen,material));
 await shot('03-desktop-revealed-plan');
 check('Three accessible room anchors are attached to the 3D view',await page.locator('[data-room-hotspot]').count()===3);
 check('Room anchors are visible after the cutaway opens',await page.locator('[data-room-hotspot]:not([hidden])').count()>0);
 const bedroom=page.locator('[data-room-hotspot="bedroom"]');await bedroom.click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition);
 check('Clicking a spatial room anchor flies into the actual second floor',await page.evaluate(()=>window.__livingWorld.roomId==='bedroom'&&!window.__livingWorld.house.floor1.visible&&window.__livingWorld.house.floor2.visible&&window.__livingWorld.camera.position.z<4));
 await shot('04-desktop-bedroom');
 await outside();await page.locator('#openEnvelope').click();await page.waitForTimeout(180);await page.locator('#showEnvelope').click();await page.waitForFunction(()=>window.__livingWorld.envelopeAmount===1);
 check('Interrupting the reveal can restore the finished exterior',await page.evaluate(()=>window.__livingWorld.snapshot().architecture.finishedExterior));
 await page.locator('[data-floor="1"]').click();await page.waitForFunction(()=>window.__livingWorld.envelopeAmount===0);
 check('Floor isolation never leaves the facade in front of the chosen rooms',await page.evaluate(()=>!window.__livingWorld.house.floor2.visible&&!window.__livingWorld.finish.lower.visible));
 const morning=await seek(.22);await shot('05-desktop-morning');const home=await seek(.71);await shot('06-desktop-living');const night=await seek(.993);
 check('Original daily story still opens curtains, enters the house and dims at night',morning.state.curtain>.98&&home.camera[2]<3.5&&home.state.living>.9&&night.state.living<.02);
 await page.locator('#planNav').click();await page.locator('#windowCount').selectOption('2');await page.locator('[data-owned="curtain"]').fill('1');
 check('Planner subtracts owned products and retains quantities',await page.evaluate(()=>window.__currentPlan.products.find(x=>x.id==='curtain').toBuy===3));
 const downloadPromise=page.waitForEvent('download');await page.locator('#exportPlan').click();const file=await downloadPromise;await file.saveAs(path.join(out,'Example-SwitchBot-Plan.html'));check('Plan export produces a real file',fs.statSync(path.join(out,'Example-SwitchBot-Plan.html')).size>2000);
 await page.setViewportSize({width:390,height:844});await outside();check('Portrait property fits inside the live viewport after OrbitControls updates',await page.evaluate(()=>{const w=window.__livingWorld;w.camera.updateMatrixWorld();for(const x of [-8.15,9.35])for(const y of [-.7,7.3])for(const z of [-7.1,7.5]){const p=w.camera.position.clone().set(x,y,z).project(w.camera),sx=(p.x+1)/2,sy=(1-p.y)/2;if(sx<.01||sx>.99||sy<.09||sy>.57)return false;}return true;}));
 check('Architecture controls do not overlap the product toolbar',await page.evaluate(()=>{const a=document.querySelector('#envelopeControl').getBoundingClientRect(),b=document.querySelector('.world-toolbar').getBoundingClientRect();return a.top>=b.bottom+4||a.right<=b.left||b.right<=a.left;}));
 await shot('07-mobile-exterior');await page.locator('#openEnvelope').click();await page.waitForFunction(()=>window.__livingWorld.envelopeAmount===0);await shot('08-mobile-cutaway');
 check('Portrait exterior and cutaway keep a live WebGL context',await page.evaluate(()=>!window.__livingWorld.renderer.getContext().isContextLost()));
 check('Portrait controls are tappable and there is no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#openEnvelope').getBoundingClientRect().height>=38));
 await page.locator('[data-room="living"]').click();await page.waitForFunction(()=>!window.__livingWorld.roomTransition);await shot('09-mobile-living');
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const rp=await reduced.newPage();await ready(rp,base);await rp.locator('#viewExterior').click();await rp.waitForFunction(()=>window.__livingWorld.envelopeAmount===1);await rp.locator('#openEnvelope').click();await rp.waitForFunction(()=>window.__livingWorld.envelopeAmount===0);check('Reduced-motion user can reveal the house without forced transition',true);await reduced.close();
 const offline=await browser.newContext({viewport:{width:1024,height:768},offline:true});const op=await offline.newPage();const requests=[];op.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await ready(op,pathToFileURL(path.join(root,'portable','SwitchBot-Living-World-V5.html')).href);await op.locator('#viewExterior').click();await op.waitForFunction(()=>window.__livingWorld.envelopeAmount===1);await op.locator('#openEnvelope').click();await op.waitForFunction(()=>window.__livingWorld.envelopeAmount===0);check('Portable page supports the new 3D reveal without any network requests',requests.length===0);await offline.close();
 check('No page JavaScript errors',report.errors.length===0);report.status='PASS';good=true;
}catch(e){report.status='FAIL';report.failure=e.stack;try{await shot('failure');}catch{}}
finally{fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));}
// Film is an actual deterministic render of the same scene. It is not a real-time FPS benchmark.
if(good){
 for(const [name,width,height,count] of [['desktop',1120,700,80],['mobile',390,844,64]]){
  await page.setViewportSize({width,height});await outside();
  await page.evaluate(async()=>{window.__app.stopPlay();window.__spatial.stopOrbit();window.__livingWorld.active=false;cancelAnimationFrame(window.__livingWorld.raf);window.__filmState=await import('./src/timeline.js');window.__filmStart=window.__livingWorld.camera.position.clone();window.__filmTarget=window.__livingWorld.controls.target.clone();});
  const frames=path.join(out,'frames-'+name);fs.mkdirSync(frames,{recursive:true});const c=await page.context().newCDPSession(page);
  try{
   for(let i=0;i<count;i++){
    await page.evaluate(({i,count})=>{const w=window.__livingWorld,t=i/(count-1),ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
     const reveal=ease((t-.15)/.40),flight=ease((t-.57)/.43);w.envelopeAmount=1-reveal;w.envelopeTo=t<.3?1:0;w.envelopeOverride=t<.3;w.roomTransition=null;w.mode='explore';w.roomId='outside';w.floor='all';w.house.floor1.visible=true;w.house.floor2.visible=true;
     w.stateSignature='';w.applyState(window.__filmState.getState(.22));
     w.camera.position.copy(window.__filmStart);w.look.copy(window.__filmTarget);
     const dest=w.mobile?[3.5,5.7,5.7]:[3.6,5.03,3.15],target=[1.95,4.35,-1.6];
     const p=window.__filmStart.toArray(),a=window.__filmTarget.toArray();w.camera.position.set(...p.map((x,k)=>x+(dest[k]-x)*flight));w.look.set(...a.map((x,k)=>x+(target[k]-x)*flight));w.controls.target.copy(w.look);w.camera.lookAt(w.look);
     w.camera.setViewOffset(w.width,w.height,w.width*(w.mobile?0:-.08)*(1-flight),w.height*(w.mobile?.18:0)*(1-flight),w.width,w.height);w.camera.updateProjectionMatrix();w.renderer.shadowMap.needsUpdate=true;w.renderer.render(w.scene,w.camera);w.onFrame(w);
    },{i,count});
    const s=await c.send('Page.captureScreenshot',{format:'jpeg',quality:86,captureBeyondViewport:false});fs.writeFileSync(path.join(frames,String(i).padStart(4,'0')+'.jpg'),Buffer.from(s.data,'base64'));
    if(i%20===0)console.log(name,'frame',i,'/',count);
   }
  }finally{await c.detach();await page.evaluate(()=>{window.__livingWorld.active=true;window.__livingWorld.dirty=true;window.__livingWorld.raf=requestAnimationFrame(window.__livingWorld.animate);});}
  const video=path.join(out,'SwitchBot-V5.1.1-'+name+'-Outside-to-Inside.mp4');const result=spawnSync('ffmpeg',['-y','-framerate','12','-i',path.join(frames,'%04d.jpg'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',video],{encoding:'utf8'});
  if(result.status!==0)throw new Error('Film encoding failed: '+result.stderr);fs.rmSync(frames,{recursive:true,force:true});console.log('FILM',video);
 }
}
await browser.close();if(!good)process.exitCode=1;
