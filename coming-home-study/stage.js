import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createHouse} from './src/house.js';
import {finishArchitecture} from './src/architectural-finish.js';
import {compactHouse} from './src/optimize.js';
import {stateAt,cameraAt} from './director.js';

// Original illustrative geometry. Product bodies are reference-guided, not approved CAD.
export class ComingHomeStage {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.scene=new T.Scene();this.scene.background=new T.Color('#c6c5bb');this.scene.fog=new T.Fog('#c6c5bb',40,95);
  this.camera=new T.PerspectiveCamera(39,1,.025,140);
  const pmrem=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.05);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.32;pmrem.dispose();room.dispose();
  this.sun=new T.DirectionalLight('#ffd49d',2.25);this.sun.position.set(-8,9,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-13,right:13,bottom:-12,top:12,near:.1,far:44});this.sun.shadow.normalBias=.025;this.sun.shadow.bias=-.00025;this.scene.add(this.sun);
  this.hemi=new T.HemisphereLight('#d9e5ee','#6b5c47',.68);this.scene.add(this.hemi);
  const ground=new T.Mesh(new T.PlaneGeometry(220,220),new T.MeshStandardMaterial({color:'#c3c4b8',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.71;ground.receiveShadow=true;this.scene.add(ground);
  this.house=createHouse();this.scene.add(this.house.root);this.finish=finishArchitecture(this.house);this.finish.setState({closed:true,roof:true,floor:'all',alpha:1});
  this.materials={};this.decorate();this.replaceProducts();this.replaceResident();
  compactHouse(this.house);this.resize();this.seek(0);this.canvas.dataset.ready='true';
 }
 mat(id,color,roughness=.7,extra={}){return this.materials[id]??(this.materials[id]=new T.MeshStandardMaterial({color,roughness,...extra}));}
 box(parent,w,h,d,x,y,z,mat,r=.01){const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w*.45,h*.45,d*.45)),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 sphere(parent,x,y,z,scale,mat){const m=new T.Mesh(new T.SphereGeometry(1,24,16),mat);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 rod(parent,a,b,r,mat){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),v=bb.clone().sub(aa);const m=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),12),mat);m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());m.castShadow=true;parent.add(m);return m;}
 disk(parent,r,d,x,y,z,mat){const m=new T.Mesh(new T.CylinderGeometry(r,r,d,40),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 textPlane(parent,text,x,y,z,w,h,color='#acada8',background=null){const c=document.createElement('canvas');c.width=768;c.height=384;const g=c.getContext('2d');if(background){g.fillStyle=background;g.fillRect(0,0,768,384);}g.fillStyle=color;g.font='500 100px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,192);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));m.position.set(x,y,z);parent.add(m);return m;}
 decorate(){
  const h=this.house,m=h.materials;m.oak.color.set('#e6ddce');m.walnut.color.set('#b5a087');m.cream.color.set('#e4e0d6');m.sage.color.set('#6f7d72');m['tv-screen'].color.set('#20282a');m['tv-screen'].emissiveIntensity=0;
  const remove=[];h.root.traverse(o=>{if(['resident-coat','resident-skin'].includes(o.material?.name))return;if(o.name==='car body'||o.name==='car cabin')o.material.color.set('#566260');if(o.name==='door oak strip')o.material=m.walnut;if(o.name==='art canvas')o.material.color.set('#ebe6db');if(o.name==='induction surface'||o.name==='refrigerator')o.material.roughness=.66;});
  // Artfully restrained lived-in cues. These do not imply additional SwitchBot SKUs.
  const f=h.floor1,brass=this.mat('brass','#a39777',.4,{metalness:.65}),clay=this.mat('clay','#ad8f79',.98),linen=m.cream;
  this.box(f,.12,1.6,.13,2.69,1.23,1.02,m.oak,.014);
  this.box(f,1.00,.05,.37,1.6,1.02,-.76,m.walnut,.016);for(const x of [1.17,2.03])this.rod(f,[x,.27,-.74],[x,1.0,-.74],.023,m.ink);
  this.box(f,.36,.025,.25,1.82,1.06,-.77,linen,.004);this.box(f,.3,.017,.22,1.79,1.083,-.77,clay,.004);
  this.rod(f,[4.30,1.44,1.15],[4.32,1.86,1.17],.018,brass);this.sphere(f,4.32,1.90,1.17,[.1,.19,.1],clay);
  this.porchMat=this.mat('porch-lit','#e2d1b5',.5,{emissive:'#ffb85e',emissiveIntensity:2});this.box(f,.20,.06,.20,3.8,2.87,3.82,this.porchMat,.015);
  const porch=new T.PointLight('#ffd8ac',7,4,2);porch.position.set(3.8,2.66,3.93);f.add(porch);
  this.fillLiving=new T.PointLight('#ffcf93',0,6.5,2);this.fillLiving.position.set(-2.6,2.45,.55);f.add(this.fillLiving);
  this.coveMat=this.mat('cove','#ead2ae',.9,{emissive:'#ffc47d',emissiveIntensity:.1});this.box(f,2.85,.023,.035,-3.04,1.02,-3.05,this.coveMat,.004);
  this.floorGlow=new T.PointLight('#ffd7a2',0,4,2);this.floorGlow.position.set(-4.13,1.73,1.87);f.add(this.floorGlow);
 }
 replaceProducts(){
  const h=this.house;for(const d of h.devices)if(['keypad','lock','hub'].includes(d.id))d.mesh.visible=false;h.faceLed.visible=false;h.lockDial.visible=false;
  const black=this.mat('device-black','#202728',.34,{metalness:.26}),edge=this.mat('device-edge','#4f5555',.3,{metalness:.55}),rubber=this.mat('rubber','#303636',.86),glass=this.mat('device-glass','#0a1216',.16,{metalness:.35}),white=this.mat('type','#b6bdbd',.6);
  this.pad=new T.Group();this.pad.position.set(4.64,1.66,3.65);h.floor1.add(this.pad);this.box(this.pad,.078,.183,.029,0,0,0,edge,.014);this.box(this.pad,.075,.179,.018,0,0,.015,black,.014);
  this.box(this.pad,.068,.036,.007,0,.064,.028,glass,.009);this.box(this.pad,.057,.017,.01,0,.043,.032,glass,.006);this.textPlane(this.pad,'SwitchBot',.011,.057,.036,.031,.012);
  for(let i=0;i<12;i++){const x=-.025+(i%4)*.017,y=.012-Math.floor(i/4)*.020;this.disk(this.pad,.0068,.002,x,y,.027,rubber);this.textPlane(this.pad,['1','2','3','◇','4','5','6','0','7','8','9','✓'][i],x,y,.0285,.012,.01);}
  this.disk(this.pad,.011,.003,0,-.052,.029,edge);this.disk(this.pad,.0096,.003,0,-.052,.031,rubber);this.padLight=this.mat('pad-indicator','#b5c1b8',.6,{emissive:'#92cca7',emissiveIntensity:.15});this.box(this.pad,.021,.002,.002,0,-.077,.027,this.padLight,.0005);
  this.lock=new T.Group();this.lock.position.set(1.05,1.31,-.094);this.lock.rotation.y=Math.PI;h.door.add(this.lock);this.box(this.lock,.069,.122,.041,0,0,0,edge,.026);this.box(this.lock,.065,.118,.036,0,0,.007,black,.029);this.disk(this.lock,.030,.019,0,-.024,.035,rubber);this.lockRing=this.disk(this.lock,.031,.003,0,-.024,.044,white);this.disk(this.lock,.028,.004,0,-.024,.046,black);this.lockDot=this.sphere(this.lock,0,.001,.050,[.0025,.0025,.0012],this.mat('orange','#e58850',.4));
  this.hub=new T.Group();this.hub.position.set(1.52,1.13,-.57);h.floor1.add(this.hub);this.box(this.hub,.099,.12,.032,0,0,0,edge,.018);this.box(this.hub,.096,.115,.019,0,0,.017,black,.018);this.box(this.hub,.080,.054,.002,0,.023,.028,glass,.008);this.textPlane(this.hub,'SwitchBot',0,.038,.03,.055,.018);this.textPlane(this.hub,'− −',0,.016,.03,.044,.02,'#8d9799');this.disk(this.hub,.019,.009,0,-.025,.032,rubber);this.disk(this.hub,.0165,.005,0,-.025,.039,black);this.box(this.hub,.088,.009,.054,0,-.064,-.004,black,.006);
  this.hubLamp=this.mat('hub-indicator','#8e978c',.5,{emissive:'#b2d6b3',emissiveIntensity:.1});this.sphere(this.hub,-.033,.047,.03,[.002,.002,.001],this.hubLamp);
  h.devices.push({id:'keypad',mesh:this.pad},{id:'lock',mesh:this.lock},{id:'hub',mesh:this.hub});
 }
 replaceResident(){
  const h=this.house;h.resident.removeFromParent();const r=new T.Group();h.floor1.add(r);h.resident=r;this.resident=r;
  const coat=this.mat('jacket','#6b776d',.96),shirt=this.mat('shirt','#c8c5b7',1),pants=this.mat('pants','#424a48',.93),skin=this.mat('skin','#c2a48f',.97),hair=this.mat('hair','#363531',.98),paper=this.mat('bag-paper','#b39c78',1);
  this.box(r,.37,.59,.23,0,1.02,0,coat,.085);this.box(r,.32,.16,.20,0,.72,0,coat,.045);this.rod(r,[0,1.33,0],[0,1.44,0],.047,skin);this.sphere(r,0,1.54,.0,[.097,.127,.103],skin);this.sphere(r,0,1.575,-.030,[.103,.11,.090],hair);this.sphere(r,0,1.66,-.086,[.043,.04,.045],hair);
  this.legs=[];for(const x of [-.092,.092]){const g=new T.Group();g.position.set(x,.78,0);r.add(g);this.box(g,.135,.60,.155,0,-.30,0,pants,.045);this.box(g,.146,.103,.24,0,-.666,.025,this.mat('shoes','#deddd2',.88),.038);this.legs.push(g);}
  this.rod(r,[-.19,1.25,0],[-.25,.85,.07],.056,coat);this.sphere(r,-.25,.79,.07,[.041,.06,.04],skin);
  this.arm=new T.Group();this.arm.position.set(.19,1.25,0);r.add(this.arm);this.box(this.arm,.108,.32,.13,0,-.13,0,coat,.04);this.forearm=new T.Group();this.forearm.position.set(0,-.27,0);this.arm.add(this.forearm);this.box(this.forearm,.09,.23,.1,0,-.115,.01,coat,.036);this.sphere(this.forearm,0,-.266,.015,[.038,.052,.03],skin);
  this.bags=[];for(const [x,y,z,w] of [[-.29,.50,.07,.29],[.26,.67,-.015,.25]]){const bag=new T.Group();bag.position.set(x,y,z);r.add(bag);this.box(bag,w,.34,.17,0,0,0,paper,.012);this.box(bag,w-.018,.012,.14,0,.176,0,this.mat('bag-interior','#594f3c'),.002);for(const zz of [-.052,.052]){this.rod(bag,[-w*.3,.17,zz],[-w*.2,.28,zz],.006,paper);this.rod(bag,[-w*.2,.28,zz],[w*.2,.28,zz],.006,paper);this.rod(bag,[w*.2,.28,zz],[w*.3,.17,zz],.006,paper);}this.bags.push(bag);}
  this.sphere(this.bags[0],.075,.25,0,[.065,.11,.055],this.mat('grocery-green','#597356',.98));this.rod(this.bags[0],[-.06,.15,0],[-.085,.43,0],.043,this.mat('baguette','#ba9262',.99));
 }
 resize(w=innerWidth,h=innerHeight){this.mobile=w<h;this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.fov=this.mobile?47:39;this.camera.updateProjectionMatrix();}
 seek(t){
  const s=stateAt(t);this.state=s;const h=this.house;h.door.rotation.y=-s.door*1.27;
  this.padLight.emissiveIntensity=s.authenticated?1.4:.1;this.lockDot.position.x=s.locked?0:.017;this.lockDot.position.y=s.locked?.001:-.024;this.hubLamp.emissiveIntensity=s.hub?1.3:.1;
  for(const l of h.lights){const v=l.name==='entry'?s.entry:l.name==='living'?s.living:.0;l.light.intensity=v*7;l.material.emissiveIntensity=.05+v*1.8;}
  this.fillLiving.intensity=s.living*7;this.floorGlow.intensity=s.living*4;this.coveMat.emissiveIntensity=.05+s.living*1.9;
  this.scene.environmentIntensity=.29+s.living*.07;
  const r=this.resident;r.visible=t<19.2;r.position.set(3.72,.06,6.22-s.walkUp*1.73-s.walkIn*3.55);r.position.x-=s.walkIn*.80;r.rotation.y=Math.PI;
  const moving=(s.walkUp>0&&s.walkUp<1)||(s.walkIn>0&&s.walkIn<1);this.legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(t*7+i*Math.PI)*.21:0);
  this.arm.rotation.x=-s.hand*.96;this.forearm.rotation.x=-s.hand*.35;this.bags.forEach((b,i)=>b.rotation.x=moving?Math.sin(t*7+i)*.055:0);
  const frame=cameraAt(t,this.mobile);this.camera.position.set(...frame.position);this.camera.lookAt(...frame.target);
  // Preserve the actual house, keep close foreground obstructions out of the shot.
  if(t>13.1&&t<16.0&&r.position.distanceTo(this.camera.position)<1.1)r.visible=false;
  this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);
  return {time:t,camera:frame.position,triangles:this.renderer.info.render.triangles,state:s};
 }
 productView(id){const target=id==='keypad'?[4.64,1.66,3.68]:id==='hub'?[1.52,1.13,-.54]:[4.2,1.55,3.35];const pos=id==='keypad'?[4.98,1.75,4.10]:id==='hub'?[1.74,1.20,-.05]:[3.9,1.60,2.75];this.seek(id==='lock'?8:20);this.camera.position.set(...pos);this.camera.lookAt(...target);this.renderer.render(this.scene,this.camera);}
}
