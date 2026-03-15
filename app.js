function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
async function fetchRetry(url,timeout,retries){for(let i=0,m=retries||2;i<=m;i++){try{return await fetch(url,{signal:AbortSignal.timeout(timeout||10000)});}catch(e){if(i>=m)throw e;await new Promise(r=>setTimeout(r,1000<<i));}}}
'use strict';

// ── 언어 ──
let lang = localStorage.getItem('lang') || 'ko';
const LABELS = {
  ko: {탐색기:'탐색기', 도구:'도구', 시각화:'시각화', 통계:'통계', 노드:'노드', 지도:'지도', 포트폴리오:'포트폴리오', 전송:'전송', 배우기:'배우기', 앱모음:'앱모음'},
  en: {탐색기:'Explorer', 도구:'Tools', 시각화:'Viz', 통계:'Stats', 노드:'Nodes', 지도:'Map', 포트폴리오:'Portfolio', 전송:'TX', 배우기:'Learn', 앱모음:'Apps'},
  ja: {탐색기:'探索', 도구:'ツール', 시각화:'可視化', 통계:'統計', 노드:'ノード', 지도:'地図', 포트폴리오:'資産', 전송:'送金', 배우기:'学習', 앱모음:'アプリ'},
};
function setLang(l){
  lang=l; localStorage.setItem('lang',lang); document.documentElement.lang=lang;
  const btn=document.getElementById('lang-btn');
  if(btn) btn.textContent={ko:'KO',en:'EN',ja:'JA'}[lang]||'KO';
  document.getElementById('lang-menu')?.classList.remove('open');
  document.querySelectorAll('[data-ko]').forEach(el=>{
    const val=el.dataset[lang]||el.dataset.en||el.dataset.ko;
    if(val){
      if(el.placeholder!==undefined) el.placeholder=val;
      else el.textContent=val;
    }
  });
}
function toggleLang(){const m=document.getElementById('lang-menu');m?.classList.toggle('open');document.getElementById('lang-btn')?.setAttribute('aria-expanded',m?.classList.contains('open')||false);}
document.addEventListener('click',e=>{const m=document.getElementById('lang-menu');if(m&&!e.target.closest('.lang-dropdown')){m.classList.remove('open');document.getElementById('lang-btn')?.setAttribute('aria-expanded','false');}});
(function(){setLang(lang);})();

const T = {
  invalidInput: { ko:'유효한 TXID(64자 hex) 또는 비트코인 주소를 입력하세요.', en:'Enter a valid TXID (64-char hex) or Bitcoin address.', ja:'有効なTXID（64文字hex）またはビットコインアドレスを入力してください。' },
  dataLoadFailed: { ko:'데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.', en:'Failed to load data. Please try again later.', ja:'データを読み込めませんでした。しばらくしてから再試行してください。' },
  inputs: { ko:'입력', en:'Inputs', ja:'入力' },
  outputs: { ko:'출력', en:'Outputs', ja:'出力' },
  fee: { ko:'수수료', en:'Fee', ja:'手数料' },
  recent: { ko:'최근', en:'Recent', ja:'最新' },
  txViz: { ko:'개 TX 시각화', en:' TX visualized', ja:'件 TX 可視化' },
  lightMode: { ko:'라이트 모드로 전환', en:'Switch to light mode', ja:'ライトモードに切替' },
  darkMode: { ko:'다크 모드로 전환', en:'Switch to dark mode', ja:'ダークモードに切替' },
};
function t(key){ return (T[key]&&T[key][lang]) || (T[key]&&T[key].en) || key; }

const API = 'https://mempool.space/api';

(function() {
  const th = localStorage.getItem('theme') || 'dark';
  const isDark = th !== 'light';
  document.documentElement.setAttribute('data-theme', th);
  document.getElementById('theme-btn').innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';document.getElementById('theme-btn').title=isDark?t('lightMode'):t('darkMode');
})();
function updateThemeBtn(){
  const btn=document.getElementById('theme-btn');if(!btn)return;
  const isDark=document.documentElement.getAttribute('data-theme')!=='light';
  btn.innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.title=isDark?t('lightMode'):t('darkMode');
}
function toggleTheme() {
  const h = document.documentElement;
  const next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  h.setAttribute('data-theme', next); localStorage.setItem('theme', next);
  updateThemeBtn();
  if (window._currentTxid) renderGraph(window._currentData);
}

document.getElementById('tx-input').addEventListener('keydown', e => { if (e.key === 'Enter') loadViz(); });

async function loadViz() {
  const val = document.getElementById('tx-input').value.trim();
  if (!val) return;
  if (/^[0-9a-fA-F]{64}$/.test(val)) { await vizTx(val); }
  else if (/^(bc1|1|3)[a-zA-Z0-9]{25,62}$/.test(val)) { await vizAddress(val); }
  else { document.getElementById('viz-info').textContent = t('invalidInput'); }
}

