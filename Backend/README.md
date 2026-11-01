# Wina Bwangu Flask API

This Flask API provides booth and service data, records transactions, and supplies the figures used by the dashboard. Its SQLite database defaults to `Backend/wina_bwangu.db` and is created from `seed_data/*.csv`.

## Run on Windows

From PowerShell:

```powershell
cd Backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python seed_db.py
python run.py
```

The API listens on `http://127.0.0.1:5000`. For local development, serve the `Frontend` folder with an HTTP server (for example, VS Code Live Server on port 5500) and open `login.html` from that server.

On macOS or Linux, create and activate a virtual environment with `python3 -m venv .venv` and `source .venv/bin/activate`, then use the same pip, seed, and run commands.

Run `python seed_db.py --reset` only when you want to drop and recreate the database from the seed CSV files.

## Configuration

| Environment variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | SQLite file at `Backend/wina_bwangu.db` | SQLAlchemy database URL |
| `TAX_RATE` | `0.10` | Tax rate from 0 through 1 (10% by default) |
| `CORS_ORIGINS` | Local development origins and `null` | Comma-separated browser origins allowed to call `/api/*` |
| `DEMO_MODE` | `1` | Enable the local presentation-data reset action |
| `DEMO_ADMIN_EMAIL` | `admin@winabwangu.com` | Admin email required by the reset action |
| `DEMO_ADMIN_PASSWORD` | `password` | Admin password required by the reset action |
| `FLASK_HOST` | `127.0.0.1` | Address used by the development server |
| `PORT` | `5000` | Development server port |
| `FLASK_DEBUG` | `0` | Set to `1` to enable Flask debug mode locally |

For example, if the frontend is served from port 3000, add `http://localhost:3000` and `http://127.0.0.1:3000` to `CORS_ORIGINS`. CORS only controls which browser origins can read API responses; it does not authenticate users or protect API data.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check that the API is responding |
| GET | `/api/booths` | List booths and locations |
| GET | `/api/booths/<id>/services` | List services offered by a booth |
| GET | `/api/services` | List the service catalog and rates |
| GET | `/api/transactions?booth_id=&service_id=` | List transactions, optionally filtered by booth or service |
| POST | `/api/transactions` | Record a transaction |
| GET | `/api/dashboard/service-summary` | Service totals, monthly limits, and remaining amounts |
| GET | `/api/dashboard/booth-revenue` | Revenue by booth |
| GET | `/api/dashboard/frequency` | Transaction counts by booth and service |
| GET | `/api/dashboard/totals` | Total revenue and capital |
| GET | `/api/dashboard/pie` | Totals shaped for a pie chart |
| POST | `/api/demo/reset` | Restore all tables from the seed CSV files (local requests only; requires demo admin credentials) |

Create a transaction with a JSON object like:

```json
{"booth_id":1,"service_id":1,"amount":125.50}
```

The API validates IDs, positive amounts, currency precision, the booth/service pairing, and the remaining service limit. It calculates tax and returns the generated transaction ID.

The dashboard can filter the transaction list by booth, service, and the database entry date, then export the filtered rows to CSV. The transaction form shows remaining service credit, warns near the limit, and blocks amounts that would exceed it. A successful save displays a printable receipt.

The admin dashboard's **Reset demo data** action requires confirmation twice and the admin password. It is accepted only when the request comes from the same computer as the Flask server. It drops the current demo tables and reloads the CSV seed data, removing transactions recorded after the previous seed/reset. The same operation is available from the command line with `python seed_db.py --reset`.

## Data assumptions

- The source transaction file describes one month (February 2021) but has no event date per row. Seed rows use their database insertion time for the current-month allowance and date filters; those dates are not the original transaction dates. New transaction usage rolls into the current calendar month based on `created_at`.
- Total capital is the sum of each service's monthly limit. The assignment brief does not define another formula.
- The source data includes `WB0000017` for Zamtel Money at Wina5, although the listed booth offerings omit that pair. The seed preserves the source row; new transactions must follow the configured booth offerings.
- Tax defaults to 10% because the assignment brief does not give a rate. Override `TAX_RATE` when the required value is known.

## Authentication status

The current agent/admin sign-in is still checked in frontend JavaScript for the prototype. The Flask API does not generally authenticate requests or enforce agent/admin permissions; the reset action separately checks its configured demo admin credentials and only accepts loopback requests. Keep this API on a trusted local development environment until full server-side authentication and authorization are implemented.
