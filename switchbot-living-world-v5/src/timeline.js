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
 {p:0,position:[13.5,10.2,17.5],target:[0,2.6,0]},
 {p:.06,position:[10.0,8.2,13.1],target:[.8,3.2,-.1]},
 {p:.13,position:[5.3,6.15,6.3],target:[2.1,4.50,-1.4]},
 {p:.22,position:[3.50,4.92,1.80],target:[1.85,4.54,-2.90]},
 {p:.275,position:[9.4,6.2,11.5],target:[2.1,2.3,1.1]},
 {p:.34,position:[6.0,2.45,7.8],target:[3.85,1.45,3.15]},
 {p:.42,position:[4.8,1.95,5.8],target:[3.92,1.48,3.30]},
 {p:.49,position:[11.4,6.9,13.8],target:[1.8,2.4,.8]},
 {p:.55,position:[6.3,2.4,7.4],target:[4.1,1.6,3.60]},
 {p:.61,position:[3.80,1.93,4.75],target:[3.45,1.50,1.2]},
 {p:.66,position:[3.65,1.90,2.62],target:[.8,1.28,-.40]},
 {p:.71,position:[.8,1.93,2.95],target:[-2.80,1.30,-1.90]},
 {p:.75,position:[-.55,1.97,2.68],target:[-2.75,1.18,-1.8]},
 {p:.795,position:[8.3,6.8,11.4],target:[.9,3.1,-.5]},
 {p:.85,position:[3.9,5.15,3.2],target:[1.85,4.44,-1.7]},
 {p:.91,position:[7.6,7.3,9.8],target:[.8,3.4,-.1]},
 {p:1,position:[13.5,10.2,17.5],target:[0,2.6,0]}
];
// Portrait is a separately composed camera track, not a crop of the desktop view.
export const mobileCameraKeys=[
 {p:0,position:[19.4,14.9,26.2],target:[0,2.5,0]},
 {p:.06,position:[15.5,12,19.3],target:[.65,3.1,0]},
 {p:.13,position:[6.8,7.0,10.5],target:[2.0,4.55,-.4]},
 {p:.22,position:[3.25,5.4,4.8],target:[2.1,4.45,-1.7]},
 {p:.275,position:[13.1,8.9,16.5],target:[2.6,2.0,1.6]},
 {p:.34,position:[6.8,3.6,10.1],target:[3.95,1.45,3.2]},
 {p:.42,position:[5.7,2.8,8.0],target:[4.03,1.50,3.4]},
 {p:.49,position:[15.2,9.5,18.5],target:[2.0,2.5,1]},
 {p:.55,position:[6.8,3.05,9.2],target:[4.1,1.6,3.7]},
 {p:.61,position:[4.6,2.85,7.1],target:[3.8,1.45,2.4]},
 {p:.66,position:[3.7,2.7,5.1],target:[.9,1.40,.15]},
 {p:.71,position:[-.65,2.65,5.40],target:[-2.35,1.28,-.85]},
 {p:.75,position:[-1.1,2.5,4.3],target:[-2.6,1.25,-1.0]},
 {p:.795,position:[13.2,9.2,16.8],target:[.6,3.1,0]},
 {p:.85,position:[4.8,6.7,8.5],target:[2.05,4.30,-.7]},
 {p:.91,position:[10.1,10.4,15.2],target:[.6,3.3,0]},
 {p:1,position:[19.4,14.9,26.2],target:[0,2.5,0]}
];
/** Monotone Hermite interpolation. Derivatives match at keys; no stop/start at every room. */
function component(keys,index,field,axis,t){
 const a=keys[index],b=keys[index+1],h=b.p-a.p;
 const delta=(b[field][axis]-a[field][axis])/h;
 const slope=(i)=>{if(i===0)return (keys[1][field][axis]-keys[0][field][axis])/(keys[1].p-keys[0].p);
 if(i===keys.length-1)return (keys[i][field][axis]-keys[i-1][field][axis])/(keys[i].p-keys[i-1].p);
 const x=(keys[i][field][axis]-keys[i-1][field][axis])/(keys[i].p-keys[i-1].p),y=(keys[i+1][field][axis]-keys[i][field][axis])/(keys[i+1].p-keys[i].p);
 return x*y<=0?0:2*x*y/(x+y);};
 let m0=slope(index),m1=slope(index+1);
 if(delta===0)m0=m1=0;
 const tt=t*t,ttt=tt*t;return (2*ttt-3*tt+1)*a[field][axis]+(ttt-2*tt+t)*h*m0+(-2*ttt+3*tt)*b[field][axis]+(ttt-tt)*h*m1;
}
export function getCamera(progress,mobile=false){
 const keys=mobile?mobileCameraKeys:cameraKeys,p=clamp(progress);let i=0;
 while(i<keys.length-2&&p>keys[i+1].p)i++;
 const t=clamp((p-keys[i].p)/(keys[i+1].p-keys[i].p));
 return {position:[0,1,2].map(k=>component(keys,i,'position',k,t)),target:[0,1,2].map(k=>component(keys,i,'target',k,t))};
}
export const roomViews={
 all:{position:[12.4,10,15.4],target:[0,2.3,0]},
 entrance:{position:[7.1,3.3,8.6],target:[3.6,1.3,2.65]},
 living:{position:[.65,2.30,3.18],target:[-2.5,1.22,-1.0]},
 bedroom:{position:[3.4,5.05,3.0],target:[1.95,4.35,-1.6]},
 outside:{position:[13.5,6.0,15],target:[2.5,1,2.2]}
};

/** Wall-clock playback remains correct on dropped frames. */
export function playbackAt(start,startTime,now,duration=46000){return clamp(start+Math.max(0,now-startTime)/duration);}

/** A resident establishes scale, then walks ahead of the lens instead of obscuring the room. */
export function getResidentPose(progress){
 const p=clamp(progress),arrival=p>.512&&p<.705,leaving=p>.30&&p<.43;
 let x=3.95,z=1.5,phase=0;
 if(arrival){phase=clamp((p-.512)/.16);if(p<.555)z=5.6-1.5*ease(.512,.555,p);else if(p<.577)z=4.1-.7*ease(.555,.577,p);else if(p<.613)z=3.4-3.15*ease(.577,.613,p);else{const t=ease(.613,.69,p);x=3.95-2.35*t;z=.25-1.15*t;}}
 if(leaving){phase=clamp((p-.30)/.13);z=1.5+4.2*phase;}
 return {visible:arrival||leaving,position:[x,.27,z],angle:arrival?0:Math.PI,phase,reaching:arrival&&p>.557&&p<.588};
}
