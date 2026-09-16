import * as T from 'three';
import {seededRandom} from './architecture-state.js';

/** Original, locally generated surface maps and architectural envelope. No external image requests. */
export function finishArchitecture(house) {
 const textures=[],materials=[],geometry=[];
 const rng=seededRandom(1701);
 function microSurface(kind){
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d'),image=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const n=rng(),weave=kind==='linen'?((x%4<2?1:-1)+(y%4<2?1:-1))*15:0;
   const grain=kind==='oak'?Math.sin(y*.55+Math.sin(x*.018)*.9)*16:0;
   const v=Math.round(128+(n-.5)*(kind==='stone'?62:22)+weave+grain),i=(y*256+x)*4;
   image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);const texture=new T.CanvasTexture(c);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='oak'?3:5,kind==='oak'?3:5);
  texture.anisotropy=4;textures.push(texture);return texture;
 }
 const oakBump=microSurface('oak'),linenBump=microSurface('linen'),stoneBump=microSurface('stone'),plasterBump=microSurface('plaster');
 for(const [name,m] of Object.entries(house.materials)){
  if(['oak','walnut'].includes(name)){m.bumpMap=oakBump;m.bumpScale=.012;m.roughness=.71;}
  if(['cream','sage','rust','rug','tatami'].includes(name)){m.bumpMap=linenBump;m.bumpScale=.011;m.roughness=.96;}
  if(['stone','driveway','steps'].includes(name)||name.startsWith('tile')){m.bumpMap=stoneBump;m.bumpScale=.022;m.roughness=.92;}
  if(name==='plaster'){m.bumpMap=plasterBump;m.bumpScale=.009;m.roughness=.96;}
  m.needsUpdate=true;
 }
 // A lighter neutral multiplier preserves the oak map rather than staining every surface orange.
 house.materials.oak.color.set('#e9dfce');house.materials.walnut.color.set('#a68b6a');
 house.materials.grass.color.set('#929b80');house.materials.cream.color.set('#ede8de');
 for(const c of house.curtains){c.panel.material.bumpMap=linenBump;c.panel.material.bumpScale=.008;c.panel.material.needsUpdate=true;}
 const wall=new T.MeshStandardMaterial({color:'#e7e3d9',roughness:.95,bumpMap:plasterBump,bumpScale:.009});
 const timber=house.materials.oak,metal=house.materials.ink;
 const clearGlass=new T.MeshPhysicalMaterial({color:'#a9bbba',roughness:.14,metalness:.12,transparent:true,opacity:.30,depthWrite:false});
 const darkGlass=new T.MeshStandardMaterial({color:'#6c898a',roughness:.28,metalness:.22});
 materials.push(wall,clearGlass,darkGlass);
 const lower=new T.Group(),upper=new T.Group();lower.name='Finished lower exterior';upper.name='Finished upper exterior';
 house.floor1.add(lower);house.floor2.add(upper);lower.visible=upper.visible=false;
 const box=(name,w,h,d,x,y,z,m,p)=>{
  const g=new T.BoxGeometry(w,h,d);geometry.push(g);const o=new T.Mesh(g,m);o.name=name;
  o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;p.add(o);return o;
 };
 const rod=(name,a,b,r,m,p)=>{
  const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);
  const g=new T.CylinderGeometry(r,r,delta.length(),12);geometry.push(g);const o=new T.Mesh(g,m);
  o.name=name;o.position.copy(aa.add(bb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.castShadow=true;p.add(o);return o;
 };
 function frontWindow(x,y,w,height,p){
  const z=3.62;
  box('Sliding glass',w,height,.018,x,y,z,clearGlass,p);
  for(const xx of [x-w/2,x,x+w/2])box('Recessed window jamb',.044,height+.08,.105,xx,y,z+.02,metal,p);
  for(const yy of [y-height/2,y+height/2])box('Window head and track',w+.08,.055,.105,x,yy,z+.02,metal,p);
  box('Exterior sill',w+.14,.045,.21,x,y-height/2-.035,z+.07,metal,p);
 }
 // Front elevation, matching the actual room footprint and existing door. Never shown during room flights.
 for(const [x,w] of [[-4.72,.2],[-1.15,.24],[1.36,.24],[2.76,.28],[4.72,.22]])box('Ground facade pier',w,2.83,.17,x,1.66,3.58,wall,lower);
 box('Ground facade head',9.65,.38,.18,0,2.92,3.58,wall,lower);
 box('Living facade sill',3.28,.35,.18,-2.94,.43,3.58,wall,lower);
 box('Dining facade sill',2.25,.66,.18,.10,.57,3.58,wall,lower);
 frontWindow(-2.94,1.66,3.24,2.13,lower);frontWindow(.10,1.81,2.19,1.80,lower);
 box('Cedar entrance wall',1.18,2.45,.19,2.05,1.51,3.61,timber,lower);
 for(let i=0;i<11;i++)box('Fine cedar joints',.010,2.42,.016,1.52+i*.103,1.50,3.72,metal,lower);
 for(const [x,w] of [[-4.67,.32],[-.64,.30],[4.63,.42]])box('Upper facade pier',w,2.79,.17,x,4.75,3.58,wall,upper);
 box('Upper sill band',9.65,.52,.17,0,3.62,3.58,wall,upper);box('Upper lintel band',9.65,.38,.17,0,5.99,3.58,wall,upper);
 frontWindow(-2.70,4.83,3.47,1.88,upper);frontWindow(2.05,4.83,4.38,1.88,upper);
 // A thin gable completes the roof silhouette when viewed outside.
 const gableShape=new T.Shape();gableShape.moveTo(-4.86,6.18);gableShape.lineTo(0,7.25);gableShape.lineTo(4.86,6.18);gableShape.closePath();
 const gg=new T.ShapeGeometry(gableShape);geometry.push(gg);const gable=new T.Mesh(gg,wall);gable.position.z=3.58;gable.name='South gable';gable.castShadow=true;upper.add(gable);
 // East elevation and a real opening onto the balcony.
 const side=new T.Group();side.rotation.y=-Math.PI/2;side.position.set(4.90,0,0);lower.add(side);
 box('East lower facade',.17,2.83,5.62,4.89,1.66,.7,wall,lower);
 box('East living window recess',.026,1.05,1.45,4.988,1.80,-.20,darkGlass,lower);
 for(const z of [-.96,.55])box('East window edge',.06,1.13,.04,5.01,1.8,z,metal,lower);
 for(const y of [1.25,2.35])box('East window edge',.06,.04,1.55,5.01,y,-.20,metal,lower);
 box('East upper front pier',.17,2.78,2.58,4.89,4.75,2.17,wall,upper);
 box('Balcony door head',.17,.37,2.73,4.89,5.99,-.62,wall,upper);
 box('Balcony sliding door',.022,2.33,2.35,4.90,4.53,-.62,clearGlass,upper);
 for(const z of [-1.82,-.62,.58])box('Balcony door vertical',.095,2.36,.048,4.95,4.53,z,metal,upper);
 for(const y of [3.34,5.72])box('Balcony door track',.095,.05,2.45,4.95,y,-.62,metal,upper);
 // Persistent small-scale construction details visible both in cutaway and exterior modes.
 for(const [parent,y] of [[house.floor1,.32],[house.floor2,3.39]]){
  box('North baseboard',9.45,.12,.035,0,y+.06,-3.402,timber,parent);
  box('West baseboard',.035,.12,6.8,-4.702,y+.06,0,timber,parent);
 }
 rod('East rain pipe',[4.99,.25,-3.6],[4.99,6.18,-3.6],.04,metal,house.root);
 rod('West rain pipe',[-4.95,.25,-3.6],[-4.95,6.18,-3.6],.04,metal,house.root);
 // Low timber terrace, placed away from the path into the front door.
 box('Living terrace footing',3.68,.14,1.36,-2.92,.02,4.16,house.materials.stone,house.root);
 for(let i=0;i<17;i++)box('Terrace board',.209,.065,1.32,-4.69+i*.218,.13,4.16,timber,house.root);
 box('Terrace step',3.68,.08,.39,-2.92,-.06,5.02,timber,house.root);
 // Fine lancet leaves replace chunky, uniformly thick foliage while reusing instanced branches.
 const leafShape=new T.Shape();leafShape.moveTo(0,-1);leafShape.quadraticCurveTo(.54,-.20,0,1);leafShape.quadraticCurveTo(-.54,-.20,0,-1);
 const leafGeo=new T.ShapeGeometry(leafShape,3);leafGeo.computeVertexNormals();geometry.push(leafGeo);
 const leafMat=new T.MeshStandardMaterial({color:'#849173',roughness:.95,side:T.DoubleSide});materials.push(leafMat);
 house.root.traverse(node=>{if(node.isInstancedMesh&&node.name==='Japanese garden foliage'){
  node.geometry=leafGeo;node.material=leafMat;
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
  for(let i=0;i<node.count;i++){node.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);scale.set(scale.x*.9,scale.x*1.35,1);matrix.compose(position,rotation,scale);node.setMatrixAt(i,matrix);}
  node.instanceMatrix.needsUpdate=true;node.computeBoundingSphere();
 }});
 // Facade materials are isolated so revealing rooms never dims their furniture.
 const facadeMaterials=[];
 for(const group of [lower,upper])group.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.material;mesh.material=original.clone();materials.push(mesh.material);facadeMaterials.push({mesh,material:mesh.material,opacity:original.opacity,transparent:original.transparent,depthWrite:original.depthWrite,shadow:mesh.castShadow});});
 let closed=false,alpha=0;
 return {lower,upper,textures,
  setState(state){
   const next=Math.max(0,Math.min(1,state.alpha??(state.closed?1:0))),visible=next>.002;
   const shadowChanged=(alpha>.98)!==(next>.98)||lower.visible!==visible;
   if(alpha!==next||lower.visible!==visible){alpha=next;closed=next>.998;lower.visible=upper.visible=visible;
    for(const f of facadeMaterials){f.material.opacity=f.opacity*next;f.material.transparent=f.transparent||next<.998;f.material.depthWrite=f.depthWrite&&next>.98;f.mesh.castShadow=f.shadow&&next>.98;}
   }
   return shadowChanged;
  },
  snapshot(){return {finishedExterior:closed,envelopeAlpha:alpha,lowerVisible:lower.visible,upperVisible:upper.visible,originalProceduralMaps:textures.length};},
  dispose(){for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometry)g.dispose();}
 };
}
