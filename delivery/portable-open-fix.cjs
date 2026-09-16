/* Build a local opener without browser import maps, remote modules, or eval.
   Usage: node portable-open-fix.cjs PROJECT_ROOT OUTPUT.html */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
let ts;try{ts=require(process.env.TYPESCRIPT_PATH||'typescript');}catch{ts=require(path.join(cp.execSync('npm root -g',{encoding:'utf8'}).trim(),'typescript'));}
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
let html=fs.readFileSync(path.join(root,'portable/SwitchBot-Living-World-V5.html'),'utf8');
const factories=[],sources={};
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const f of [...walk(path.join(root,'src')),...walk(path.join(root,'vendor'))].filter(f=>f.endsWith('.js'))){
 const id=path.relative(root,f).split(path.sep).join('/');let text=fs.readFileSync(f,'utf8');
 if(id==='src/spatial-view.js')text=text.split('\n').filter(s=>!s.startsWith("const style=document.createElement('link')")).join('\n');
 if(id==='src/app.js')text=text.replace("console.error('3D renderer unavailable',err);failWorld();","console.error('3D renderer unavailable',err);window.__SB_LAUNCH.fail(/WebGL.*context/i.test(err.message)?'WEBGL2_UNAVAILABLE':'RENDERER_START_FAILED',err.message);failWorld();");
 if(id==='src/world.js'){
  text=text.replace('this.canvas=canvas;','this.lightweight=window.__SB_OPEN_OPTIONS&&window.__SB_OPEN_OPTIONS.lightweight;this.canvas=canvas;');
  text=text.replace("{canvas,antialias:true,powerPreference:'high-performance',alpha:false}","{canvas,antialias:!this.lightweight,powerPreference:this.lightweight?'low-power':'default',alpha:false}");
  text=text.replace('this.renderer.shadowMap.enabled=true','this.renderer.shadowMap.enabled=!this.lightweight');
  text=text.replace('const envScene=new RoomEnvironment();','if(!this.lightweight){const envScene=new RoomEnvironment();');
  text=text.replace('envScene.dispose();pmrem.dispose();','envScene.dispose();pmrem.dispose();}else{this.envTarget=null;}');
  text=text.replace('this.sun.castShadow=true','this.sun.castShadow=!this.lightweight');
  text=text.replace('this.mobile?1.25:1.5','this.lightweight?1:(this.mobile?1.25:1.5)');
  text=text.replace('this.envTarget.dispose();','if(this.envTarget)this.envTarget.dispose();');
 }
 const result=ts.transpileModule(text,{fileName:id,compilerOptions:{target:ts.ScriptTarget.ES2019,module:ts.ModuleKind.CommonJS,allowJs:true,removeComments:false,esModuleInterop:false},reportDiagnostics:true});
 if(result.diagnostics.some(d=>d.category===ts.DiagnosticCategory.Error))throw new Error('Transpiling failed: '+id);
 sources[id]=text;factories.push(JSON.stringify(id)+':function(module,exports,require){\n'+result.outputText+'\n}');
}
const runtime=`(function(){"use strict";var modules={${factories.join(',\n')}};var cache=Object.create(null);
function resolve(from,s){if(s==='three')return 'vendor/three/three.module.min.js';if(s.indexOf('three/addons/')===0)return 'vendor/three/addons/'+s.slice(13);if(s[0]!=='.')return s;var a=from.split('/');a.pop();s.split('/').forEach(function(x){if(x==='..')a.pop();else if(x!=='.')a.push(x);});return a.join('/');}
function load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('Bundled module not found: '+id);var m=cache[id]={exports:{}};modules[id](m,m.exports,function(s){return load(resolve(id,s));});return m.exports;}
try{load('src/app.js');window.__SB_CLASSIC_LOADED=true;}catch(error){window.__SB_LAUNCH.fail('SCRIPT_START_FAILED',error&&error.message);}
})();`;
new (require('node:vm').Script)(runtime);
const boot=`(function(){'use strict';
var status={edition:'5.2.1-open-fix',mode:location.hash.indexOf('sb-lite')!==-1?'lite':'standard',state:'starting',errors:[],runtime:'classic inline script; no import map',protocol:location.protocol,browser:navigator.userAgent};
window.__SB_OPEN_OPTIONS={lightweight:status.mode==='lite'};
var help=document.getElementById('launch-help'),detail=document.getElementById('launch-details'),loading=document.getElementById('loading'),timer,poll;
function update(){detail.textContent=JSON.stringify(status,null,2);}
function show(){update();help.hidden=false;}
function fail(code,message){clearInterval(poll);clearTimeout(timer);status.state='failed';status.code=code;status.errors.push(String(message||code).slice(0,800));if(loading)loading.hidden=true;show();}
window.__SB_LAUNCH={status:status,fail:fail,show:show};
window.addEventListener('error',function(e){if(e.message)fail('SCRIPT_ERROR',e.message);});
window.addEventListener('unhandledrejection',function(e){fail('ASYNC_ERROR',e.reason&&e.reason.message||e.reason);});
document.addEventListener('world-failed',function(){fail('RENDERER_UNAVAILABLE','3D 描画の初期化または描画継続を確認できません。詳細を確認してください。');});
document.getElementById('launch-open').onclick=show;
document.getElementById('launch-close').onclick=function(){help.hidden=true;};
document.getElementById('launch-lite').onclick=function(){location.hash='sb-lite';location.reload();};
document.getElementById('launch-retry').onclick=function(){location.hash='';location.reload();};
document.getElementById('launch-plan').onclick=function(){help.hidden=true;if(loading)loading.hidden=true;document.getElementById('build').scrollIntoView();};
document.getElementById('launch-save').onclick=function(){var blob=new Blob([JSON.stringify(status,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SwitchBot-Open-Diagnostic.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove();},5000);};
poll=setInterval(function(){var w=window.__livingWorld;if(w&&w.canvas&&w.canvas.dataset.ready==='true'){clearInterval(poll);clearTimeout(timer);status.state='ready';status.code='3D_READY';status.webgl=w.renderer.getContext().getParameter(w.renderer.getContext().VERSION);if(loading)loading.hidden=true;update();}},400);
timer=setTimeout(function(){clearInterval(poll);if(status.state!=='ready')fail('STARTUP_TIMEOUT','3D の起動を確認できませんでした。互換モードを試すか、この診断を保存してください。');},20000);
})();`;
const panel=`<style>
#launch-open{position:fixed;right:12px;bottom:5px;z-index:60;background:#fffdf7;color:#42514a;border:1px solid #bbbfb1;border-radius:5px;padding:6px 9px;font:11px system-ui;cursor:pointer}
#launch-help{position:fixed;inset:0;z-index:10000;background:#eee9dffa;overflow:auto;display:grid;place-items:center;padding:28px}
#launch-card{font:14px/1.7 system-ui,sans-serif;color:#293531;background:#fffdf7;max-width:650px;width:100%;padding:28px;border:1px solid #cdcbbf;border-radius:12px;box-shadow:0 15px 60px #27353115}
#launch-card h2{font:600 24px/1.5 system-ui;margin:0 0 10px}#launch-card p{margin:8px 0 15px}
#launch-card button{font:13px system-ui;padding:11px 15px;background:#293531;color:#fff;border:0;border-radius:5px;margin:4px 5px 4px 0;cursor:pointer}#launch-card #launch-lite{background:#c33f31}
#launch-details{font:11px/1.6 monospace;white-space:pre-wrap;overflow-wrap:anywhere;max-height:190px;overflow:auto;background:#efeee9;padding:12px;border-radius:6px}
#launch-card small{color:#617066;display:block;margin:9px 0}
@media(max-width:600px){#launch-help{padding:12px}#launch-card{padding:20px}}
</style>
<button id="launch-open" type="button">起動診断 / 启动诊断</button>
<section id="launch-help" hidden role="dialog" aria-modal="true" aria-labelledby="launch-heading"><div id="launch-card"><h2 id="launch-heading">3D 起動チェック / 启动检查</h2><p>画面が開かない場合は、下の互換モードを試せます。<br>未显示三维时，可尝试兼容模式，或将诊断信息发回。</p><small>互換モードも同じ3D住宅です。描画負荷を下げるため影と反射を簡略化します。浏览器必须提供 WebGL 2；不会修改电脑的安全设置。</small><button type="button" id="launch-lite">互換モード / 兼容模式</button><button type="button" id="launch-retry">通常モードで再読込</button><button type="button" id="launch-close">閉じる / 关闭</button><pre id="launch-details"></pre><button type="button" id="launch-save">診断を保存 / 保存诊断</button><button type="button" id="launch-plan">プランのみ見る</button><small>诊断仅保存在本机，不自动上传。页面仍无法使用时，请截图保留浏览器顶部地址栏。</small></div></section>`;
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'');
html=html.replace(/<script type="module">[\s\S]*?<\/script>/,()=>panel+'\n<script>'+boot.replace(/<\/script/gi,'<\\/script')+'</script>\n<script>'+runtime.replace(/<\/script/gi,'<\\/script')+'</script>');
html=html.replace('Living World V5.2 ·','Living World V5.2.1 ·');
html=html.replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript><div class="noscript" style="position:fixed;inset:0;z-index:10001;padding:10vw;background:#eee9df;color:#293531;font:20px/1.7 system-ui">本页面需要在浏览器中运行 JavaScript。<br>请先保存 HTML，再用 Chrome、Edge 或 Safari 打开，不要在聊天附件或文件快速预览里运行。<br>この3D体験にはブラウザのJavaScriptが必要です。</div></noscript>`);
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);fs.writeFileSync(out+'.manifest.json',JSON.stringify({edition:'5.2.1-open-fix',source:fs.readFileSync(path.join(root,'SOURCE_COMMIT.txt'),'utf8').trim(),modules:Object.keys(sources).length,compiler:'TypeScript '+ts.version,scriptFormat:'classic-inline-CommonJS-registry',importMap:false,eval:false,remoteRuntime:false,sha256:require('node:crypto').createHash('sha256').update(html).digest('hex')},null,2));
console.log('Built',out,fs.statSync(out).size,'bytes',Object.keys(sources).length,'modules');
