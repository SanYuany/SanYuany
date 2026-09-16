import {orbitFrame,entryProgress} from './spatial-math.js';
/** Same house, renderer and planner as the narrative page. No flat-image substitution. */
const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const style=document.createElement('link');style.rel='stylesheet';style.href='./src/spatial-view.css';document.head.append(style);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function initialize(){
 for(let i=0;i<900&&!window.__livingWorld;i++)await sleep(100);
 const world=window.__livingWorld,app=window.__app;if(!world||!app)return;
 let automatic=false,orbitStart=0,raf=0,introRaf=0,introActive=false,immersive=false;
 const stage=$('#stage');
 const entry=document.createElement('button');entry.id='enterSpatial';entry.type='button';entry.className='spatial-entry';entry.textContent='自由に家を探索する ↗';$('#startExperience').after(entry);
 const tools=document.createElement('div');tools.id='spatialToolbar';tools.className='spatial-toolbar';tools.hidden=true;
 tools.innerHTML='<span class="spatial-badge">3D HOME</span><button id="orbitToggle" aria-pressed="false">回転する</button><button id="spatialDay">一日を再生</button><button id="spatialFullscreen">全画面 ⛶</button><button id="spatialExit">ストーリーへ ↗</button>';stage.append(tools);
 const hint=document.createElement('p');hint.id='spatialHint';hint.className='spatial-hint';hint.hidden=true;hint.textContent='ドラッグで回転 · ピンチで拡大 · 部屋を選んで中へ';stage.append(hint);
 function stopIntro(){introActive=false;cancelAnimationFrame(introRaf);}
 function stopOrbit(){automatic=false;cancelAnimationFrame(raf);$('#orbitToggle').textContent='回転する';$('#orbitToggle').setAttribute('aria-pressed','false');}
 function frame(t){
  if(!automatic||world.mode!=='explore'||document.hidden){if(document.hidden)raf=requestAnimationFrame(frame);else stopOrbit();return;}
  if(!world.roomTransition){const pose=orbitFrame(t-orbitStart,world.mobile);world.camera.position.set(...pose.position);world.controls.target.set(...pose.target);world.look.copy(world.controls.target);world.camera.lookAt(world.look);world.dirty=true;}
  raf=requestAnimationFrame(frame);
 }
 function startOrbit(){stopIntro();app.stopPlay();if(world.mode!=='explore')enter(false);app.selectRoom('all');world.roomTransition=null;world.setFloor('all');automatic=true;orbitStart=performance.now();$('#orbitToggle').textContent='回転を止める';$('#orbitToggle').setAttribute('aria-pressed','true');raf=requestAnimationFrame(frame);}
 function enter(rotate=true){stopIntro();app.stopPlay();immersive=true;document.body.classList.add('spatial-first');app.setMode('explore');tools.hidden=false;hint.hidden=false;world.spatialComposition=true;world.resize();if(rotate&&!reduced)startOrbit();}
 function exit(play=false){stopIntro();stopOrbit();immersive=false;document.body.classList.remove('spatial-first');tools.hidden=true;hint.hidden=true;world.spatialComposition=false;app.setMode('story',false);world.resize();app.seek(0,true);if(play)app.startPlay();}
 $('#enterSpatial').onclick=()=>enter();$('#orbitToggle').onclick=()=>automatic?stopOrbit():startOrbit();$('#spatialExit').onclick=()=>exit();$('#spatialDay').onclick=()=>exit(true);
 $('#spatialFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(stage.requestFullscreen)await stage.requestFullscreen();}catch{hint.textContent='このブラウザでは全画面に切り替えられません。';}};
 world.canvas.addEventListener('pointerdown',()=>{stopIntro();stopOrbit();});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#spatialToolbar')){stopIntro();if(e.target.closest('#roomButtons,#exploreTools,.header,#build'))stopOrbit();}},true);
 window.addEventListener('wheel',stopIntro,{passive:true});window.addEventListener('touchstart',stopIntro,{passive:true});
 for(const id of ['storyNav','backToStory','homeLink','planNav'])$('#'+id)?.addEventListener('click',()=>{if(!immersive)return;stopOrbit();immersive=false;document.body.classList.remove('spatial-first');tools.hidden=true;hint.hidden=true;world.spatialComposition=false;world.resize();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopIntro();stopOrbit();}});
 window.__spatial={ready:true,enter,exit,startOrbit,stopOrbit,stopIntro,get automatic(){return automatic;}};
 if(new URLSearchParams(location.search).get('view')==='3d'){enter();return;}
 if(!reduced&&scrollY<4&&!location.hash){introActive=true;const start=performance.now();function intro(t){if(!introActive)return;app.seek(entryProgress(t-start),true);if(t-start<10000)introRaf=requestAnimationFrame(intro);else stopIntro();}introRaf=requestAnimationFrame(intro);}
}
initialize().catch(e=>console.error('Spatial controls failed to initialize',e));
