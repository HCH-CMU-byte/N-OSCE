/* 互動情境（試行版）：對話問診 → 碰觸身體檢查 → 腦中分析泡泡 → 評分講解 */
const GAMES=['dizziness','headache'];
const REGION={head:['頭',100,20],eyes:['眼',100,52],face:['臉',100,84],ears:['耳',58,66],neck:['頸',100,114],chest:['胸',100,165],arm:['臂',158,180],hand:['手',160,246],legs:['腿',112,310]};
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function say(el,text){clearInterval(say.t);el.textContent='';let i=0;say.t=setInterval(()=>{el.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(say.t)},22)}
function bodySVG(){return `<svg viewBox="0 0 200 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g class="gm-fig">
 <ellipse class="fg-line" cx="100" cy="58" rx="40" ry="48"/><circle class="fg-line" cx="58" cy="66" r="8"/><circle class="fg-line" cx="142" cy="66" r="8"/>
 <rect class="fg-line" x="90" y="100" width="20" height="22" rx="6"/><rect class="fg-line" x="58" y="120" width="84" height="120" rx="26"/>
 <rect class="fg-line" x="30" y="124" width="22" height="112" rx="11"/><rect class="fg-line" x="148" y="124" width="22" height="112" rx="11"/>
 <circle class="fg-line" cx="41" cy="248" r="11"/><circle class="fg-line" cx="159" cy="248" r="11"/>
 <rect class="fg-line" x="70" y="238" width="27" height="130" rx="12"/><rect class="fg-line" x="103" y="238" width="27" height="130" rx="12"/></g></svg>`}
const pos=(x,y)=>`left:${x/2}%;top:${y/3.8}%`;

async function gameMenu(){
  document.title='互動情境（試行版）';
  app.innerHTML=`<button class="back" id="back">← 回首頁</button><header><div class="eyebrow">互動情境（試行版）</div><h1>OSCE 情境模擬</h1>
  <p class="sub">與病人對話問診、碰觸身體部位做檢查，最後在腦中選擇思考方向並提出鑑別診斷。每次病例隨機產生。</p></header>
  <div class="tlist">${GAMES.map(id=>{const t=INDEX.find(x=>x.id===id),r=store.get('game:'+id,null);return `<button type="button" class="tcard" data-g="${id}"><div class="tt">${t.title}</div><div class="td">問診 → 身體檢查 → 分析</div>${r?`<div class="tn">已練習 ${r.n} 次・最近 ${r.last} 分・最佳 ${r.best} 分</div>`:''}</button>`}).join('')}</div>`;
  document.getElementById('back').onclick=()=>{location.hash='#/'};
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{location.hash='#/game/'+b.dataset.g});
}

