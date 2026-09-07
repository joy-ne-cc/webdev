/**
 * dashboard.js
 * -----------------------------------------------------------------------
 * Renders the dashboard from window.dashboardData (see mock-data.js).
 * Every function below reads the SAME data shape a real API response
 * would use, so swapping mock-data.js for a fetch() call requires no
 * changes here beyond how `data` is obtained.
 * -----------------------------------------------------------------------
 */

function formatKwacha(amount) {
  return "K" + Number(amount).toLocaleString("en-ZM", { maximumFractionDigits: 0 });
}

function renderSummary(data) {
  document.getElementById("total-revenue").textContent = formatKwacha(data.summary.totalRevenue);
  document.getElementById("total-capital").textContent = formatKwacha(data.summary.totalCapital);
}

function renderServiceLimits(data) {
  const tbody = document.getElementById("service-limits-body");
  tbody.innerHTML = "";

  data.services.forEach(service => {
    const remaining = service.monthLimit - service.cumulativeTotal;
    const percentUsed = Math.min(100, Math.round((service.cumulativeTotal / service.monthLimit) * 100));
    const isNearLimit = percentUsed >= 85;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${service.name}</td>
      <td>${formatKwacha(service.monthLimit)}</td>
      <td>${formatKwacha(service.cumulativeTotal)}</td>
      <td class="${isNearLimit ? "value-warning" : ""}">${formatKwacha(remaining)}</td>
      <td>
        <div class="data-bar-track" role="progressbar" aria-valuenow="${percentUsed}" aria-valuemin="0" aria-valuemax="100" aria-label="${service.name} limit used">
          <div class="data-bar-fill ${isNearLimit ? "data-bar-fill--warning" : ""}" style="width:${percentUsed}%"></div>
        </div>
        <span class="data-bar-label">${percentUsed}% used</span>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderBoothRevenue(data) {
  const tbody = document.getElementById("booth-revenue-body");
  tbody.innerHTML = "";

  const sorted = [...data.booths].sort((a, b) => b.cumulativeRevenue - a.cumulativeRevenue);

  sorted.forEach(booth => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${booth.code}</td>
      <td>${booth.location}</td>
      <td>${formatKwacha(booth.cumulativeRevenue)}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderFrequencyGrid(data) {
  const table = document.getElementById("frequency-table");
  const { booths, services, counts } = data.frequency;

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.innerHTML = "<th>Booth</th>" + services.map(s => `<th>${s}</th>`).join("");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  booths.forEach((booth, i) => {
    const row = document.createElement("tr");
    const cells = counts[i].map(count => {
      const intensity = Math.min(1, count / 40); // scale against a rough max for shading
      const bg = count === 0 ? "" : `style="background-color: rgba(31, 122, 92, ${0.12 + intensity * 0.55})"`;
      return `<td ${bg}>${count}</td>`;
    }).join("");
    row.innerHTML = `<td class="frequency-booth-label">${booth}</td>${cells}`;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
}

function renderTaxObligations(data) {
  const container = document.getElementById("tax-obligations");
  container.innerHTML = "";

  data.services.forEach(service => {
    const taxCollected = service.cumulativeTotal * data.taxRate;
    const percentOfRevenue = Math.round(data.taxRate * 100);

    const row = document.createElement("div");
    row.className = "tax-row";
    row.innerHTML = `
      <div class="tax-row-label">${service.name}</div>
      <div class="data-bar-track" role="progressbar" aria-valuenow="${percentOfRevenue}" aria-valuemin="0" aria-valuemax="100" aria-label="${service.name} tax obligation">
        <div class="data-bar-fill data-bar-fill--tax" style="width:${percentOfRevenue}%"></div>
      </div>
      <div class="tax-row-value">${formatKwacha(taxCollected)}</div>
    `;
    container.appendChild(row);
  });
}

function renderSummaryPie(data) {
  const { totalRevenue, totalCapital } = data.summary;
  const total = totalRevenue + totalCapital;
  const revenueDeg = (totalRevenue / total) * 360;

  const pie = document.getElementById("summary-pie");
  pie.style.background = `conic-gradient(
    var(--color-accent) 0deg ${revenueDeg}deg,
    var(--color-ink-soft) ${revenueDeg}deg 360deg
  )`;

  const revenuePct = Math.round((totalRevenue / total) * 100);
  document.getElementById("pie-legend").innerHTML = `
    <div class="legend-item"><span class="legend-swatch legend-swatch--revenue"></span>Total Revenue — ${revenuePct}%</div>
    <div class="legend-item"><span class="legend-swatch legend-swatch--capital"></span>Total Capital — ${100 - revenuePct}%</div>
  `;
}

function initDashboard() {
  const data = window.dashboardData;
  renderSummary(data);
  renderServiceLimits(data);
  renderBoothRevenue(data);
  renderFrequencyGrid(data);
  renderTaxObligations(data);
  renderSummaryPie(data);
}

document.addEventListener("DOMContentLoaded", initDashboard);