async function loadDemo() {
  document.getElementById('tx-input').value = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
  await vizTx('f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16');
}

function showLoading(v) {
  const el = document.getElementById('viz-loading');
  if (v) el.classList.remove('hidden'); else el.classList.add('hidden');
}

async function vizTx(txid) {
  showLoading(true);
  document.getElementById('viz-info').textContent = '';
  try {
    const tx = await fetchRetry(`${API}/tx/${txid}`,10000).then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
    window._currentTxid = txid;
    window._currentData = { type: 'tx', tx };
    renderGraph({ type: 'tx', tx });
    const totalIn = tx.vin.reduce((s, v) => s + (v.prevout?.value || 0), 0);
    const totalOut = tx.vout.reduce((s, v) => s + (v.value || 0), 0);
    document.getElementById('viz-info').innerHTML =
      `<b class="viz-info-accent">${txid.slice(0,16)}…</b> · ` +
      `${t('inputs')} ${tx.vin.length} (${(totalIn/1e8).toFixed(4)} BTC) → ` +
      `${t('outputs')} ${tx.vout.length} (${(totalOut/1e8).toFixed(4)} BTC) · ` +
      `${t('fee')} ${tx.fee?.toLocaleString()} sat`;
  } catch (e) { console.error('vizTx error:', e); document.getElementById('viz-info').textContent = t('dataLoadFailed'); }
  showLoading(false);
}

async function vizAddress(address) {
  showLoading(true);
  document.getElementById('viz-info').textContent = '';
  try {
    const txs = await fetchRetry(`${API}/address/${address}/txs`,10000).then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
    window._currentData = { type: 'address', address, txs: txs.slice(0, 10) };
    renderGraph(window._currentData);
    document.getElementById('viz-info').innerHTML =
      `<b class="viz-info-accent">${address.slice(0,20)}…</b> · ${t('recent')} ${Math.min(txs.length,10)}${t('txViz')}`;
  } catch (e) { console.error('vizAddress error:', e); document.getElementById('viz-info').textContent = t('dataLoadFailed'); }
  showLoading(false);
}

function renderGraph(data) {
  const svg = d3.select('#viz-svg');
  svg.selectAll('*').remove();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const W = document.getElementById('viz-container').clientWidth;
  const H = document.getElementById('viz-container').clientHeight;

  const nodes = [], links = [];

  if (data.type === 'tx') {
    const { tx } = data;
    // 중심 TX 노드
    nodes.push({ id: 'tx', label: tx.txid.slice(0,8)+'…', type: 'tx', value: tx.fee || 0, txid: tx.txid });
    // 입력 노드
    tx.vin.slice(0, 10).forEach((v, i) => {
      const addr = v.coinbase ? 'Coinbase' : (v.prevout?.scriptpubkey_address || `input-${i}`);
      const id = `in-${i}`;
      nodes.push({ id, label: addr === 'Coinbase' ? 'Coinbase' : addr.slice(0,10)+'…', type: 'input', value: v.prevout?.value || 0, addr });
      links.push({ source: id, target: 'tx', value: v.prevout?.value || 0 });
    });
    // 출력 노드
    tx.vout.slice(0, 10).forEach((v, i) => {
      const addr = v.scriptpubkey_address || `out-${i}`;
      const id = `out-${i}`;
      nodes.push({ id, label: addr.slice(0,10)+'…', type: 'output', value: v.value || 0, addr });
      links.push({ source: 'tx', target: id, value: v.value || 0 });
    });
  } else if (data.type === 'address') {
    const { address, txs } = data;
    nodes.push({ id: 'addr', label: address.slice(0,10)+'…', type: 'address', value: 0 });
    txs.forEach((tx, i) => {
      const id = `tx-${i}`;
      nodes.push({ id, label: tx.txid.slice(0,8)+'…', type: 'tx', value: tx.fee || 0, txid: tx.txid });
      links.push({ source: 'addr', target: id, value: tx.fee || 0 });
    });
  }

  const colorMap = { tx: '#58a6ff', input: '#f7931a', output: '#3fb950', address: '#a371f7' };

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(120).strength(0.8))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide().radius(40));

  const g = svg.append('g');

  // 줌
  svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform)));

  // 화살표
  svg.append('defs').selectAll('marker').data(['arrow']).join('marker')
    .attr('id', 'arrow').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', isDark ? '#444c56' : '#b8c0cc');

  // 링크
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', isDark ? '#30363d' : '#d0d7de')
    .attr('stroke-width', d => Math.max(1, Math.log10((d.value||1)/1e6) + 2))
    .attr('marker-end', 'url(#arrow)');

  // 노드
  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; d._dragged=false; })
      .on('drag', (e, d) => { d.fx=e.x; d.fy=e.y; d._dragged=true; })
      .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx=null; d.fy=null; }));

  node.append('circle')
    .attr('r', d => d.type === 'tx' ? 16 : 12)
    .attr('fill', d => colorMap[d.type] || '#8b949e')
    .attr('fill-opacity', 0.85)
    .attr('stroke', isDark ? '#0d1117' : '#fff')
    .attr('stroke-width', 2);

  node.append('text')
    .attr('text-anchor', 'middle').attr('dy', '0.35em')
    .attr('font-family', "'Space Mono', monospace").attr('font-size', '6px')
    .attr('fill', '#fff').attr('pointer-events', 'none')
    .text(d => d.type === 'tx' ? 'TX' : d.type === 'input' ? 'IN' : d.type === 'output' ? 'OUT' : '⬟');

  node.append('text')
    .attr('text-anchor', 'middle').attr('dy', 26)
    .attr('font-family', "'Space Mono', monospace").attr('font-size', '8px')
    .attr('fill', isDark ? '#8b949e' : '#656d76').attr('pointer-events', 'none')
    .text(d => d.label);

  // 툴팁
  const tooltip = document.getElementById('tooltip');
  const typeClassMap = { tx:'tooltip-type-tx', input:'tooltip-type-input', output:'tooltip-type-output', address:'tooltip-type-address' };
  node.on('mouseover', (e, d) => {
    const btc = d.value ? (d.value/1e8).toFixed(4) + ' BTC' : '';
    const cls = typeClassMap[d.type] || '';
    tooltip.innerHTML = `<b class="tooltip-type ${cls}">${escHtml(d.type.toUpperCase())}</b><br>${escHtml(d.addr || d.label)}${btc ? '<br>' + btc : ''}`;
    tooltip.classList.add('tooltip-visible');
  }).on('mousemove', e => {
    tooltip.style.setProperty('--tx', (e.offsetX + 14) + 'px');
    tooltip.style.setProperty('--ty', (e.offsetY - 10) + 'px');
  }).on('mouseout', () => { tooltip.classList.remove('tooltip-visible'); })
    .on('click', (e, d) => {
      if (d._dragged) return; // 드래그 후 click 무시
      if (d.type === 'tx') {
        const txid = d.txid || (d.id === 'tx' ? window._currentTxid : null);
        if (!txid || !/^[0-9a-fA-F]{64}$/.test(txid)) return;
        if (txid === window._currentTxid && data.type === 'tx') {
          // 현재 TX면 탐색기로 열기
          window.open(`https://txid.uk/#/tx/${txid}`, '_blank');
        } else {
          document.getElementById('tx-input').value = txid;
          vizTx(txid);
        }
      } else if (d.addr && /^(bc1|1|3)[a-zA-Z0-9]{25,62}$/.test(d.addr)) {
        document.getElementById('tx-input').value = d.addr;
        vizAddress(d.addr);
      }
    });

  simulation.on('tick', () => {
    link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y).attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    node.attr('transform', d=>`translate(${d.x},${d.y})`);
  });

  document.getElementById('viz-legend').classList.remove('hidden');
}

