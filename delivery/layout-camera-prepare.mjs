import fs from 'node:fs';
let source=fs.readFileSync('delivery/v511-browser.mjs','utf8');
function replaceOnce(from,to){if(!source.includes(from))throw new Error('Browser fixture changed: '+from);source=source.replace(from,to);}
const overlapCheck=`check('Architecture controls do not overlap the product toolbar',await page.evaluate(()=>{const a=document.querySelector('#envelopeControl').getBoundingClientRect(),b=document.querySelector('.world-toolbar').getBoundingClientRect();return a.top>=b.bottom+4||a.right<=b.left||b.right<=a.left;}));`;
replaceOnce("await shot('02-desktop-exterior');",overlapCheck+"\n await shot('02-desktop-exterior');");
replaceOnce("await shot('07-mobile-exterior');",`check('Portrait property fits inside the live viewport after OrbitControls updates',await page.evaluate(()=>{const w=window.__livingWorld;w.camera.updateMatrixWorld();for(const x of [-8.15,9.35])for(const y of [-.7,7.3])for(const z of [-7.1,7.5]){const p=w.camera.position.clone().set(x,y,z).project(w.camera),sx=(p.x+1)/2,sy=(1-p.y)/2;if(sx<.01||sx>.99||sy<.09||sy>.57)return false;}return true;}));\n `+overlapCheck+"\n await shot('07-mobile-exterior');");
// Pause the normal animation only while making deterministic film frames; restore afterwards.
replaceOnce('window.__livingWorld.active=false;','window.__livingWorld.active=false;cancelAnimationFrame(window.__livingWorld.raf);');
replaceOnce('w.envelopeAmount=1-reveal;','w.envelopeAmount=1-reveal;');
replaceOnce('if(flight>0){w.camera.clearViewOffset();w.camera.updateProjectionMatrix();}',"w.camera.setViewOffset(w.width,w.height,w.width*(w.mobile?0:-.08)*(1-flight),w.height*(w.mobile?.18:0)*(1-flight),w.width,w.height);w.camera.updateProjectionMatrix();");
replaceOnce('window.__livingWorld.active=true;window.__livingWorld.dirty=true;','window.__livingWorld.active=true;window.__livingWorld.dirty=true;window.__livingWorld.raf=requestAnimationFrame(window.__livingWorld.animate);');
fs.writeFileSync('delivery/layout-camera-browser.mjs',source);
fs.copyFileSync('delivery/layout-camera-browser.mjs','switchbot-living-world-v5/tests/reveal-browser.mjs');
