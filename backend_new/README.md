# Wina Bwangu API

Flask backend for the Wina Bwangu web app case study. Covers: server setup,
database, seeding the 308 transactions, and all GET/POST endpoints the
frontend needs.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_db.py               # creates wina_bwangu.db and loads all seed data
python run.py                   # starts the server on http://localhost:5000
```

Re-run `python seed_db.py --reset` any time you want to wipe and reload from
`seed_data/*.csv`.

## Folder structure

```
app/
  __init__.py       # app factory — creates the Flask app, registers routes
  config.py         # DB URI + TAX_RATE
  extensions.py     # the shared db = SQLAlchemy() instance
  models.py         # Location, MobileBooth, Service, BoothService, Transaction
  utils.py          # transaction ID generation + tax calculation
  routes/
    booths.py       # GET /api/booths, GET /api/booths/<id>/services
    services.py     # GET /api/services
    transactions.py # GET/POST /api/transactions
    dashboard.py     # all the dashboard aggregate endpoints
seed_data/           # booths.csv, services.csv, booth_services.csv, transactions.csv
seed_db.py           # loads seed_data/ into the database
run.py                # entry point
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/booths` | Booth dropdown (id, name, location) |
| GET | `/api/booths/<id>/services` | Service dropdown, filtered to that booth — dropdown chaining |
| GET | `/api/services` | Full service catalog (monthly limit, revenue/kwacha) |
| GET | `/api/transactions?booth_id=&service_id=` | List/filter transactions |
| POST | `/api/transactions` | Create a transaction — body `{booth_id, service_id, amount}` |
| GET | `/api/dashboard/service-summary` | Cumulative total + amount remaining, per service |
| GET | `/api/dashboard/booth-revenue` | Cumulative revenue, per booth |
| GET | `/api/dashboard/frequency` | Transaction count per booth + service |
| GET | `/api/dashboard/totals` | `{total_revenue, total_capital}` |
| GET | `/api/dashboard/pie` | Same totals, shaped for a pie chart |
| GET | `/api/health` | Sanity check |

`POST /api/transactions` auto-generates the TransactionID, rejects a
booth/service combination the booth doesn't actually offer (400), and
returns `tax_share_pct` (0-100) so the frontend can drive a data bar
directly off it.

## Assumptions made (flag these in the team report)

1. **Tax rate**: the brief asks for "Transaction Amount after Tax" but never
   states a rate. Defaulted to **10%** in `app/config.py` (`TAX_RATE`) —
   change it there, or override with the `TAX_RATE` env var, once you have
   the real figure.
2. **"Monthly" cumulative totals**: Appendix 1 has no per-transaction date
   column — all 308 rows are described as one month (Feb 2021). Cumulative
   totals are therefore computed across *all* seeded transactions. If a real
   date field gets added later, `service-summary` and `booth-revenue` should
   filter by month.
3. **Total capital**: interpreted as the sum of every service's monthly
   limit (i.e. the total float the company needs available). Adjust
   `dashboard.py: totals()` if your lecturer defines this differently.
4. **Data anomaly**: `WB0000017` (Wina5 / Zamtel Money) is in the source
   data but Wina5 isn't listed as offering Zamtel Money per the brief. It's
   seeded as-is (matches the real provided dataset); the same combination
   is rejected with a 400 if submitted through `POST /api/transactions`,
   since that endpoint enforces the offering rules.
