import { scenes, rooms } from './data.js';
import { SwitchBotWorld } from './three-world.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#worldCanvas'); let world;
try { world=new SwitchBotWorld(canvas); } catch(err){ console.error(err); $('#webglFallback').hidden=false; }

const experience=$('#experience'), hero=$('#heroCopy'), overlay=$('#sceneOverlay'), bar=$('#progressBar');
const sceneTime=$('#sceneTime'), sceneEyebrow=$('#sceneEyebrow'), sceneTitle=$('#sceneTitle'), sceneBody=$('#sceneBody');
let activeScene=-1, activeGoal=null;
const anchors=[.16,.36,.62,.88];
const ranges=[[.08,.27],[.27,.49],[.49,.78],[.78,1.01]];

function clamp01(v){return Math.min(1,Math.max(0,v));}
function getProgress(){ const r=experience.getBoundingClientRect(); return clamp01((-r.top)/(experience.offsetHeight-innerHeight)); }
function setWorldProgress(p){ if(world) world.setWorldProgress(p); bar.style.width=`${(p*100).toFixed(2)}%`; }
function sceneIndexFor(p){ return ranges.findIndex(([a,b])=>p>=a&&p<b); }
function applyScene(index){
  if(index===activeScene) return; activeScene=index;
  $$('#timeline button').forEach((b,i)=>b.classList.toggle('active',i===index));
  if(index<0){ hero.style.opacity='1'; hero.style.pointerEvents='auto'; overlay.classList.remove('is-visible'); return; }
  const s=scenes[index]; hero.style.opacity='0'; hero.style.pointerEvents='none';
  sceneTime.textContent=s.time; sceneEyebrow.textContent=s.eyebrow; sceneTitle.textContent=s.title; sceneBody.textContent=s.body; overlay.classList.add('is-visible');
}
function onScroll(){ const p=getProgress(); setWorldProgress(p); applyScene(sceneIndexFor(p)); }
addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll,{passive:true}); onScroll();

$$('#timeline button').forEach((button,i)=>button.addEventListener('click',()=>{
  const top=experience.offsetTop+anchors[i]*(experience.offsetHeight-innerHeight); scrollTo({top,behavior:'smooth'});
}));

function renderDialog(scene){
  $('#dialogContent').innerHTML=`<div class="dialog-inner"><p class="eyebrow dark">${scene.time} · ${scene.eyebrow}</p><h3>${scene.title}</h3><div class="tier"><span>ESSENTIAL</span><b>${scene.essential.join(' / ')}</b></div><div class="tier"><span>RECOMMENDED</span><b>${scene.recommended.join(' / ')}</b></div><div class="tier"><span>UPGRADE</span><b>${scene.upgrade.join(' / ')}</b></div></div>`;
  $('#solutionDialog').showModal();
}
$('#solutionButton').addEventListener('click',()=>renderDialog(scenes[Math.max(0,activeScene)])); $('#dialogClose').addEventListener('click',()=>$('#solutionDialog').close());

$('#roomGrid').innerHTML=rooms.map((r,i)=>`<article class="room-card" data-room="${r.id}"><span class="number">0${i+1}</span><h3>${r.name}</h3><p>${r.copy}</p><span class="eyebrow dark">${r.scenes.length} SCENES →</span></article>`).join('');
$$('.room-card').forEach(card=>card.addEventListener('click',()=>{
  const room=rooms.find(r=>r.id===card.dataset.room); const related=scenes.filter(s=>room.scenes.includes(s.id));
  $('#dialogContent').innerHTML=`<div class="dialog-inner"><p class="eyebrow dark">EXPLORE · ${room.name}</p><h3>${room.copy}</h3>${related.map(s=>`<div class="tier"><span>${s.time} · ${s.eyebrow}</span><b>${s.title}</b></div>`).join('')}</div>`; $('#solutionDialog').showModal();
}));

const goalMap={
  '安心':['leaving','coming-home','good-night'], 'ラク':['morning','leaving','coming-home','good-night'], '快適':['morning','coming-home'], '省エネ':['leaving','good-night']
};
$$('#goalGrid button').forEach(btn=>btn.addEventListener('click',()=>{
  activeGoal=btn.dataset.goal; $$('#goalGrid button').forEach(b=>b.classList.toggle('active',b===btn));
  const selected=scenes.filter(s=>goalMap[activeGoal].includes(s.id));
  $('#planCard').innerHTML=`<p class="eyebrow">YOUR SWITCHBOT HOME · ${activeGoal}</p><h3>${selected.length}つの暮らしを優先。</h3><div class="plan-list">${selected.map(s=>`<div class="plan-item"><b>${s.time} ${s.title}</b><span>${s.essential.concat(s.recommended).join(' · ')}</span></div>`).join('')}</div>`;
}));
