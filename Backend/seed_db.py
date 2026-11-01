"""Creates the database tables and populates them from seed_data/*.csv.

Usage:
    python seed_db.py            # normal run
    python seed_db.py --reset    # drop and recreate all tables first
"""
import csv
import sys
from pathlib import Path

from app import create_app
from app.extensions import db
from app.models import Location, MobileBooth, Service, BoothService, Transaction
from app.utils import apply_tax, parse_transaction_amount

SEED_DIR = Path(__file__).resolve().parent / "seed_data"


def load_csv(name):
    with (SEED_DIR / name).open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def seed():
    app = create_app()
    with app.app_context():
        if "--reset" in sys.argv:
            db.drop_all()
        db.create_all()

        seeded_tables = [
            Location.query.first(),
            MobileBooth.query.first(),
            Service.query.first(),
            BoothService.query.first(),
            Transaction.query.first(),
        ]
        if all(seeded_tables):
            print("Database already has data — skipping seed. Use --reset to reload.")
            return
        if any(seeded_tables):
            raise RuntimeError(
                "Database contains a partial seed. Use --reset to rebuild it from the CSV files."
            )

        # Locations + booths
        booth_rows = load_csv("booths.csv")
        location_cache = {}
        for row in booth_rows:
            loc_name = row["Location"]
            if loc_name not in location_cache:
                loc = Location(name=loc_name)
                db.session.add(loc)
                location_cache[loc_name] = loc
        db.session.flush()

        booth_cache = {}
        for row in booth_rows:
            booth = MobileBooth(
                id=int(row["BoothID"]),
                name=row["BoothName"],
                location_id=location_cache[row["Location"]].id,
            )
            db.session.add(booth)
            booth_cache[row["BoothName"]] = booth
        db.session.flush()

        # Services
        service_cache = {}
        for row in load_csv("services.csv"):
            svc = Service(
                id=int(row["ServiceID"]),
                name=row["ServiceName"],
                monthly_limit=row["MonthlyLimit"],
                revenue_per_kwacha=row["RevenuePerKwacha"],
            )
            db.session.add(svc)
            service_cache[row["ServiceName"]] = svc
        db.session.flush()

        # Booth <-> service offerings
        for row in load_csv("booth_services.csv"):
            booth_id, service_id = int(row["BoothID"]), int(row["ServiceID"])
            if booth_id not in booth_cache or service_id not in service_cache:
                raise ValueError(f"Unknown booth or service in booth_services.csv: {row}")
            db.session.add(BoothService(
                booth_id=booth_id,
                service_id=service_id,
            ))
        db.session.flush()

        # Transactions
        tax_rate = app.config["TAX_RATE"]
        count = 0
        for row in load_csv("transactions.csv"):
            booth_id, service_id = int(row["BoothID"]), int(row["ServiceID"])
            if booth_id not in booth_cache or service_id not in service_cache:
                raise ValueError(f"Unknown booth or service in transactions.csv: {row}")
            amount = parse_transaction_amount(row["TransactionAmount"])
            tax_amount, amount_after_tax = apply_tax(amount, tax_rate)
            db.session.add(Transaction(
                id=row["TransactionID"],
                booth_id=booth_id,
                service_id=service_id,
                amount=amount,
                tax_amount=tax_amount,
                amount_after_tax=amount_after_tax,
            ))
            count += 1

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        print(f"Seeded {len(location_cache)} locations, {len(booth_cache)} booths, "
              f"{len(service_cache)} services, {count} transactions.")


if __name__ == "__main__":
    seed()
