import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a,b,v) => { const t=clamp01((v-a)/(b-a)); return t*t*(3-2*t); };
const pulse = (a,b,c,d,v) => smooth(a,b,v) * (1-smooth(c,d,v));

export class SwitchBotWorld {
  constructor(canvas){
    this.canvas=canvas;
    this.scene=new THREE.Scene();
    this.scene.fog=new THREE.FogExp2('#a9bdc8',0.012);
    this.camera=new THREE.PerspectiveCamera(46,1,0.1,140);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.12;
    this.progress=0; this.targetProgress=0; this.clock=new THREE.Clock();
    this.refs={trees:[]}; this.pointer=new THREE.Vector2();
    this.createSkyDome(); this.createLighting(); this.createHouse();
    this.cameraKeysDesktop=[
      {p:0.00,pos:[16.5,10.8,18.5],target:[0,2.8,0]},
      {p:0.09,pos:[12.2,8.2,13.0],target:[2.2,3.8,-.7]},
      {p:0.20,pos:[6.4,5.2,6.3],target:[2.7,4.15,-1.25]},
      {p:0.30,pos:[11.2,4.2,11.0],target:[4.3,1.35,2.45]},
      {p:0.41,pos:[7.2,2.9,6.8],target:[4.0,1.25,2.25]},
      {p:0.50,pos:[11.3,4.0,10.7],target:[4.2,1.35,2.4]},
      {p:0.62,pos:[7.1,3.0,6.2],target:[-.7,1.35,-.35]},
      {p:0.73,pos:[4.9,2.75,4.1],target:[-2.25,1.18,-1.0]},
      {p:0.83,pos:[7.6,5.7,6.5],target:[2.7,4.0,-1.25]},
      {p:1.00,pos:[16.8,10.9,18.8],target:[0,2.8,0]}
    ];
    this.cameraKeysMobile=[
      {p:0.00,pos:[20.5,13.0,23.0],target:[0,2.8,0]},
      {p:0.09,pos:[15.0,9.7,16.3],target:[2.2,3.8,-.7]},
      {p:0.20,pos:[8.8,6.2,8.8],target:[2.7,4.15,-1.25]},
      {p:0.30,pos:[13.4,5.0,13.5],target:[4.3,1.35,2.45]},
      {p:0.41,pos:[9.1,3.7,8.7],target:[4.0,1.25,2.25]},
      {p:0.50,pos:[13.8,4.8,13.0],target:[4.2,1.35,2.4]},
      {p:0.62,pos:[9.0,3.7,8.3],target:[-.5,1.35,-.25]},
      {p:0.73,pos:[7.2,3.5,6.7],target:[-2.0,1.25,-.8]},
      {p:0.83,pos:[10.0,6.7,9.6],target:[2.7,4.0,-1.25]},
      {p:1.00,pos:[20.7,13.2,23.2],target:[0,2.8,0]}
    ];
    this.camera.position.set(...this.cameraKeysDesktop[0].pos);
    this._lookTarget=new THREE.Vector3(...this.cameraKeysDesktop[0].target);
    this.camera.lookAt(this._lookTarget);
    window.addEventListener('pointermove',e=>{
      this.pointer.x=(e.clientX/window.innerWidth-.5)*2;
      this.pointer.y=(e.clientY/window.innerHeight-.5)*2;
    },{passive:true});
    window.addEventListener('resize',()=>this.resize(),{passive:true});
    this.resize(); this.animate();
  }

