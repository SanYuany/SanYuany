import {scenes,rooms,goals,productCatalog} from './data.js';
import {chapters,chapterAt,clamp,playbackAt} from './timeline.js';
import {buildPlan,encodePlan,decodePlan} from './planner.js';
import {renderPlanDocument,downloadPlanDocument} from './export.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const experience=$('#experience'),stage=$('#stage'),canvas=$('#worldCanvas'),dialog=$('#solutionDialog');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let world,mode='story',activeChapter=-2,progress=0,playing=false,lastPlayTime=0,playStartProgress=0,playRaf=0,storyPosition=0,currentRoom='all',toastTimer;
const storageKey='switchbot-living-world-plan-v4';
const safe=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function getProgress(){const rect=experience.getBoundingClientRect();return clamp(-rect.top/Math.max(1,experience.offsetHeight-stage.clientHeight));}
function updateCopy(p){
 progress=p;const index=chapterAt(p);$('#progressBar').style.width=`${p*100}%`;stage.classList.toggle('night',p>.79);
 if(index!==activeChapter){activeChapter=index;$('#heroCopy').hidden=index>=0;$('#chapterCopy').hidden=index<0;
  $$('#timeline button').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'step':'false');});
  const scene=scenes[index];if(scene){$('#sceneTime').textContent=scene.time;$('#sceneEnglish').textContent=scene.en;$('#sceneTitle').textContent=scene.title;$('#sceneBody').textContent=scene.body;$('#roomName').textContent=scene.room;$('#actionSteps').innerHTML=scene.actions.map(x=>`<li>${safe(x)}</li>`).join('');}
  else $('#roomName').textContent='JAPANESE HOME / 1F + 2F';
 }
 const n=world?.state?.actionIndex??0;$$('#actionSteps li').forEach((li,i)=>li.classList.toggle('done',i<=n));
}
function onScroll(){if(mode!=='story')return;const p=getProgress();if(world)world.setProgress(p);else updateCopy(p);}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});
function seek(p,immediate=false){const y=experience.offsetTop+clamp(p)*(experience.offsetHeight-stage.clientHeight);scrollTo({top:y,behavior:'instant'});if(world)world.setProgress(p,immediate);updateCopy(p);}
function stopPlay(){playing=false;cancelAnimationFrame(playRaf);$('#playToggle').textContent='▶';$('#playToggle').setAttribute('aria-pressed','false');$('#playToggle').setAttribute('aria-label','一日の自動再生');}
function playTick(t){if(!playing)return;const p=playbackAt(playStartProgress,lastPlayTime,t);seek(p);if(p>=1)stopPlay();else playRaf=requestAnimationFrame(playTick);}
function startPlay(){if(mode==='explore')setMode('story');if(reduced){goScene(scenes[(Math.max(-1,activeChapter)+1)%scenes.length].id);toast('動きを減らす設定に合わせて、場面ごとに移動します。');return;}if(getProgress()>.985)seek(0,true);playing=true;lastPlayTime=performance.now();playStartProgress=getProgress();$('#playToggle').textContent='Ⅱ';$('#playToggle').setAttribute('aria-pressed','true');$('#playToggle').setAttribute('aria-label','一日の再生を停止');playRaf=requestAnimationFrame(playTick);}
$('#startExperience').addEventListener('click',startPlay);$('#playToggle').addEventListener('click',()=>playing?stopPlay():startPlay());
addEventListener('wheel',()=>{if(playing)stopPlay();},{passive:true});addEventListener('touchstart',e=>{if(playing&&!e.target.closest('#stageControls'))stopPlay();},{passive:true});
canvas.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();playing?stopPlay():startPlay();}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();goScene(scenes[clamp(activeChapter+(e.key==='ArrowRight'?1:-1),0,3)].id);}});
$('#timeline').innerHTML=scenes.map((s,i)=>`<button type="button" data-scene="${s.id}" aria-label="${s.time} ${s.label}の場面へ"><b>${s.time}</b>${s.label}</button>`).join('');
$$('#timeline button').forEach(b=>b.addEventListener('click',()=>goScene(b.dataset.scene)));
function goScene(id){stopPlay();if(mode==='explore')setMode('story',false);const i=scenes.findIndex(s=>s.id===id);if(i>=0)seek(chapters[i].anchor,reduced);}
$('#textToggle').addEventListener('click',()=>{const hide=stage.classList.toggle('theatre');$('#textToggle').setAttribute('aria-pressed',String(hide));$('#textToggle').textContent=hide?'文字を表示':'3Dのみ';});
function productBlock(id){const p=productCatalog[id];return `<div class="dialog-product"><a href="${p.url}" target="_blank" rel="noopener noreferrer">${safe(p.name)} ↗</a><p>${safe(p.role)}</p><p>${safe(p.note)}</p></div>`;}
function openSolution(id){stopPlay();const s=scenes.find(x=>x.id===id)||scenes[0];$('#dialogContent').innerHTML=`<p class="eyebrow">${s.time} / ${safe(s.en)}</p><h2 class="dialog-title">${safe(s.title)}</h2><p class="dialog-note">${safe(s.note)}</p><p class="tier-title">このシーンに必要 · ESSENTIAL</p>${s.essential.map(productBlock).join('')}${s.recommended.length?`<p class="tier-title">さらに便利に · RECOMMENDED</p>${s.recommended.map(productBlock).join('')}`:''}${s.upgrade.length?`<p class="tier-title">広げるなら · UPGRADE</p>${s.upgrade.map(productBlock).join('')}`:''}<p class="dialog-note">数量・対応条件はご家庭で異なります。複数のシーンで使うハブなどは「わが家のプラン」で重複を除いて集計します。</p><button class="primary" id="dialogPlan">わが家の組み合わせへ ↗</button>`;dialog.showModal();$('#dialogPlan').onclick=()=>{dialog.close();goBuild();};}
$('#solutionButton').onclick=()=>openSolution(scenes[Math.max(0,activeChapter)].id);$('#closeDialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
// Explore is the same 3D world, not a room-card popup.
function setMode(next,restore=true){stopPlay();if(next===mode)return;if(next==='explore')storyPosition=progress;mode=next;experience.classList.toggle('exploring',next==='explore');$('#explorePanel').hidden=next!=='explore';$('#exploreTools').hidden=next!=='explore';$('#storyNav').classList.toggle('active',next==='story');$('#exploreNav').classList.toggle('active',next==='explore');stage.classList.remove('theatre');$('#textToggle').textContent='3Dのみ';$('#textToggle').setAttribute('aria-pressed','false');world?.setMode(next);if(next==='explore'){scrollTo({top:0,behavior:'instant'});stage.classList.remove('night');selectRoom('all');}else if(restore)seek(storyPosition,true);}
function selectRoom(id){currentRoom=id;world?.setRoom(id);const room=rooms.find(r=>r.id===id)||rooms[0];$$('#roomButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.room===id));$('#roomName').textContent=`${room.floor} / ${room.name}`;$('#relatedScenes').innerHTML=`<p>${safe(room.description)}</p>${room.scenes.map(sceneId=>{const s=scenes.find(x=>x.id===sceneId);return `<button class="related-button" data-replay="${s.id}">${s.time} ${s.label}を体験 ↗</button>`;}).join('')}`;$$('[data-replay]').forEach(b=>b.onclick=()=>goScene(b.dataset.replay));const f=id==='bedroom'?'2':id==='living'||id==='entrance'?'1':'all';$$('[data-floor]').forEach(b=>b.classList.toggle('selected',b.dataset.floor===f));}
$('#roomButtons').innerHTML=rooms.map(r=>`<button type="button" data-room="${r.id}">${r.name}<small>${r.floor}</small></button>`).join('');$$('[data-room]').forEach(b=>b.onclick=()=>selectRoom(b.dataset.room));
$$('[data-floor]').forEach(b=>b.onclick=()=>{world?.setFloor(b.dataset.floor);$$('[data-floor]').forEach(x=>x.classList.toggle('selected',x===b));});
$$('[data-light]').forEach(b=>b.onclick=()=>{world?.setTime(b.dataset.light);stage.classList.toggle('night',b.dataset.light==='night');$$('[data-light]').forEach(x=>x.classList.toggle('selected',x===b));});
$('#resetView').onclick=()=>selectRoom(currentRoom);$('#exploreNav').onclick=$('#exploreBelow').onclick=()=>setMode('explore');$('#storyNav').onclick=$('#backToStory').onclick=()=>setMode('story');$('#homeLink').onclick=e=>{e.preventDefault();if(mode!=='story')setMode('story',false);stopPlay();seek(0,true);};
function goBuild(){stopPlay();if(mode==='explore')setMode('story',false);requestAnimationFrame(()=>$('#build').scrollIntoView({behavior:reduced?'instant':'smooth'}));}
$('#planNav').onclick=e=>{e.preventDefault();goBuild();};
// Form values never become executable HTML. Inventory stays on-device; there is no analytics collector.
$('#goalGrid').innerHTML=goals.map(g=>`<label><input type="checkbox" name="goal" value="${g.id}" ${g.id==='comfort'?'checked':''}><b>${g.name}</b><small>${g.sub}</small></label>`).join('');
$('#ownedProducts').innerHTML=['curtain','hub','lock','keypad'].map(id=>`<label>${productCatalog[id].short}<input type="number" inputmode="numeric" min="0" max="20" value="0" data-owned="${id}" aria-label="お持ちの${productCatalog[id].short}の台数"></label>`).join('');
function readInput(){const chosen=$$('input[name=goal]:checked').map(x=>x.value);return{goals:chosen,scenes:scenes.filter(s=>s.goals.some(x=>chosen.includes(x))).map(s=>s.id),curtainWindows:+$('#windowCount').value,split:$('#curtainType').value==='split',compatibleLight:$('#compatibleLight').checked,owned:Object.fromEntries($$('[data-owned]').map(x=>[x.dataset.owned,+x.value]))};}
function restoreInput(data){if(!data||typeof data!=='object')return;const allowed=Array.isArray(data.goals)?data.goals:[];$$('input[name=goal]').forEach(x=>x.checked=allowed.includes(x.value));$('#windowCount').value=String(Math.round(clamp(data.curtainWindows??1,1,6)));$('#curtainType').value=data.split===false?'single':'split';$('#compatibleLight').checked=!!data.compatibleLight;$$('[data-owned]').forEach(x=>x.value=String(Math.round(clamp(data.owned?.[x.dataset.owned]??0,0,20))));}
function renderPlan(){const input=readInput(),plan=buildPlan(input);$('#planSummary').innerHTML=plan.scenes.length?`<h3>${plan.scenes.length}つの暮らしから、始めよう。</h3><div class="scene-pills">${plan.scenes.map(id=>{const s=scenes.find(x=>x.id===id);return `<span>${s.time} ${s.label}</span>`;}).join('')}</div>`:`<p class="empty-plan">左の目的を選ぶと、ここに必要な組み合わせが表示されます。</p>`;
 $('#planProducts').innerHTML=plan.products.map(p=>`<div class="plan-product"><div><a href="${p.url}" target="_blank" rel="noopener noreferrer">${p.name} ↗</a><small>${p.id==='curtain'?`${plan.windows}窓 × ${plan.split?'両開き2台':'片開き1台'}`:p.role}</small></div><div class="product-count">${p.toBuy}<small>${p.toBuy===0?'お持ちの製品を活用':'台を追加'}${p.owned?` · 所有 ${p.owned}`:''}</small></div></div>`).join('');
 $('#planOptional').innerHTML=plan.optional.length?`<div class="optional-plan"><p class="tier-title">さらに便利に · RECOMMENDED</p>${plan.optional.map(p=>`<a href="${p.url}" target="_blank" rel="noopener noreferrer">${safe(p.name)} ↗</a><small>${safe(p.role)}</small>`).join('')}<p>必要な機器とは分けてご検討ください。</p></div>`:'';
 $('#planWarnings').innerHTML=plan.warnings.length?`<div class="plan-warnings">${plan.warnings.map(w=>`<p>※ ${safe(w)}</p>`).join('')}</div>`:'';
 $('#sharePlan').disabled=$('#exportPlan').disabled=!plan.scenes.length;try{localStorage.setItem(storageKey,JSON.stringify(input));}catch{}
 window.__currentPlan=plan;
}
$('#planForm').addEventListener('input',renderPlan);$('#planForm').addEventListener('change',renderPlan);$('#planForm').addEventListener('submit',e=>e.preventDefault());
$('#resetPlan').onclick=()=>{restoreInput({goals:['comfort'],curtainWindows:1,split:true,owned:{}});renderPlan();toast('入力をリセットしました。');};
$('#sharePlan').onclick=async()=>{const url=`${location.origin}${location.pathname}#plan=${encodePlan(readInput())}`;try{await navigator.clipboard.writeText(url);toast('プランの共有URLをコピーしました。');}catch{let field=$('#shareURL');if(!field){field=document.createElement('textarea');field.id='shareURL';field.className='share-url';field.readOnly=true;field.setAttribute('aria-label','共有URL');$('#planResult').appendChild(field);}field.value=url;field.focus();field.select();toast('共有URLを選択しました。コピーしてお使いください。');}};
$('#exportPlan').onclick=()=>{stopPlay();try{const plan=buildPlan(readInput());downloadPlanDocument(renderPlanDocument(plan));toast('プランのダウンロードを開始しました。');}catch(err){console.error('Plan export failed',err);toast('保存できませんでした。もう一度お試しください。');}};
let shared=location.hash.startsWith('#plan=')?decodePlan(location.hash):null;try{restoreInput(shared||JSON.parse(localStorage.getItem(storageKey)||'null'));}catch{}renderPlan();
function failWorld(){stopPlay();$('#loading').hidden=true;$('#fallback').hidden=false;$('#exploreNav').disabled=true;$('#exploreBelow').disabled=true;$('#startExperience').disabled=true;$('#playToggle').disabled=true;}
document.addEventListener('world-failed',failWorld);
window.__app={seek,goScene,setMode,selectRoom,startPlay,stopPlay,readInput,buildPlan,openSolution,renderPlan};
(async()=>{try{const {LivingWorld}=await import('./refined-world.js');world=new LivingWorld(canvas,{reducedMotion:reduced,onFrame:w=>{if(mode==='story')updateCopy(w.progress);}});window.__livingWorld=world;$('#loading').hidden=true;onScroll();if(shared)goBuild();}catch(err){console.error('3D renderer unavailable',err);failWorld();}})();

import './spatial-view.js';
import './cinematic.js';

import './house-controls.js';
