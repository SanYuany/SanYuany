import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createHouse} from './house.js';
import {getCamera,getState,roomViews,clamp} from './timeline.js';

export class LivingWorld {
 constructor(canvas,{reducedMotion=false,onFrame=()=>{}}={}){
  this.canvas=canvas;this.onFrame=onFrame;this.reducedMotion=reducedMotion;this.mode='story';this.progress=0;this.targetProgress=0;this.active=true;this.floor='all';this.disposed=false;this.dirty=true;
  this.scene=new T.Scene();this.scene.background=new T.Color('#eee9df');
  this.scene.fog=new T.Fog('#eee9df',38,88);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.98;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.camera=new T.PerspectiveCamera(41,1,.08,120);this.look=new T.Vector3();
  const envScene=new RoomEnvironment();const pmrem=new T.PMREMGenerator(this.renderer);this.envTarget=pmrem.fromScene(envScene,.035);this.scene.environment=this.envTarget.texture;this.scene.environmentIntensity=.62;envScene.dispose();pmrem.dispose();
  this.sun=new T.DirectionalLight('#fff4df',3.8);this.sun.position.set(-5,14,9);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:48});this.sun.shadow.bias=-.00024;this.sun.shadow.normalBias=.025;this.sun.shadow.radius=3;this.scene.add(this.sun);
  this.hemi=new T.HemisphereLight('#edf6fa','#a59a80',1.15);this.scene.add(this.hemi);
  this.fill=new T.DirectionalLight('#d8e4e3',1.0);this.fill.position.set(9,6,-5);this.scene.add(this.fill);
  const ground=new T.Mesh(new T.PlaneGeometry(220,220),new T.MeshStandardMaterial({color:'#e3decf',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.71;ground.receiveShadow=true;this.scene.add(ground);this.ground=ground;
  this.house=createHouse();this.scene.add(this.house.root);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.enabled=false;this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.enablePan=false;this.controls.enableZoom=true;this.controls.minDistance=3;this.controls.maxDistance=37;this.controls.maxPolarAngle=Math.PI*.485;this.controls.minPolarAngle=.18;
  this.controls.addEventListener('change',()=>{this.dirty=true;});
  this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.active=false;document.dispatchEvent(new CustomEvent('world-failed'));});
  this.canvas.addEventListener('webglcontextrestored',()=>location.reload());
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
  this.visibility=()=>{this.active=!document.hidden;this.dirty=true;};document.addEventListener('visibilitychange',this.visibility);
  this.resize();this.setCamera(getCamera(0,this.mobile));this.applyState(getState(0));
  this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);canvas.dataset.ready='true';
  this.lastTime=0;this.frames=0;this.animate=this.animate.bind(this);this.raf=requestAnimationFrame(this.animate);
 }
 resize(){
  const rect=this.canvas.parentElement.getBoundingClientRect();this.mobile=rect.width<760;
  const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.25:1.5));this.renderer.setSize(w,h,false);
  this.camera.aspect=w/h;this.camera.setViewOffset(w,h,this.mobile?0:-w*.135,this.mobile?h*.15:0,w,h);this.camera.updateProjectionMatrix();this.dirty=true;
 }
 setProgress(p,immediate=false){this.targetProgress=clamp(p);if(immediate||this.reducedMotion)this.progress=this.targetProgress;this.dirty=true;}
 setCamera(frame){this.camera.position.set(...frame.position);this.look.set(...frame.target);this.camera.lookAt(this.look);}
 setMode(mode){this.mode=mode;this.controls.enabled=mode==='explore';this.canvas.style.touchAction=mode==='explore'?'none':'pan-y';this.dirty=true;if(mode==='explore'){this.controls.target.copy(this.look);this.setRoom('all');}else{this.roomTransition=null;this.setFloor('all');}}
 setRoom(id){const view=roomViews[id]||roomViews.all;const target=new T.Vector3(...view.target),position=new T.Vector3(...view.position);if(this.mobile)position.sub(target).multiplyScalar(id==='all'||id==='outside'?1.55:1.30).add(target);
  this.roomTransition={from:this.camera.position.clone(),fromTarget:this.controls.target.clone(),to:position,toTarget:target,t:0};this.setFloor(id==='bedroom'?'2':id==='living'||id==='entrance'?'1':'all');this.dirty=true;}
 setFloor(value){this.floor=value;this.house.floor1.visible=value!=='2';this.house.floor2.visible=value!=='1';this.dirty=true;this.renderer.shadowMap.needsUpdate=true;}
 setTime(value){this.exploreTime=value==='night'?.94:.68;this.dirty=true;}
 applyState(s){
  for(const c of this.house.curtains){const scale=1-.81*s.curtain;c.group.scale.x=scale;}
  this.house.door.rotation.y=-s.door*1.27;
  this.house.lockDial.rotation.z=s.locked?0:Math.PI*.5;
  this.house.faceLed.material.emissiveIntensity=s.authenticated?2.4:.1;
  for(const entry of this.house.lights){const value=entry.name==='entry'?s.entry:entry.name==='living'?s.living:s.bedroom;entry.light.intensity=value*10;entry.material.emissiveIntensity=.1+value*2.3;}
  const roof=this.mode==='story'?clamp(s.roof):0;this.house.roofGroup.visible=roof>.025;this.house.roofGroup.position.y=(1-roof)*1.6;
  for(const mesh of this.house.roof){mesh.material.transparent=roof<.99;mesh.material.opacity=roof;mesh.castShadow=roof>.9;mesh.material.depthWrite=roof>.9;}
  const day=new T.Color('#ede9df'),evening=new T.Color('#d7ccbf'),night=new T.Color('#27343d');const bg=day.clone().lerp(evening,clamp(s.returning)).lerp(night,s.night);
  this.scene.background.copy(bg);this.scene.fog.color.copy(bg);this.ground.material.color.copy(new T.Color('#e1dacb').lerp(new T.Color('#59605d'),s.night));
  this.sun.intensity=2.8*(1-s.night)+.45;this.sun.color.set(s.returning>.1?'#ffd6a7':'#fff3de');this.hemi.intensity=.55*(1-s.night)+.30;this.fill.intensity=.30*(1-s.night)+.18;
  this.scene.environmentIntensity=.28*(1-s.night)+.20;
  this.state=s;this.renderer.shadowMap.needsUpdate=true;
 }
 animate(time){
  if(this.disposed)return;this.raf=requestAnimationFrame(this.animate);if(!this.active)return;
  const dt=Math.min(.05,(time-this.lastTime)/1000||.016);this.lastTime=time;
  if(this.mode==='story'){
   const old=this.progress;this.progress=this.reducedMotion?this.targetProgress:this.progress+(this.targetProgress-this.progress)*(1-Math.exp(-11*dt));
   if(Math.abs(this.progress-this.targetProgress)<.00001)this.progress=this.targetProgress;
   if(old!==this.progress||this.dirty){this.setCamera(getCamera(this.progress,this.mobile));this.applyState(getState(this.progress));this.dirty=true;}
  }else{
   if(this.roomTransition){const tr=this.roomTransition;tr.t=Math.min(1,tr.t+dt/1.1);const t=this.reducedMotion?1:tr.t*tr.t*(3-2*tr.t);this.camera.position.lerpVectors(tr.from,tr.to,t);this.controls.target.lerpVectors(tr.fromTarget,tr.toTarget,t);this.camera.lookAt(this.controls.target);this.look.copy(this.controls.target);this.dirty=true;if(t>=1)this.roomTransition=null;}
   if(this.dirty)this.applyState(getState(this.exploreTime??.68));
   this.controls.update();
  }
  if(this.dirty){this.renderer.render(this.scene,this.camera);this.frames++;this.onFrame(this);this.dirty=false;}
 }
 snapshot(){return{mode:this.mode,progress:this.progress,targetProgress:this.targetProgress,camera:this.camera.position.toArray(),target:this.look.toArray(),state:this.state,frames:this.frames,triangles:this.renderer.info.render.triangles,drawCalls:this.renderer.info.render.calls,visible1:this.house.floor1.visible,visible2:this.house.floor2.visible,contextLost:this.renderer.getContext().isContextLost()};}
 renderAt(p){this.mode='story';this.controls.enabled=false;this.setProgress(p,true);this.setCamera(getCamera(p,this.mobile));this.applyState(getState(p));this.renderer.render(this.scene,this.camera);this.frames++;this.onFrame(this);}
 dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});this.envTarget.dispose();this.renderer.dispose();}
}
