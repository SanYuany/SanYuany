/** View state is independent of product automation; an exterior is an architectural view only. */
export function resolveEnvelope({mode='story',room='all',floor='all',override=null}={}) {
 const overview=room==='outside'||room==='all';
 const closed=mode==='explore'&&floor==='all'&&overview&&(typeof override==='boolean'?override:room==='outside');
 return {closed,roof:closed};
}
export function seededRandom(seed=1701) {
 let state=seed>>>0;
 return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
/** The entire property must fit above mobile's room panel, not be a cropped desktop view. */
export function exteriorCamera(mobile=false){
 return mobile?{position:[38,27,49],target:[.3,2.6,0],offset:[0,.18]}:{position:[18,12.5,24],target:[.3,2.6,0],offset:[-.08,0]};
}

/** Amount=1 is a complete exterior; zero is a cutaway. Pure, reversible wall-clock transition. */
export function envelopeAt(from,to,elapsed,reducedMotion=false,duration=1200){
 const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
 const a=clamp(from),b=clamp(to);
 if(reducedMotion||duration<=0)return b;
 const t=clamp(elapsed/duration),e=t*t*(3-2*t);
 return a+(b-a)*e;
}
