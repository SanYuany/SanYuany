from pathlib import Path
import shutil,hashlib,json
root=Path('r3-stage');(root/'src/coming-home').mkdir(parents=True,exist_ok=True)
for name in ['proof-motion.js','proof-stage.js']:
 shutil.copyfile('coming-home-study/r3/'+name,root/'src/coming-home'/name)
p=root/'director.js';s=p.read_text()
s=s.replace('locked:t<7.6,door:', 'locked:t<7.6,dialAngle:-Math.PI/2*ramp(t,7.0,7.6),door:').replace('export function cameraAt(t,mobile=false)','function baseCameraAt(t,mobile=false)')
s+='''\nexport const EDITORIAL_CUTS=[6.85,9.30];
export function cameraAt(t,mobile=false){
 t=clamp(t,0,DURATION);
 if(t>=6.85&&t<9.30){const u=clamp((t-6.85)/2.45);return {position:mobile?[4.42-u*.018,1.61,3.00]:[4.40-u*.018,1.61,3.08],target:[4.22,1.55,3.40],shot:'inside-lock'};}
 return {...baseCameraAt(t,mobile),shot:t<6.85?'arrival-and-authentication':t<14?'manual-entry':'indoor-welcome'};
}
'''
(root/'src/coming-home/director.js').write_text(s)
p.write_text("export * from './src/coming-home/director.js';\n")
p=root/'stage.js';s=p.read_text()
s=s.replace("import {stateAt,cameraAt} from './director.js';", "import {stateAt,cameraAt} from './director.js';\nimport {installProofStage} from './src/coming-home/proof-stage.js';")
s=s.replace('this.decorate();this.replaceProducts();this.replaceResident();','this.decorate();this.replaceProducts();this.replaceResident();installProofStage(this);')
s=s.replace('this.poseHand(s);const frame=cameraAt(t,this.mobile);','this.poseHand(s);if(this.applyR3)this.applyR3(t,s);const frame=cameraAt(t,this.mobile);')
s=s.replace('if(t>13.1&&t<16.0&&r.position.distanceTo(this.camera.position)<.72)r.visible=false;this.grip.visible=this.grip.visible&&r.visible;','this.grip.visible=false;')
s=s.replace('triangles:this.renderer.info.render.triangles,state:s','triangles:this.renderer.info.render.triangles,state:s,shot:frame.shot,proof:this.proof')
p.write_text(s)
(root/'package.json').write_text('{"type":"module"}')
(root/'evidence/r3').mkdir(parents=True,exist_ok=True)
files=['stage.js','director.js','src/coming-home/director.js','src/coming-home/proof-stage.js','src/coming-home/proof-motion.js']
(root/'evidence/r3/source-sha256.json').write_text(json.dumps({f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files},indent=2))
print('R3 source restored. Same house; interior insert is an illustrative shot, not a measured product demonstration.')
