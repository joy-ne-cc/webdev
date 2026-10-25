# Wina Bwangu Booth Operations

A small Flask and JavaScript system for recording mobile money booth transactions and reviewing service limits, booth revenue, and transaction activity. The project was built for a web development assignment and keeps the workflow deliberately simple: choose a booth, select one of its services, enter an amount, and review the saved records on the dashboard.

## Run locally

1. In a terminal, go to `Backend/` and create a virtual environment: `python -m venv .venv`.
2. Activate it, then install dependencies with `pip install -r requirements.txt`.
3. Seed the SQLite database with `python seed_db.py`.
4. Start the API with `python run.py`.
5. In another terminal, serve `Frontend/` with `python -m http.server 8080` and open `http://127.0.0.1:8080/`.

The dashboard and transaction form use the Flask API at `http://127.0.0.1:5000/api`. If the API is unavailable, the dashboard labels its figures as illustrative demo data. The transaction form can show demo booth/service options, but saving still requires the API.

## Project layout

- `Frontend/` contains the two pages, shared styles, and browser scripts.
- `Backend/` contains the Flask application, API routes, and seed data.
- `Data/transactions.csv` is the assignment's flat transaction dataset.

## Project assumptions

- The assignment does not specify a tax rate, so the app currently uses a clearly labelled 10% placeholder. Set `TAX_RATE` in the backend environment if the brief specifies another rate.
- Seeded transactions have no individual date. Dashboard totals therefore cover the complete supplied dataset rather than a date-filtered month.
- Total capital is interpreted as the sum of the five monthly service limits.
