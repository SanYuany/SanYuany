from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'r3-stage')
p=root/'src/coming-home/proof-stage.js';s=p.read_text()
s=s.replace('.015+random()*.055','.004+random()*.014')
s=s.replace("s.box(lock,.071,.137,.033,0,0,-.006,body,.03);s.box(lock,.068,.132,.026,0,0,.006,face,.030);", """function capsule(w,height,depth,mat,z){const r=w/2,c=height/2-r,sh=new T.Shape();sh.moveTo(-r,-c);sh.lineTo(-r,c);sh.absarc(0,c,r,Math.PI,0,true);sh.lineTo(r,-c);sh.absarc(0,-c,r,0,-Math.PI,true);const g=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:3,curveSegments:40,steps:1});const m=new T.Mesh(g,mat);m.position.z=z;m.castShadow=true;m.receiveShadow=true;lock.add(m);return m;}
 capsule(.068,.136,.030,body,-.022);capsule(.065,.130,.003,face,.010);""")
s=s.replace("for(let i=0;i<36;i++){const a=i*Math.PI/18;const rib=s.box(dial,.0013,.006,.010,Math.sin(a)*.0321,Math.cos(a)*.0321,.001,rubber,.0004);rib.rotation.z=-a;}", "const marks=[];for(let i=0;i<48;i++){const a=i*Math.PI/24;marks.push(Math.sin(a)*.03205,Math.cos(a)*.03205,-.007,Math.sin(a)*.03205,Math.cos(a)*.03205,.006);}const lines=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(marks,3)),new T.LineBasicMaterial({color:'#151c1d'}));dial.add(lines);")
s=s.replace("return {g,upper,lower,hand};", "const shoulder=s.sphere(g,0,0,0,[.052,.052,.052],coat),elbow=s.sphere(g,0,0,0,[.044,.044,.044],coat);return {g,upper,lower,hand,shoulder,elbow};")
s=s.replace("chain.hand.position.copy(b);", "chain.shoulder.position.copy(a);chain.elbow.position.copy(e);chain.hand.position.copy(b);")
s=s.replace("s.applyR3=(t,state)=>{", "for(const o of r.children){if(o.isMesh&&o.geometry.type==='SphereGeometry'&&o.position.y>1.45)o.position.y-=.045;if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.position.y>1.35&&o.position.y<1.42){o.scale.y=.55;o.position.y=1.355;}}\n s.applyR3=(t,state)=>{")
p.write_text(s)
p=root/'src/coming-home/proof-motion.js';s=p.read_text().replace('12.55,13.15','12.55,12.80').replace('inward=s.walkIn','inward=ramp(t,12.8,15.0)').replace('6.22-2*s.walkUp','6.22-2.08*s.walkUp').replace('-.25*s.door','-.31*s.door');p.write_text(s)
p=root/'src/coming-home/director.js';s=p.read_text().replace('[14,[3.79','[15.7,[3.79').replace('[16,[2.75','[17.2,[2.75');p.write_text(s)
print('R3 reviewed refinement: capsule shell, flush dial grooves, joint caps and delayed following camera. No actor visibility trick.')
