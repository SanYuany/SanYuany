import {LivingWorld as BaseWorld} from './world.js';
import {finishArchitecture} from './architectural-finish.js';
import {resolveEnvelope,exteriorCamera,envelopeAt} from './architecture-state.js';
/** Same house and renderer for exterior, cutaway, and room cameras. */
export class LivingWorld extends BaseWorld {
 constructor(canvas,options){
  super(canvas,options);
  this.roomId='all';this.finish=finishArchitecture(this.house);this.exploreTime=.76;
  this.envelopeAmount=0;this.envelopeFrom=0;this.envelopeTo=0;this.envelopeStart=0;this.envelopeOverride=null;
  this.stateSignature='';this.dirty=true;this.renderer.shadowMap.needsUpdate=true;
 }
 frameExterior(){
  if(this.mode==='explore'&&this.roomId==='outside'&&this.width){const p=exteriorCamera(this.mobile);this.camera.setViewOffset(this.width,this.height,this.width*p.offset[0],this.height*p.offset[1],this.width,this.height);}
 }
 resize(){super.resize();this.frameExterior();}
 setRoom(id){
  this.roomId=id;this.envelopeOverride=null;super.setRoom(id);this.stateSignature='';this.projectionShift=NaN;
  if(id==='outside'){
   const p=exteriorCamera(this.mobile);this.roomTransition.to.set(...p.position);this.roomTransition.toTarget.set(...p.target);this.frameExterior();
  }else{this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
 }
 setMode(mode){super.setMode(mode);this.envelopeOverride=null;this.projectionShift=NaN;if(mode==='story')this.roomId='all';}
 setFloor(value){super.setFloor(value);this.stateSignature='';if(value!=='all')this.envelopeOverride=null;}
 setEnvelopeView(closed){
  if(this.mode!=='explore'||!['all','outside'].includes(this.roomId)||this.floor!=='all')return false;
  this.envelopeOverride=Boolean(closed);this.dirty=true;return true;
 }
 animate(time){
  if(this.finish){
   const target=resolveEnvelope({mode:this.mode,room:this.roomId,floor:this.floor,override:this.envelopeOverride}).closed?1:0;
   if(target!==this.envelopeTo){this.envelopeFrom=this.envelopeAmount;this.envelopeTo=target;this.envelopeStart=time;}
   const immediate=this.reducedMotion||this.mode!=='explore'||this.floor!=='all';
   const next=envelopeAt(this.envelopeFrom,target,time-this.envelopeStart,immediate);
   if(next!==this.envelopeAmount){this.envelopeAmount=next;this.dirty=true;}
  }
  super.animate(time);
 }
 applyState(state){
  super.applyState(state);if(!this.finish)return;
  const amount=this.mode==='explore'?this.envelopeAmount:0;
  if(this.finish.setAmount(amount))this.renderer.shadowMap.needsUpdate=true;
  if(this.mode==='explore'){
   this.house.roofGroup.visible=amount>.0001;this.house.roofGroup.position.y=(1-amount)*1.6;
   for(const mesh of this.house.roof){const m=mesh.material,blend=amount<.9999;if(m.transparent!==blend){m.transparent=blend;m.needsUpdate=true;}m.opacity=amount;m.depthWrite=!blend;mesh.castShadow=amount>.98;}
  }
 }
 snapshot(){return {...super.snapshot(),roomId:this.roomId,envelopeTarget:this.envelopeTo,architecture:this.finish?.snapshot()??null};}
 dispose(){this.finish?.dispose();super.dispose();}
}
