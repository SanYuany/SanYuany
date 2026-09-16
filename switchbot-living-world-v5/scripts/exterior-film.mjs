import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const out=path.resolve('evidence/refinement'),frameDir=path.join(out,'exterior-frames');fs.mkdirSync(frameDir,{recursive:true});
const check=spawnSync('ffmpeg',['-hide_banner','-encoders'],{encoding:'utf8'});if(check.status||!check.stdout.includes('libx264'))throw new Error('No H.264 encoder; capture not started.');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const metadata={version:'5.1.0',frames:72,fps:12,method:'Sequential renders of the same interactive website camera. Architectural orbit demonstration, not a real-time FPS benchmark.',status:'RUNNING'};
try{
 const page=await browser.newPage({viewport:{width:1024,height:700},deviceScaleFactor:1});await page.goto(process.env.BASE_URL||'http://127.0.0.1:4185/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__livingWorld?.finish&&window.__spatial?.ready,null,{timeout:90000});
 await page.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__app.setMode('explore');window.__app.selectRoom('outside');});
 await page.waitForFunction(()=>!window.__livingWorld.roomTransition,null,{timeout:45000});
 await page.evaluate(()=>{const w=window.__livingWorld;w.active=false;cancelAnimationFrame(w.raf);w.renderer.setPixelRatio(1);});
 for(let i=0;i<72;i++){
  const result=await page.evaluate(t=>{const w=window.__livingWorld;const angle=.45+t*.8;w.camera.clearViewOffset();w.camera.position.set(Math.sin(angle)*20,7.5,Math.cos(angle)*20);w.camera.lookAt(0,2.6,0);w.renderer.render(w.scene,w.camera);return{frame:w.canvas.toDataURL('image/jpeg',.91),lost:w.renderer.getContext().isContextLost()};},i/71);
  if(result.lost)throw new Error('WebGL context lost');fs.writeFileSync(path.join(frameDir,String(i).padStart(4,'0')+'.jpg'),Buffer.from(result.frame.split(',')[1],'base64'));
  if(i%24===0)console.log('exterior frame',i);
 }
 const file=path.join(out,'SwitchBot-V5.1-Exterior-3D.mp4');const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','12','-i',path.join(frameDir,'%04d.jpg'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',file],{encoding:'utf8',timeout:120000});if(r.status)throw new Error(r.stderr);metadata.status='PASS';metadata.file=path.basename(file);metadata.bytes=fs.statSync(file).size;
 fs.rmSync(frameDir,{recursive:true,force:true});
}catch(e){metadata.status='FAIL';metadata.error=String(e);throw e;}
finally{fs.writeFileSync(path.join(out,'exterior-film.json'),JSON.stringify(metadata,null,2));await browser.close();}
