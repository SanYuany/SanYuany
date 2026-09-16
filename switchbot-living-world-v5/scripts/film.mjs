import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const layout=process.env.LAYOUT||'desktop';
if(!['desktop','mobile'].includes(layout))throw new Error('LAYOUT must be desktop or mobile');
const root=process.env.PROJECT_ROOT||process.cwd();
const out=path.join(root,'evidence','films');fs.mkdirSync(out,{recursive:true});
const ffmpeg=process.env.FFMPEG_BIN||'ffmpeg';
const preflight=spawnSync(ffmpeg,['-hide_banner','-encoders'],{encoding:'utf8'});
if(preflight.status!==0||!preflight.stdout.includes('libx264'))throw new Error('Install FFmpeg with libx264 BEFORE capture. No frames were started.');
const fps=16,seconds=16,count=fps*seconds;
const viewport=layout==='desktop'?{width:1120,height:700}:{width:480,height:848};
const frames=path.join(out,'frames-'+layout);fs.mkdirSync(frames,{recursive:true});
const meta={layout,viewport,fps,seconds,expectedFrames:count,captured:0,method:'Deterministic sequential frames from the actual website WebGL camera; simulated continuous scroll, not device performance measurement.',started:new Date().toISOString(),result:'IN_PROGRESS'};
fs.writeFileSync(path.join(out,layout+'-capture.json'),JSON.stringify(meta,null,2));
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4195/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__livingWorld?.canvas.dataset.ready==='true'&&window.__cinematic?.ready&&window.__spatial?.ready,null,{timeout:90000});
 await page.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__app.setMode('story',false);const w=window.__livingWorld;w.active=false;cancelAnimationFrame(w.raf);w.renderer.setPixelRatio(1);w.resize();});
 for(let i=0;i<count;i++){
  const progress=i/(count-1);
  const result=await page.evaluate(p=>{const w=window.__livingWorld;w.renderAt(p);return{url:w.canvas.toDataURL('image/jpeg',.92),camera:w.camera.position.toArray(),triangles:w.renderer.info.render.triangles,lost:w.renderer.getContext().isContextLost()};},progress);
  if(result.lost||result.triangles<5000||!result.url.startsWith('data:image/jpeg;base64,'))throw new Error('3D render invalid at '+i);
  fs.writeFileSync(path.join(frames,String(i).padStart(4,'0')+'.jpg'),Buffer.from(result.url.split(',')[1],'base64'));
  meta.captured=i+1;
  if(i%32===0||i===count-1){console.log(layout+' frame '+(i+1)+'/'+count);fs.writeFileSync(path.join(out,layout+'-capture.json'),JSON.stringify(meta,null,2));}
 }
 const file=path.join(out,'SwitchBot-V5-'+layout+'-3D-Journey.mp4');
 const encode=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',path.join(frames,'%04d.jpg'),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',file],{encoding:'utf8',timeout:120000});
 if(encode.status!==0)throw new Error('Encoder failed; frames retained: '+encode.stderr);
 if(fs.statSync(file).size<20000)throw new Error('Video is unexpectedly small');
 // Contact sheets are actual rendered frames, never substituted concept art.
 const sheet=path.join(out,layout+'-contact-sheet.jpg');
 const tile=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',file,'-vf',"fps=0.75,scale=320:-1,tile=4x3",'-frames:v','1',sheet],{encoding:'utf8',timeout:60000});
 if(tile.status!==0)throw new Error('Contact sheet failed: '+tile.stderr);
 meta.result='PASS';meta.file=path.basename(file);meta.bytes=fs.statSync(file).size;meta.sha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');meta.completed=new Date().toISOString();
 for(const [label,n] of [['overview',0],['morning',Math.round(count*.22)],['entry',Math.round(count*.60)],['living',Math.round(count*.71)],['night',count-1]])fs.copyFileSync(path.join(frames,String(n).padStart(4,'0')+'.jpg'),path.join(out,layout+'-'+label+'.jpg'));
 fs.rmSync(frames,{recursive:true,force:true});
}catch(error){meta.result='FAIL';meta.error=String(error.stack||error);throw error;}
finally{fs.writeFileSync(path.join(out,layout+'-capture.json'),JSON.stringify(meta,null,2));await browser.close();}
