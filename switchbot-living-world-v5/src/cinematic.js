import * as T from 'three';
import {productCatalog} from './data.js';
const $=s=>document.querySelector(s);
let shown=false;
async function setup(){
 for(let i=0;i<300&&!window.__livingWorld;i++)await new Promise(r=>setTimeout(r,50));
 const world=window.__livingWorld;if(!world)return;
 const layer=$('#deviceLayer'),labels=new Map(),position=new T.Vector3();
 for(const device of world.house.devices){if(labels.has(device.id))continue;const el=document.createElement('span');el.className='device-label';el.textContent=productCatalog[device.id]?.short||device.id;el.hidden=true;layer.append(el);labels.set(device.id,el);}
 const previous=world.onFrame;
 world.onFrame=(w)=>{previous(w);for(const [id,el] of labels){const device=w.house.devices.find(d=>d.id===id);const p=w.progress;const relevant=w.mode==='explore'||(p>.09&&p<.28&&id==='curtain')||(p>.28&&p<.49&&['lock','hub'].includes(id))||(p>.49&&p<.78&&['keypad','lock','hub'].includes(id))||(p>.78&&['hub','curtain'].includes(id));
 device.mesh.getWorldPosition(position);position.project(w.camera);const x=(position.x*.5+.5)*w.width,y=(-position.y*.5+.5)*w.height;
 el.hidden=!shown||!relevant||position.z<0||position.z>1||x<12||x>w.width-100||y<80||y>w.height-140;
 if(!el.hidden)el.style.transform=`translate(${x}px,${y}px)`;
 }};
 $('#showDevices').onclick=()=>{shown=!shown;$('#showDevices').setAttribute('aria-pressed',String(shown));world.dirty=true;};
 $('#tryCurtain').onclick=()=>world.setPreview('curtain',!(world.preview.curtain??world.state.curtain));
 $('#tryLight').onclick=()=>{const value=!(world.preview.living??world.state.living);world.setPreview('living',value);world.setPreview('entry',value);};
 $('#cinemaFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#stage').requestFullscreen();}catch{$('#cinemaFullscreen').textContent='全画面不可';}};
 // Pausing the active rendering view while a plan is read avoids needless mobile GPU use.
 const observer=new IntersectionObserver(entries=>{world.active=entries[0].isIntersecting&&!document.hidden;if(world.active)world.dirty=true;},{threshold:0});observer.observe($('#stage'));
 window.__cinematic={ready:true,showDevices:value=>{shown=value;world.dirty=true;}};
}
setup().catch(e=>console.error('Cinematic controls',e));
