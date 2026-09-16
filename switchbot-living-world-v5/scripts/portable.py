from pathlib import Path
import re,json,base64,posixpath,sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path.cwd()
mods={}
for f in list((root/'src').rglob('*.js'))+list((root/'vendor').rglob('*.js')):
 rel=f.relative_to(root).as_posix();text=f.read_text()
 def sub(m):
  start,q,spec=m.groups()
  if spec=='three':dest='vendor/three/three.module.min.js'
  elif spec.startswith('three/addons/'):dest='vendor/three/addons/'+spec[len('three/addons/'):]
  elif spec.startswith('.'):dest=posixpath.normpath(posixpath.join(posixpath.dirname(rel),spec))
  else:return m.group(0)
  return start+q+'local/'+dest+q
 text=re.sub(r"(\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['\"])([^'\"]+)\2",sub,text)
 if rel=='src/spatial-view.js':text='\n'.join(x for x in text.splitlines() if not x.startswith("const style=document.createElement('link')"))
 mods['local/'+rel]='data:text/javascript;base64,'+base64.b64encode(text.encode()).decode()
html=(root/'index.html').read_text()
css='\n'.join((root/'src'/x).read_text() for x in ['styles.css','spatial-view.css','cinematic.css'] if (root/'src'/x).exists())
html=html.replace('<link rel="stylesheet" href="./src/styles.css">','<style>'+css+'</style>')
html=re.sub(r'<link rel="stylesheet" href="./src/cinematic.css">','',html)
html=re.sub(r'<script type="importmap">[\s\S]*?</script>',lambda _: '<script type="importmap">'+json.dumps({'imports':mods})+'</script>',html)
html=html.replace('<script type="module" src="./src/app.js"></script>','<script type="module">import "local/src/app.js";</script>')
facts=(root/'docs/FACTS.html').read_text();facts=facts[facts.index('<h1>'):].replace('</html>','').replace('href="../vendor/three/LICENSE"','href="#third-party-license"')
license=(root/'vendor/three/LICENSE').read_text()
html=html.replace('href="./docs/FACTS.html"','href="#facts"').replace('</footer>','</footer><section id="facts" class="portable-facts"><details><summary>機能の出典・条件・ライセンス</summary>'+facts+'<pre id="third-party-license">'+license+'</pre></details></section>')
out=root/'portable';out.mkdir(exist_ok=True);(out/'SwitchBot-Living-World-V5.html').write_text(html)
print('Portable HTML:',len(html),'characters;',len(mods),'embedded modules')
