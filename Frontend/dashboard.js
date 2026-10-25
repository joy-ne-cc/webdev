(() => {
  const API_BASE = window.WINA_API_BASE || 'http://127.0.0.1:5000/api';
  const TAX_RATE = 0.10;
  const $ = id => document.getElementById(id);
  const money = value => `K${Number(value || 0).toLocaleString('en-ZM', {maximumFractionDigits:0})}`;
  const money2 = value => `K${Number(value || 0).toLocaleString('en-ZM', {minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const safePercent = (value, max) => max > 0 ? Math.max(0, Math.min(100, Math.round(value / max * 100))) : 0;

  async function getJson(path) {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) throw new Error(`API request failed: ${path}`);
    return response.json();
  }
  function addCell(row, text, className) {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (className) cell.className = className;
    row.appendChild(cell);
    return cell;
  }
  function renderServiceLimits(services) {
    const body = $('service-limits-body'); body.replaceChildren();
    $('service-count').textContent = `${services.length} SERVICES`;
    services.forEach(item => {
      const limit = Number(item.monthly_limit ?? item.monthLimit ?? 0);
      const used = Number(item.cumulative_total ?? item.cumulativeTotal ?? 0);
      const remaining = Number(item.amount_remaining ?? (limit - used));
      const pct = safePercent(used, limit);
      const row = document.createElement('tr');
      addCell(row, item.service ?? item.name);
      addCell(row, money(limit)); addCell(row, money(used));
      addCell(row, money(remaining), pct >= 85 ? 'value-warning' : '');
      const progressCell = row.insertCell();
      const track = document.createElement('span'); track.className = 'data-bar-track'; track.setAttribute('role','progressbar');
      track.setAttribute('aria-valuenow',pct); track.setAttribute('aria-valuemin','0'); track.setAttribute('aria-valuemax','100');
      track.setAttribute('aria-label',`${item.service ?? item.name} limit used`);
      const fill = document.createElement('span'); fill.className = `data-bar-fill${pct >= 85 ? ' data-bar-fill--warning' : ''}`; fill.style.width = `${pct}%`; track.appendChild(fill); progressCell.appendChild(track);
      const label = document.createElement('span'); label.className = 'data-bar-label'; label.textContent = `${pct}%`; progressCell.appendChild(label);
      body.appendChild(row);
    });
    if (!services.length) body.innerHTML = '<tr><td colspan="5" class="table-loading">No service records available.</td></tr>';
  }
  function renderBooths(booths) {
    const container = $('booth-performance'); container.replaceChildren();
    [...booths].sort((a,b) => Number(b.cumulative_revenue ?? b.cumulativeRevenue ?? 0) - Number(a.cumulative_revenue ?? a.cumulativeRevenue ?? 0)).forEach((item,index) => {
      const row = document.createElement('div'); row.className = 'booth-row';
      const rank = document.createElement('span'); rank.className = 'booth-rank'; rank.textContent = String(index+1).padStart(2,'0');
      const meta = document.createElement('div'); meta.className = 'booth-meta';
      const name = document.createElement('strong'); name.textContent = item.booth ?? item.code;
      const loc = document.createElement('small'); loc.textContent = item.location || 'Booth location'; meta.append(name,loc);
      const revenue = document.createElement('strong'); revenue.className = 'booth-revenue'; revenue.textContent = money(item.cumulative_revenue ?? item.cumulativeRevenue);
      row.append(rank,meta,revenue); container.appendChild(row);
    });
    if (!booths.length) container.textContent = 'No booth activity available.';
  }
  function renderFrequency(transactions, booths, services) {
    const table = $('frequency-table'); table.replaceChildren();
    const head = document.createElement('thead'), hr = document.createElement('tr');
    const boothHead = document.createElement('th'); boothHead.textContent = 'Booth'; hr.appendChild(boothHead);
    services.forEach(s => { const th = document.createElement('th'); th.textContent = s; hr.appendChild(th); }); head.appendChild(hr); table.appendChild(head);
    const counts = {};
    transactions.forEach(t => { const b=t.booth ?? t.code, s=t.service; if(!b||!s)return; counts[b] ||= {}; counts[b][s]=(counts[b][s]||0)+1; });
    const body = document.createElement('tbody');
    booths.forEach(booth => {
      const row = document.createElement('tr'); addCell(row,booth);
      services.forEach(service => { const count=(counts[booth]||{})[service]||0; const cell=addCell(row,String(count),count?'frequency-cell':''); if(count){const intensity=Math.min(.7,.12+count/45);cell.style.backgroundColor=`rgba(22,123,91,${intensity})`;cell.style.color=intensity>.38?'#fff':'#235d46';} });
      body.appendChild(row);
    });
    table.appendChild(body);
  }
  function renderTax(services) {
    const container=$('tax-obligations'); container.replaceChildren();
    services.forEach(item => {
      const name=item.service ?? item.name, used=Number(item.cumulative_total ?? item.cumulativeTotal ?? 0), tax=used*TAX_RATE;
      const row=document.createElement('div');row.className='tax-row';
      const label=document.createElement('div');label.className='tax-row-label';label.textContent=name;
      const track=document.createElement('div');track.className='tax-track';const fill=document.createElement('div');fill.className='tax-fill';fill.style.width=`${TAX_RATE*100}%`;track.appendChild(fill);
      const value=document.createElement('div');value.className='tax-row-value';value.textContent=money2(tax);row.append(label,track,value);container.appendChild(row);
    });
  }
  function renderRecent(transactions, demo = false) {
    const body = $('recent-transactions-body');
    body.replaceChildren();
    if (demo) {
      const row = document.createElement('tr');
      addCell(row, 'Recent transaction details are not included in the demo summary.', 'table-loading');
      row.firstChild.colSpan = 6;
      body.appendChild(row);
      return;
    }
    const recent = [...transactions].sort((a, b) => {
      const aDate = Date.parse(a.created_at || ''), bDate = Date.parse(b.created_at || '');
      if (Number.isFinite(aDate) && Number.isFinite(bDate) && aDate !== bDate) return bDate - aDate;
      return String(b.id || '').localeCompare(String(a.id || ''), undefined, {numeric:true});
    }).slice(0, 8);
    recent.forEach(item => {
      const row = document.createElement('tr');
      addCell(row, item.id || '—', 'transaction-id');
      addCell(row, `${item.booth || '—'}${item.location ? ` · ${item.location}` : ''}`);
      addCell(row, item.service || '—');
      addCell(row, money2(item.amount));
      addCell(row, money2(item.tax_amount));
      addCell(row, money2(item.amount_after_tax), 'amount-net');
      body.appendChild(row);
    });
    if (!recent.length) {
      const row = document.createElement('tr');
      addCell(row, 'No transactions have been recorded yet.', 'table-loading');
      row.firstChild.colSpan = 6;
      body.appendChild(row);
    }
  }
  function renderPie(revenue,capital) {
    const total=Math.max(0,revenue)+Math.max(0,capital);const pct=total?Math.round(revenue/total*100):0;
    $('summary-pie').style.background=`conic-gradient(var(--green) 0deg ${pct*3.6}deg,#dce6e0 ${pct*3.6}deg 360deg)`;
    $('revenue-share').textContent=`${pct}%`;
    const legend=$('pie-legend');legend.replaceChildren();
    [["Revenue generated",revenue,'legend-swatch--revenue'],["Total capital",capital,'legend-swatch--capital']].forEach(([label,value,cls])=>{
      const row=document.createElement('div');row.className='legend-item';const swatch=document.createElement('span');swatch.className=`legend-swatch ${cls}`;const name=document.createElement('span');name.textContent=label;const amount=document.createElement('strong');amount.textContent=money(value);row.append(swatch,name,amount);legend.appendChild(row);
    });
  }
  function renderSummary(revenue,capital,transactionCount){$('total-revenue').textContent=money(revenue);$('total-capital').textContent=money(capital);$('total-transactions').textContent=Number(transactionCount).toLocaleString('en-ZM');}
  async function initDashboard(){
    try {
      const [totals,serviceSummary,boothRevenue,transactions,boothsResponse,servicesResponse] = await Promise.all([
        getJson('/dashboard/totals'),getJson('/dashboard/service-summary'),getJson('/dashboard/booth-revenue'),getJson('/transactions'),getJson('/booths'),getJson('/services')
      ]);
      const services=serviceSummary.map(item=>({...item,service:item.service}));
      const booths=boothRevenue.map(item=>({...item,booth:item.booth,location:(boothsResponse.find(b=>b.name===item.booth)||{}).location||''}));
      const boothNames=boothsResponse.map(b=>b.name); const serviceNames=servicesResponse.map(s=>s.name);
      renderSummary(totals.total_revenue,totals.total_capital,transactions.length);
      renderServiceLimits(services);renderBooths(booths);renderFrequency(transactions,boothNames,serviceNames);renderRecent(transactions);renderTax(services);renderPie(totals.total_revenue,totals.total_capital);
    } catch (error) {
      const data=window.dashboardData;
      if (!data) { $('dashboardMessage').className='alert alert-danger';$('dashboardMessage').textContent='Dashboard data could not be loaded. Start the Flask backend and refresh this page.';return; }
      $('dashboardMessage').className='alert alert-info';$('dashboardMessage').textContent='Showing illustrative demo figures because the Flask API is unavailable. Start the backend to view live database totals.';
      const services=data.services.map(s=>({service:s.name,monthly_limit:s.monthLimit,cumulative_total:s.cumulativeTotal,amount_remaining:s.monthLimit-s.cumulativeTotal}));
      const booths=data.booths.map(b=>({booth:b.code,location:b.location,cumulative_revenue:b.cumulativeRevenue}));
      const transactions=[];data.frequency.booths.forEach((booth,i)=>data.frequency.services.forEach((service,j)=>{for(let n=0;n<(data.frequency.counts[i][j]||0);n++)transactions.push({booth,service});}));
      renderSummary(data.summary.totalRevenue,data.summary.totalCapital,transactions.length);renderServiceLimits(services);renderBooths(booths);renderFrequency(transactions,data.frequency.booths,data.frequency.services);renderRecent([],true);renderTax(services);renderPie(data.summary.totalRevenue,data.summary.totalCapital);
    }
  }
  document.addEventListener('DOMContentLoaded',initDashboard);
})();
