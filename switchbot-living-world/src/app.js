import { scenes, rooms, products } from './data.js';

const byId = id => document.getElementById(id);
const sceneCopy = byId('sceneCopy');
const timeline = byId('timeline');
const worldBg = document.querySelector('.world-bg');
const worldHouse = byId('worldHouse');
const progressBar = byId('progressBar');
const dialog = byId('solutionDialog');
const dialogContent = byId('dialogContent');
const story = document.querySelector('.story-shell');
let activeScene = 0;

const productMap = new Map(products.map(p => [p.id,p]));

function productChip(id){
  const p = productMap.get(id);
  return `<a class="product-chip" href="${p.url}" target="_blank" rel="noopener">${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy"/>` : `<span class="ph"></span>`}<span><strong>${p.name}</strong><br><small>${p.role}</small></span></a>`;
}

function solutionMarkup(scene){
  const tier = (label, ids) => ids.length ? `<div class="tier"><div class="tier-label">${label}</div><div class="product-row">${ids.map(productChip).join('')}</div></div>` : '';
  return `<div class="dialog-body"><p class="kicker dark">${scene.time} · ${scene.eyebrow}</p><h3>${scene.headline}</h3><p>${scene.body}</p><div class="action-chain">${scene.actions.map((a,i)=>`<div class="action-step"><b>0${i+1}</b><br>${a}</div>`).join('')}</div>${tier('ESSENTIAL',scene.essential)}${tier('RECOMMENDED',scene.recommended)}${tier('UPGRADE',scene.upgrade)}</div>`;
}

function applyScene(index, source='scroll'){
  activeScene = Math.max(0,Math.min(scenes.length-1,index));
  const scene = scenes[activeScene];
  worldBg.dataset.tone = scene.tone;
  sceneCopy.innerHTML = `<p class="scene-time">${scene.time} · ${scene.eyebrow}</p><h2>${scene.headline}</h2><p>${scene.body}</p><button class="ghost" id="openSolution">このしくみを見る</button>`;
  document.querySelectorAll('.room').forEach(el=>el.classList.remove('active'));
  const targetRoom = scene.room === 'bedroom' ? '.bedroom' : scene.room === 'entrance' ? '.entrance' : '.living';
  document.querySelector(targetRoom)?.classList.add('active');
  const transform = [
    'translateY(-50%) scale(1)',
    'translateY(-50%) scale(.95) translateX(2vw)',
    'translateY(-50%) scale(1.10) translateX(-3vw)',
    'translateY(-50%) scale(.92) translateX(1vw)'
  ][activeScene];
  worldHouse.style.transform = transform;
  document.querySelectorAll('.timeline button').forEach((b,i)=>b.classList.toggle('active',i===activeScene));
  byId('openSolution')?.addEventListener('click',()=>openSolution(scene));
  if(source==='click'){
    const spacer = document.querySelector('.story-spacer');
    const start = story.offsetTop;
    const max = spacer.offsetHeight - window.innerHeight;
    window.scrollTo({top:start + max*(activeScene/(scenes.length-1)),behavior:'smooth'});
  }
}

function openSolution(scene){
  dialogContent.innerHTML = solutionMarkup(scene);
  dialog.showModal();
}

scenes.forEach((s,i)=>{
  const b=document.createElement('button');
  b.innerHTML=`<strong>${s.time}</strong><span>${s.eyebrow}</span>`;
  b.addEventListener('click',()=>applyScene(i,'click'));
  timeline.appendChild(b);
});

dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog) dialog.close();});

function onScroll(){
  const top = story.offsetTop;
  const spacer = document.querySelector('.story-spacer');
  const max = spacer.offsetHeight - window.innerHeight;
  const p = Math.max(0,Math.min(1,(window.scrollY-top)/max));
  progressBar.style.width = `${p*100}%`;
  const idx = Math.min(scenes.length-1,Math.floor(p*scenes.length));
  if(idx!==activeScene) applyScene(idx);
}
window.addEventListener('scroll',onScroll,{passive:true});

const roomGrid=byId('roomGrid');
const explorePanel=byId('explorePanel');
rooms.forEach((r,i)=>{
  const card=document.createElement('button');card.className='room-card';card.innerHTML=`<span class="num">0${i+1}</span><h3>${r.name}</h3><p>${r.descriptor}</p>`;
  card.addEventListener('click',()=>renderRoom(r,card));roomGrid.appendChild(card);
});
function renderRoom(room,card){
  document.querySelectorAll('.room-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');
  const related = room.scenes.map(id=>scenes.find(s=>s.id===id));
  explorePanel.innerHTML=`<div><p class="kicker">${room.name.toUpperCase()}</p><h3>${room.name}で変わる暮らし</h3><p>${room.descriptor}を中心に、製品ではなく生活の瞬間から選びます。</p></div><div class="explore-scenes">${related.map(s=>`<button class="mini-scene" data-scene="${s.id}"><span>${s.time} · ${s.eyebrow}</span><strong>${s.headline}</strong></button>`).join('')}</div>`;
  explorePanel.querySelectorAll('.mini-scene').forEach(btn=>btn.addEventListener('click',()=>openSolution(scenes.find(s=>s.id===btn.dataset.scene))));
}
renderRoom(rooms[0],roomGrid.children[0]);

const goalScenes={ease:['coming-home','leaving','good-night'],comfort:['morning','coming-home','good-night'],security:['coming-home','leaving'],energy:['leaving','good-night','morning']};
function renderPlan(goal='ease'){
  const selected=goalScenes[goal].map(id=>scenes.find(s=>s.id===id));
  byId('planCard').innerHTML=`<p class="kicker dark">YOUR SWITCHBOT HOME</p><h3>${goal==='ease'?'もっとラクに':goal==='comfort'?'もっと快適に':goal==='security'?'もっと安心に':'もっと省エネに'}</h3><p>最初から全部そろえなくても、優先度の高いシーンから始められます。</p><div class="plan-list">${selected.map((s,i)=>`<div class="plan-item"><div><b>0${i+1}</b> ${s.headline}</div><span>${s.essential.map(id=>productMap.get(id).name.replace('SwitchBot ','')).join(' + ')}</span></div>`).join('')}</div>`;
}
byId('builderOptions').addEventListener('click',e=>{if(!e.target.matches('.choice'))return;document.querySelectorAll('.choice').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');renderPlan(e.target.dataset.goal)});
renderPlan();
applyScene(0);
