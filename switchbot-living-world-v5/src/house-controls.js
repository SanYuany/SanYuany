import * as T from 'three';
/** Architectural controls reveal rooms, not a second model or a flat overlay. */
const $=s=>document.querySelector(s);
const spots=[{id:'bedroom',name:'寝室',floor:'2F',point:[1.9,4.65,.8]},{id:'living',name:'リビング',floor:'1F',point:[-2.8,1.6,1.3]},{id:'entrance',name:'玄関',floor:'1F',point:[3.95,1.8,3.7]}];
async function initialize(){
 for(let i=0;i<400&&!window.__livingWorld;i++)await new Promise(r=>setTimeout(r,50));
 const world=window.__livingWorld,app=window.__app;if(!world||!app)return;
 const hero=document.createElement('button');hero.id='viewExterior';hero.type='button';hero.className='exterior-entry';hero.textContent='外観から、家の中へ ↗';$('#startExperience').after(hero);
 hero.onclick=()=>{window.__spatial?.stopIntro();window.__spatial?.stopOrbit();app.setMode('explore');app.selectRoom('outside');};
 const control=document.createElement('div');control.className='envelope-control';control.id='envelopeControl';control.hidden=true;
 control.innerHTML='<span class="envelope-caption">同じ家を、外から中へ</span><div role="group" aria-label="建物の表示"><button type="button" id="showEnvelope" aria-pressed="false">外観</button><button type="button" id="openEnvelope" aria-pressed="true">間取りを見る</button></div>';
 $('#stage').append(control);
 const layer=document.createElement('div');layer.id='roomHotspots';layer.className='room-hotspots';layer.setAttribute('aria-label','3Dの部屋を選ぶ');$('#stage').append(layer);
 for(const spot of spots){const button=document.createElement('button');button.className='room-hotspot';button.type='button';button.dataset.roomHotspot=spot.id;button.innerHTML='<small>'+spot.floor+'</small>'+spot.name+' <span>↗</span>';button.hidden=true;button.onclick=()=>{window.__spatial?.stopOrbit();app.selectRoom(spot.id);};layer.append(button);spot.button=button;}
 const set=closed=>{window.__spatial?.stopOrbit();world.setEnvelopeView(closed);};
 $('#showEnvelope').onclick=()=>set(true);$('#openEnvelope').onclick=()=>set(false);
 const vector=new T.Vector3(),previous=world.onFrame;
 world.onFrame=w=>{
  previous(w);
  const overview=w.mode==='explore'&&['all','outside'].includes(w.roomId)&&w.floor==='all';
  control.hidden=!overview;
  const closed=w.envelopeTo===1;$('#showEnvelope').setAttribute('aria-pressed',String(closed));$('#openEnvelope').setAttribute('aria-pressed',String(!closed));
  const canvasRect=w.canvas.getBoundingClientRect(),panel=$('#explorePanel').getBoundingClientRect();
  for(const spot of spots){
   vector.set(...spot.point).project(w.camera);const x=(vector.x*.5+.5)*w.width,y=(-vector.y*.5+.5)*w.height;
   const sx=x+canvasRect.left,sy=y+canvasRect.top;
   const behindPanel=!$('#explorePanel').hidden&&sx>panel.left-55&&sx<panel.right+55&&sy>panel.top-22&&sy<panel.bottom+22;
   spot.button.hidden=!overview||w.envelopeAmount>.01||Boolean(w.roomTransition)||vector.z<0||vector.z>1||x<70||x>w.width-70||y<180||y>w.height-145||behindPanel;
   if(!spot.button.hidden)spot.button.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
  }
 };
 window.__houseControls={ready:true,set};world.dirty=true;
}
initialize().catch(e=>console.error('House view controls',e));
