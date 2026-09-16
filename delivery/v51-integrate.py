from pathlib import Path
import json
root=Path('switchbot-living-world-v5')
p=root/'src/app.js';s=p.read_text();assert "import('./world.js')" in s or "import('./refined-world.js')" in s;p.write_text(s.replace("import('./world.js')","import('./refined-world.js')"))
p=root/'src/data.js';p.write_text(p.read_text().replace("id:'outside',name:'アプローチ'","id:'outside',name:'外観・アプローチ'"))
p=root/'package.json';v=json.loads(p.read_text());v['version']='5.1.0';p.write_text(json.dumps(v,indent=2)+'\n')
p=root/'scripts/build.mjs';s=p.read_text();s=s.replace("'src/world.js','src/house.js'","'src/world.js','src/refined-world.js','src/architectural-finish.js','src/architecture-state.js','src/house.js'");p.write_text(s)
p=root/'index.html';p.write_text(p.read_text().replace('Living World V5 ·','Living World V5.1 ·'))
p=root/'docs/IMPLEMENTATION.md';s=p.read_text().replace('V4 delivery contract','V5.1 refinement delivery contract');p.write_text(s+'\n## 5.1 architectural refinement\n- Original procedural surface maps for wood, linen, plaster and stone.\n- Same-house finished exterior under Explore > Exterior; no wall obstruction in story/room views.\n- Glazing, gable, balcony access, terrace, rainpipes, baseboards and fine instanced foliage.\n- Existing product claims, room journey, planner and download behavior preserved.\n- Architectural illustration, not construction documents or product CAD.\n')
print('Integrated V5.1 into existing modular source; no deployment credentials or external assets used.')
