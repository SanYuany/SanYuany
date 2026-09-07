import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = (a,b,v) => { const t=clamp01((v-a)/(b-a)); return t*t*(3-2*t); };
const pulse = (a,b,c,d,v) => smooth(a,b,v) * (1-smooth(c,d,v));

export class SwitchBotWorld {
  constructor(canvas){
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#a9c7d6');
    this.scene.fog = new THREE.FogExp2('#9db9c7', 0.018);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.progress = 0;
    this.targetProgress = 0;
    this.clock = new THREE.Clock();
    this.refs = {};
    this.createLighting();
    this.createHouse();
    this.cameraKeys = [
      {p:0.00, pos:[15,9.5,19], target:[0,2.7,0]},
      {p:0.10, pos:[10,7.4,12.5], target:[2.4,4.0,-1.3]},
      {p:0.21, pos:[4.8,4.9,4.9], target:[2.7,4.0,-2.65]},
      {p:0.30, pos:[8.8,3.6,8.8], target:[4.2,1.3,3.2]},
      {p:0.41, pos:[5.9,2.7,5.1], target:[4.25,1.35,2.7]},
      {p:0.50, pos:[10.2,3.2,8.8], target:[4.25,1.35,2.8]},
      {p:0.62, pos:[5.5,2.6,4.6], target:[1.1,1.35,-0.5]},
      {p:0.73, pos:[0.5,2.7,4.5], target:[-2.1,1.25,-1.6]},
      {p:0.83, pos:[5.4,5.2,5.1], target:[2.7,4.0,-2.6]},
      {p:1.00, pos:[15.5,10.2,20.2], target:[0,2.8,0]}
    ];
    this.camera.position.set(...this.cameraKeys[0].pos);
    this._lookTarget=new THREE.Vector3(...this.cameraKeys[0].target);
    this.camera.lookAt(this._lookTarget);
    this.resize();
    window.addEventListener('resize',()=>this.resize(),{passive:true});
    this.animate();
  }

