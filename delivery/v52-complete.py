from pathlib import Path
import json
p=Path('switchbot-living-world-v5')
version=json.loads((p/'package.json').read_text())['version']
if version=='5.2.0':
 print('V5.2 already applied');raise SystemExit(0)
assert version=='5.1.0',f'Unexpected baseline {version}'
f=p/'src/architecture-state.js'
f.write_text(f.read_text()+'''
/** Complete house to cutaway to complete house. Pure reversible scroll state. */
export function storyEnvelopeAlpha(progress=0){
 const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
 const smooth=(a,b)=>{const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t);};
 return Math.max(1-smooth(.02,.075),smooth(.95,1));
}
/** Exterior orbit starts at its independently composed camera with no jump. */
export function exteriorOrbitFrame(elapsed=0,mobile=false){
 const pose=exteriorCamera(mobile),[x,y,z]=pose.position,[tx,,tz]=pose.target;
 const radius=Math.hypot(x-tx,z-tz),angle=Math.atan2(x-tx,z-tz)+Math.max(0,Number.isFinite(elapsed)?elapsed:0)*.000085;
 return {position:[tx+Math.sin(angle)*radius,y,tz+Math.cos(angle)*radius],target:[...pose.target]};
}
''')
f=p/'src/refined-world.js';s=f.read_text().replace('resolveEnvelope,exteriorCamera','resolveEnvelope,exteriorCamera,storyEnvelopeAlpha')
s=s.replace('if(this.finish.setState(architecture))',"const alpha=this.mode==='story'?storyEnvelopeAlpha(state.p):(architecture.closed?1:0);\n  if(this.finish.setState({...architecture,alpha}))")
f.write_text(s)
f=p/'src/architectural-finish.js';s=f.read_text();old=" let closed=false;\n return {lower,upper,textures,\n  setState(state){if(closed!==state.closed){closed=state.closed;lower.visible=upper.visible=closed;return true;}return false;},\n  snapshot(){return {finishedExterior:closed,lowerVisible:lower.visible,upperVisible:upper.visible,originalProceduralMaps:textures.length};},"
new=''' // Facade materials are isolated so revealing rooms never dims their furniture.
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
  snapshot(){return {finishedExterior:closed,envelopeAlpha:alpha,lowerVisible:lower.visible,upperVisible:upper.visible,originalProceduralMaps:textures.length};},'''
assert old in s;s=s.replace(old,new);f.write_text(s)
f=p/'src/spatial-view.js';s=f.read_text().replace("import {orbitFrame,entryProgress} from './spatial-math.js';","import {orbitFrame,entryProgress} from './spatial-math.js';\nimport {exteriorOrbitFrame} from './architecture-state.js';")
s=s.replace('const pose=orbitFrame(t-orbitStart,world.mobile);',"const pose=world.roomId==='outside'?exteriorOrbitFrame(t-orbitStart,world.mobile):orbitFrame(t-orbitStart,world.mobile);")
s=s.replace("app.selectRoom('all');world.roomTransition=null;world.setFloor('all');automatic=true;","app.selectRoom(world.roomId==='outside'?'outside':'all');world.roomTransition=null;world.setFloor('all');automatic=true;")
s=s.replace('world.spatialComposition=true;world.resize();if(rotate',"world.spatialComposition=true;app.selectRoom('outside');world.resize();if(rotate")
f.write_text(s)
f=p/'src/app.js';s=f.read_text().replace("$('#sharePlan').onclick=async()=>{const url=","$('#sharePlan').onclick=async()=>{if(!['http:','https:'].includes(location.protocol)){downloadPlanDocument(renderPlanDocument(buildPlan(readInput())));toast('共有用のプランを保存しました。ファイルをそのまま送れます。');return;}const url=")
s=s.replace("let shared=location.hash.startsWith","if(!['http:','https:'].includes(location.protocol))$('#sharePlan').textContent='共有用ファイルを保存 ↗';\nlet shared=location.hash.startsWith")
f.write_text(s)
f=p/'src/cinematic.css';f.write_text(f.read_text()+'''
/* V5.2: preserve readable room choices without an orphaned final syllable. */
.explore-panel h2{font-size:23px;line-height:1.5;text-wrap:balance;word-break:normal;overflow-wrap:normal}
@media(min-width:761px){.explore-panel{overflow-y:auto;max-height:calc(100svh - 140px)}.hero-copy{max-width:360px}.hero-copy h1{font-size:clamp(34px,3.7vw,53px)}}
@media(max-width:760px){.hero-copy h1{font-size:30px}.hero-copy .lead{font-size:12px}.hero-copy .primary{margin-top:4px}}
''')
f=p/'index.html';f.write_text(f.read_text().replace('Living World V5.1','Living World V5.2'))
f=p/'package.json';d=json.loads(f.read_text());d['version']='5.2.0';f.write_text(json.dumps(d,indent=2)+'\n')
f=p/'README.md';s=f.read_text().replace('Living World 5.1','Living World 5.2');s+='''
## V5.2 completion pass

The first and last story views show the finished facade. Scroll reveals the same underlying rooms before the morning scene. The facade is a pure reversible function of scroll position, not a new house. No product claims or automation rules changed.

The direct 3D entry opens the exterior; auto-rotation preserves it instead of jumping to the cutaway. Local file pages export a shareable plan file, never a broken null-origin URL. Desktop and portrait remain independently composed.

Public hosting is separate from browser acceptance. Deployment uses only an existing standard NETLIFY_AUTH_TOKEN repository secret, never credentials or temporary proxy authorizations stored in repository files. No payment or unified checkout is implemented.
''';f.write_text(s)
print('V5.2 changes applied to the existing V5 source only.')
