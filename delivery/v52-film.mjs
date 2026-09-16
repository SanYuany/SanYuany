import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const encoder=spawnSync('ffmpeg',['-version']);if(encoder.status!==0)throw Error('FFmpeg missing; do not start rendering.');
const mobile=process.env.FILM_VIEW==='mobile',label=mobile?'mobile':'desktop',width=mobile?450:960,height=mobile?900:600;
const root=path.resolve('switchbot-living-world-v5'),out=path.join(root,'evidence/v52/films');fs.mkdirSync(out,{recursive:true});const frames=path.join(out,label+'-frames');fs.mkdirSync(frames,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const page=await b.newPage({viewport:{width,height},deviceScaleFactor:1});
try{await page.goto('http://127.0.0.1:4198/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__spatial?.ready&&window.__cinematic?.ready&&window.__livingWorld.frames>0,null,{timeout:60000});await page.evaluate(()=>{window.__spatial.stopIntro();window.__spatial.stopOrbit();window.__app.stopPlay();window.__livingWorld.active=false;});
 const count=160;
 for(let i=0;i<count;i++){
  const data=await page.evaluate(p=>{const w=window.__livingWorld;window.__app.seek(p,true);w.renderAt(p);return w.canvas.toDataURL('image/jpeg',.9).split(',')[1];},i/(count-1));
  fs.writeFileSync(path.join(frames,String(i).padStart(4,'0')+'.jpg'),Buffer.from(data,'base64'));if(i%40===0)console.log(label,i,'/',count);
 }
 const output=path.join(out,'SwitchBot-Living-World-V5.2-'+label+'.mp4');const r=spawnSync('ffmpeg',['-y','-framerate','10','-i',path.join(frames,'%04d.jpg'),'-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',output],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);
 const verify=spawnSync('ffmpeg',['-v','error','-i',output,'-f','null','-'],{encoding:'utf8'});if(verify.status!==0)throw Error('MP4 decode failed: '+verify.stderr);
 fs.writeFileSync(path.join(out,label+'-manifest.json'),JSON.stringify({version:'5.2.0',sourceSha:process.env.GITHUB_SHA,renderer:'Actual Three.js canvas rendered at sequential deterministic scroll positions',independentPortraitCamera:mobile,width,height,frames:count,durationSeconds:16,playbackFPS:10,realTimePerformanceBenchmark:false,decode:'PASS'},null,2));fs.rmSync(frames,{recursive:true,force:true});console.log('FILM_COMPLETE',output);
}finally{await b.close();}
