import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
test('clean checkout builds without an untracked empty assets folder',()=>{
 const root=new URL('../',import.meta.url),dir=mkdtempSync(path.join(tmpdir(),'sb-clean-build-'));
 try{for(const name of ['src','vendor','docs','index.html','scripts','package.json'])cpSync(new URL(name,root),path.join(dir,name),{recursive:true});
 const r=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:dir,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.ok(existsSync(path.join(dir,'dist/assets')));
 const receipt=JSON.parse(readFileSync(path.join(dir,'dist/release.json'),'utf8'));assert.match(receipt.files['src/world.js'],/^[a-f0-9]{64}$/);assert.ok(existsSync(path.join(dir,'dist/src/export.js')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
