import {LivingWorld as BaseWorld} from './world.js';
import {finishArchitecture} from './architectural-finish.js';
import {resolveEnvelope,exteriorCamera} from './architecture-state.js';
/** Refines the existing scene without replacing its products, timeline, or planner. */
export class LivingWorld extends BaseWorld {
 constructor(canvas,options){
  super(canvas,options);
  this.roomId='all';this.finish=finishArchitecture(this.house);this.exploreTime=.76;
  this.stateSignature='';this.dirty=true;this.renderer.shadowMap.needsUpdate=true;
 }
 frameExterior(){
  if(this.mode==='explore'&&this.roomId==='outside'&&this.width){const p=exteriorCamera(this.mobile);this.camera.setViewOffset(this.width,this.height,this.width*p.offset[0],this.height*p.offset[1],this.width,this.height);}
 }
 resize(){super.resize();this.frameExterior();}
 setRoom(id){
  this.roomId=id;super.setRoom(id);this.stateSignature='';this.projectionShift=NaN;
  if(id==='outside'){
   const p=exteriorCamera(this.mobile);this.roomTransition.to.set(...p.position);this.roomTransition.toTarget.set(...p.target);this.frameExterior();
  }else{this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
 }
 setMode(mode){super.setMode(mode);this.projectionShift=NaN;if(mode==='story')this.roomId='all';}
 setFloor(value){super.setFloor(value);this.stateSignature='';}
 applyState(state){
  super.applyState(state);
  if(!this.finish)return;
  const architecture=resolveEnvelope({mode:this.mode,room:this.roomId,floor:this.floor});
  if(this.finish.setState(architecture))this.renderer.shadowMap.needsUpdate=true;
  if(architecture.roof){
   this.house.roofGroup.visible=true;this.house.roofGroup.position.y=0;
   for(const mesh of this.house.roof){mesh.material.opacity=1;mesh.material.transparent=false;mesh.material.depthWrite=true;mesh.castShadow=true;}
  }
 }
 snapshot(){return {...super.snapshot(),architecture:this.finish?.snapshot()??null};}
 dispose(){this.finish?.dispose();super.dispose();}
}
