(()=>{
"use strict";
const PRODUCTS={
 lock:{id:'lock',name:'SwitchBot ロックUltra',place:'玄関ドアの内側',image:'media/scene-lock.jpg',url:'https://www.switchbot.jp/products/switchbot-lock-ultra',condition:'ドア・サムターンの適合を確認。ドアの開閉は人が行います。'},
 keypad:{id:'keypad',name:'SwitchBot 顔認証パッド',place:'玄関の外側',image:'media/scene-keypad.jpg',url:'https://www.switchbot.jp/products/switchbot-keypad-vision',condition:'対応ロックとのペアリング、顔の登録と設置位置の調整が必要です。'},
 hub:{id:'hub',name:'SwitchBot ハブ3',place:'操作する家電と同じ部屋',image:'media/scene-hub.jpg',url:'https://www.switchbot.jp/products/switchbot-hub3',condition:'対応する赤外線家電・2.4GHz Wi-Fi・シーン設定が必要です。'}
};
const count=v=>Math.min(20,Math.max(0,Math.floor(Number(v)||0)));
function buildPlan({tasks=['entry'],owned={},doorLocks=1,trigger='button',lightCompatible='unknown'}={}){
 const selected=[...new Set(tasks)].filter(x=>['entry','welcome'].includes(x)),lines=new Map(),warnings=[];
 const need=(id,qty,reason)=>{const v=lines.get(id);if(v){v.qty=Math.max(v.qty,qty);v.reasons.push(reason);}else lines.set(id,{...PRODUCTS[id],qty,reasons:[reason]});};
 if(selected.includes('entry')){need('lock',doorLocks===2?2:1,'登録した顔の認証結果を受けて、玄関の鍵を解錠。');need('keypad',1,'鍵やスマホを取り出さずに、玄関の外で本人認証。');}
 if(selected.includes('welcome')){need('hub',1,'同じ部屋の対応する照明・家電に、設定した操作を届ける。');if(trigger==='door'){need('lock',doorLocks===2?2:1,'玄関の動作を使う帰宅オートメーションの構成例。');warnings.push('ドア連動はジオフェンスなどの条件とオートメーションの事前設定を確認してください。鍵が開くたび無条件に実行する説明ではありません。');}else warnings.push('この構成はハブのボタンで室内シーンを実行します。玄関での自動解錠やドア連動は含みません。');warnings.push('ハブは単一LDKの例として1台。壁・距離・赤外線の届く範囲により追加が必要です。');}
 if(selected.includes('entry')||trigger==='door'&&selected.includes('welcome'))warnings.push('玄関のドア・サムターンと取り付け寸法は購入前に確認が必要です。');
 let compatibility='CHECK_REQUIRED';
 if(selected.includes('welcome')){if(lightCompatible==='no'){compatibility='UNSUPPORTED_LIGHT';warnings.push('現在の照明はこの赤外線構成では操作できません。対応照明や別の操作方法を先に確認してください。');}else if(lightCompatible!=='yes')warnings.push('照明の対応が未確認です。おすすめ機器の一覧は動作保証ではありません。');else compatibility='DEVICE_FIT_TO_CHECK';}
 const products=[...lines.values()].map(p=>({...p,owned:count(owned[p.id]),toBuy:Math.max(0,p.qty-count(owned[p.id]))}));
 return {tasks:selected,trigger:trigger==='door'?'door':'button',doorLocks:doorLocks===2?2:1,lightCompatible,products,warnings,compatibility,newCount:products.reduce((n,p)=>n+p.toBuy,0)};
}
/** Consumer scope is not an installation certification. Never imply hardware alone proves fit. */
function describePlan(plan){
 const entry=plan.tasks.includes('entry'),inside=plan.tasks.includes('welcome'),linked=inside&&plan.trigger==='door';
 const mode=!entry&&!inside?'EMPTY':linked?'ARRIVAL_LINK':entry&&inside?'SEPARATE_OPERATIONS':entry?'ENTRY_ONLY':'INDOOR_BUTTON';
 const outcomes=[],excluded=[];
 if(entry)outcomes.push('登録した顔で本人認証し、対応ロックを解錠。');
 else excluded.push('顔認証での解錠は含まれません。');
 if(inside)outcomes.push(linked?'事前に設定した帰宅条件で、対応照明のシーンを実行。':'ハブ3のボタンから、対応照明のシーンを実行。');
 else excluded.push('室内の点灯・帰宅連動は含まれません。');
 if(!linked)excluded.push('玄関の動作をきっかけにした室内の自動点灯は含まれません。');
 if(mode!=='EMPTY')excluded.push('ドアの自動開閉は含まれません。開閉は人が行います。');
 const status=mode==='EMPTY'?'EMPTY':plan.compatibility==='UNSUPPORTED_LIGHT'?'BLOCKED':'CHECK_REQUIRED';
 const titles={EMPTY:'まず、減らしたい操作を選ぶ。',ENTRY_ONLY:'まずは、玄関だけ。',INDOOR_BUTTON:'まずは、室内のボタン操作。',SEPARATE_OPERATIONS:'玄関と室内を、それぞれ便利に。',ARRIVAL_LINK:'帰宅と点灯を、条件付きでつなぐ。'};
 const nextAction=status==='EMPTY'?'実現したい場面を一つ選んでください。':status==='BLOCKED'?'現在の照明はこの構成では操作できません。購入前に照明の対応・別の操作方法を先に確認してください。':linked?'ドア・照明の適合と、アプリの帰宅条件／通信範囲を先に確認してください。':entry?'ドア・サムターンの適合と、顔認証パッドの設置・登録条件を先に確認してください。':'照明の対応、ハブの設置場所、ボタンへのシーン登録を先に確認してください。';
 const note=mode==='SEPARATE_OPERATIONS'?'二つを選んでも、自動で連動する設定にはなりません。室内はボタン操作です。':mode==='ARRIVAL_LINK'?'映像と同じ方向の構成例です。帰宅条件の事前設定が必要で、毎回の解錠だけで無条件に点灯する説明ではありません。':mode==='ENTRY_ONLY'?'映像後半の室内連動は、この選択には入りません。':mode==='INDOOR_BUTTON'?'映像は帰宅連動の例です。この選択では、照明はボタンで操作します。':'映像のすべてを揃える必要はありません。';
 return {mode,status,title:titles[mode],outcomes,excluded:mode==='EMPTY'?[]:excluded,nextAction,note};
}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=u=>{try{const v=new URL(u);return v.protocol==='https:'&&v.hostname==='www.switchbot.jp'?esc(v.href):'#';}catch{return '#';}};
function planHTML(plan){
 const d=describePlan(plan);
 return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SwitchBot 帰宅プラン</title><style>body{font-family:system-ui,sans-serif;color:#24332f;max-width:880px;margin:40px auto;padding:24px;line-height:1.8}h1{font-size:30px;line-height:1.5}h2{font-size:20px;margin-top:30px}small{color:#62665d}.scope{padding:20px;background:#f4f1ea;border-left:3px solid #b14734}.gate{padding:18px;border:1px solid #ac7358}.blocked{background:#fff0e5}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #ddd;font-size:13px}a{color:#a33626}li{margin:8px 0}@media(max-width:550px){body{padding:16px}td,th{padding:8px 4px;font-size:11px}h1{font-size:25px}}@media print{.scope,.gate,tr{break-inside:avoid}}</style></head><body><small>SWITCHBOT / LIVING WORLD · COMING HOME R4.1</small><h1>わが家の「おかえり」プラン</h1><section class="scope"><h2>${esc(d.title)}</h2><p>${esc(d.note)}</p><h3>選んだ体験</h3><ul>${d.outcomes.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h3>このプランに含まれないこと</h3><ul>${d.excluded.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></section><h2>先に確認すること</h2><div class="gate ${d.status==='BLOCKED'?'blocked':''}"><b>${d.status==='BLOCKED'?'対応確認が先です':'適合・設定は未検証です'}</b><p>${esc(d.nextAction)}</p></div><p>参考構成・価格と在庫は公式ページで確認。必要台数は選んだ場面に限った概算です。</p>${plan.tasks.includes('welcome')?'<p>室内シーン：'+(plan.trigger==='door'?'ドア連動（条件設定を確認）':'ボタンで実行')+'</p>':''}<h2>${d.status==='BLOCKED'?'対応確認後に検討する機器':'選んだ場面の参考機器'}</h2><table><thead><tr><th>製品・役割</th><th>必要</th><th>所有</th><th>追加</th></tr></thead><tbody>${plan.products.map(p=>`<tr><td><a href="${safeURL(p.url)}">${esc(p.name)}</a><br><small>${p.reasons.map(esc).join(' ')}<br>${esc(p.condition)}</small></td><td>${p.qty}</td><td>${p.owned}</td><td>${p.toBuy}</td></tr>`).join('')}</tbody></table><h2>ご購入前の条件</h2>${plan.warnings.map(w=>`<p>※ ${esc(w)}</p>`).join('')}<footer><p>設置適合・対応機器・通信範囲は家庭ごとに確認してください。映像は演出を含む3Dイメージで、実測の設置図ではありません。</p><small>このファイルは静的な参考プランです。既存機器の適合や設置完了を証明しません。支払い・価格計算・在庫予約は行いません。</small></footer></body></html>`;
}

const DURATION=24;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number(x)||0));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};const ramp=(t,a,b)=>ease((t-a)/(b-a));
const CHAPTERS=[{start:0,end:5,name:'荷物を持って、帰宅。',kicker:'01 / HANDS FULL',body:'鍵を探すために、荷物を置かなくていい。',device:null},{start:5,end:9,name:'顔を向けて、解錠。',kicker:'02 / YOUR FACE, YOUR KEY',body:'顔認証パッドが認証。内側のロックが鍵を回す。',device:'keypad'},{start:9,end:14,name:'いつものドアを、開ける。',kicker:'03 / STILL YOUR DOOR',body:'開くのは鍵。ドアは、あなたの手で。',device:'lock'},{start:14,end:18,name:'明かりまで、ひと続きに。',kicker:'04 / A CONNECTED WELCOME',body:'設定した帰宅の条件に合わせて、対応する照明をオン。',device:'hub'},{start:18,end:21,name:'いつもの家電も、一緒に。',kicker:'05 / START WITH WHAT YOU HAVE',body:'ハブが、同じ部屋の対応する家電へ操作を届ける。',device:'hub'},{start:21,end:24.1,name:'あとは、くつろぐだけ。',kicker:'06 / MAKE IT YOURS',body:'玄関だけでも。室内までつなげても。必要な暮らしから。',device:null}];
function stateAt(t){t=clamp(t,0,DURATION);return {t,authenticated:t>=7,locked:t<7.6,dialAngle:-Math.PI/2*ramp(t,7.0,7.6),door:ramp(t,10,12.8),hand:ramp(t,9.2,10.2)*(1-ramp(t,12.5,13.5)),entry:ramp(t,14,15),living:ramp(t,15.2,17.4),hub:t>=14.2,walkIn:ramp(t,12.5,15.3),walkUp:ramp(t,.5,4.6),settled:ramp(t,20,22)};}
const keys=[[0,[12.8,7.8,15.6],[1.1,2.55,.55]],[2.7,[7.3,3.15,8.5],[3.7,1.15,3.4]],[4.6,[5.6,2.2,6.7],[3.7,1.5,3.85]],[5.8,[4.82,1.75,4.06],[4.64,1.65,3.66]],[8.6,[4.80,1.73,4.02],[4.64,1.65,3.66]],[10,[5.15,1.62,5.70],[4.06,1.38,3.86]],[12.8,[4.86,1.62,5.55],[3.99,1.38,3.95]],[15.7,[3.79,1.72,3.15],[3.34,1.4,1]],[17.2,[2.75,1.71,1.95],[-1.2,1.12,.1]],[18,[1.15,1.8,1.7],[-2.7,1.1,.1]],[19,[1.70,1.21,-.10],[1.52,1.13,-.54]],[20.7,[1.68,1.20,-.11],[1.52,1.13,-.54]],[23,[.95,1.88,2.45],[-2.45,1.05,-.08]],[24,[.82,1.87,2.45],[-2.45,1.05,-.08]]];
const mobileKeys=keys.map(k=>[k[0],[...k[1]],[...k[2]]]);const overrides={0:[[18.5,9,22],[1.2,2.7,.5]],2.7:[[7.5,3.1,9.2],[3.7,1.7,3.6]],4.6:[[5.5,2.4,7.2],[3.95,1.48,4.02]],5.8:[[4.87,1.77,4.17],[4.64,1.65,3.66]],8.6:[[4.85,1.75,4.15],[4.64,1.65,3.66]],18:[[.1,1.94,2.9],[-2.4,1.32,.1]],23:[[0,1.95,2.82],[-2.6,1.22,.1]],24:[[-.12,1.95,2.8],[-2.6,1.22,.1]]};for(const k of mobileKeys)if(overrides[k[0]])[k[1],k[2]]=overrides[k[0]];
function baseCameraAt(t,mobile=false){t=clamp(t,0,DURATION);const list=mobile?mobileKeys:keys;let i=0;while(i<list.length-2&&t>list[i+1][0])i++;const a=list[i],b=list[i+1],u=ease((t-a[0])/(b[0]-a[0]));const mix=(v,w)=>v.map((n,j)=>n+(w[j]-n)*u);return {position:mix(a[1],b[1]),target:mix(a[2],b[2])};}
function chapterAt(t){return CHAPTERS.findIndex(c=>t>=c.start&&t<c.end);}

