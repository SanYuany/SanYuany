from pathlib import Path
p=Path('coming-home-study/director.js');s=p.read_text()
s=s.replace('walkIn:ramp(t,12.9,17)','walkIn:ramp(t,12.5,16.0)')
s=s.replace('[5.02,1.83,4.48],[4.64,1.65,3.64]','[4.82,1.75,4.06],[4.64,1.65,3.66]').replace('[5,1.80,4.35],[4.64,1.66,3.64]','[4.80,1.73,4.02],[4.64,1.65,3.66]')
s=s.replace('[4.6,1.69,5.23],[4.12,1.5,3.68]','[5.15,1.62,5.70],[4.06,1.38,3.86]').replace('[4.23,1.68,5],[3.74,1.5,3.45]','[4.86,1.62,5.55],[3.99,1.38,3.95]')
s=s.replace('[1.77,1.36,.73],[1.63,1.22,-.53]','[1.70,1.21,-.10],[1.52,1.13,-.54]').replace('[1.62,1.34,.61],[1.63,1.22,-.53]','[1.68,1.20,-.11],[1.52,1.13,-.54]')
s=s.replace('[5.06,1.84,4.6],[4.64,1.64,3.64]','[4.87,1.77,4.17],[4.64,1.65,3.66]').replace('[5.02,1.8,4.53],[4.64,1.65,3.64]','[4.85,1.75,4.15],[4.64,1.65,3.66]')
p.write_text(s)
p=Path('coming-home-study/stage.js');s=p.read_text()
s=s.replace("this.rod(r,[-.19,1.25,0],[-.25,.85,.07],.056,coat);this.sphere(r,-.25,.79,.07,[.041,.06,.04],skin);", "this.staticArm=this.rod(r,[-.19,1.25,0],[-.25,.85,.07],.056,coat);this.staticHand=this.sphere(r,-.25,.79,.07,[.041,.06,.04],skin);")
s=s.replace("this.bags=[];", "this.grip=new T.Group();h.floor1.add(this.grip);h.devices.push({id:'grip',mesh:this.grip});this.gripUpper=this.rod(this.grip,[0,0,0],[0,1,0],.052,coat);this.gripLower=this.rod(this.grip,[0,0,0],[0,1,0],.041,coat);this.gripPalm=this.sphere(this.grip,0,0,0,[.040,.052,.033],skin);for(let i=0;i<4;i++)this.sphere(this.gripPalm,.025,-.3+i*.20,.30,[.33,.13,.7],skin);this.bags=[];")
s=s.replace("r.position.set(3.72,.06,6.22-s.walkUp*1.73-s.walkIn*3.55);", "r.position.set(3.72,-.08+s.walkIn*.26,6.22-s.walkUp*2.10+s.door*.46*(1-s.walkIn)-s.walkIn*3.12);")
s=s.replace("const frame=cameraAt(t,this.mobile);", "this.poseHand(s);const frame=cameraAt(t,this.mobile);")
s=s.replace("if(t>13.1&&t<16.0&&r.position.distanceTo(this.camera.position)<1.1)r.visible=false;", "if(t>13.1&&t<16.0&&r.position.distanceTo(this.camera.position)<.72)r.visible=false;this.grip.visible=this.grip.visible&&r.visible;")
needle=' productView(id){'
method=''' poseHand(s){
  const active=s.t>=9.8&&s.t<=12.9;this.grip.visible=active;this.staticArm.visible=!active;this.staticHand.visible=!active;if(!active)return;
  this.house.root.updateMatrixWorld(true);const a=this.resident.localToWorld(new T.Vector3(-.19,1.25,0));const b=this.house.door.localToWorld(new T.Vector3(1.05,1.18,.115));const v=b.clone().sub(a);const d=v.length();const e=a.clone().add(b).multiplyScalar(.5);e.y-=Math.sqrt(Math.max(.004,.35*.35-d*d/4));e.z+=.035;
  const fit=(mesh,x,y)=>{const delta=y.clone().sub(x);mesh.position.copy(x.clone().add(y).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());mesh.scale.y=delta.length();};fit(this.gripUpper,a,e);fit(this.gripLower,e,b);this.gripPalm.position.copy(b);this.lastGripError=this.gripPalm.position.distanceTo(b);
 }
'''
assert needle in s;s=s.replace(needle,method+needle);p.write_text(s)
print('Reviewed camera and manual-handle corrections applied.')