function game(T,meta,G){
  document.title='互動情境｜'+meta.title;
  const S=T.steps,N=T.dx.length,$=id=>document.getElementById(id);
  const truth=pick1(T.dx),val={};
  S.forEach(s=>{const m=truth.match[s.dim]||[];val[s.dim]=pick1(m.length?m:s.options)});
  const auto=['age','sex'].filter(d=>S.some(s=>s.dim===d)),askDims=G.q.map(q=>q.dim);
  const spec=Object.fromEntries(askDims.map(d=>[d,1-T.dx.filter(x=>(x.match[d]||[]).includes(val[d])).length/N]));
  const fnd=it=>{const k=Object.keys(it.over).find(k=>truth.name.includes(k));return k?it.over[k]:null};
  const pool=shuf([...G.q.map(q=>({k:'q',dim:q.dim,ask:q.ask})),...G.gen.map((g,i)=>({k:'g',i,ask:g.ask}))]);
  const hist=[],done=[],R={main:null,more:new Set(),dx:new Set(),plan:new Set()};
  const old=/>65|>50/.test(val.age||''),fem=val.sex==='女',av=old?(fem?'👵':'👴'):(fem?'👩':'👨');
  const who=[val.sex?(fem?'女性':'男性'):'',val.age||''].filter(Boolean).join('，');
  const locLabel=id=>(T.localize.options.find(o=>o.id===id)||{}).label||'未選擇';
  app.innerHTML=`<button class="back" id="back">← 離開情境</button><header><div class="eyebrow">OSCE 情境　·　${meta.title}</div><h1>病人：${who||'成人'}</h1></header><div class="gm-top"><span id="ph"></span><span id="qt"></span></div><div id="stage"></div>`;
  $('back').onclick=()=>{location.hash='#/game'};

  function p1(){
    $('ph').textContent='① 問診';
    $('stage').innerHTML=`<div class="gm-stage"><div class="gm-who"><div class="bub doc" id="dbub">請說，哪裡不舒服？</div><div class="gm-av">🧑‍⚕️</div><div class="gm-name">你（檢查者）</div></div>
     <div class="gm-who"><div class="bub" id="pbub"></div><div class="gm-av">${av}</div><div class="gm-name">病人</div></div></div>
     <div class="choices" id="ch"></div><div class="logbox" id="hlog"></div><div class="endnav"><button type="button" class="cbtn rand" id="n1">結束問診，進入身體檢查 →</button></div>`;
    say($('pbub'),G.cc);$('n1').onclick=p2;choices();
  }
  function choices(){
    const left=G.qcap-hist.length;$('qt').textContent=`還可提問 ${Math.max(left,0)} 題`;
    $('ch').innerHTML=pool.map((c,i)=>`<button type="button" class="choice" data-i="${i}" ${hist.includes(c)||left<=0?'disabled':''}>🗨 ${c.ask}</button>`).join('');
    $('ch').querySelectorAll('.choice').forEach(b=>b.onclick=()=>{
      const c=pool[+b.dataset.i];if(hist.length>=G.qcap||hist.includes(c))return;hist.push(c);
      const rep=c.k==='q'?(G.q.find(q=>q.dim===c.dim).lay[val[c.dim]]||val[c.dim]):G.gen[c.i].reply;
      $('dbub').textContent=c.ask;say($('pbub'),rep);c.rep=rep;
      $('hlog').innerHTML=hist.map(h=>`<div class="logrow"><b>你：</b>${h.ask}<br><b>病人：</b>${h.rep}</div>`).join('');choices()});
  }
  function p2(){
    $('ph').textContent='② 身體檢查';
    const regs=[...new Set(G.exam.map(e=>e.region))];
    $('stage').innerHTML=`<p class="sub" style="text-align:center">點選發光的身體部位，再選擇要做的檢查。</p><div class="body" id="body">${bodySVG()}${regs.map(r=>`<button type="button" class="spot" data-r="${r}" style="${pos(REGION[r][1],REGION[r][2])}">${REGION[r][0]}</button>`).join('')}</div>
     <div class="logbox" id="pop"></div><div class="logbox" id="elog"></div><div class="endnav"><button type="button" class="cbtn rand" id="n2">完成檢查，進入分析 →</button></div>`;
    const upd=()=>{$('qt').textContent=`還可檢查 ${G.ecap-done.length} 項`;$('elog').innerHTML=done.map(id=>{const it=G.exam.find(e=>e.id===id);return `<div class="logrow pop"><b>${it.label}</b><br>${fnd(it)||it.normal}</div>`}).join('')};
    document.querySelectorAll('.spot').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('.spot').forEach(x=>x.classList.toggle('on',x===b));
      $('pop').innerHTML=G.exam.filter(e=>e.region===b.dataset.r).map(e=>`<button type="button" class="choice" data-e="${e.id}" ${done.includes(e.id)||done.length>=G.ecap?'disabled':''}>🩺 ${e.label}</button>`).join('');
      $('pop').querySelectorAll('.choice').forEach(c=>c.onclick=()=>{if(done.length>=G.ecap||done.includes(c.dataset.e))return;done.push(c.dataset.e);$('pop').innerHTML='';upd()})});
    $('n2').onclick=p3;upd();window.scrollTo(0,0);
  }
  function p3(){
    $('ph').textContent='③ 腦中分析';$('qt').textContent='';
    const sum=[...hist.map(h=>`<div class="logrow"><b>${h.ask}</b><br>${h.rep}</div>`),...done.map(id=>{const it=G.exam.find(e=>e.id===id);return `<div class="logrow"><b>${it.label}</b><br>${fnd(it)||it.normal}</div>`})].join('');
    const rk=Object.keys(G.routes);
    $('stage').innerHTML=`<details class="fgd" open><summary>📋 目前蒐集到的資訊</summary><div class="logbox">${sum||'<div class="sub">尚未蒐集任何資訊。</div>'}</div></details>
     <p class="sub" style="text-align:center;margin-top:10px">點選身體部位，表示你的思考方向：<b>第一個點選為主要方向 ★</b>，其餘為次要考慮；再點一次取消。</p>
     <div class="body" id="body">${bodySVG()}${rk.map(k=>`<button type="button" class="anchor" data-k="${k}" style="${pos(G.routes[k].x,G.routes[k].y)}">${G.routes[k].icon}</button>`).join('')}<div id="bubs"></div></div>
     <div class="logbox" id="rp"></div>
     <div class="step" style="margin-top:12px"><div class="step-head"><div class="step-num">★</div><div class="step-title">下一步計畫（最多 5 項）</div></div><div class="opts" id="plans">${PLAN.map(p=>`<button type="button" class="opt" data-p="${p[0]}">${p[1]}</button>`).join('')}</div></div>
     <div class="endnav"><button type="button" class="cbtn rand" id="sub">送出分析</button></div><div class="msg" id="msg"></div>`;
    const active=()=>[...(R.main?[R.main]:[]),...R.more];
    const draw=()=>{
      document.querySelectorAll('.anchor').forEach(a=>{a.classList.toggle('main',a.dataset.k===R.main);a.classList.toggle('on',R.more.has(a.dataset.k))});
      $('bubs').innerHTML=active().map(k=>{const r=G.routes[k],ds=[...R.dx].map(i=>T.dx[i]).filter(d=>d.loc===k);
        return `<div class="tbub ${r.dir||'r'}${k===R.main?' main':''}" style="${pos(r.x,r.y)}"><b>${k===R.main?'★ ':''}${r.short}</b>${ds.map(d=>`<div>• ${d.name.split('（')[0]}</div>`).join('')}</div>`}).join('');
      $('rp').innerHTML=active().map(k=>`<div class="gname">${G.routes[k].icon} ${G.routes[k].short}：選擇可能的診斷（共最多 5 項，目前 ${R.dx.size}）</div><div class="opts">${T.dx.map((d,i)=>[d,i]).filter(([d])=>d.loc===k).map(([d,i])=>`<button type="button" class="opt${R.dx.has(i)?' sel':''}" data-i="${i}">${d.name}</button>`).join('')}</div>`).join('')||'<div class="sub" style="text-align:center">尚未選擇思考方向。</div>';
      $('rp').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(R.dx.has(i))R.dx.delete(i);else if(R.dx.size<5)R.dx.add(i);else return;draw()});
    };
    document.querySelectorAll('.anchor').forEach(a=>a.onclick=()=>{const k=a.dataset.k;
      if(R.main===k){R.main=null;[...R.dx].forEach(i=>{if(T.dx[i].loc===k)R.dx.delete(i)})}
      else if(R.more.has(k)){R.more.delete(k);[...R.dx].forEach(i=>{if(T.dx[i].loc===k)R.dx.delete(i)})}
      else if(!R.main)R.main=k;else R.more.add(k);draw()});
    document.querySelectorAll('#plans .opt').forEach(b=>b.onclick=()=>{const k=b.dataset.p;if(R.plan.has(k))R.plan.delete(k);else if(R.plan.size<5)R.plan.add(k);else return;b.classList.toggle('sel',R.plan.has(k))});
    $('sub').onclick=()=>{if(!R.main){$('msg').textContent='請先點選一個主要思考方向。';return}if(R.dx.size<3){$('msg').textContent='鑑別診斷至少需要 3 項。';return}result()};
    draw();window.scrollTo(0,0);
  }
  function result(){
    const w=x=>S.find(s=>s.dim===x).w||1,rev=[...auto,...hist.filter(h=>h.k==='q').map(h=>h.dim)];
    const sc=d=>rev.reduce((a,x)=>a+((d.match[x]||[]).includes(val[x])?w(x):0),0);
    const rs=T.dx.map(d=>({d,s:sc(d)})).sort((a,b)=>b.s-a.s),thr=rs[Math.min(5,rs.length-1)].s,plaus=new Set(rs.filter(x=>x.s>=thr&&x.s>0).map(x=>x.d));
    const keyH=[...askDims].sort((a,b)=>spec[b]-spec[a]).slice(0,G.qcap),askedQ=hist.filter(h=>h.k==='q').map(h=>h.dim);
    const pH=Math.round(20*Math.min(1,askedQ.reduce((a,d)=>a+spec[d],0)/(keyH.reduce((a,d)=>a+spec[d],0)||1)));
    const keyE=G.exam.filter(e=>fnd(e)),hitE=keyE.filter(e=>done.includes(e.id));
    const pE=keyE.length?Math.round(20*Math.min(1,hitE.length/Math.min(keyE.length,G.ecap))):(done.length>=2?20:10);
    const pR=R.main===truth.loc?15:(R.more.has(truth.loc)?7:0);
    const ch=[...R.dx].map(i=>T.dx[i]),oth=ch.filter(d=>d!==truth),cat=d=>d===truth?'✓':(plaus.has(d)||d.loc===truth.loc)?'○':'✗';
    const pD=Math.min(30,(ch.includes(truth)?20:0)+(oth.length?Math.round(10*oth.filter(d=>cat(d)!=='✗').length/oth.length):0));
    const has=k=>R.plan.has(k),pn=[];let pp=0;
    if(truth.red){if(has('urgent'))pp+=10;else pn.push('此診斷屬危及生命或需緊急處置者，應先「立即啟動急診處置」。');if(has('image'))pp+=5;else pn.push('應盡速安排影像或血管檢查。');if(has('consult')||has('lab'))pp+=5;else pn.push('應同時通知專科並完成基本檢驗。');if(has('home')||has('follow')){pp=Math.max(0,pp-5);pn.push('選擇返家或門診追蹤屬低估風險。')}}
    else{if(has('complete'))pp+=6;else pn.push('尚未補完關鍵病史與檢查，確診前不宜直接結案。');if(has('follow')||has('educ'))pp+=8;else pn.push('應安排追蹤，並衛教紅旗症狀與回診時機。');if(has('image')||has('lab')||has('consult'))pp+=6;else pn.push('可視需要安排檢查或會診以釐清診斷。');if(has('urgent')){pp=Math.max(0,pp-3);pn.push('此病例線索較不具緊急性，啟動急診處置屬過度升級。')}}
    const pP=R.plan.size?Math.round(Math.min(20,pp)*0.75):0,total=pH+pE+pR+pD+pP;
    const r=store.get('game:'+T.id,{n:0,best:0,last:0});store.set('game:'+T.id,{n:r.n+1,last:total,best:Math.max(r.best,total)});
    const li=a=>a.length?'<ul>'+a.map(x=>`<li>${x}</li>`).join('')+'</ul>':'',row=(t,s,m,b)=>`<div class="dxcard"><div class="dxname rs"><span>${t}</span><span>${s}／${m}</span></div>${b}</div>`;
    const missH=keyH.filter(d=>!askedQ.includes(d)).map(d=>`<span class="bad">漏問</span>「${S.find(s=>s.dim===d).title}」：本案答案是「${val[d]}」，只符合 ${T.dx.filter(x=>(x.match[d]||[]).includes(val[d])).length}／${N} 個診斷，是縮小範圍的關鍵。`);
    const hL=[`你問了：${hist.map(h=>h.ask.replace(/？.*/,'？')).join('、')||'（無）'}`,...missH,...(hist.some(h=>h.k==='g')?['一般性問題（家族史、旅遊、生活習慣）在次數有限時，優先順序應排在區辨力高的問題之後。']:[])];
    const eL=[keyE.length?`本案的關鍵檢查發現共 ${keyE.length} 項，你完成 ${hitE.length} 項。`:'本案的檢查多為正常，此時「排除危險診斷」本身就是重要的檢查目的。',...keyE.filter(e=>!done.includes(e.id)).map(e=>`<span class="bad">漏做</span>「${e.label}」：本案發現為「${fnd(e)}」`)];
    const rL=[`你的主要方向：${R.main?G.routes[R.main].short:'未選擇'}；正確方向：<b>${locLabel(truth.loc)}</b>。`];
    const dL=ch.map(d=>`${cat(d)} ${d.name}${d.red?'（紅旗）':''}`),dN=['✓ 正確診斷　○ 合理候選（依線索或同一方向）　✗ 與線索不符',`正確診斷：<b>${truth.name}</b>。確診尚需補足：${truth.missing}`];
    const sg=[];if(pH<14)sg.push(`問診效率：次數有限時，先問區辨力高的問題（本案依序為：${keyH.map(d=>S.find(s=>s.dim===d).title).join('、')}）。`);
    if(keyE.length&&hitE.length<Math.min(keyE.length,G.ecap))sg.push('身體檢查：先針對高風險或能區分中樞與周邊的檢查（例如眼震、甩頭試驗、頸部與神經學檢查），再做例行檢查。');
    if(pR===0)sg.push('思考方向：先判斷最可能的方向，再展開鑑別診斷，避免一開始就把範圍拉太寬。');if(!ch.includes(truth))sg.push('鑑別診斷要同時涵蓋「最可能」與「不能漏掉」（紅旗）兩類。');
    $('qt').textContent='';$('ph').textContent='結果';
    $('stage').innerHTML=`<div class="final"><h3>🎯 成績 ${total}／100　${total>=85?'表現優良':total>=70?'尚可，仍有進步空間':'需加強'}</h3><div class="clue">正確答案：<b>${truth.name}</b></div>
     <div class="dxlist">${row('問診',pH,20,li(hL))}${row('身體檢查',pE,20,li(eL))}${row('思考方向',pR,15,li(rL))}${row('鑑別診斷',pD,30,li(dL)+li(dN))}${row('下一步計畫',pP,15,li(pn.length?pn:['計畫與風險等級相符。']))}</div>
     ${sg.length?`<div class="teachnote"><b>改進建議</b>${li(sg)}</div>`:''}<div class="teachnote"><b>教學提醒：</b>${T.teachNote}</div>
     <div class="endnav"><button type="button" class="cbtn rand" id="again">🎲 再來一個病人</button><button type="button" class="cbtn" id="menu">← 回情境選單</button></div></div>`;
    $('again').onclick=()=>route();$('menu').onclick=()=>{location.hash='#/game'};window.scrollTo(0,0);
  }
  p1();
}
