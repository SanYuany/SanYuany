import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan} from '../src/planner.js';
import {renderPlanDocument} from '../src/export.js';
test('export preserves deduplicated products and owned-device subtraction',()=>{
 const p=buildPlan({scenes:['morning','coming-home','good-night'],curtainWindows:2,split:true,owned:{curtain:1,hub:1}});
 const html=renderPlanDocument(p,{date:'2026-09-14'});
 assert.match(html,/<html lang="ja">/);
 assert.match(html,/data-product="curtain"[\s\S]*?data-required="4"[\s\S]*?data-buy="3"/);
 assert.equal((html.match(/data-product="hub"/g)||[]).length,1);
 assert.match(html,/data-product="hub"[\s\S]*?data-buy="0"/);
 assert.match(html,/2F \/ 寝室/);assert.match(html,/1F \/ 玄関/);
});
test('saved plan has no WebGL, JavaScript, or remote runtime dependency',()=>{
 const html=renderPlanDocument(buildPlan({scenes:['morning']}));
 assert.doesNotMatch(html,/<script|<canvas|<iframe|<link[^>]+stylesheet|toDataURL|WebGLRenderer/i);
 assert.match(html,/https:\/\/www.switchbot.jp\/products\/switchbot-curtain3/);assert.match(html,/@media print/);
});
test('export escapes textual content and rejects non-HTTPS product URLs',()=>{
 const plan=buildPlan({scenes:['morning']});plan.products[0].name='<script>alert(1)</script>';plan.products[0].url='javascript:alert(1)';
 const html=renderPlanDocument(plan);assert.doesNotMatch(html,/<script|href="javascript:/);assert.match(html,/&lt;script&gt;/);
});
test('saved plan contains compatibility warnings and is explicitly an estimate',()=>{
 const html=renderPlanDocument(buildPlan({scenes:['leaving','coming-home'],compatibleLight:false}));assert.match(html,/通信|赤外線/);assert.match(html,/適合/);assert.match(html,/参考構成/);
});
