/**
 * mock-data.js
 * -----------------------------------------------------------------------
 * Placeholder data shaped exactly like what the Flask API / database layer
 * is expected to return. dashboard.js reads ONLY from `window.dashboardData`,
 * so once Graine's endpoints and Kathie's cumulative-totals logic are ready,
 * this whole file can be deleted and replaced with a fetch() call that
 * populates the same shape. No other file should need to change.
 *
 * TAX_RATE is a placeholder constant — replace with whatever rate/logic
 * the business actually uses once confirmed.
 * -----------------------------------------------------------------------
 */

const TAX_RATE = 0.10; // 10% placeholder, applied to transaction amount

window.dashboardData = {

  // Item 9: dashboard summary figures
  summary: {
    totalRevenue: 812340,   // Kwacha
    totalCapital: 740000    // Kwacha
  },

  // Item 6: cumulative totals + remaining credit per service
  services: [
    { name: "Airtel Money", monthLimit: 350000, revenuePerKwacha: 0.05, cumulativeTotal: 298400 },
    { name: "MTN Money",    monthLimit: 160000, revenuePerKwacha: 0.06, cumulativeTotal: 121300 },
    { name: "Zamtel Money", monthLimit: 70000,  revenuePerKwacha: 0.045, cumulativeTotal: 58900 },
    { name: "Zanaco",       monthLimit: 80000,  revenuePerKwacha: 0.035, cumulativeTotal: 41200 },
    { name: "FNB",          monthLimit: 80000,  revenuePerKwacha: 0.04, cumulativeTotal: 62500 }
  ],

  // Item 7: cumulative revenue per mobile booth
  booths: [
    { code: "Wina1", location: "Lusaka CPD",  cumulativeRevenue: 132400 },
    { code: "Wina2", location: "Libala",      cumulativeRevenue: 118900 },
    { code: "Wina3", location: "Kabwata",     cumulativeRevenue: 246700 },
    { code: "Wina4", location: "Mandevu",     cumulativeRevenue: 154200 },
    { code: "Wina5", location: "Woodlands",   cumulativeRevenue: 96800 },
    { code: "Wina6", location: "Matero East", cumulativeRevenue: 63340 }
  ],

  // Item 8: frequency of each service at each booth
  // rows = booths, columns follow the services array order above
  frequency: {
    booths:   ["Wina1", "Wina2", "Wina3", "Wina4", "Wina5", "Wina6"],
    services: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    counts: [
      [12, 8, 4, 6, 9],   // Wina1
      [10, 11, 5, 0, 7],  // Wina2
      [38, 22, 14, 20, 0],// Wina3
      [24, 6, 5, 0, 0],   // Wina4
      [7, 5, 0, 3, 12],   // Wina5
      [9, 6, 3, 0, 0]     // Wina6
    ]
  },

  taxRate: TAX_RATE
};
