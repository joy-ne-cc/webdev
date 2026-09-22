// REGRESSION TESTS- boot the real server and hit the HTTP API end-to-end using the
// full 308-transaction seed database. re-run after every change to catch an error.
// Run with: node-- test tests/regression.test.js

const test = require('node:test'); 
const assert = require('node:assert/strict'); 

let server, base; 

test.before(async () => { 
    server = require('../server'); 
    await new Promise((resolve) => server.listen(0, resolve)); 
    base = `http://localhost:${server.address().port}`; 
}); 

test.after(() => server.close()); 
test('REG-01: GET /api/booths returns all 6 booths with correct locations', async () => { 
    const res = await fetch(`${base}/api/booths`); 
    const data = await res.json(); 
    assert.equal(res.status, 200); 
    assert.equal(data.length, 6); 
    assert.deepEqual(data.find((b) => b.booth === 'Wina6'), 
    { booth: 'Wina6', location: 'Matero East' }
);
 });
 
 test('REG-02: GET /api/transactions returns the full seeded 308 transactions', async () => { 
    const res = await fetch(`${base}/api/transactions`); 
    const data = await res.json(); 
    assert.equal(data.length, 308); 
    assert.equal(data[0].transactionId, 'WB0000001'); 
    assert.equal(data[307].transactionId, 'WB0000308'); 
}); 

test('REG-03: dropdown dependency — Wina4 never returns Zanaco or FNB', async () => { 
    const res = await fetch(`${base}/api/booths/Wina4/services`); 
    const services = (await res.json()).map((s) => s.service); 
    assert.ok(!services.includes('Zanaco')); 
    assert.ok(!services.includes('FNB')); 
});

test('REG-04: service-totals cumulative amounts match a manual recompute from the seed data', async () => { 
    const txns = await (await fetch(`${base}/api/transactions`)).json(); 
    const manualFNB = txns.filter((t) => t.service === 'FNB').reduce((s, t) => s + t.transactionAmount, 0); 
    const totals = await (await fetch(`${base}/api/dashboard/service-totals`)).json(); 
    assert.equal(Math.round(totals.FNB.cumulativeTotal * 100) / 100, Math.round(manualFNB * 100) / 100); 
    assert.equal(totals.FNB.amountRemaining, totals.FNB.monthLimit - totals.FNB.cumulativeTotal); 
});

test('REG-05: booth-revenue totals are non-negative for all 6 booths', async () => { 
    const revenue = await (await fetch(`${base}/api/dashboard/booth-revenue`)).json(); 
    assert.equal(Object.keys(revenue).length, 6); 
    for (const booth of Object.keys(revenue)) assert.ok(revenue[booth] >= 0); 
}); 

test('REG-06: service-frequency counts sum to 308 across all booths/services', async () => { 
    const freq = await (await fetch(`${base}/api/dashboard/service-frequency`)).json();
     let total = 0; 
     for (const booth of Object.keys(freq)) { 
        for (const service of Object.keys(freq[booth])) total += freq[booth][service]; 
    } 
    assert.equal(total, 308); 
}); 

test('REG-07: dashboard summary total revenue equals sum of per-booth revenue', async () => { 
    const summary = await (await fetch(`${base}/api/dashboard/summary`)).json(); 
    const boothRevenue = await (await fetch(`${base}/api/dashboard/booth-revenue`)).json(); 
    const summed = Object.values(boothRevenue).reduce((a, b) => a + b, 0); 
    assert.equal(Math.round(summary.totalRevenue * 100) / 100, Math.round(summed * 100) / 100); 
});

test('REG-08: raising a new transaction increments totals without disturbing existing 308 rows', async () => { 
    const before = await (await fetch(`${base}/api/dashboard/service-totals`)).json(); 
    const res = await fetch(`${base}/api/transactions`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ booth: 'Wina1', service: 'Airtel Money', transactionAmount: 500 }),
     });
      assert.equal(res.status, 201); 
      const created = await res.json(); 
      assert.equal(created.transactionId, 'WB0000309'); 
      const after = await (await fetch(`${base}/api/dashboard/service-totals`)).json(); 
      assert.equal(
        Math.round(after['Airtel Money'].cumulativeTotal * 100) / 100, 
        Math.round((before['Airtel Money'].cumulativeTotal + 500) * 100) / 100
    ); 
    const allTxns = await (await fetch(`${base}/api/transactions`)).json(); 
    assert.equal(allTxns.length, 309); 
}); 

test('REG-09: invalid booth/service combination is rejected with 400, dataset unchanged', async () => { 
    const res = await fetch(`${base}/api/transactions`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ booth: 'Wina4', service: 'Zanaco', transactionAmount: 500 }),
}); 
assert.equal(res.status, 400); 
const allTxns = await (await fetch(`${base}/api/transactions`)).json(); 
assert.equal(allTxns.length, 308); 
});