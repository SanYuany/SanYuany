/** View state is independent of product automation; an exterior is an architectural view only. */
export function resolveEnvelope({mode='story',room='all',floor='all'}={}) {
 const closed=mode==='explore'&&room==='outside'&&floor==='all';
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

/** OrbitControls must not clamp the independently framed portrait exterior. */
export function exteriorMaxDistance(mobile=false){return mobile?90:65;}
