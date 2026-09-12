// UNIT TEST- exercis each business logic
// Run with: node--test tests/unit.js

const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../logic');

test('generateTransactionId: produce next sequential WB-prefixed ID', () => {
    const existing = [{ transactionId: 'WB0000001' }, { transactionId: 'WB0000308' }];
    assert.equal(logic.generateTransactionId(existing), 'WB0000309');
});

test('generatetransactionId: starts at WB0000001 when no existing transactions', () => {
    assert.equal(logic.generateTransactionId([]), 'WB0000001');
});

test('getBoothLocation: returns correct booth location for given a valid booth', () => {
    assert.equal(logic.getBoothLocation('Wina3'), 'Kabwata');
});

test('getBoothLocation: throws "Unknown Booth" for an unknown booth', () => {
    assert.throws(logic.getBoothLocation('Wina9'), 'Unknown Mobile Booth');
});

test('getServiceForBooth: Wina4 only offers its 3 configured services', () => {
    const services = logic.getServiceForBooth('Wina4').map((s) => s.service);
    assert.deepEqual(services.sort(), ['Airtel Money', 'MTN Money', 'Zamtel Money'].sort());
});

test('getServiceForBooth: throws Wina1 offers all 5 services with correct rates', () => {
    const services = logic.getServiceForBooth('Wina1');
    const zanaco = services.find((s) => s.service === 'Zanaco');
    assert.equal(zanaco.revenueperKwacha, 0.035);
});

test('calculateAmountAfterTax: applies the tax rate correctly', () => {
    const { amountAfterTax, taxAmount } = logic.calculateAmountAfterTax(1000, 0.16);
    assert.equal(taxAmount, 160);
    assert.equal(amountAfterTax, 840);
});

test('calculateAmountAfterTax: rejects zero to negative amounts', () => {
    assert.throws(() => logic.calculateAmountAfterTax(0, 0));
    assert.throws(() => logic.calculateAmountAfterTax(-50));
});

test('biuldTransaction: rejects a service not offered at the choosen booth', () => {
    assert.throws(
        () => logic.buildTransaction({ booth: 'Wina4', service: 'Zanaco', transactionAmount: 500 }, []),
        /not offered at booth/
    );
});

test('buildTransaction: builds a complete, correctly-computed record', () => {
    const txn = logic.buildTransaction(
        {booth: 'Wina2', service: 'MTN Money', transactionAmount: 2000},
        []
    );
    assert.equal(txn.transactionId, 'WB0000001');
    assert.equal(txn.location, 'Libala');
    assert.equal(txn.revenuePerKwacha, 0.06);
    assert.equal(txn.revenue, 120);
    assert.equal(txn.taxAmount, 320);
    assert.equal(txn.amountAfterTax, 1680); 
});

test('computeServiceTotals: cummulative total and remaining limit are consistent', ()=> {
    const txns =[
        {service: 'FNB', transactionAmount: '1000'}
        {service: 'FNB', transactionAmount: '500'}
    ];
    const totals = logic.computeServiceTotals(txns);
    assert.equal(totals.FNB.cummulativeTotal, 1500);
    assert.equal(totals.FNB.monthLimit, 80000);
    assert.equal(totals.FNB.amountRemaining, 78500);
});

test('computeBoothRevenue: sums revenue per booth correctly', () => {
    const txns = [
        {booth: 'Wina1', transactionAmount: '1000', revenuePerKwacha: '0.05'},
        {booth: 'Wina1', transactionAmount: '500', revenuePerKwacha: '0.05'},
        {booth: 'Wina2', transactionAmount: '2000', revenuePerKwacha: '0.06'}
    ];
    const revenue = logic.computeBoothRevenue(txns);
    assert.equal(revenue.Wina1, 75);
    assert.equal(revenue.Wina2, 120);
})

test('computeServiceFrequency: counts occurences per booth/service', () => {
    const txns = [
        {booth: 'Wina3', service: 'Airtel money'},
        { booth: 'Wina3', service: 'Airtel money' },
        { booth: 'Wina3', service: 'MTN money' },
    ];
    const freq = logic.computeServiceFrequency(txns);
    
    assert.equal(freq.Wina3['Airtel Money'], 2);
    assert.equal(freq.Wina3['MTN Money'], 1);
    assert.equal(freq.Wina3['Zanaco'], 0);
})

test('computeDashboardSummary: total revenue matche smanual sum; the total capital is the summed monthly limits', () => {
    const txns = [
        { booth: 'Wina1', transactionAmount: '1000', revenuePerKwacha: 0.05 },
        { booth: 'Wina2', transactionAmount: '2000', revenuePerKwacha: 0.06 },
    ];
    const { totalRevenue, totalCapital } = logic.computeDashboardSummary(txns);
    assert.equal(totalRevenue, 170);
    assert.equal(totalCapital, 350000 + 160000 + 70000 + 80000 + 80000);
});

test('computeDashboardSummary: total revenue always foots exactly to the sum of computeBoothRevenue', () => {
    const { loadSeedTransactions } = require('../data'); 
    const txns = loadSeedTransactions(); 
    const { totalRevenue } = logic.computeDashboardSummary(txns); 
    const boothRevenue = logic.computeBoothRevenue(txns); 
    const summed = logic.round2(Object.values(boothRevenue).reduce((a, b) => a + b, 0)); 
    assert.equal(totalRevenue, summed);
});