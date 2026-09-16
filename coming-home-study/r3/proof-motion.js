/** Pure illustration choreography; not measured product kinematics. */
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0),len=a=>Math.hypot(...a);
export function manualPose(t){return {contact:ramp(t,9.2,9.95)*(1-ramp(t,12.55,13.15))};}
export function residentPose(t,s){
 const turn=ramp(t,15.3,18),inward=s.walkIn;
 const base=[3.85+.15*s.walkUp-.25*s.door, -.08+.34*inward, 6.22-2*s.walkUp+.60*s.door*(1-inward)];
 return {position:[base[0]+(3.58-base[0])*inward-2.05*turn,base[1],base[2]+(1.75-base[2])*inward-.9*turn],yaw:-Math.PI+Math.PI/2*turn,moving:(s.walkUp>0&&s.walkUp<1)||(inward>0&&inward<1)||(turn>0&&turn<1)};
}
/** Two-bone arm with a pole direction. Unreachable targets stop at maximum reach. */
export function solveArm(start,target,upper=.32,lower=.31,pole=[0,-1,.3]){
 if(![...start,...target,upper,lower,...pole].every(Number.isFinite)||upper<=0||lower<=0)throw new TypeError('Finite coordinates and positive arm lengths required');
 const delta=sub(target,start),raw=len(delta),axis=raw>1e-9?mul(delta,1/raw):[1,0,0];
 const reach=Math.max(Math.abs(upper-lower)+1e-6,Math.min(upper+lower-1e-6,raw));
 const hand=add(start,mul(axis,reach));
 let normal=sub(pole,mul(axis,dot(pole,axis)));if(len(normal)<1e-6){const fallback=Math.abs(axis[1])<.8?[0,1,0]:[1,0,0];normal=sub(fallback,mul(axis,dot(fallback,axis)));}normal=mul(normal,1/len(normal));
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const elbow=add(add(start,mul(axis,along)),mul(normal,height));
 return {elbow,hand,reachable:raw<=upper+lower&&raw>=Math.abs(upper-lower),error:len(sub(hand,target))};
}