const EDITORIAL_CUTS=[6.85,9.30];
function cameraAt(t,mobile=false){
 t=clamp(t,0,DURATION);
 if(t>=6.85&&t<9.30){const u=clamp((t-6.85)/2.45);return {position:mobile?[4.42-u*.018,1.61,3.00]:[4.40-u*.018,1.61,3.08],target:[4.22,1.55,3.40],shot:'inside-lock'};}
 return {...baseCameraAt(t,mobile),shot:t<6.85?'arrival-and-authentication':t<14?'manual-entry':'indoor-welcome'};
}

/** Editorial explanation, never a readout from real devices. */
const ROLES={
 keypad:{eyebrow:'01 / 玄関の外',title:'本人を確かめる。',verb:'認証',body:'登録した顔で本人認証。鍵やスマホを取り出す操作を減らします。',boundary:'顔認証パッドだけでドアは開きません。対応ロックとのペアリングが必要です。',task:'entry'},
 lock:{eyebrow:'02 / ドアの内側',title:'鍵を回す。ドアはそのまま。',verb:'解錠',body:'認証結果を受けて、ドア内側の対応ロックが鍵を回します。',boundary:'解錠とドアを開く動作は別です。ドアを開けるのは人の手です。',task:'entry'},
 manual:{eyebrow:'03 / あなたの手',title:'開けるのは、あなた。',verb:'開扉',body:'解錠したいつものドアを、自分の手で開けて入ります。',boundary:'自動ドアやドア開閉用モーターの機能を表す映像ではありません。',task:null},
 hub:{eyebrow:'04 / 操作する家電と同じ部屋',title:'対応する照明へ、操作を届ける。',verb:'点灯',body:'ボタン操作でまとめる方法と、事前に設定した帰宅条件でつなぐ方法を選べます。',boundary:'すべての照明がそのまま使えるわけではありません。赤外線家電の対応、設置場所、シーン設定を確認してください。',task:'welcome'}
};
function roleForTime(t){return t<5?null:t<6.85?'keypad':t<9.3?'lock':t<14?'manual':'hub';}
function proofProgress(t){return ['keypad','lock','manual','hub'].map((id,i)=>({id,active:roleForTime(t)===id,reached:t>=[5,6.85,9.3,14][i]}));}
/** What is actually visible is not always the same thing as the explanatory role. */
function visibleCueForTime(t){if(!Number.isFinite(t)||t<5||t>=21)return null;return t<6.85?'keypad':t<9.3?'lock':t<14?'manual':'hub';}

