import {chromium} from 'playwright';import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const view=process.env.VIEW==='mobile'?'mobile':'desktop',out=`r3-stage/evidence/final-${view}`,frames=384,fps=16;
fs.mkdirSync(out+'/frames',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:view==='desktop'?{width:960,height:600}:{width:450,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4188/render.html');await page.waitForFunction(()=>window.stage?.canvas.dataset.ready==='true',null,{timeout:90000});
const initial=[];
for(const t of [0,3.8,6.4,6.9,7.3,8.2,10.7,12.2,14.2,16.2,17.4,23]){const result=await page.evaluate(t=>{const state=window.seek(t);return {state,image:stage.canvas.toDataURL('image/png')}},t);initial.push(result.state);fs.writeFileSync(`${out}/${view}-${t}.png`,Buffer.from(result.image.split(',')[1],'base64'));}
fs.writeFileSync(out+'/keyframe-report.json',JSON.stringify({view,initial,errors},null,2));
if(process.env.KEYFRAMES_ONLY==='1'){await browser.close();process.exit(errors.length?1:0);}
const states=[];
try{for(let i=0;i<frames;i++){
 const t=24*i/(frames-1);const frame=await page.evaluate(t=>{const state=window.seek(t);return {state,image:stage.canvas.toDataURL('image/jpeg',.90)}},t);
 states.push(frame.state);if(frame.state.proof.contact>.999)assert.ok(frame.state.proof.handError<.001,'Hand lost contact at '+t);
 if(t>=6.85&&t<9.30){assert.equal(frame.state.shot,'inside-lock');assert.equal(frame.state.proof.doorAngle,0);}
 fs.writeFileSync(`${out}/frames/${String(i).padStart(4,'0')}.jpg`,Buffer.from(frame.image.split(',')[1],'base64'));
 if(i%64===0)console.log(view,i,'/',frames);
}}finally{await browser.close();}
assert.deepEqual(errors,[]);
const movie=out+`/coming-home-r3-${view}.mp4`;
const run=(args)=>{const p=spawnSync('ffmpeg',args,{stdio:'inherit'});assert.equal(p.status,0);};
run(['-y','-v','error','-framerate',String(fps),'-i',out+'/frames/%04d.jpg','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-g','8','-movflags','+faststart',movie]);
run(['-v','error','-i',movie,'-f','null','-']);
const files=['stage.js','director.js','src/coming-home/director.js','src/coming-home/proof-stage.js','src/coming-home/proof-motion.js'];const hashes=Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync('r3-stage/'+f)).digest('hex')]));
fs.writeFileSync(out+'/film-report.json',JSON.stringify({edition:'Coming Home R3',view,frames,fps,duration:24,editorialCuts:[6.85,9.30],sourceHashes:hashes,errors,maxFullContactError:Math.max(...states.filter(s=>s.proof.contact>.999).map(s=>s.proof.handError)),states,method:'Deterministic original 3D renders. Not user-GPU performance or measured product kinematics.'},null,2));
fs.rmSync(out+'/frames',{recursive:true});console.log('Decoded and saved',movie);
