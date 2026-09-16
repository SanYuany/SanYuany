import * as T from 'three';
import {manualPose,residentPose,solveArm} from './proof-motion.js';
/** R3 modifies the same canonical house. No duplicate door, invented actuator or live-state UI. */
export function installProofStage(stage){
 const s=stage,h=s.house,r=s.resident;let seed=927;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=kind==='wood'?'#baa286':'#ddd9d1';g.fillRect(0,0,512,512);for(let i=0;i<3400;i++){g.strokeStyle=`rgba(60,47,34,${.015+random()*.055})`;g.lineWidth=.3+random()*.7;const a=random()*512;g.beginPath();if(kind==='wood'){g.moveTo(a,0);g.bezierCurveTo(a+3,190,a-3,300,a,512);}else{g.moveTo(0,a);g.lineTo(512,a);}g.stroke();}const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=4;return tx;}
 const wood=texture('wood'),linen=texture('linen');
 const timber=s.mat('r3-door-oak','#d9cab6',.69,{map:wood,bumpMap:wood,bumpScale:.0005});
 h.door.traverse(o=>{if(o.name==='front door'||o.name==='door oak strip')o.material=timber;});
 const fabric=s.materials.jacket;fabric.map=linen;fabric.color.set('#617063');fabric.roughness=.96;
 h.materials.cream.color.set('#ebe4d5');h.materials.cream.bumpMap=linen;h.materials.cream.bumpScale=.001;
 h.materials.walnut.roughness=.76;h.materials.plaster.color.set('#ede8dc');
 s.lock.removeFromParent();const lock=new T.Group();lock.name='R3 interior Lock Ultra illustration';lock.position.set(1.05,1.31,-.094);lock.rotation.y=Math.PI;h.door.add(lock);s.lock=lock;h.devices.push({id:'r3-lock',mesh:lock});
 const body=s.mat('r3-device-body','#262b2e',.43,{metalness:.30}),face=s.mat('r3-device-cover','#343a3b',.49,{metalness:.25}),rubber=s.mat('r3-knurl','#202629',.64,{metalness:.1}),silver=s.mat('r3-ring','#b4b8b7',.31,{metalness:.85});
 s.box(lock,.071,.137,.033,0,0,-.006,body,.03);s.box(lock,.068,.132,.026,0,0,.006,face,.030);
 const dial=new T.Group();dial.position.set(0,-.027,.029);lock.add(dial);s.proofDial=dial;
 s.disk(dial,.032,.024,0,0,0,rubber);s.disk(dial,.0299,.005,0,0,.014,face);
 const ring=new T.Mesh(new T.TorusGeometry(.0305,.00095,8,80),silver);ring.position.z=.016;dial.add(ring);
 for(let i=0;i<36;i++){const a=i*Math.PI/18;const rib=s.box(dial,.0013,.006,.010,Math.sin(a)*.0321,Math.cos(a)*.0321,.001,rubber,.0004);rib.rotation.z=-a;}
 s.proofIndex=s.sphere(dial,0,.024,.018,[.0021,.0021,.0007],s.mat('r3-index','#e18c50',.6));
 s.textPlane(lock,'SwitchBot',.031,.011,.024,.007,.045,'#60686a').rotation.z=-Math.PI/2;
 const bounce=new T.PointLight('#eee6d8',.45,1.1,2);bounce.position.set(4.04,1.88,3.0);h.floor1.add(bounce);
 const warm=s.mat('r3-soft-linen','#c2b49e',.95,{map:linen});s.box(h.floor1,.57,.025,.4,4.39,1.445,1.76,warm,.008);
 const coat=s.materials.jacket,skin=s.materials.skin;
 function arm(){const g=new T.Group();g.name='R3 articulated arm';h.floor1.add(g);h.devices.push({id:'r3-arm',mesh:g});const upper=s.rod(g,[0,0,0],[0,1,0],.049,coat),lower=s.rod(g,[0,0,0],[0,1,0],.039,coat),hand=new T.Group();g.add(hand);s.sphere(hand,0,0,0,[.034,.050,.025],skin);for(let i=0;i<4;i++){const finger=s.rod(hand,[.021,-.037+i*.020,.009],[.020,-.037+i*.020,-.022],.0065,skin);finger.name='curled finger';}s.rod(hand,[-.026,.025,.012],[-.032,-.006,-.011],.009,skin);return {g,upper,lower,hand};}
 s.proofFreeArm=arm();s.proofCarryArm=arm();
 for(const bag of s.bags)bag.removeFromParent();s.bags=[];
 const bag=new T.Group();bag.position.set(.255,.455,.07);r.add(bag);s.bags.push(bag);
 const canvas=s.mat('r3-bag','#b39a72',.95,{map:linen});s.box(bag,.31,.32,.20,0,0,0,canvas,.018);s.box(bag,.28,.012,.17,0,.16,0,s.mat('r3-bag-inside','#5d5445',1),.002);
 for(const z of [-.070,.070]){s.rod(bag,[-.10,.155,z],[-.06,.287,z],.008,canvas);s.rod(bag,[-.06,.287,z],[.06,.287,z],.008,canvas);s.rod(bag,[.06,.287,z],[.10,.155,z],.008,canvas);}
 s.sphere(bag,.08,.215,0,[.05,.10,.048],s.mat('r3-grocery','#637b54',.96));s.rod(bag,[-.07,.14,0],[-.092,.345,0],.034,s.mat('r3-bread','#ae8053',.97));
 const tote=new T.Group();tote.position.set(-.25,.79,-.02);r.add(tote);s.box(tote,.17,.31,.235,0,0,0,s.mat('r3-leather','#6e5443',.88),.03);s.rod(r,[-.245,.91,-.105],[-.19,1.28,-.08],.010,s.materials['r3-leather']);s.rod(r,[-.19,1.28,.09],[-.245,.92,.10],.010,s.materials['r3-leather']);
 s.rod(r,[0,.82,.122],[0,1.31,.122],.0035,s.mat('r3-seam','#4b574d',.99));for(const x of [-.12,.12])s.box(r,.07,.006,.008,x,.91,.128,s.materials['r3-seam'],.002);
 const poseChain=(chain,a,target)=>{const solution=solveArm(a.toArray(),target.toArray(),.32,.31,[.1,-1,.28]);const e=new T.Vector3(...solution.elbow),b=new T.Vector3(...solution.hand);for(const [mesh,u,v] of [[chain.upper,a,e],[chain.lower,e,b]]){const delta=v.clone().sub(u);mesh.position.copy(u.clone().add(v).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());mesh.scale.y=delta.length();}chain.hand.position.copy(b);chain.hand.rotation.y=Math.PI;return solution;};
 s.applyR3=(t,state)=>{
  s.proofDial.rotation.z=state.dialAngle;
  const rp=residentPose(t,state);r.visible=true;r.position.set(...rp.position);r.rotation.y=rp.yaw;
  s.staticArm.visible=false;s.staticHand.visible=false;s.arm.visible=false;s.grip.visible=false;
  s.legs.forEach((leg,i)=>leg.rotation.x=rp.moving?Math.sin(t*7+i*Math.PI)*.17:0);
  s.bags.forEach(b=>b.rotation.x=0);
  h.root.updateMatrixWorld(true);
  const shoulder=r.localToWorld(new T.Vector3(-.19,1.25,0)),rest=r.localToWorld(new T.Vector3(-.25,.745,.065));
  const handle=h.door.localToWorld(new T.Vector3(1.05,1.18,.115)),contact=manualPose(t).contact;
  const target=rest.clone().lerp(handle,contact),free=poseChain(s.proofFreeArm,shoulder,target);
  const carryShoulder=r.localToWorld(new T.Vector3(.19,1.25,0)),carryGrip=bag.localToWorld(new T.Vector3(0,.287,0));
  poseChain(s.proofCarryArm,carryShoulder,carryGrip);
  s.proofFreeArm.g.visible=r.visible;s.proofCarryArm.g.visible=r.visible;
  s.proof={dialAngle:s.proofDial.rotation.z,doorAngle:h.door.rotation.y,contact,handError:contact>.999?free.error:null,upper:.32,lower:.31,reachable:free.reachable,hand:free.hand,handle:handle.toArray(),resident:rp.position};
  s.fillLiving.intensity=state.living*6.5;s.floorGlow.intensity=state.living*3.4;s.coveMat.emissiveIntensity=.05+state.living*1.4;
 };
}
