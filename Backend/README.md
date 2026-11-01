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

Create a transaction with a JSON object like:

```json
{"booth_id":1,"service_id":1,"amount":125.50}
```

The API validates IDs, positive amounts, currency precision, and the booth/service pairing. It calculates tax and returns the generated transaction ID.

## Data assumptions

- The source transaction file describes one month (February 2021) but has no per-transaction date. Dashboard "cumulative" values are totals across the available rows.
- Total capital is the sum of each service's monthly limit. The assignment brief does not define another formula.
- The source data includes `WB0000017` for Zamtel Money at Wina5, although the listed booth offerings omit that pair. The seed preserves the source row; new transactions must follow the configured booth offerings.
- Tax defaults to 10% because the assignment brief does not give a rate. Override `TAX_RATE` when the required value is known.

## Authentication status

The current agent/admin credentials are checked in frontend JavaScript for the prototype. The Flask API does not yet authenticate requests or enforce agent/admin permissions. Keep this API on a trusted local development environment until server-side authentication and authorization are implemented.
