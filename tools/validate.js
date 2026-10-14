// 用法：node tools/validate.js   ——新增或修改主題 JSON 後執行，抓出選項拼字不一致等錯誤
const fs=require('fs');let bad=0;
const err=m=>{console.log('✗ '+m);bad++};
for(const t of JSON.parse(fs.readFileSync('topics/index.json','utf8')).filter(t=>t.ready)){
  const T=JSON.parse(fs.readFileSync('topics/'+t.file,'utf8')),opt=Object.fromEntries(T.steps.map(s=>[s.dim,s.options]));
  T.dx.forEach(d=>{
    if(!d.name||!d.missing)err(`${t.id}: 診斷缺少 name 或 missing`);
    for(const [k,v] of Object.entries(d.match)){
      if(!opt[k])err(`${t.id}/${d.name}: 未知維度 ${k}`);
      else v.forEach(x=>opt[k].includes(x)||err(`${t.id}/${d.name}: 「${x}」不在 ${k} 的選項中`));}});
  T.steps.forEach(s=>s.options.forEach(o=>T.dx.some(d=>(d.match[s.dim]||[]).includes(o))||err(`${t.id}: 選項「${o}」沒有任何診斷對應`)));
  if(T.regions)T.dx.forEach(d=>T.regions.some(g=>g.id===d.region)||err(`${t.id}/${d.name}: region 不在 regions 清單`));
  if(T.localize)T.dx.forEach(d=>T.localize.options.some(o=>o.id===d.loc)||err(`${t.id}/${d.name}: loc 不在 localize 選項中`));
  (T.presets||[]).forEach(p=>(p.vals.length!==T.steps.length||p.vals.some((v,i)=>!T.steps[i].options.includes(v)))&&err(`${t.id}: 範例「${p.label}」與選項不符`));
  console.log(`✓ ${t.id}：${T.steps.length} 項線索、${T.dx.length} 個診斷、${(T.presets||[]).length} 個範例`);
}
for(const id of ['dizziness','headache']){try{const G=JSON.parse(fs.readFileSync('games/'+id+'.json','utf8')),T=JSON.parse(fs.readFileSync('topics/'+id+'.json','utf8'));
  G.q.forEach(q=>{const o=T.steps.find(s=>s.dim===q.dim).options;o.forEach(x=>q.lay[x]||err(`game/${id}: 缺少「${x}」的白話回答`))});
  G.exam.forEach(e=>Object.keys(e.over).forEach(k=>T.dx.some(d=>d.name.includes(k))||err(`game/${id}/${e.id}: 診斷關鍵字「${k}」找不到`)));
  Object.keys(G.routes).forEach(k=>T.localize.options.some(o=>o.id===k)||err(`game/${id}: route ${k} 不在 localize 中`));
  const ic=fs.readFileSync('icons.js','utf8');[...G.q,...G.gen,...G.exam,...Object.values(G.routes)].forEach(x=>x.ic&&!new RegExp('\\n '+x.ic+':').test(ic)&&err(`game/${id}: 圖示「${x.ic}」不存在於 icons.js`));
  console.log(`✓ game/${id}：${G.q.length} 個問診問題、${G.exam.length} 個檢查項目`)}catch(e){err('game/'+id+': '+e.message)}}
process.exit(bad?1:0);
