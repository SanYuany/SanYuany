import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Architectural illustration in metres. Simplified device geometry is not a product CAD asset. */
export function createHouse(){
 const root=new T.Group();root.name='SwitchBot Japanese Home';
 const refs={root,curtains:[],lights:[],devices:[],roof:[],floor1:new T.Group(),floor2:new T.Group(),exterior:new T.Group(),greenery:[]};
 root.add(refs.floor1,refs.floor2,refs.exterior);
 const geoCache=new Map();
 const materials={};
 let seed=43;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function grain(kind){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='wood'?'#c3a47c':kind==='linen'?'#ddd9cf':'#e8e4da';ctx.fillRect(0,0,512,512);
  if(kind==='wood'){
    for(let i=0;i<1900;i++){const y=rnd()*512;ctx.strokeStyle=`rgba(77,48,24,${.025+rnd()*.055})`;ctx.lineWidth=.4+rnd()*1.5;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(170,y+5*rnd(),330,y-4*rnd(),512,y+4*rnd());ctx.stroke();}
    for(let y=0;y<512;y+=64){ctx.fillStyle='#5d442225';ctx.fillRect(0,y,512,1);for(let x=(y%128?170:330);x<512;x+=340)ctx.fillRect(x,y,1,64);}
  }else{for(let i=0;i<15000;i++){ctx.fillStyle=`rgba(80,72,61,${rnd()*.13})`;ctx.fillRect(rnd()*512,rnd()*512,1,kind==='linen'?3:1);}}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='wood'?2:3,kind==='wood'?2:3);tex.anisotropy=4;return tex;
 }
 const woodTexture=grain('wood'),fabricTexture=grain('linen'),wallTexture=grain('plaster');
 const mat=(name,color,roughness=.8,extra={})=>materials[name]??(materials[name]=new T.MeshStandardMaterial({color,roughness,...extra}));
 const oak=mat('oak','#d9c4a3',.72,{map:woodTexture});const walnut=mat('walnut','#8f6a45',.78,{map:woodTexture});
 const plaster=mat('plaster','#f3efe6',.96,{map:wallTexture});const cutEdge=mat('edge','#eee7da',.83);
 const stone=mat('stone','#b9b6ad',.94);const ink=mat('ink','#313b3c',.5,{metalness:.22});const cream=mat('cream','#f1e9dc',.99,{map:fabricTexture});
 const sage=mat('sage','#829384',.96,{map:fabricTexture});const rust=mat('rust','#a77955',.98,{map:fabricTexture});const dark=mat('dark','#4e5652',.8);
 const glass=new T.MeshPhysicalMaterial({color:'#a9c3c6',metalness:.05,roughness:.18,transparent:true,opacity:.22,depthWrite:false});
 function box(name,w,h,d,x,y,z,m=plaster,parent=root,r=0){
  const key=[w,h,d,r].join(':');let g=geoCache.get(key);if(!g){g=r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-.001,h/2-.001,d/2-.001)):new T.BoxGeometry(w,h,d);geoCache.set(key,g);}
  const mesh=new T.Mesh(g,m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cyl(name,rad,h,x,y,z,m=ink,parent=root,radTop=rad,segments=24){
  const key=['cyl',rad,radTop,h,segments].join(':');let g=geoCache.get(key);if(!g){g=new T.CylinderGeometry(radTop,rad,h,segments);geoCache.set(key,g);}
  const mesh=new T.Mesh(g,m);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function ball(name,r,x,y,z,m,parent=root,scale=[1,1,1]){const mesh=new T.Mesh(new T.SphereGeometry(r,16,12),m);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function rod(a,b,r,m=ink,parent=root){const start=new T.Vector3(...a),end=new T.Vector3(...b),diff=end.clone().sub(start);const mesh=cyl('rod',r,diff.length(),0,0,0,m,parent);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());return mesh;}
 function picture(x,y,z,w,h,parent){box('oak frame',w,h,.07,x,y,z,walnut,parent,.02);box('art canvas',w-.065,h-.065,.011,x,y,z+.04,mat('art-paper','#e4d9c5'),parent);const shape=ball('abstract print',.25,x+.06,y-.03,z+.055,mat('art-shape','#979a7d'),parent,[w*1.05,h*1.2,.02]);}
 function plant(x,y,z,size=1,parent=root){cyl('ceramic planter',.23*size,.42*size,x,y+.21*size,z,mat('planter','#c6bda9'),parent,.19*size);rod([x,y+.4*size,z],[x,y+1.2*size,z],.02*size,walnut,parent);for(let i=0;i<7;i++){const a=i*2.4,cy=y+(.75+i*.07)*size;const leaf=ball('leaf',.2*size,x+Math.sin(a)*.15*size,cy,z+Math.cos(a)*.15*size,mat('indoor-leaf','#526955'),parent,[.55,1.5,.19]);leaf.rotation.set(.4,a,.3);}}
 function rug(x,y,z,w,d,parent){box('woven rug',w,.024,d,x,y,z,mat('rug','#c8baa0',1,{map:fabricTexture}),parent,.012);for(let j=-1;j<=1;j+=2)for(let i=0;i<24;i++)box('rug fringe',.014,.016,.10,x-w*.47+i*w*.94/23,y+.001,z+j*d/2,cream,parent);}
 // Calm architectural model base, paving, garden and a small parking area.
 box('site plinth',17.5,.45,14.6,.6,-.46,.2,mat('plinth','#ddd7c9'),root,.2);
 box('garden',16.9,.08,14,.6,-.195,.2,mat('grass','#a4ae89'),root,.08);
 box('house foundation',10.05,.30,7.55,0,-.035,0,stone,root,.06);
 box('approach',3.1,.05,4.2,3.4,-.12,5.1,stone,root,.02);
 for(let a=0;a<6;a++)for(let b=0;b<4;b++)box('approach tile',.49,.035,.66,2.16+a*.505,-.08,3.7+b*.68,mat('tile'+(a+b)%3,['#c9c7be','#c3c1b7','#cecdc4'][(a+b)%3]),root,.012);
 box('driveway',3.2,.07,6.2,6.7,-.13,2.5,mat('driveway','#bdbdb4'),root,.06);
 for(let i=0;i<6;i++){box('stepping stone',.63,.09,.45,-3.7+i*.7,-.08,4.6,mat('steps','#c7c2b6'),root,.04);}
 for(let i=0;i<32;i++)box('fence batten',.06,1.04,.07,-7.8+i*.5,.33,-6.15,oak,root);
 rod([-7.9,.85,-6.15],[7.9,.85,-6.15],.035,ink);
 function tree(x,z,size=1){const treeRoot=new T.Group();treeRoot.position.set(x,-.15,z);root.add(treeRoot);cyl('tree trunk',.105*size,2.45*size,0,1.22*size,0,walnut,treeRoot,.075*size,10);for(let i=0;i<9;i++){const a=i*2.4,r=.32+rnd()*.5;rod([0,1.1*size,0],[Math.sin(a)*r*size,(2+i*.07)*size,Math.cos(a)*r*size],.026*size,walnut,treeRoot);ball('tree foliage',(.43+rnd()*.22)*size,Math.sin(a)*r*size,(2.28+(i%3)*.37)*size,Math.cos(a)*r*size,mat('leaf'+i%3,['#5e7757','#728664','#80926c'][i%3],1),treeRoot,[1,1.17,.88]);}refs.greenery.push(treeRoot);}
 tree(-6.5,-3.8,1.05);tree(6.35,-4.95,1.13);tree(-6.7,4.5,.83);tree(2.65,-5.9,.74);
 for(let i=0;i<12;i++)ball('low planting',.29,-6.1+i*.44,.08,-5.6,mat('shrub','#819576',1),root,[1,1.2,.8]);
 for(let i=0;i<8;i++)ball('garden rock',.18+rnd()*.15,-5.8+rnd()*1.1,-.02,2.3+rnd()*2,stone,root,[1.5,.65,1]);
 // Base floors: warm, continuous oak; room groups remain stable when exploring.
 const f1=refs.floor1,f2=refs.floor2;
 box('1F oak floor',9.6,.16,7.0,0,.17,0,oak,f1);
 box('2F oak floor',9.6,.19,7,0,3.22,0,oak,f2);
 const trim=(y,parent)=>{box('slab fascia',9.75,.18,.10,0,y,3.53,cutEdge,parent);box('slab side',.10,.18,7.15,4.85,y,0,cutEdge,parent);};trim(.18,f1);trim(3.23,f2);
 // Two cutaway faces. Full north/west faces and thin structural edges establish real volume.
 box('west wall',.16,2.85,7,-4.8,1.65,0,plaster,f1);
 box('west upper wall',.16,2.85,7,-4.8,4.73,0,plaster,f2);
 box('north ground wall',9.6,2.85,.16,0,1.65,-3.5,plaster,f1);
 box('north upper left',4.55,2.85,.16,-2.52,4.73,-3.5,plaster,f2);
 box('window sill wall',5.05,.55,.16,2.27,3.60,-3.5,plaster,f2);
 box('window upper lintel',5.05,.46,.16,2.27,5.99,-3.5,plaster,f2);
 box('right window pier',.59,2.22,.16,4.5,4.85,-3.5,plaster,f2);
 box('left window pier',.5,2.22,.16,-.01,4.85,-3.5,plaster,f2);
 box('east wall remnant',.16,2.85,1.5,4.8,1.65,-2.75,plaster,f1);
 box('east upper wall remnant',.16,2.85,1.5,4.8,4.73,-2.75,plaster,f2);
 for(const x of [-4.8,.05,4.8]){box('oak structural post',.115,2.92,.115,x,1.69,3.5,oak,f1);box('upper post',.115,2.89,.115,x,4.72,3.5,oak,f2);}
 box('1F beam',9.72,.14,.14,0,3.04,3.5,oak,f1);box('2F beam',9.72,.14,.14,0,6.13,3.5,oak,f2);
 // Roof forms then lifts away while the camera enters.
 refs.roofGroup=new T.Group();root.add(refs.roofGroup);
 for(const side of [-1,1]){const material=mat('roof'+side,'#586460',.66,{metalness:.16}).clone();const panel=box('pitched roof',5.25,.14,7.9,side*2.52,6.61,0,material,refs.roofGroup,.018);panel.rotation.z=-side*.22;refs.roof.push(panel);for(let j=0;j<20;j++){const seam=box('roof standing seam',5.26,.025,.018,side*2.52,6.70,-3.78+j*.4,material,refs.roofGroup);seam.rotation.z=-side*.22;refs.roof.push(seam);}}
 box('ridge cap',.14,.12,7.95,0,7.21,0,ink,refs.roofGroup,.02);
 // LIVING: textured sofa, pillows, ottoman, circular table, rug and a slatted media wall.
 rug(-2.8,.278,.8,3.25,3.2,f1);
 const sofa=new T.Group();sofa.position.set(-3.35,.26,-.52);f1.add(sofa);
 box('sofa plinth',2.53,.17,.97,0,.2,0,walnut,sofa,.05);
 box('sofa upholstery base',2.6,.37,1.01,0,.4,0,cream,sofa,.11);
 box('sofa back',2.58,.75,.25,0,.8,-.49,cream,sofa,.11);
 box('sofa arm left',.24,.63,1.13,-1.3,.55,0,cream,sofa,.10);box('sofa arm right',.24,.63,1.13,1.3,.55,0,cream,sofa,.10);
 for(const x of [-.65,.65])box('seat cushion',1.2,.17,.90,x,.64,.08,cream,sofa,.07);
 const pillow1=box('sage pillow',.50,.48,.17,-.83,.93,-.24,sage,sofa,.07);pillow1.rotation.set(-.16,0,-.12);
 const pillow2=box('clay pillow',.44,.43,.17,.80,.91,-.25,rust,sofa,.06);pillow2.rotation.set(-.14,0,.15);
 const table=cyl('round coffee table',.67,.09,-2.76,.71,1.12,walnut,f1);table.scale.x=1.28;
 for(const x of [-3.23,-2.28])rod([x,.3,.90],[x,.68,1.12],.032,ink,f1);
 cyl('ceramic vase',.095,.23,-2.8,.87,1.09,mat('vase','#dfd4bc'),f1,.06);rod([-2.8,.99,1.09],[-2.72,1.32,1.1],.006,walnut,f1);
 box('book',.32,.035,.22,-3.12,.78,1.27,mat('book','#d6cbb6'),f1,.007);
 box('media low cabinet',2.8,.42,.47,-3.05,.5,-3.12,walnut,f1,.04);
 for(let i=0;i<23;i++)box('media wall slats',.055,2.55,.08,-4.4+i*.122,1.6,-3.38,oak,f1,.009);
 box('television bezel',2.1,1.18,.055,-3.05,1.60,-3.21,ink,f1,.035);
 const tv=box('television glass',2.04,1.10,.015,-3.05,1.61,-3.173,mat('tv-screen','#53666a',.22,{metalness:.18,emissive:'#213332',emissiveIntensity:.2}),f1,.012);
 refs.tv=tv;
 cyl('reading light base',.21,.055,-4.14,.29,1.87,ink,f1);rod([-4.14,.30,1.87],[-4.14,1.85,1.87],.017,ink,f1);cyl('linen lampshade',.23,.37,-4.14,1.77,1.87,cream,f1,.15);
 plant(-4.13,.25,2.88,.9,f1);
 // Kitchen and dining: real cabinet divisions, small sink, hob, stools and table legs.
 box('kitchen cabinets',3.1,.82,.66,-.05,.70,-3.12,mat('kitchen','#dedfd2'),f1,.028);
 box('stone worktop',3.2,.075,.74,-.05,1.145,-3.12,mat('worktop','#e5e0d6',.48),f1,.022);
 for(let i=0;i<5;i++){box('cabinet groove',.008,.70,.01,-1.51+i*.60,.70,-2.781,dark,f1);box('cabinet handle',.19,.018,.018,-1.22+i*.6,.965,-2.754,ink,f1,.006);}
 box('sink',.57,.016,.36,-.84,1.187,-3.13,ink,f1,.055);rod([-.84,1.18,-3.4],[-.84,1.47,-3.4],.018,ink,f1);rod([-.84,1.47,-3.4],[-.84,1.47,-3.12],.018,ink,f1);
 box('induction surface',.66,.019,.46,.77,1.195,-3.08,ink,f1,.025);
 cyl('kettle',.1,.17,.77,1.285,-3.11,stone,f1,.087);
 box('open shelf',2.65,.06,.23,-.03,2.14,-3.28,oak,f1,.01);
 for(let i=0;i<5;i++)cyl('cup',.05,.10,-1+i*.22,2.22,-3.27,cream,f1,.058,16);
 box('refrigerator',.74,1.92,.76,2.18,1.24,-3.02,mat('fridge','#b9c1bd',.42,{metalness:.35}),f1,.045);
 box('fridge split',.71,.016,.014,2.18,.99,-2.631,dark,f1);box('fridge handle',.026,.42,.035,1.9,1.64,-2.61,ink,f1,.008);
 box('dining tabletop',1.55,.085,.86,-.32,.98,.32,oak,f1,.16);
 for(const x of [-.88,.24])for(const z of [.05,.59])rod([x,.29,z],[x,.94,z],.037,walnut,f1);
 function chair(x,z,dir){const group=new T.Group();group.position.set(x,.27,z);group.rotation.y=dir;f1.add(group);box('chair seat',.49,.09,.47,0,.43,0,sage,group,.07);box('chair curved back',.49,.39,.08,0,.69,-.22,oak,group,.035);for(const xx of [-.17,.17])for(const zz of [-.15,.15])rod([xx,.02,zz],[xx,.44,zz],.023,walnut,group);}
 chair(-.76,-.43,0);chair(.1,-.43,0);chair(-.76,1.06,Math.PI);chair(.1,1.06,Math.PI);
 cyl('table bowl',.15,.04,-.32,1.05,.32,cream,f1,.19);
 // Pendants and ceiling disks are visible but not a forest of product markers.
 function lamp(name,x,y,z,parent,scale=1){const bulb=mat(name+'glow','#fff0cf',.72,{emissive:'#ffc17a',emissiveIntensity:.15});cyl(name+' disk',.26*scale,.05,x,y,z,bulb,parent);const light=new T.PointLight('#ffd4a0',0,5.5,2);light.position.set(x,y-.12,z);parent.add(light);refs.lights.push({name,light,material:bulb});return light;}
 refs.livingLight=lamp('living',-2.9,2.98,.35,f1,1.3);refs.entryLight=lamp('entry',3.44,2.97,2.10,f1,.6);
 rod([-.32,3.05,.32],[-.32,2.44,.32],.007,ink,f1);cyl('dining pendant',.22,.16,-.32,2.4,.32,mat('pendant','#ccc3af'),f1,.13);
 // Genkan with a step, a shoe cabinet, outside authentication and inside retrofit lock.
 box('genkan tile',2.15,.1,2.22,3.69,.145,2.32,stone,f1,.025);
 box('genkan raised floor',2.09,.11,.24,3.69,.265,1.12,oak,f1,.02);
 box('shoe cabinet',.52,1.12,1.5,4.46,.83,1.7,oak,f1,.035);box('cabinet top',.58,.04,1.55,4.46,1.41,1.7,stone,f1,.01);
 box('shoe',.13,.08,.29,3.72,.24,2.56,mat('shoe','#6d6e65'),f1,.038);box('shoe',.13,.08,.29,3.91,.24,2.56,materials.shoe,f1,.038);
 const entryFrame=refs.entryFrame=new T.Group();entryFrame.position.set(3.8,.25,3.51);f1.add(entryFrame);
 for(const x of [-.68,.68])box('door frame',.095,2.4,.15,x,1.20,0,ink,entryFrame);
 box('door lintel',1.45,.08,.15,0,2.43,0,ink,entryFrame);
 refs.door=new T.Group();refs.door.position.set(-.63,0,0);entryFrame.add(refs.door);
 box('front door',1.27,2.37,.085,.635,1.195,0,walnut,refs.door,.015);
 for(let i=0;i<8;i++)box('door oak strip',.009,2.32,.009,.05+i*.17,1.18,.049,oak,refs.door);
 rod([1.05,.91,.115],[1.05,1.51,.115],.016,ink,refs.door);
 const lock=box('Lock Ultra approximate spatial marker',.082,.22,.062,1.05,1.32,-.09,ink,refs.door,.036);refs.devices.push({id:'lock',mesh:lock});
 const dial=cyl('lock cylinder',.04,.06,1.05,1.3,-.13,mat('lock-metal','#78827f',.35,{metalness:.7}),refs.door);dial.rotation.x=Math.PI/2;
 refs.lockDial=dial;
 box('entrance pier',.46,2.60,.19,4.73,1.56,3.52,plaster,f1,.014);
 const keypad=box('face authentication pad simplified',.087,.19,.037,4.64,1.66,3.642,ink,f1,.024);refs.devices.push({id:'keypad',mesh:keypad});
 const faceLed=ball('keypad status',.014,4.64,1.70,3.669,mat('keypad-status','#9fa9a0',.45,{emissive:'#8dd9b0',emissiveIntensity:0}),f1,[1,1,.5]);refs.faceLed=faceLed;
 box('entry canopy',2.3,.085,1.04,3.84,2.94,3.82,ink,f1,.02);
 for(let i=0;i<6;i++)box('porch screen',.035,2.39,.08,2.68,1.49,1.98+i*.21,oak,f1);
 picture(3.6,1.65,-3.38,.75,1.0,f1);
 // Upstairs bedroom with a true window opening, pleated curtain panels and moving motor mounts.
 rug(2.20,3.33,-.04,3.78,4.65,f2);
 box('bed low oak frame',2.19,.28,2.21,2.02,3.56,-.68,walnut,f2,.055);
 box('mattress',2.04,.22,2.02,2.02,3.81,-.68,cream,f2,.095);
 box('duvet',2.02,.19,1.37,2.02,3.99,-.20,cream,f2,.085);
 box('sage throw',2.03,.065,.46,2.02,4.1,.18,sage,f2,.03);
 box('bed headboard',2.21,.93,.13,2.02,3.94,-1.8,oak,f2,.05);
 for(const x of [1.49,2.55]){const p=box('linen pillow',.78,.15,.51,x,4.03,-1.30,cream,f2,.09);p.rotation.y=(x<2?-.055:.055);}
 for(const x of [.48,3.56]){box('bedside table',.47,.51,.45,x,3.6,-1.30,oak,f2,.035);cyl('lamp base',.088,.11,x,3.92,-1.30,stone,f2,.10);cyl('bedside shade',.14,.19,x,4.07,-1.30,cream,f2,.085);}
 box('window sill',3.87,.065,.34,2.17,3.915,-3.4,oak,f2,.013);
 for(const x of [.3,4.04])box('window vertical',.048,1.87,.08,x,4.9,-3.46,ink,f2);
 for(const y of [3.955,5.84])box('window horizontal',3.84,.045,.08,2.17,y,-3.46,ink,f2);
 box('window mullion',.04,1.86,.07,2.17,4.9,-3.46,ink,f2);
 box('glass view',3.78,1.82,.015,2.17,4.9,-3.48,glass,f2);
 rod([.06,5.95,-3.20],[4.3,5.95,-3.20],.022,ink,f2);
 function curtain(side){
  const group=new T.Group();group.position.set(side<0?.16:4.18,4.88,-3.14);f2.add(group);
  // Left panel expands right; right panel expands left. Corrugation gives visible fabric depth.
  const width=2.02,height=2.06,g=new T.PlaneGeometry(width,height,72,8),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){const xx=pos.getX(i);pos.setZ(i,.047*Math.sin((xx/width+.5)*Math.PI*18)+.007*Math.cos(pos.getY(i)*5));}
  g.computeVertexNormals();const cm=new T.MeshStandardMaterial({color:'#dcd0b9',roughness:1,map:fabricTexture,side:T.DoubleSide});
  const panel=new T.Mesh(g,cm);panel.position.x=side<0?width/2:-width/2;panel.castShadow=true;panel.receiveShadow=true;group.add(panel);
  const motor=box('Curtain 3 approximate mount',.055,.1,.055,side<0?width-.07:-width+.07,1.04,0,cream,group,.02);
  refs.curtains.push({group,panel,motor,side,width});refs.devices.push({id:'curtain',mesh:motor});
 }
 curtain(-1);curtain(1);
 refs.bedLight=lamp('bedroom',2.15,6.03,-.08,f2,1.1);
 plant(4.03,3.33,1.89,.75,f2); // Window remains unobstructed; no floating artwork.
 box('bedroom bench',1.31,.11,.39,2.03,3.87,2.56,oak,f2,.035);for(const x of [1.57,2.5])box('bench leg',.07,.46,.30,x,3.58,2.56,walnut,f2,.015);
 // Upstairs study / child room. Quiet lived-in details give the camera parallax cues.
 box('upstairs dividing wall',.12,2.74,4.9,-.3,4.65,-1.0,plaster,f2);
 box('study desktop',2.42,.08,.68,-2.54,4.07,-2.9,oak,f2,.035);
 for(const x of [-3.54,-1.55])box('desk legs',.08,.75,.5,x,3.69,-2.9,walnut,f2);
 box('monitor',.76,.46,.04,-2.48,4.45,-3.08,ink,f2,.019);box('monitor screen',.70,.4,.012,-2.48,4.45,-3.052,mat('monitor-screen','#899a9b',.4),f2);
 rod([-2.48,4.11,-3.08],[-2.48,4.35,-3.08],.022,ink,f2);
 box('desk chair',.5,.11,.49,-2.5,3.86,-2.03,sage,f2,.065);box('chair back',.5,.49,.09,-2.5,4.11,-1.83,sage,f2,.065);rod([-2.5,3.33,-2.03],[-2.5,3.85,-2.03],.035,ink,f2);
 box('tatami platform',3.4,.1,2.8,-2.59,3.36,1.72,mat('tatami','#c2bc94',1,{map:fabricTexture}),f2,.015);
 for(let i=0;i<3;i++)box('tatami border',.025,.012,2.74,-4.1+i*1.1,3.42,1.72,dark,f2);
 box('reading cushion',.85,.12,.82,-3.57,3.51,1.74,rust,f2,.11);
 const lowtable=cyl('low table',.51,.07,-2.4,3.73,1.49,oak,f2);for(const x of [-2.72,-2.08])box('table supports',.055,.28,.30,x,3.57,1.49,walnut,f2);
 for(let i=0;i<5;i++)box('book spine',.07,.27,.18,-4.51+i*.077,3.56,-1.08,mat('book'+i,['#a6ad94','#d0baa0','#bd806a','#d7d5c7','#83948a'][i]),f2,.004);
 // Slim staircase indicates a coherent two-storey home rather than two unrelated dioramas.
 for(let i=0;i<11;i++){box('stair tread',.73,.095,.255,-4.22,.37+i*.263,-2.32+i*.30,oak,f1,.011);rod([-4.62,.38+i*.263,-2.32+i*.3],[-4.62,1.19+i*.263,-2.32+i*.3],.012,ink,f1);}
 rod([-4.62,1.21,-2.32],[-4.62,3.85,.68],.022,ink,f1);
 // Hub at a realistic table location, kept small in the house, explained in the solution panel.
 const hubGroup=new T.Group();hubGroup.position.set(.95,1.215,-3.01);f1.add(hubGroup);
 const hub=box('Hub 3 approximate spatial marker',.105,.13,.04,0,.065,0,ink,hubGroup,.018);refs.devices.push({id:'hub',mesh:hub});
 box('hub display',.082,.076,.006,0,.082,.024,mat('hub-screen','#bbc9ba',.6,{emissive:'#d3dfcd',emissiveIntensity:.25}),hubGroup,.01);
 const dial2=cyl('hub control',.020,.012,0,.02,.029,stone,hubGroup);dial2.rotation.x=Math.PI/2;
 // Car: unbranded small Japanese-family scale, a depth cue rather than a hero object.
 const car=new T.Group();car.position.set(6.7,.05,2.4);root.add(car);
 box('car body',1.46,.46,2.85,0,.45,0,mat('car','#ced4c7',.28,{metalness:.38}),car,.16);
 box('car cabin',1.26,.61,1.7,0,.95,-.25,materials.car,car,.18);
 box('windscreen',1.1,.44,.025,0,1.0,.61,mat('auto glass','#4c686b',.22,{metalness:.45}),car,.07);
 for(const x of [-.58,.58])for(const z of [-.83,.83]){const wheel=cyl('wheel',.25,.135,x,.29,z,ink,car);wheel.rotation.z=Math.PI/2;}
 for(const x of [-.49,.49])box('headlight',.28,.095,.025,x,.55,1.425,mat('headlights','#e7e8db',.35),car,.035);
 // Grounding contact shadows are original procedural textures, not baked foreign assets.
 const aoCanvas=document.createElement('canvas');aoCanvas.width=aoCanvas.height=128;const ac=aoCanvas.getContext('2d');
 const ag=ac.createRadialGradient(64,64,3,64,64,64);ag.addColorStop(0,'rgba(48,41,30,.35)');ag.addColorStop(.5,'rgba(48,41,30,.18)');ag.addColorStop(1,'rgba(48,41,30,0)');ac.fillStyle=ag;ac.fillRect(0,0,128,128);
 const aoTexture=new T.CanvasTexture(aoCanvas);aoTexture.colorSpace=T.SRGBColorSpace;
 const aoMat=new T.MeshBasicMaterial({map:aoTexture,transparent:true,depthWrite:false,opacity:.72});
 for(const [x,y,z,w,d,parent] of [[-3.35,.304,-.52,3.45,1.8,f1],[-2.8,.31,1.16,2.0,1.4,f1],[-.32,.263,.32,2.4,2.8,f1],[4.46,.259,1.7,1.0,1.9,f1],[2.02,3.349,-.68,2.75,2.8,f2],[.48,3.353,-1.3,.8,.8,f2],[3.56,3.353,-1.3,.8,.8,f2]]){const m=new T.Mesh(new T.PlaneGeometry(w,d),aoMat);m.name='furniture contact shadow';m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);}
 refs.materials=materials;refs.box=box;return refs;
}