  mat(color,rough=.72,metal=.02,extra={}){ return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra}); }
  box(name,size,pos,mat,group=this.scene){ const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat); m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;group.add(m);return m; }
  rbox(name,size,pos,mat,radius=.12,group=this.scene){ const g=new RoundedBoxGeometry(size[0],size[1],size[2],4,Math.min(radius,...size.map(v=>v/2-.001))); const m=new THREE.Mesh(g,mat);m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;group.add(m);return m; }
  cyl(name,r,h,pos,mat,group=this.scene){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat);m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;group.add(m);return m; }

  createSkyDome(){
    const uniforms={top:{value:new THREE.Color('#8fc2dc')},bottom:{value:new THREE.Color('#dce8e8')},offset:{value:14},exponent:{value:0.72}};
    const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,vertexShader:`varying vec3 vWorldPosition; void main(){vec4 wp=modelMatrix*vec4(position,1.0);vWorldPosition=wp.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 top;uniform vec3 bottom;uniform float offset;uniform float exponent;varying vec3 vWorldPosition;void main(){float h=normalize(vWorldPosition+vec3(0.0,offset,0.0)).y;float f=pow(max(h,0.0),exponent);gl_FragColor=vec4(mix(bottom,top,f),1.0);}`});
    const sky=new THREE.Mesh(new THREE.SphereGeometry(90,32,18),mat); this.scene.add(sky); this.refs.sky=sky; this.refs.skyUniforms=uniforms;
  }

  createLighting(){
    this.hemi=new THREE.HemisphereLight(0xe8f4ff,0x665847,2.7); this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffe3b5,5.1); this.sun.position.set(-10,16,11); this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048); Object.assign(this.sun.shadow.camera,{near:.1,far:60,left:-20,right:20,top:20,bottom:-20}); this.scene.add(this.sun);
    const fill=new THREE.DirectionalLight(0xb9d9e8,1.0);fill.position.set(10,8,-10);this.scene.add(fill);this.refs.fill=fill;
  }

  createDioramaBase(root,m){
    this.rbox('earth-island',[28,1.0,21],[0,-.78,0],this.mat('#675448',1),.8,root);
    this.rbox('grass-island',[27.1,.35,20.1],[0,-.18,0],this.mat('#78916c',1),.62,root);
    this.rbox('driveway',[11,.16,10],[8.2,.04,5.2],this.mat('#a7aaa5',.98),.25,root);
    this.rbox('entry-path',[5.5,.12,2.0],[4.2,.1,5.1],this.mat('#c4bdb0',.97),.12,root);
    const fenceMat=this.mat('#d9d4c8',.9);
    for(let i=0;i<9;i++) this.box('fence-post',[.10,1.15,.10],[-12.2+i*1.6,.55,-8.7],fenceMat,root);
    this.box('fence-rail',[13.0,.10,.10],[-5.8,.88,-8.7],fenceMat,root);
    for(let i=0;i<8;i++){
      const trunk=this.cyl('tree-trunk',.13,2.0,[-11+i*3.0,1.0,-7.3+(i%2)*1.2],m.wood,root);
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.85+(i%3)*.14,2),this.mat(i%2?'#64845d':'#55764f',1));crown.position.set(trunk.position.x,2.45,trunk.position.z);crown.castShadow=true;root.add(crown);this.refs.trees.push(crown);
    }
    for(let i=0;i<5;i++){const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.45+.08*(i%2),2),this.mat('#6f8b64',1));shrub.position.set(-5.4+i*1.35,.38,5.1);shrub.castShadow=true;root.add(shrub);}
  }

  createPitchedRoof(root,m){
    const g=new THREE.Group();g.name='pitched-roof';root.add(g);this.refs.roofGroup=g;
    const left=this.rbox('roof-left',[6.9,.22,9.15],[-3.15,6.65,0],m.roof.clone(),.06,g);left.rotation.z=-.24;
    const right=this.rbox('roof-right',[6.9,.22,9.15],[3.15,6.65,0],m.roof.clone(),.06,g);right.rotation.z=.24;
    this.box('roof-ridge',[.16,.18,9.2],[0,7.47,0],m.dark.clone(),g);
    for(const child of g.children){child.material.transparent=true;child.material.opacity=.96;}
  }

  createBalcony(root,m){
    const g=new THREE.Group();g.name='balcony';root.add(g);
    this.rbox('balcony-deck',[5.4,.16,1.25],[2.7,3.25,4.52],m.wood,.06,g);
    for(let i=0;i<6;i++) this.box('balcony-post',[.07,1.0,.07],[.25+i*.98,3.78,5.02],m.dark,g);
    this.box('balcony-rail',[5.1,.08,.08],[2.7,4.22,5.02],m.dark,g);
    this.box('balcony-midrail',[5.1,.05,.05],[2.7,3.78,5.02],m.dark,g);
  }

  createWoodSlats(root,m){
    const g=new THREE.Group();g.name='genkan-wood-slats';root.add(g);
    for(let i=0;i<9;i++) this.rbox('wood-slat',[.08,2.8,.12],[4.62+i*.16,1.52,3.72],m.wood,.025,g);
    this.rbox('genkan-canopy',[2.35,.16,1.45],[4.55,2.95,4.0],m.dark,.04,g);
  }

  createDiningZone(root,m){
    const g=new THREE.Group();g.name='dining-zone';root.add(g);
    this.rbox('dining-table',[2.5,.14,1.25],[.25,.83,.95],m.wood,.07,g);
    for(const [x,z] of [[-.7,.58],[1.2,.58],[-.7,1.35],[1.2,1.35]]) this.rbox('chair',[.55,.72,.55],[x,.42,z],m.chair,.08,g);
    this.rbox('kitchen-base',[3.25,.95,.62],[.35,.55,-3.35],m.kitchen,.08,g);
    this.rbox('countertop',[3.35,.12,.72],[.35,1.08,-3.35],m.stone,.04,g);
    this.rbox('fridge',[.78,2.05,.72],[2.45,1.05,-3.38],m.kitchen,.06,g);
    this.rbox('pendant-bar',[2.2,.05,.05],[.25,2.55,.92],m.dark,.02,g);
    for(const x of [-.55,.25,1.05]){const shade=this.cyl('pendant',.16,.18,[x,2.25,.92],m.dark,g);shade.rotation.x=Math.PI/2;}
  }

  createHouse(){
    const root=new THREE.Group();root.name='JapaneseHouse';this.scene.add(root);this.refs.root=root;
    const m={wall:this.mat('#eee9df',.86),wall2:this.mat('#d9d5cd',.9),wood:this.mat('#9b6f4e',.76),floor:this.mat('#bd875c',.76),dark:this.mat('#252d30',.62,.07),fabric:this.mat('#d9d5cd',.96),sofa:this.mat('#7f9189',.9),blue:this.mat('#54a9d2',.5,.05),chair:this.mat('#9aa49d',.9),kitchen:this.mat('#bfc1bb',.72),stone:this.mat('#918f8a',.82),roof:this.mat('#3e4547',.74,.06),rug:this.mat('#d9cbbd',1)};
    const glass=new THREE.MeshPhysicalMaterial({color:'#b7dce8',roughness:.08,transmission:.5,transparent:true,opacity:.42,depthWrite:false});
    const glowMat=new THREE.MeshStandardMaterial({color:'#fff3d1',emissive:'#ffd27a',emissiveIntensity:.7,roughness:.4});
    this.createDioramaBase(root,m);
    this.rbox('foundation',[12.5,.34,8.5],[0,.05,0],this.mat('#b2aca0',.95),.1,root);
    this.box('floor1',[12,.18,8],[0,.25,0],m.floor,root);this.box('floor2',[12,.18,8],[0,3.28,0],m.floor,root);
    this.box('back1',[12,3,.16],[0,1.75,-4],m.wall,root);this.box('left1',[.16,3,8],[-6,1.75,0],m.wall2,root);this.box('right1',[.16,3,8],[6,1.75,0],m.wall2,root);
    this.box('back2',[12,3,.16],[0,4.78,-4],m.wall,root);this.box('left2',[.16,3,8],[-6,4.78,0],m.wall2,root);this.box('right2',[.16,3,8],[6,4.78,0],m.wall2,root);
    for(const x of [-5.9,1.35,5.9]) this.box('front-column',[.16,6.0,.16],[x,3.25,3.94],m.wall2,root);
    this.box('front-beam-1',[12,.16,.16],[0,3.22,3.94],m.wall2,root);this.box('front-beam-2',[12,.16,.16],[0,6.18,3.94],m.wall2,root);
    this.box('partition1',[.12,3,7.5],[1.4,1.75,-.2],m.wall2,root);this.box('partition2',[.12,3,7.5],[.2,4.78,-.2],m.wall2,root);
    this.rbox('living-window',[3.3,1.7,.07],[-3.0,1.7,-3.86],glass,.02,root);this.rbox('bed-window',[3.4,1.7,.07],[2.7,4.83,-3.86],glass,.02,root);
    this.createPitchedRoof(root,m);this.createBalcony(root,m);this.createWoodSlats(root,m);this.createDiningZone(root,m);
    const doorPivot=new THREE.Group();doorPivot.position.set(3.35,.25,3.88);root.add(doorPivot);this.refs.doorPivot=doorPivot;
    this.rbox('entrance-door',[1.55,2.6,.18],[.78,1.35,0],m.wood,.06,doorPivot);this.rbox('lock-ultra',[.18,.5,.18],[1.32,1.45,-.18],m.dark,.04,doorPivot);
    const lockLed=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),new THREE.MeshStandardMaterial({color:'#54df99',emissive:'#54df99',emissiveIntensity:2.4}));lockLed.position.set(1.33,1.58,-.285);doorPivot.add(lockLed);this.refs.lockLed=lockLed;
    this.rbox('face-keypad',[.38,.8,.16],[5.1,1.55,4.04],m.dark,.06,root);
    this.rbox('entry-console',[1.65,.14,.58],[3.7,1.0,2.2],m.wood,.05,root);this.rbox('hub3',[.88,.6,.13],[3.7,1.43,2.05],m.dark,.08,root);
    const hs=this.rbox('hub-screen',[.74,.44,.02],[3.7,1.43,1.98],m.blue,.025,root);hs.material.emissive=new THREE.Color('#3a9bc6');hs.material.emissiveIntensity=.65;
    this.rbox('rug',[4.4,.06,3.2],[-2.5,.38,.25],m.rug,.12,root);this.rbox('sofa-base',[3.35,.56,1.28],[-2.65,.68,-.85],m.sofa,.22,root);this.rbox('sofa-back',[3.35,1.0,.28],[-2.65,1.25,-1.36],m.sofa,.14,root);
    this.rbox('coffee-table',[1.9,.13,1.0],[-2.65,.88,.95],m.wood,.1,root);this.rbox('tv-console',[3.3,.42,.5],[-3.0,.62,-3.48],m.dark,.08,root);
    const tv=this.rbox('tv',[2.75,1.5,.08],[-3.0,1.6,-3.7],m.dark,.04,root);tv.material.emissive=new THREE.Color('#1f353e');tv.material.emissiveIntensity=.3;
    const vac=this.cyl('robot-vacuum',.38,.14,[-.45,.42,2.45],m.dark,root);vac.rotation.x=Math.PI/2;
    this.cyl('plant-pot',.3,.46,[-5.0,.52,-2.8],this.mat('#9c7560',.9),root);const plant=new THREE.Mesh(new THREE.IcosahedronGeometry(.58,2),this.mat('#5f7b58',1));plant.position.set(-5,1.15,-2.8);plant.castShadow=true;root.add(plant);
    this.rbox('shelf',[.9,2.2,.34],[-5.25,1.45,2.65],m.wood,.05,root);
    this.rbox('bed-base',[3.45,.5,2.15],[2.8,3.72,-1.15],m.wood,.12,root);this.rbox('mattress',[3.3,.34,2.0],[2.8,4.12,-1.15],m.fabric,.12,root);this.rbox('duvet',[3.0,.22,1.45],[2.8,4.36,-1.4],this.mat('#e8ebe8',.98),.12,root);
    this.rbox('pillow1',[1.08,.18,.56],[2.1,4.51,-.5],m.fabric,.11,root);this.rbox('pillow2',[1.08,.18,.56],[3.5,4.51,-.5],m.fabric,.11,root);this.rbox('bedside',[.76,.72,.72],[4.95,3.78,-1.5],m.wood,.08,root);this.rbox('bed-rug',[4.5,.05,3.0],[2.75,3.4,-.7],this.mat('#c8b7a8',1),.12,root);
    const rail=this.cyl('curtain-rail',.045,3.8,[2.75,5.97,-3.7],m.dark,root);rail.rotation.z=Math.PI/2;
    this.refs.curtainLeft=this.rbox('curtain-left',[1.5,1.95,.09],[1.95,5.0,-3.68],this.mat('#d1c4b2',.98),.05,root);this.refs.curtainRight=this.rbox('curtain-right',[1.5,1.95,.09],[3.55,5.0,-3.68],this.mat('#d1c4b2',.98),.05,root);
    const motor=this.cyl('curtain3-motor',.11,.28,[.9,5.95,-3.7],m.dark,root);motor.rotation.z=Math.PI/2;this.rbox('bedroom-bench',[2.0,.45,.65],[2.75,3.7,2.55],m.chair,.14,root);
    const fixture=(name,pos)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.14,20,12),glowMat.clone());mesh.position.set(...pos);root.add(mesh);const light=new THREE.PointLight(0xffcc78,0,7.5,2);light.position.set(...pos);light.castShadow=true;root.add(light);this.refs[name]={mesh,light};};
    fixture('bedLight',[2.75,5.92,-.05]);fixture('entryLight',[3.8,2.78,2.2]);fixture('livingLight',[-2.25,2.72,.0]);
  }

  keyframe(progress){
    const keys=window.innerWidth<800?this.cameraKeysMobile:this.cameraKeysDesktop;let i=0;while(i<keys.length-2&&progress>keys[i+1].p)i++;
    const a=keys[i],b=keys[i+1],t=smooth(a.p,b.p,progress);
    return {pos:new THREE.Vector3().lerpVectors(new THREE.Vector3(...a.pos),new THREE.Vector3(...b.pos),t),target:new THREE.Vector3().lerpVectors(new THREE.Vector3(...a.target),new THREE.Vector3(...b.target),t)};
  }
  morningState(p){return smooth(.035,.20,p)} leavingState(p){return smooth(.24,.44,p)} comingHomeState(p){return smooth(.50,.74,p)} nightState(p){return smooth(.78,.98,p)}

  applyStates(p){
    const morning=this.morningState(p),leaving=this.leavingState(p),coming=this.comingHomeState(p),night=this.nightState(p);
    const curtainOpen=clamp01(morning*(1-night));this.refs.curtainLeft.position.x=1.95-1.05*curtainOpen;this.refs.curtainRight.position.x=3.55+1.05*curtainOpen;
    const doorPulse=Math.max(pulse(.275,.31,.36,.405,p),pulse(.535,.57,.69,.735,p));this.refs.doorPivot.rotation.y=-doorPulse*1.32;
    const home=coming*(1-night);this.refs.entryLight.light.intensity=7.2*home;this.refs.livingLight.light.intensity=9.2*home;this.refs.bedLight.light.intensity=2.0*(1-leaving)*(1-night)+1.0*home;
    this.refs.entryLight.mesh.material.emissiveIntensity=.25+2.5*home;this.refs.livingLight.mesh.material.emissiveIntensity=.25+2.7*home;this.refs.bedLight.mesh.material.emissiveIntensity=.22+1.45*(1-leaving)*(1-night);
    const topDay=new THREE.Color('#82b8d3'),botDay=new THREE.Color('#e7eee8'),topEvening=new THREE.Color('#8d7580'),botEvening=new THREE.Color('#d9a276'),topNight=new THREE.Color('#0c1624'),botNight=new THREE.Color('#283345');
    if(p<.72){const t=smooth(.46,.72,p);this.refs.skyUniforms.top.value.lerpColors(topDay,topEvening,t);this.refs.skyUniforms.bottom.value.lerpColors(botDay,botEvening,t);}else{this.refs.skyUniforms.top.value.lerpColors(topEvening,topNight,night);this.refs.skyUniforms.bottom.value.lerpColors(botEvening,botNight,night);}
    this.scene.fog.color.copy(this.refs.skyUniforms.bottom.value);this.sun.intensity=5.0*(1-night)+.3;this.hemi.intensity=2.65*(1-night)+.65;this.renderer.toneMappingExposure=1.12-.2*night;
    const roofOpacity=.94-.79*smooth(.06,.18,p)+.79*smooth(.86,.99,p);for(const child of this.refs.roofGroup.children){child.material.opacity=roofOpacity;child.visible=roofOpacity>.08;}
    this.refs.lockLed.material.emissiveIntensity=doorPulse>.15?.7:2.5;
  }

  setWorldProgress(p){this.targetProgress=clamp01(p)}
  resize(){const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)}
  animate(){
    requestAnimationFrame(()=>this.animate());const elapsed=this.clock.getElapsedTime();this.progress=this.targetProgress;const frame=this.keyframe(this.progress);
    const parallaxX=this.pointer.x*(window.innerWidth<800?.08:.16),parallaxY=-this.pointer.y*(window.innerWidth<800?.05:.10);
    this.camera.position.copy(frame.pos);this.camera.position.x+=parallaxX;this.camera.position.y+=parallaxY;this._lookTarget.copy(frame.target);this.camera.lookAt(this._lookTarget);
    this.applyStates(this.progress);for(let i=0;i<this.refs.trees.length;i++)this.refs.trees[i].rotation.z=Math.sin(elapsed*.55+i)*.008;
    this.renderer.render(this.scene,this.camera);
  }
}
