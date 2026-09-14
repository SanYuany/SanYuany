/** Metres; deterministic wall-clock camera math, independent of rendering frame rate. */
export function orbitFrame(elapsed=0,mobile=false){
 const t=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
 const angle=.58+t*.000043,radius=mobile?31:20;
 return {position:[Math.sin(angle)*radius,mobile?19:12,Math.cos(angle)*radius],target:[0,2.35,0]};
}
export function entryProgress(elapsed){const t=Math.max(0,Math.min(1,(Number.isFinite(elapsed)?elapsed:0)/8000));return .07*t*t*(3-2*t);}
/** A dropped frame must not stretch an intended 1.1-second room flight. */
export function transitionAt(start,now,reduced=false){const t=Math.max(0,Math.min(1,(now-start)/1100));return reduced?1:t*t*(3-2*t);}
