import {LivingWorld as BaseWorld} from './world.js';
import {finishArchitecture} from './architectural-finish.js';
import {resolveEnvelope,exteriorCamera,storyEnvelopeAlpha,exteriorMaxDistance} from './architecture-state.js';
/** Refines the existing scene without replacing its products, timeline, or planner. */
export class LivingWorld extends BaseWorld {
 constructor(canvas,options){
  super(canvas,options);
  this.roomId='all';this.finish=finishArchitecture(this.house);this.exploreTime=.76;
  this.stateSignature='';this.dirty=true;this.renderer.shadowMap.needsUpdate=true;
 }
 frameExterior(){
  if(this.controls)this.controls.maxDistance=this.roomId==='outside'?exteriorMaxDistance(this.mobile):37;
  if(this.mode==='explore'&&this.roomId==='outside'&&this.width){const p=exteriorCamera(this.mobile);this.camera.setViewOffset(this.width,this.height,this.width*p.offset[0],this.height*p.offset[1],this.width,this.height);}
 }
 resize(){super.resize();if(this.mode==='explore'&&this.roomId==='outside'){const p=exteriorCamera(this.mobile);this.camera.position.set(...p.position);this.look.set(...p.target);this.controls.target.copy(this.look);this.camera.lookAt(this.look);this.roomTransition=null;}this.frameExterior();}
 setRoom(id){
  this.roomId=id;super.setRoom(id);this.stateSignature='';this.projectionShift=NaN;
  if(id==='outside'){
   const p=exteriorCamera(this.mobile);this.roomTransition.to.set(...p.position);this.roomTransition.toTarget.set(...p.target);this.frameExterior();
  }else{this.controls.maxDistance=37;this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
 }
 setMode(mode){super.setMode(mode);this.projectionShift=NaN;if(mode==='story')this.roomId='all';}
 setFloor(value){super.setFloor(value);this.stateSignature='';}
 applyState(state){
  super.applyState(state);
  if(!this.finish)return;
  const architecture=resolveEnvelope({mode:this.mode,room:this.roomId,floor:this.floor});
  const alpha=this.mode==='story'?storyEnvelopeAlpha(state.p):(architecture.closed?1:0);
  if(this.finish.setState({...architecture,alpha}))this.renderer.shadowMap.needsUpdate=true;
  if(architecture.roof){
   this.house.roofGroup.visible=true;this.house.roofGroup.position.y=0;
   for(const mesh of this.house.roof){mesh.material.opacity=1;mesh.material.transparent=false;mesh.material.depthWrite=true;mesh.castShadow=true;}
  }
 }
 snapshot(){return {...super.snapshot(),architecture:this.finish?.snapshot()??null};}
 dispose(){this.finish?.dispose();super.dispose();}
}