  createLighting(){
    this.hemi = new THREE.HemisphereLight(0xd7efff,0x6e685e,2.5);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe5c0,4.6);
    this.sun.position.set(-8,14,10);
    this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);
    this.sun.shadow.camera.near=0.1;
    this.sun.shadow.camera.far=50;
    this.sun.shadow.camera.left=-18;
    this.sun.shadow.camera.right=18;
    this.sun.shadow.camera.top=18;
    this.sun.shadow.camera.bottom=-18;
    this.scene.add(this.sun);
  }

  mat(color, rough=.72, metal=.02){ return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}); }
  box(name,size,pos,mat,group=this.scene){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);
    mesh.name=name;
    mesh.position.set(...pos);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    group.add(mesh);
    return mesh;
  }
  cyl(name,r,h,pos,mat,group=this.scene){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,28),mat);
    mesh.name=name;
    mesh.position.set(...pos);
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    group.add(mesh);
    return mesh;
  }

  createHouse(){
    const root=new THREE.Group();
    root.name='JapaneseHouse';
    this.scene.add(root);
    this.refs.root=root;
    const wall=this.mat('#eeeae2',.82), wall2=this.mat('#ddd8ce',.86), wood=this.mat('#9c6848',.78), floor=this.mat('#c99a6b',.72), dark=this.mat('#252a2d',.6,.08), fabric=this.mat('#d9d6cf',.96), sofa=this.mat('#8f9b9d',.92), blue=this.mat('#5ea9d0',.58,.08);
    const glass=new THREE.MeshPhysicalMaterial({color:'#b9e2ef',roughness:.08,transmission:.38,transparent:true,opacity:.45,metalness:0,depthWrite:false});
    const glowMat=new THREE.MeshStandardMaterial({color:'#efe6cd',emissive:'#ffd98b',emissiveIntensity:.8,roughness:.45});

    const ground=this.box('ground',[42,.25,34],[0,-.2,0],this.mat('#7d8d72',1),root);
    ground.receiveShadow=true;
    this.box('driveway',[13,.12,11],[9,-.05,6],this.mat('#a8aaa5',1),root);
    for(let i=0;i<7;i++){
      const trunk=this.cyl('tree',.16,2.4,[-10+i*3,-.0,-7+(i%2)*1.5],wood,root);
      trunk.position.y=1.0;
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05+(i%3)*.18,2),this.mat(i%2?'#69835e':'#5a7853',1));
      crown.position.set(trunk.position.x,2.7,trunk.position.z);
      crown.castShadow=true;
      root.add(crown);
    }

    this.box('floor1',[12,.22,8],[0,.05,0],floor,root);
    this.box('floor2',[12,.22,8],[0,3.08,0],floor,root);
    this.box('roof',[12.8,.28,8.8],[0,6.35,0],dark.clone(),root).material.transparent=true;
    this.refs.roof=root.getObjectByName('roof');
    this.refs.roof.material.opacity=.88;
    this.box('back1',[12,3,0.18],[0,1.55,-4],wall,root);
    this.box('left1',[.18,3,8],[-6,1.55,0],wall2,root);
    this.box('right1',[.18,3,8],[6,1.55,0],wall2,root);
    this.box('back2',[12,3,0.18],[0,4.58,-4],wall,root);
    this.box('left2',[.18,3,8],[-6,4.58,0],wall2,root);
    this.box('right2',[.18,3,8],[6,4.58,0],wall2,root);
    this.box('front-left',[7.1,3,.18],[-2.45,1.55,4],wall,root);
    this.box('front-right',[1.0,3,.18],[5.5,1.55,4],wall,root);
    this.box('front2-left',[4.7,3,.18],[-3.65,4.58,4],wall,root);
    this.box('front2-right',[4.6,3,.18],[3.7,4.58,4],wall,root);
    this.box('partition1',[.12,3,7.4],[1.4,1.55,-.2],wall2,root);
    this.box('partition2',[.12,3,7.4],[0.2,4.58,-.2],wall2,root);

    this.box('living-window',[3.1,1.55,.08],[-3.0,1.55,-3.86],glass,root);
    this.box('bed-window',[3.2,1.55,.08],[2.75,4.65,-3.86],glass,root);

    const doorPivot=new THREE.Group();
    doorPivot.position.set(3.55,0,3.88);
    root.add(doorPivot);
    this.refs.doorPivot=doorPivot;
    const door=this.box('entrance-door',[1.6,2.65,.18],[.8,1.4,0],wood,doorPivot);
    door.castShadow=true;
    const lock=this.box('lock-ultra',[.18,.48,.18],[1.36,1.48,-.18],dark,doorPivot);
    this.refs.lock=lock;
    const lockLed=new THREE.Mesh(new THREE.SphereGeometry(.055,18,12),new THREE.MeshStandardMaterial({color:'#5ad991',emissive:'#5ad991',emissiveIntensity:2.4}));
    lockLed.position.set(1.37,1.6,-.285);
    doorPivot.add(lockLed);
    this.refs.lockLed=lockLed;
    this.box('face-keypad',[.36,.78,.16],[5.0,1.35,4.12],dark,root);

    this.box('entry-console',[1.6,.12,.55],[3.7,.85,2.5],wood,root);
    this.box('hub3',[.9,.62,.12],[3.7,1.27,2.39],dark,root);
    const hubScreen=this.box('hub-screen',[.76,.47,.02],[3.7,1.27,2.32],blue,root);
    hubScreen.material.emissive=new THREE.Color('#3b9cc8');
    hubScreen.material.emissiveIntensity=.45;

    this.box('sofa-base',[3.3,.55,1.25],[-2.6,.45,-.8],sofa,root);
    this.box('sofa-back',[3.3,1.05,.25],[-2.6,1.05,-1.35],sofa,root);
    this.box('coffee-table',[2.0,.12,1.05],[-2.6,.72,1.0],wood,root);
    this.box('coffee-leg1',[.14,.62,.14],[-3.35,.38,.7],dark,root);
    this.box('coffee-leg2',[.14,.62,.14],[-1.85,.38,1.3],dark,root);
    this.box('tv-console',[3.3,.38,.48],[-3.0,.38,-3.55],dark,root);
    const tv=this.box('tv',[2.7,1.5,.08],[-3.0,1.4,-3.7],dark,root);
    tv.material.emissive=new THREE.Color('#233842');
    tv.material.emissiveIntensity=.25;
    this.cyl('robot-vacuum',.38,.14,[-.7,.16,2.35],dark,root).rotation.x=Math.PI/2;

    this.box('bed-base',[3.4,.45,2.1],[2.8,3.4,-1.2],wood,root);
    this.box('mattress',[3.25,.35,1.95],[2.8,3.77,-1.2],fabric,root);
    this.box('duvet',[3.0,.22,1.38],[2.8,4.02,-1.43],this.mat('#e6e9e7',.97),root);
    this.box('pillow1',[1.1,.18,.55],[2.1,4.16,-.55],fabric,root);
    this.box('pillow2',[1.1,.18,.55],[3.5,4.16,-.55],fabric,root);
    this.box('bedside',[.75,.7,.72],[4.95,3.48,-1.5],wood,root);

    this.cyl('curtain-rail',.045,3.8,[2.75,5.65,-3.7],dark,root).rotation.z=Math.PI/2;
    const cl=this.box('curtain-left',[1.5,1.85,.09],[1.95,4.72,-3.68],this.mat('#d1c5b5',.98),root);
    const cr=this.box('curtain-right',[1.5,1.85,.09],[3.55,4.72,-3.68],this.mat('#d1c5b5',.98),root);
    this.refs.curtainLeft=cl;
    this.refs.curtainRight=cr;
    this.cyl('curtain3-motor',.11,.28,[.9,5.63,-3.7],dark,root).rotation.z=Math.PI/2;

    const fixture=(name,pos)=>{
      const m=new THREE.Mesh(new THREE.SphereGeometry(.16,20,12),glowMat.clone());
      m.position.set(...pos);
      root.add(m);
      const p=new THREE.PointLight(0xffd18a,0,8,2);
      p.position.set(...pos);
      p.castShadow=true;
      root.add(p);
      this.refs[name]={mesh:m,light:p};
    };
    fixture('bedLight',[2.75,5.75,-.1]);
    fixture('entryLight',[3.8,2.65,2.15]);
    fixture('livingLight',[-2.2,2.6,.0]);

    this.box('step',[2.8,.22,1.5],[4.1,.08,4.7],this.mat('#9a9c99',1),root);
    for(let i=0;i<4;i++){
      const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.55+.1*i,2),this.mat('#607c58',1));
      shrub.position.set(-5+i*1.35,.45,4.75);
      shrub.castShadow=true;
      root.add(shrub);
    }
  }

  keyframe(progress){
    const keys=this.cameraKeys;
    let i=0;
    while(i<keys.length-2 && progress>keys[i+1].p) i++;
    const a=keys[i], b=keys[i+1], t=smooth(a.p,b.p,progress);
    const pa=new THREE.Vector3(...a.pos), pb=new THREE.Vector3(...b.pos), ta=new THREE.Vector3(...a.target), tb=new THREE.Vector3(...b.target);
    const pos=new THREE.Vector3();
    pos.lerpVectors(pa,pb,t);
    const target=new THREE.Vector3();
    target.lerpVectors(ta,tb,t);
    return {pos,target};
  }

  morningState(p){ return smooth(.035,.20,p); }
  leavingState(p){ return smooth(.24,.44,p); }
  comingHomeState(p){ return smooth(.50,.74,p); }
  nightState(p){ return smooth(.78,.98,p); }

  applyStates(p){
    const morning=this.morningState(p), leaving=this.leavingState(p), coming=this.comingHomeState(p), night=this.nightState(p);
    const curtainOpen=clamp01(morning*(1-night));
    this.refs.curtainLeft.position.x=1.95-1.05*curtainOpen;
    this.refs.curtainRight.position.x=3.55+1.05*curtainOpen;
    const doorPulse=Math.max(pulse(.275,.31,.36,.405,p),pulse(.535,.57,.69,.735,p));
    this.refs.doorPivot.rotation.y=-doorPulse*1.32;

    const homeLights=coming*(1-night);
    this.refs.entryLight.light.intensity=8.0*homeLights;
    this.refs.livingLight.light.intensity=10.0*homeLights;
    this.refs.bedLight.light.intensity=2.2*(1-leaving)*(1-night)+1.1*homeLights;
    this.refs.entryLight.mesh.material.emissiveIntensity=.3+2.4*homeLights;
    this.refs.livingLight.mesh.material.emissiveIntensity=.3+2.7*homeLights;
    this.refs.bedLight.mesh.material.emissiveIntensity=.25+1.4*(1-leaving)*(1-night);

    const skyMorning=new THREE.Color('#b8d5e3'), skyDay=new THREE.Color('#96bfd4'), skyEvening=new THREE.Color('#837b89'), skyNight=new THREE.Color('#101a27');
    const bg=new THREE.Color();
    if(p<.52) bg.lerpColors(skyMorning,skyDay,smooth(.0,.45,p));
    else if(p<.80) bg.lerpColors(skyDay,skyEvening,smooth(.52,.80,p));
    else bg.lerpColors(skyEvening,skyNight,night);
    this.scene.background.copy(bg);
    this.scene.fog.color.copy(bg);
    this.sun.intensity=4.8*(1-night)+.25;
    this.sun.color.lerpColors(new THREE.Color('#fff0cb'),new THREE.Color('#b8cbe2'),night);
    this.hemi.intensity=2.5*(1-night)+.55;
    this.renderer.toneMappingExposure=1.08-.22*night;
    this.refs.roof.material.opacity=.84-.58*smooth(.08,.20,p)+.58*smooth(.88,1,p);
    this.refs.roof.visible=this.refs.roof.material.opacity>.08;
    this.refs.lockLed.material.emissiveIntensity=doorPulse>.15?.7:2.5;
  }

  setWorldProgress(p){ this.targetProgress=clamp01(p); }

  resize(){
    const w=this.canvas.clientWidth||innerWidth, h=this.canvas.clientHeight||innerHeight;
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }

  animate(){
    requestAnimationFrame(()=>this.animate());
    this.clock.getDelta();
    this.progress = this.targetProgress;
    const frame=this.keyframe(this.progress);
    this.camera.position.copy(frame.pos);
    const look=this._lookTarget||(this._lookTarget=new THREE.Vector3());
    look.copy(frame.target);
    this.camera.lookAt(look);
    this.applyStates(this.progress);
    this.renderer.render(this.scene,this.camera);
  }
}
