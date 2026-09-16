import {scenes,productCatalog} from './data.js';
import {clamp} from './timeline.js';
/** A transparent estimate, never a fabricated installation guarantee or live cart. */
export function buildPlan(input={}){
 const selected=[...new Set(Array.isArray(input.scenes)?input.scenes:[])].filter(id=>scenes.some(s=>s.id===id));
 const windows=Math.round(clamp(input.curtainWindows??1,1,6));
 const motors=windows*(input.split?2:1),counts=new Map(),required=new Set();
 for(const id of selected){const scene=scenes.find(s=>s.id===id);for(const key of scene.essential){required.add(key);counts.set(key,key==='curtain'?motors:1);}}
 const products=[...counts].map(([id,quantity])=>({...productCatalog[id],quantity,owned:Math.round(clamp(input.owned?.[id]??0,0,99)),toBuy:Math.max(0,quantity-Math.round(clamp(input.owned?.[id]??0,0,99))),tier:'essential'}));
 const optional=[...new Set(selected.flatMap(id=>scenes.find(s=>s.id===id).recommended))].filter(id=>!required.has(id)).map(id=>productCatalog[id]);
 const warnings=[];
 if(products.some(p=>p.id==='hub'))warnings.push('ハブは仮に1台で集計。階数・壁・赤外線の届く範囲により追加設置が必要です。');
 if(selected.some(id=>id!=='morning')&&!input.compatibleLight)warnings.push('照明・空調の対応状況が未確認です。赤外線リモコンや対応機器を公式サイトでご確認ください。');
 if(products.some(p=>p.id==='lock'))warnings.push('ご購入前に、玄関ドアとサムターンの適合をご確認ください。');
 return {version:1,scenes:selected,products,optional,warnings,windows,split:!!input.split};
}
export function encodePlan(input){return encodeURIComponent(JSON.stringify(input));}
export function decodePlan(hash){try{const raw=JSON.parse(decodeURIComponent(hash.replace(/^#plan=/,'')));return raw&&typeof raw==='object'?raw:null;}catch{return null;}}