// URL 파라미터 자동 실행
(function(){
  const p = new URLSearchParams(location.search);
  const tx = p.get('tx'), addr = p.get('addr');
  if (tx) { document.getElementById('search-input').value = tx; vizTx(tx); }
  else if (addr) { document.getElementById('search-input').value = addr; vizAddr(addr); }
})();

// ── 이벤트 리스너 바인딩 ──
document.getElementById('lang-btn').addEventListener('click', toggleLang);
document.querySelectorAll('#lang-menu button').forEach(function(btn) {
  var lang = btn.textContent === '한국어' ? 'ko' : btn.textContent === 'English' ? 'en' : 'ja';
  btn.addEventListener('click', function() { setLang(lang); });
});
document.getElementById('theme-btn').addEventListener('click', toggleTheme);
document.getElementById('viz-btn').addEventListener('click', loadViz);
document.getElementById('demo-btn').addEventListener('click', loadDemo);

// ── 모바일 햄버거 메뉴 ──
document.getElementById('hamburger-btn')?.addEventListener('click', function() {
  var panel = document.getElementById('hamburger-panel');
  if (!panel) return;
  var open = panel.classList.toggle('open');
  this.setAttribute('aria-expanded', open);
  if (open) updateHamburger();
});
document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.hamburger-wrap');
  var panel = document.getElementById('hamburger-panel');
  if (wrap && panel && !wrap.contains(e.target)) {
    panel.classList.remove('open');
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
  }
});
document.querySelectorAll('#hamburger-panel .settings-lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setLang(btn.dataset.lang);
    document.getElementById('hamburger-panel')?.classList.remove('open');
    document.getElementById('hamburger-btn')?.setAttribute('aria-expanded', 'false');
  });
});
document.getElementById('hamburger-theme-btn')?.addEventListener('click', function() {
  toggleTheme();
  updateHamburger();
});
function updateHamburger() {
  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  var icon = document.getElementById('hamburger-theme-icon');
  if (icon) icon.innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  document.querySelectorAll('#hamburger-panel .settings-lang-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}