/** A URL carries chosen device counts only; it never carries identity or fit certification. */
const shareCount = v => Number.isFinite(Number(v)) ? Math.min(20,Math.max(0,Math.floor(Number(v)))) : 0;
function normalizePlanInput(input={}){
 const value=input&&typeof input==='object'?input:{};
 const tasks=['entry','welcome'].filter(t=>Array.isArray(value.tasks)&&value.tasks.includes(t));
 return {tasks,trigger:value.trigger==='door'?'door':'button',doorLocks:value.doorLocks===2?2:1,lightCompatible:['yes','no'].includes(value.lightCompatible)?value.lightCompatible:'unknown',owned:Object.fromEntries(['lock','keypad','hub'].map(k=>[k,shareCount(value.owned?.[k])]))};
}
function encodePlan(input){
 const p=normalizePlanInput(input);
 const payload=[(p.tasks.includes('entry')?1:0)+(p.tasks.includes('welcome')?2:0),p.trigger==='door'?1:0,p.doorLocks,['unknown','yes','no'].indexOf(p.lightCompatible),p.owned.lock,p.owned.keypad,p.owned.hub];
 return 'v1.'+btoa(JSON.stringify(payload)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodePlan(input){
 try{
  const value=String(input).replace(/^#plan=/,'');
  if(value.length>256||!/^v1\.[A-Za-z0-9_-]+$/.test(value))return null;
  const encoded=value.slice(3).replace(/-/g,'+').replace(/_/g,'/');
  const p=JSON.parse(atob(encoded));
  if(!Array.isArray(p)||p.length!==7||p.some(n=>!Number.isInteger(n)))return null;
  if(p[0]<0||p[0]>3||![0,1].includes(p[1])||![1,2].includes(p[2])||p[3]<0||p[3]>2||p.slice(4).some(n=>n<0||n>20))return null;
  return normalizePlanInput({tasks:['entry','welcome'].filter((_,i)=>p[0]&(1<<i)),trigger:p[1]?'door':'button',doorLocks:p[2],lightCompatible:['unknown','yes','no'][p[3]],owned:{lock:p[4],keypad:p[5],hub:p[6]}});
 }catch{return null;}
}
function makePlanLink(href,input){
 try{const url=new URL(href);if(url.protocol!=='https:'||['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.hostname.endsWith('.localhost'))return null;url.username='';url.password='';url.search='';url.hash='plan='+encodePlan(input);return url.href;}catch{return null;}
}


/** Native-video timeline. The browser renders no WebGL on this consumer surface. */
function createPlayer({film,journey,playButton,seekInput,onTime,onError,onReady=()=>{},isBlocked=()=>false}){
 let playing=false,pending=0,ignoreUntil=0,view=innerWidth<760?'mobile':'desktop',resumeAfterLoad=false,raf=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const time=()=>Number.isFinite(film.currentTime)?film.currentTime:pending;
 const span=()=>Math.max(1,journey.offsetHeight-innerHeight);
 const pageTime=()=>clamp(-journey.getBoundingClientRect().top/span())*DURATION;
 const end=()=>Number.isFinite(film.duration)?Math.max(0,film.duration-.025):DURATION;
 function notify(t){onTime(clamp(t,0,DURATION));seekInput.value=String(clamp(t,0,DURATION));}
 function align(t,guard=true){ignoreUntil=guard?performance.now()+110:0;scrollTo({top:journey.offsetTop+span()*clamp(t/DURATION),behavior:'instant'});}
 function pause(){film.pause();playing=false;cancelAnimationFrame(raf);pending=time();playButton.textContent='▶';playButton.setAttribute('aria-label','映像を再生');}
 function applyPending(){if(film.readyState>=1&&!film.seeking){film.currentTime=Math.min(pending,end());}notify(pending);}
 function seek(t,alignPage=true){pause();pending=clamp(t,0,DURATION);applyPending();if(alignPage)align(pending);}
 function tick(){if(!playing)return;pending=time();notify(pending);raf=requestAnimationFrame(tick);}
 async function play(){if(playing){pause();return;}if(film.currentTime>=end()-.06)pending=0;else pending=time();if(Math.abs(time()-pending)>.05)film.currentTime=pending;try{await film.play();playing=true;playButton.textContent='Ⅱ';playButton.setAttribute('aria-label','映像を一時停止');tick();}catch(e){onError(e);}}
 function setSource(next,preserve=false){const saved=preserve?(film.seeking?pending:time()):0;resumeAfterLoad=preserve&&playing;pause();pending=saved;view=next;film.src=view==='mobile'?'media/coming-home-mobile.mp4':'media/coming-home-desktop.mp4';film.poster=view==='mobile'?'media/poster-mobile.jpg':'media/poster-desktop.jpg';film.load();notify(pending);}
 film.addEventListener('loadedmetadata',()=>{onReady();applyPending();if(resumeAfterLoad){resumeAfterLoad=false;void play();}});
 film.addEventListener('seeked',()=>{if(!playing&&Math.abs(time()-pending)>.08)applyPending();});
 film.addEventListener('timeupdate',()=>{if(playing)notify(time());});
 film.addEventListener('ended',()=>{pause();pending=end();notify(pending);});
 film.addEventListener('error',()=>onError(new Error('VIDEO_LOAD_FAILED')));
 let queued=false;
 addEventListener('scroll',()=>{if(reduced||isBlocked()||performance.now()<ignoreUntil)return;if(playing)pause();if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const r=journey.getBoundingClientRect();if(r.top<=1&&r.bottom>=innerHeight-1){pending=pageTime();applyPending();}});},{passive:true});
 // Align at the exact media time BEFORE the first user scroll. Previously playback
 // advanced independently and the very next wheel event jumped to the old scroll position.
 function handoff(){if(!playing||isBlocked())return;const t=time();pause();align(t,false);}
 addEventListener('wheel',handoff,{passive:true,capture:true});
 addEventListener('touchstart',handoff,{passive:true,capture:true});
 addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key)&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))handoff();});
 addEventListener('resize',()=>{const next=innerWidth<760?'mobile':'desktop';if(next!==view)setSource(next,true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 seekInput.addEventListener('input',()=>seek(+seekInput.value));playButton.onclick=play;setSource(view);
 return {seek,play,pause,time,retry:()=>setSource(view,true),isPlaying:()=>playing,getView:()=>view,align};
}






const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const film=$('#film'),journey=$('.journey'),dialog=$('#roleDialog');let currentChapter=-1,currentRole=null,dialogReturn=null,proofStop=null;
$('#chaptersNav').innerHTML=CHAPTERS.map((c,i)=>`<button data-time="${c.start}" aria-label="${c.name}">${['帰宅','認証','入室','明かり','ハブ','くつろぐ'][i]}</button>`).join('');
$('#proofSteps').innerHTML=Object.keys(ROLES).map(id=>`<button type="button" data-role="${id}"><span>${ROLES[id].verb}</span><small>${{keypad:'外のパッド',lock:'内側のロック',manual:'人の手',hub:'設定したシーン'}[id]}</small></button>`).join('');
function update(t){
 $('#progress').style.width=clamp(t/DURATION)*100+'%';$('#time').textContent=`${String(Math.floor(t)).padStart(2,'0')} / 24`;
 const intro=t<1.7;$('#intro').style.opacity=intro?'1':'0';$('#intro').style.pointerEvents=intro?'auto':'none';$('#chapter').style.opacity=intro?'0':'1';$('.cinema').classList.toggle('at-intro',intro);
 if(proofStop!==null&&t>=proofStop){proofStop=null;player.pause();}
 const i=chapterAt(t);
 if(i>=0){currentChapter=i;const c=CHAPTERS[i];$('#chapterKicker').textContent=c.kicker;$('#chapterTitle').textContent=c.name;$('#chapterBody').textContent=c.body;$$('#chaptersNav button').forEach((b,j)=>{b.classList.toggle('active',i===j);if(i===j)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
 if(t>=6.85&&t<9.3){$('#chapterKicker').textContent='02 / SAME DOOR · INSIDE';$('#chapterTitle').textContent='内側で、鍵が回る。';$('#chapterBody').textContent='認証のあと、ロックが動く。ドアは、まだ閉じたまま。';}
 // The R4 inside insert shows the actual scene lock, not the face pad. Cues share its timing.
 const id=visibleCueForTime(t);currentRole=id;$('#endChoices').hidden=t<21;$('#productCue').hidden=!id;
 if(id){const p=PRODUCTS[id],r=ROLES[id];$('#cuePlace').textContent=r.eyebrow;$('#cueName').textContent=p?p.name:'ドアは、人の手で';$('#productCue').dataset.device=id;}
 proofProgress(t).forEach(p=>{const b=$(`#proofSteps [data-role="${p.id}"]`);b.classList.toggle('active',p.active);b.classList.toggle('reached',p.reached);if(p.active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 $('#captionCondition').textContent=t>=6.85&&t<9.3?'同じ玄関の内側。CGによる動作説明です。回転角・速度は模式表現。':t>=14?'映像は帰宅条件を設定した連動例。対応照明・設定が必要です。':t>=5?'認証・解錠と、ドアの開閉は別の動作です。':'3Dによる構成例。実際の動作時間・形状とは異なります。';
}
const player=createPlayer({film,journey,playButton:$('#play'),seekInput:$('#seek'),onTime:update,onError:()=>{$('#videoError').hidden=false;$('#videoDirect').href=innerWidth<760?'media/coming-home-mobile.mp4':'media/coming-home-desktop.mp4';},onReady:()=>{$('#videoError').hidden=true;},isBlocked:()=>dialog.open});
$('#retryVideo').onclick=()=>player.retry();
$('#start').onclick=()=>player.play();$('#endChoices').onclick=()=>{player.pause();$('#configure').scrollIntoView({behavior:'instant'});};$$('#chaptersNav button').forEach(b=>b.onclick=()=>player.seek(+b.dataset.time));
$('#copyToggle').onclick=()=>{const on=$('.cinema').classList.toggle('no-copy');$('#copyToggle').setAttribute('aria-pressed',String(on));$('#copyToggle').textContent=on?'説明を表示':'映像だけを見る';};
function openRole(id,from){
 const r=ROLES[id];if(!r)return;const p=PRODUCTS[id];dialogReturn={t:player.time(),playing:player.isPlaying(),focus:from};player.pause();
 $('#roleReplay').hidden=id!=='lock';
 $('#roleKicker').textContent=r.eyebrow;$('#roleTitle').textContent=r.title;$('#roleBody').textContent=r.body;$('#roleBoundary').textContent=r.boundary;
 const img=$('#roleImage');img.hidden=!p;if(p){img.src=p.image;img.alt=p.name+'（オリジナルCGによる設置イメージ）';}else img.removeAttribute('src');
 $('#manualRole').hidden=!!p;$('#roleProductName').textContent=p?p.name:'手動の開閉';const link=$('#roleOfficial');link.hidden=!p;if(p)link.href=p.url;
 $('#roleTask').hidden=!r.task;$('#roleTask').dataset.task=r.task||'';$('#roleTask').textContent=r.task==='entry'?'玄関の場面を選ぶ':'室内の場面を選ぶ';
 $('#roleBack').textContent=`映像の ${player.time().toFixed(1)} 秒に戻る`;dialog.dataset.role=id;dialog.showModal();$('#roleClose').focus();
}
$('#productCue').onclick=e=>openRole(currentRole,e.currentTarget);$$('#proofSteps button').forEach(b=>b.onclick=()=>openRole(b.dataset.role,b));
function closeRole(resume=false){const saved=dialogReturn;dialog.close();if(saved){player.seek(saved.t,false);saved.focus?.focus({preventScroll:true});if(resume&&saved.playing)void player.play();}dialogReturn=null;}
$('#roleClose').onclick=()=>closeRole();$('#roleBack').onclick=()=>closeRole(true);dialog.addEventListener('cancel',e=>{e.preventDefault();closeRole();});dialog.addEventListener('click',e=>{if(e.target===dialog)closeRole();});
$('#roleReplay').onclick=()=>{closeRole(false);proofStop=9.25;player.seek(6.85);void player.play();};
$('#roleTask').onclick=()=>{const task=$('#roleTask').dataset.task;closeRole();$(`[name="task"][value="${task}"]`).checked=true;renderPlan();$('#configure').scrollIntoView({behavior:'instant'});};
$('#roles').innerHTML=Object.keys(PRODUCTS).map(id=>{const p=PRODUCTS[id],r=ROLES[id];return `<article class="role"><img width="480" height="480" src="${p.image}" alt="${p.name}（CGによる役割イメージ）" loading="lazy"><small class="cg-label">CG / 設置位置のイメージ</small><p class="eyebrow">${r.eyebrow}</p><h3>${r.title}</h3><p>${r.body}</p><button class="role-detail" data-role="${id}">できること・条件を見る ↗</button></article>`;}).join('');
$$('.role-detail').forEach(b=>b.onclick=()=>openRole(b.dataset.role,b));
$('#ownedFields').innerHTML=Object.values(PRODUCTS).map(p=>`<div class="field" data-owned-row="${p.id}" hidden><label for="own-${p.id}">所有：${p.name.replace('SwitchBot ','')}</label><input id="own-${p.id}" data-owned="${p.id}" type="number" min="0" max="20" value="0" aria-label="所有 ${p.name} 台数"></div>`).join('');
function renderPlan(){
 const tasks=$$('[name="task"]:checked').map(x=>x.value),trigger=$('[name="trigger"]:checked').value,owned=Object.fromEntries($$('[data-owned]').map(x=>[x.dataset.owned,+x.value]));
 const p=buildPlan({tasks,trigger,owned,doorLocks:+$('#doorLocks').value,lightCompatible:$('#lightCompatible').value}),d=describePlan(p);window.currentPlan=p;window.planDescription=d;$('#sharePlan').disabled=!p.products.length;$('#shareStatus').textContent='';$('#shareURL').hidden=true;
 $('#triggerFields').hidden=!tasks.includes('welcome');$('#lightField').hidden=!tasks.includes('welcome');$('#doorLocks').closest('.field').hidden=!p.products.some(p=>p.id==='lock');
 $$('[data-owned-row]').forEach(el=>el.hidden=!p.products.some(x=>x.id===el.dataset.ownedRow));$('#ownedHint').hidden=p.products.length>0;
 $('#planBadge').textContent=d.status==='BLOCKED'?'照明の対応確認が先':d.status==='EMPTY'?'まだ選択していません':'参考構成・適合未確認';
 $('#planSummaryTitle').textContent=d.title;$('#planSummaryNote').textContent=d.note;$('#selectedOutcomes').innerHTML=d.outcomes.map(x=>`<li>${x}</li>`).join('');$('#excludedOutcomes').innerHTML=d.excluded.map(x=>`<li>${x}</li>`).join('');$('#scopeDetails').hidden=d.mode==='EMPTY';
 $('#nextAction').textContent=d.nextAction;$('#nextAction').classList.toggle('blocked',d.status==='BLOCKED');$('#planSummary').dataset.mode=d.mode;
 $('#tierCaption').textContent=d.status==='BLOCKED'?'対応確認後に検討する参考機器':'選んだ場面の参考機器';
 $('#productList').innerHTML=p.products.map(x=>`<article class="product-row"><img width="480" height="480" src="${x.image}" alt="${x.name}"><div><h3>${x.name.replace('SwitchBot ','')}</h3><p>${x.reasons.join(' ')}</p><small>必要 ${x.qty} · 所有 ${x.owned}</small><br><a href="${x.url}" target="_blank" rel="noopener noreferrer">製品・適合を確認 ↗</a></div><strong>${x.toBuy}<small>${x.toBuy===0?'追加不要':'追加候補'}</small></strong></article>`).join('')||'<p class="empty">まず、実現したい場面を選んでください。<br>未選択の製品を自動追加することはありません。</p>';
 $('#warnings').innerHTML=p.warnings.map(w=>`<p>※ ${w}</p>`).join('');$('#warnings').hidden=!p.warnings.length;$('#warnings').classList.toggle('blocked',d.status==='BLOCKED');
 $('#savePlan').disabled=!p.products.length;$('#savePlanLabel').textContent=d.status==='BLOCKED'?'確認用の下書きを保存する':'選んだプランを保存する';
 $('#comparisonNote').textContent=d.mode==='EMPTY'?'下で選ぶ構成によって、含まれる体験は変わります。':d.note;
 $('#recommended').innerHTML=d.status==='BLOCKED'?'<p>追加購入の前に、現在の照明の対応を確認してください。</p>':d.mode==='EMPTY'?'<p>まず、一つの場面を選びます。アップグレードは自動で追加しません。</p>':'<p>追加する場面がある場合だけ、左の選択を増やしてください。現在の機器数は、適合や設定の完了を意味しません。</p>';
 $$('[data-preset]').forEach(b=>{const active=(b.dataset.preset==='entry'&&d.mode==='ENTRY_ONLY')||(b.dataset.preset==='indoor'&&d.mode==='INDOOR_BUTTON')||(b.dataset.preset==='linked'&&d.mode==='ARRIVAL_LINK'&&tasks.includes('entry'));b.setAttribute('aria-pressed',String(active));});
}
$$('[data-preset]').forEach(b=>b.onclick=()=>{const kind=b.dataset.preset;$$('[name="task"]').forEach(x=>x.checked=kind==='linked'||x.value===(kind==='entry'?'entry':'welcome'));$(`[name="trigger"][value="${kind==='linked'?'door':'button'}"]`).checked=true;renderPlan();});
$$('input,select').filter(x=>x.id!=='seek').forEach(x=>x.addEventListener('change',renderPlan));$$('[data-owned]').forEach(x=>x.addEventListener('input',renderPlan));
$('#savePlan').onclick=()=>{const html=planHTML(window.currentPlan),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='SwitchBot-My-Coming-Home-Plan-R4.1.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);$('#saveStatus').textContent='保存するファイルを作成しました。適合・未選択の範囲も記載しています。';};

function selectedInput(){return {tasks:$$('[name="task"]:checked').map(x=>x.value),trigger:$('[name="trigger"]:checked').value,doorLocks:+$('#doorLocks').value,lightCompatible:$('#lightCompatible').value,owned:Object.fromEntries($$('[data-owned]').map(x=>[x.dataset.owned,+x.value]))};}
$('#sharePlan').onclick=async()=>{
 const url=makePlanLink(location.href,selectedInput());
 if(!url){$('#savePlan').click();$('#shareStatus').textContent='ローカルファイルのため、リンクの代わりにプランを保存しました。保存したファイルを共有できます。';return;}
 try{await navigator.clipboard.writeText(url);$('#shareStatus').textContent='プランのリンクをコピーしました。適合確認が必要な構成例として共有されます。';}
 catch{const field=$('#shareURL');field.hidden=false;field.value=url;field.focus();field.select();$('#shareStatus').textContent='このURLをコピーして共有してください。';}
};
const restored=decodePlan(location.hash);
if(restored){$$('[name="task"]').forEach(x=>x.checked=restored.tasks.includes(x.value));$(`[name="trigger"][value="${restored.trigger}"]`).checked=true;$('#doorLocks').value=String(restored.doorLocks);$('#lightCompatible').value=restored.lightCompatible;$$('[data-owned]').forEach(x=>x.value=String(restored.owned[x.dataset.owned]));}
renderPlan();update(0);window.story={...player,update};
if(restored){requestAnimationFrame(()=>$('#configure').scrollIntoView({behavior:'instant'}));$('#shareStatus').textContent='共有された選択を読み込みました。機器の適合・設定は別途ご確認ください。';}


})();