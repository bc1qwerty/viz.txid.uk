'use strict';
const API = 'https://mempool.space/api';

(function() {
  const t = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-btn').textContent = t === 'dark' ? '🌙' : '☀️';
})();
function toggleTheme() {
  const h = document.documentElement;
  const next = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  h.setAttribute('data-theme', next); localStorage.setItem('theme', next);
  document.getElementById('theme-btn').textContent = next === 'dark' ? '🌙' : '☀️';
  if (window._currentTxid) renderGraph(window._currentData);
}

document.getElementById('tx-input').addEventListener('keydown', e => { if (e.key === 'Enter') loadViz(); });

async function loadViz() {
  const val = document.getElementById('tx-input').value.trim();
  if (!val) return;
  if (/^[0-9a-fA-F]{64}$/.test(val)) { await vizTx(val); }
  else if (/^(bc1|1|3)[a-zA-Z0-9]{25,62}$/.test(val)) { await vizAddress(val); }
  else { document.getElementById('viz-info').textContent = '유효한 TXID(64자 hex) 또는 비트코인 주소를 입력하세요.'; }
}

async function loadDemo() {
  document.getElementById('tx-input').value = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
  await vizTx('f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16');
}

function showLoading(v) {
  document.getElementById('viz-loading').style.display = v ? 'flex' : 'none';
}

async function vizTx(txid) {
  showLoading(true);
  document.getElementById('viz-info').textContent = '';
  try {
    const tx = await fetch(`${API}/tx/${txid}`).then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
    window._currentTxid = txid;
    window._currentData = { type: 'tx', tx };
    renderGraph({ type: 'tx', tx });
    const totalIn = tx.vin.reduce((s, v) => s + (v.prevout?.value || 0), 0);
    const totalOut = tx.vout.reduce((s, v) => s + (v.value || 0), 0);
    document.getElementById('viz-info').innerHTML =
      `<b style="color:var(--accent)">${txid.slice(0,16)}…</b> · ` +
      `입력 ${tx.vin.length}개 (${(totalIn/1e8).toFixed(4)} BTC) → ` +
      `출력 ${tx.vout.length}개 (${(totalOut/1e8).toFixed(4)} BTC) · ` +
      `수수료 ${tx.fee?.toLocaleString()} sat`;
  } catch (e) { document.getElementById('viz-info').textContent = '데이터 로드 실패: ' + e.message; }
  showLoading(false);
}

async function vizAddress(address) {
  showLoading(true);
  document.getElementById('viz-info').textContent = '';
  try {
    const txs = await fetch(`${API}/address/${address}/txs`).then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
    window._currentData = { type: 'address', address, txs: txs.slice(0, 10) };
    renderGraph(window._currentData);
    document.getElementById('viz-info').innerHTML =
      `<b style="color:var(--accent)">${address.slice(0,20)}…</b> · 최근 ${Math.min(txs.length,10)}개 TX 시각화`;
  } catch (e) { document.getElementById('viz-info').textContent = '데이터 로드 실패: ' + e.message; }
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
    nodes.push({ id: 'tx', label: tx.txid.slice(0,8)+'…', type: 'tx', value: tx.fee || 0 });
    // 입력 노드
    tx.vin.slice(0, 10).forEach((v, i) => {
      const addr = v.coinbase ? 'Coinbase' : (v.prevout?.scriptpubkey_address || `input-${i}`);
      const id = `in-${i}`;
      nodes.push({ id, label: addr === 'Coinbase' ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle"><path d="M15 4l5 5-11 11H4v-5L15 4z"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Coinbase' : addr.slice(0,10)+'…', type: 'input', value: v.prevout?.value || 0, addr });
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
    .call(d3.drag().on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag', (e, d) => { d.fx=e.x; d.fy=e.y; })
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
  node.on('mouseover', (e, d) => {
    const btc = d.value ? (d.value/1e8).toFixed(4) + ' BTC' : '';
    tooltip.innerHTML = `<b style="color:${colorMap[d.type]}">${d.type.toUpperCase()}</b><br>${d.addr || d.label}${btc ? '<br>' + btc : ''}`;
    tooltip.style.display = 'block';
  }).on('mousemove', e => {
    tooltip.style.left = (e.offsetX + 14) + 'px';
    tooltip.style.top = (e.offsetY - 10) + 'px';
  }).on('mouseout', () => { tooltip.style.display = 'none'; })
    .on('click', (e, d) => {
      if (d.addr && d.type !== 'tx') {
        // 주소 노드 → 주소 시각화로 전환
        document.getElementById('tx-input').value = d.addr;
        vizAddress(d.addr);
      } else if (d.type === 'tx') {
        // TX 노드 클릭
        const txid = d.txid || (d.id === 'tx' ? window._currentTxid : null);
        if (txid && /^[0-9a-fA-F]{64}$/.test(txid)) {
          document.getElementById('tx-input').value = txid;
          vizTx(txid);
        }
      }
    });

  simulation.on('tick', () => {
    link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y).attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    node.attr('transform', d=>`translate(${d.x},${d.y})`);
  });

  document.getElementById('viz-legend').style.display = 'flex';
}

// URL 파라미터 자동 실행
(function(){
  const p = new URLSearchParams(location.search);
  const tx = p.get('tx'), addr = p.get('addr');
  if (tx) { document.getElementById('search-input').value = tx; vizTx(tx); }
  else if (addr) { document.getElementById('search-input').value = addr; vizAddr(addr); }
})();
