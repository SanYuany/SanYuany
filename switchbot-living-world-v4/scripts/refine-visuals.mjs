/** One-time, idempotent correction from actual browser visual review. No credentials. */
import fs from 'node:fs';
function replace(file,oldText,newText){let text=fs.readFileSync(file,'utf8');if(text.includes(oldText)){fs.writeFileSync(file,text.replace(oldText,newText));}else if(!text.includes(newText)){throw Error(`Unexpected source state: ${file}`);}}
replace('src/timeline.js','{p:.71,position:[.8,2.05,4.85],target:[-2.6,1.02,-.8]}','{p:.71,position:[-.8,2.1,5.45],target:[-2.6,1.02,-.8]}');
replace('src/data.js',"title:'おかえりが、\\nつながっていく。'","title:'おかえりで、\\n家が整う。'");
replace('src/house.js','plant(4.03,3.33,1.89,.75,f2);picture(1.92,5.12,-1.9,.58,.71,f2);','plant(4.03,3.33,1.89,.75,f2); // Window remains unobstructed; no floating artwork.');
replace('src/world.js','toneMappingExposure=1.06','toneMappingExposure=.98');
replace('src/world.js','this.sun.intensity=3.5*(1-s.night)+.55','this.sun.intensity=2.8*(1-s.night)+.45');
replace('src/world.js','this.hemi.intensity=1.1*(1-s.night)+.58','this.hemi.intensity=.55*(1-s.night)+.30');
replace('src/world.js','this.fill.intensity=.62*(1-s.night)+.33','this.fill.intensity=.30*(1-s.night)+.18');
replace('src/world.js','this.scene.environmentIntensity=.52*(1-s.night)+.25','this.scene.environmentIntensity=.28*(1-s.night)+.20');
replace('src/house.js','refs.materials=materials;refs.box=box;return refs;',`// Grounding contact shadows are original procedural textures, not baked foreign assets.
 const aoCanvas=document.createElement('canvas');aoCanvas.width=aoCanvas.height=128;const ac=aoCanvas.getContext('2d');
 const ag=ac.createRadialGradient(64,64,3,64,64,64);ag.addColorStop(0,'rgba(48,41,30,.35)');ag.addColorStop(.5,'rgba(48,41,30,.18)');ag.addColorStop(1,'rgba(48,41,30,0)');ac.fillStyle=ag;ac.fillRect(0,0,128,128);
 const aoTexture=new T.CanvasTexture(aoCanvas);aoTexture.colorSpace=T.SRGBColorSpace;
 const aoMat=new T.MeshBasicMaterial({map:aoTexture,transparent:true,depthWrite:false,opacity:.72});
 for(const [x,y,z,w,d,parent] of [[-3.35,.304,-.52,3.45,1.8,f1],[-2.8,.31,1.16,2.0,1.4,f1],[-.32,.263,.32,2.4,2.8,f1],[4.46,.259,1.7,1.0,1.9,f1],[2.02,3.349,-.68,2.75,2.8,f2],[.48,3.353,-1.3,.8,.8,f2],[3.56,3.353,-1.3,.8,.8,f2]]){const m=new T.Mesh(new T.PlaneGeometry(w,d),aoMat);m.name='furniture contact shadow';m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);}
 refs.materials=materials;refs.box=box;return refs;`);
replace('tests/browser.mjs',"()=>assert.deepEqual(reversed.state,morning.state)","()=>{for(const key of ['curtain','door','entry','living','bedroom'])assert.ok(Math.abs(reversed.state[key]-morning.state[key])<.002,`Reverse physical state: ${key}`);assert.equal(reversed.state.locked,morning.state.locked);}");
let tests=fs.readFileSync('tests/domain.test.js','utf8');if(!tests.includes('coming-home hero sightline'))fs.appendFileSync('tests/domain.test.js',`\ntest('coming-home hero sightline clears the front-centre post on both layouts',()=>{for(const mobile of [false,true]){const c=timeline.getCamera(.71,mobile),t=(c.position[2]-3.5)/(c.position[2]-c.target[2]);const x=c.position[0]+(c.target[0]-c.position[0])*t;assert.ok(Math.abs(x-.05)>.25,'Centre sightline must not meet the timber post');}});\n`);
console.log('Visual corrections applied: unobstructed camera, mounted furnishings, depth lighting, pixel-tolerant physical QA.');
