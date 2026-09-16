/** View state is independent of product automation; an exterior is an architectural view only. */
export function resolveEnvelope({mode='story',room='all',floor='all'}={}) {
 const closed=mode==='explore'&&room==='outside'&&floor==='all';
 return {closed,roof:closed};
}
export function seededRandom(seed=1701) {
 let state=seed>>>0;
 return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
