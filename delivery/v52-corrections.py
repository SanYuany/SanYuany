from pathlib import Path
p=Path('switchbot-living-world-v5')
f=p/'src/architecture-state.js'
if 'function exteriorMaxDistance' not in f.read_text():
 f.write_text(f.read_text()+"\n/** OrbitControls must not clamp the independently framed portrait exterior. */\nexport function exteriorMaxDistance(mobile=false){return mobile?90:65;}\n")
f=p/'src/refined-world.js';s=f.read_text()
if 'exteriorMaxDistance' not in s:
 s=s.replace('exteriorCamera,storyEnvelopeAlpha','exteriorCamera,storyEnvelopeAlpha,exteriorMaxDistance')
 s=s.replace(' frameExterior(){'," frameExterior(){\n  if(this.controls)this.controls.maxDistance=this.roomId==='outside'?exteriorMaxDistance(this.mobile):37;")
 s=s.replace('}else{this.camera.clearViewOffset();','}else{this.controls.maxDistance=37;this.camera.clearViewOffset();')
 f.write_text(s)
print('Exterior camera clamp and reset corrected.')
