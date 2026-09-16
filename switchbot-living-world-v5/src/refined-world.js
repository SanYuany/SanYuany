import {LivingWorld as BaseWorld} from './world.js';
import {finishArchitecture} from './architectural-finish.js';
import {resolveEnvelope} from './architecture-state.js';
/** Refines the existing scene without replacing its products, timeline, or planner. */
export class LivingWorld extends BaseWorld {
 constructor(canvas,options){
  super(canvas,options);
  this.roomId='all';this.finish=finishArchitecture(this.house);
  this.stateSignature='';this.dirty=true;this.renderer.shadowMap.needsUpdate=true;
 }
 setRoom(id){this.roomId=id;super.setRoom(id);this.stateSignature='';}
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
