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
# A ResizeObserver fires after viewport changes. Updating only the view offset retained
# the desktop camera in portrait. Recompose the full pose, then apply its new clamp.
s=s.replace(' resize(){super.resize();this.frameExterior();}'," resize(){super.resize();if(this.mode==='explore'&&this.roomId==='outside'){const p=exteriorCamera(this.mobile);this.camera.position.set(...p.position);this.look.set(...p.target);this.controls.target.copy(this.look);this.camera.lookAt(this.look);this.roomTransition=null;}this.frameExterior();}")
f.write_text(s)
print('Exterior camera clamp, responsive pose and reset corrected.')
