/** Pure deterministic timeline. Every visible state derives from scroll, so reverse scrubbing is safe. */
export const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
export function ease(a,b,v){const t=clamp((v-a)/(b-a));return t*t*(3-2*t);}
const pulse=(a,b,c,d,p)=>ease(a,b,p)*(1-ease(c,d,p));
export const chapters=[
  {id:'morning',start:.075,end:.28,anchor:.19},
  {id:'leaving',start:.28,end:.49,anchor:.395},
  {id:'coming-home',start:.49,end:.78,anchor:.675},
  {id:'good-night',start:.78,end:1.01,anchor:.895}
];
export function chapterAt(p){return chapters.findIndex(c=>p>=c.start&&p<c.end);}
export function getState(progress){
 const p=clamp(progress), morning=ease(.105,.205,p), night=ease(.81,.90,p);
 const returning=ease(.535,.72,p), away=ease(.41,.455,p);
 const door=Math.max(pulse(.315,.338,.368,.408,p),pulse(.557,.585,.65,.695,p));
 const entry=(1-away)*.58 + ease(.601,.638,p)*(1-ease(.91,.945,p));
 const living=(1-away)*.7 + ease(.642,.69,p)*(1-ease(.88,.92,p));
 return {p,curtain:morning*(1-night),door,locked:!((p>.31&&p<.414)||(p>.546&&p<.701)),
   entry:clamp(entry),living:clamp(living),bedroom:(.16+.5*morning)*(1-ease(.22,.27,p)) + .65*ease(.77,.815,p)*(1-ease(.92,.963,p)),
   day:1-ease(.49,.84,p),night:ease(.78,.98,p),sunrise:ease(0,.2,p),
   roof:1-ease(.025,.12,p)+ease(.95,1,p),returning,
   authenticated:p>.546&&p<.7,heating:ease(.66,.715,p)*(1-ease(.88,.93,p)),
   actionIndex:p<.28?Math.floor(ease(.10,.215,p)*2):p<.49?Math.floor(ease(.31,.46,p)*2):p<.78?Math.floor(ease(.54,.70,p)*2):Math.floor(ease(.80,.96,p)*2)
 };
}
// One continuous house, not disconnected room scenes. Metres; front is +Z.
export const cameraKeys=[
 {p:0,position:[12.8,10.4,15.8],target:[0,2.4,0]},
 {p:.06,position:[10.7,8.3,12.6],target:[.6,3,0]},
 {p:.13,position:[6.5,6.2,8.0],target:[2.1,4.35,-.7]},
 {p:.22,position:[3.6,4.95,4.65],target:[2.0,4.45,-2.05]},
 {p:.275,position:[10.4,7.4,12.8],target:[.9,2.55,.15]},
 {p:.34,position:[7.5,3.3,10],target:[3.5,1.35,3.45]},
 {p:.42,position:[5.8,2.5,7.1],target:[3.8,1.25,3.2]},
 {p:.49,position:[11.9,7.2,15.4],target:[0,2.1,0]},
 {p:.55,position:[6.6,2.4,7.1],target:[4.2,1.35,3.52]},
 {p:.61,position:[5.0,2.08,5.6],target:[3.0,1.4,1.0]},
 {p:.71,position:[-.8,2.1,5.45],target:[-2.6,1.02,-.8]},
 {p:.765,position:[10.3,7.3,13.2],target:[0,2.5,0]},
 {p:.83,position:[4.9,5.25,7.0],target:[2.0,4.15,-.7]},
 {p:.89,position:[6.4,6.8,8.4],target:[.7,3,0]},
 {p:.96,position:[12.0,9.6,16.4],target:[0,2.5,0]},
 {p:1,position:[13.2,10.4,17.0],target:[0,2.4,0]}
];
export function getCamera(progress,mobile=false){
 const p=clamp(progress);let i=0;
 while(i<cameraKeys.length-2&&p>cameraKeys[i+1].p)i++;
 const a=cameraKeys[i],b=cameraKeys[i+1],t=ease(a.p,b.p,p);
 const target=a.target.map((v,k)=>v+(b.target[k]-v)*t);
 let position=a.position.map((v,k)=>v+(b.position[k]-v)*t);
 if(mobile){const extra=p<.12||p>.94?1.62:1.30;position=position.map((v,k)=>target[k]+(v-target[k])*extra);position[1]+=.45;}
 return {position,target};
}
export const roomViews={
 all:{position:[12.4,10,15.4],target:[0,2.3,0]},
 entrance:{position:[7.1,3.3,8.6],target:[3.6,1.3,2.65]},
 living:{position:[1.3,3.45,8.15],target:[-2.3,1.1,-.15]},
 bedroom:{position:[5.3,6.9,7.85],target:[2.1,4.3,-.6]},
 outside:{position:[13.5,6.0,15],target:[2.5,1,2.2]}
};
