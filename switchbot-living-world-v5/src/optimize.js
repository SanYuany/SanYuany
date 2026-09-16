import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Merge only immutable architecture. Doors, curtains, lights and products retain their own transforms. */
export function compactHouse(refs){
 refs.root.updateMatrixWorld(true);
 const keep=new Set([refs.door,refs.roofGroup,refs.faceLed,refs.tv,refs.resident,refs.sunPatch,...refs.curtains.map(c=>c.group),...refs.devices.map(d=>d.mesh)]);
 for(const group of [refs.floor1,refs.floor2,refs.root]){
  const bins=new Map(),inverse=group.matrixWorld.clone().invert();
  function visit(node,blocked=false){
   if(node!==group&&(keep.has(node)||(group===refs.root&&(node===refs.floor1||node===refs.floor2))))return;
   if(node.isMesh&&!node.isInstancedMesh&&!Array.isArray(node.material)&&!node.material.transparent&&!node.userData.dynamic){
    const key=node.material.uuid+'|'+node.castShadow+'|'+node.receiveShadow;
    if(!bins.has(key))bins.set(key,[]);bins.get(key).push(node);
   }
   for(const child of node.children)visit(child);
  }
  visit(group);
  for(const nodes of bins.values()){
   if(nodes.length<3)continue;
   const geometries=nodes.map(node=>{let g=node.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld));return g;});
   const merged=mergeGeometries(geometries,false);
   for(const g of geometries)g.dispose();if(!merged)continue;
   const mesh=new T.Mesh(merged,nodes[0].material);mesh.name='Batched architectural surfaces';mesh.castShadow=nodes[0].castShadow;mesh.receiveShadow=nodes[0].receiveShadow;
   for(const node of nodes)node.removeFromParent();group.add(mesh);
  }
 }
 refs.root.updateMatrixWorld(true);
}
