import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('switchbot-living-world-v5');const out=path.join(root,'evidence');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const [label,width,height,count] of [['desktop',1152,768,240],['mobile',390,844,120]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});await page.goto('http://127.0.0.1:4195/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true'&&window.__spatial?.ready&&window.__cinematic?.ready,null,{timeout:90000});
 await page.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__livingWorld.active=false;document.documentElement.style.scrollBehavior='auto';document.querySelector('#stage').classList.add('theatre');});
 const cdp=await page.context().newCDPSession(page);const dir=path.join(out,'frames-'+label);fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<count;i++){const p=i/(count-1);await page.evaluate(p=>{window.__app.seek(p,true);window.__livingWorld.renderAt(p);window.__livingWorld.active=false;},p);const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:86,captureBeyondViewport:false});fs.writeFileSync(path.join(dir,String(i).padStart(4,'0')+'.jpg'),Buffer.from(r.data,'base64'));if(i%30===0)console.log(label,'frame',i,'/',count);}
 await cdp.detach();await page.close();
}
fs.writeFileSync(path.join(out,'FILM_README.txt'),'These MP4 files are deterministic frames captured from the running website in Chromium software WebGL, then encoded at 12 fps. Desktop: 240 frames, 20 seconds. Portrait: 120 frames, 10 seconds. They demonstrate continuous camera and physical scene state changes. They are not AI-generated videos or measurements of real-phone frame rate.\n');await browser.close();
