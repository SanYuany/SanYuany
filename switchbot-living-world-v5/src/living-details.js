import * as T from 'three';
/** Original architectural additions. Nothing is copied from third-party photography. */
export function addLivingDetails(refs,h){
 const {box,cyl,rod,ball,mat,oak,walnut,plaster,ink,cream,sage}=h,{floor1:f1,floor2:f2,root}=refs;
 // Slim east balcony, rail and layered sill. It never covers the open storytelling facade.
 box('east balcony deck',1.05,.14,3.55,5.30,3.24,-.62,oak,f2,.025);
 box('balcony edge',.13,.46,3.56,5.79,3.53,-.62,plaster,f2,.015);
 for(let z=-2.3;z<1.2;z+=.44)rod([5.80,3.72,z],[5.80,4.23,z],.013,ink,f2);
 rod([5.80,4.23,-2.40],[5.80,4.23,1.17],.027,ink,f2);
 for(const z of [-2.40,1.17]){rod([4.83,4.23,z],[5.8,4.23,z],.027,ink,f2);box('balcony return',1.04,.45,.12,5.3,3.54,z,plaster,f2);}
 // Upper landing rail wraps the real staircase opening.
 for(let z=-2.58;z<1.4;z+=.32)rod([-3.86,3.32,z],[-3.86,4.19,z],.012,ink,f2);
 rod([-3.86,4.19,-2.63],[-3.86,4.19,1.36],.024,walnut,f2);
 // Quiet domestic detail, not a showroom full of device icons.
 const tray=cyl('wood tray',.18,.024,-.3,1.054,.32,walnut,f1);tray.scale.x=1.42;
 for(let i=0;i<3;i++)ball('fruit',.044,-.4+i*.07,1.098,.32,mat('citrus','#bf8c43'),f1);
 box('kitchen towel',.25,.40,.018,.6,.91,-2.61,cream,f1,.016);
 for(let i=0;i<5;i++)box('cabinet brass detail',.13,.017,.023,-1.24+i*.63,.77,-2.655,ink,f1,.007);
 box('entry wall mailbox',.26,.24,.12,5.01,1.10,3.53,ink,f1,.02);
 box('house address plate',.17,.11,.01,5.01,1.41,3.60,mat('address','#dbd5c6'),f1,.01);
 // East exterior facade visible when orbiting, with dimensioned timber bands.
 for(let i=0;i<15;i++)box('north cedar siding',.21,2.87,.045,1.55+i*.20,1.67,-3.62,oak,f1,.007);
 // Layered foliage replaces the large sphere crowns with fine overlapping leaves.
 let seed=817;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(const tree of refs.greenery){
  if(tree.position.z<-5.7)tree.scale.setScalar(2.2);
  const old=tree.children.filter(x=>x.name==='tree foliage');const leaves=[];
  for(const c of old){for(let j=0;j<24;j++){const theta=rand()*Math.PI*2,u=rand()*2-1,r=.55*Math.cbrt(rand());leaves.push({p:c.position.clone().add(new T.Vector3(Math.cos(theta)*r,Math.sin(theta)*r,u*r)),s:.075+rand()*.08,a:rand()*6.28});}tree.remove(c);}
  const geometry=new T.IcosahedronGeometry(1,1),material=mat('leaf-fine','#70865e',.93);const mesh=new T.InstancedMesh(geometry,material,leaves.length);mesh.name='Japanese garden foliage';
  const obj=new T.Object3D();leaves.forEach((l,i)=>{obj.position.copy(l.p);obj.scale.set(l.s*1.9,l.s*.45,l.s);obj.rotation.set(l.a*.3,l.a,l.a*.6);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,new T.Color().setHSL(.22+rand()*.055,.18+rand()*.08,.28+rand()*.18));});
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;tree.add(mesh);
 }
 // Sunlight belongs to the bedroom window. Its patch widens only when curtains open.
 const cv=document.createElement('canvas');cv.width=256;cv.height=256;const ctx=cv.getContext('2d');
 const grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'rgba(255,222,149,.02)');grad.addColorStop(.25,'rgba(255,222,149,.5)');grad.addColorStop(.8,'rgba(255,232,180,.65)');grad.addColorStop(1,'rgba(255,232,180,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);ctx.clearRect(124,0,8,256);
 const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
 const sunMaterial=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const patch=new T.Mesh(new T.PlaneGeometry(3.76,4.90),sunMaterial);patch.name='Sun entering the opened curtain';patch.rotation.x=-Math.PI/2;patch.rotation.z=-.11;patch.position.set(2.08,3.347,-.47);patch.userData.dynamic=true;f2.add(patch);refs.sunPatch=patch;
 // Resident is an intentionally stylized scale figure; no facial identity or fake biometric UI.
 const resident=new T.Group();resident.name='Resident opening the door by hand';refs.resident=resident;f1.add(resident);
 const coat=mat('resident-coat','#b59c7b',.92),pants=mat('resident-pants','#505952',.96),skin=mat('resident-skin','#d2b394',.9);
 const torso=box('linen coat',.36,.59,.22,0,1.04,0,coat,resident,.11);
 cyl('neck',.056,.15,0,1.38,0,skin,resident);ball('head',.115,0,1.52,-.005,skin,resident,[.87,1.10,.96]);ball('hair',.116,0,1.56,.04,mat('resident-hair','#47443b',.95),resident,[.93,.88,.88]);
 const legL=new T.Group(),legR=new T.Group();legL.position.set(-.10,.77,0);legR.position.set(.10,.77,0);resident.add(legL,legR);
 for(const leg of [legL,legR]){box('trouser',.13,.59,.15,0,-.28,0,pants,leg,.05);box('walking shoe',.15,.10,.25,0,-.63,-.045,ink,leg,.04);}
 const arm=new T.Group();arm.position.set(.23,1.27,0);resident.add(arm);box('sleeve',.125,.47,.14,0,-.20,0,coat,arm,.05);ball('hand',.064,0,-.46,0,skin,arm,[.7,1,1]);
 box('left sleeve',.12,.44,.14,-.23,1.05,0,coat,resident,.05);ball('bag hand',.060,-.23,.8,0,skin,resident);
 const bag=box('shopping bag',.27,.35,.16,-.28,.57,0,mat('shopping-paper','#c4b080'),resident,.022);
 rod([-.38,.76,0],[-.34,.85,0],.013,walnut,resident);rod([-.34,.85,0],[-.2,.76,0],.013,walnut,resident);
 resident.userData.limbs={legL,legR,arm};resident.visible=false;
}
