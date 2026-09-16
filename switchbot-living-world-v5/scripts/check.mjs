import {readdirSync,readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
for(const f of readdirSync('src').filter(x=>x.endsWith('.js')))execFileSync(process.execPath,['--check',`src/${f}`],{stdio:'inherit'});
const html=readFileSync('index.html','utf8');if(!html.includes('type="importmap"'))throw Error('Missing renderer imports');console.log('All source modules parse.');
