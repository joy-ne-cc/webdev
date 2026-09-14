"""Creates the database tables and populates them from seed_data/*.csv.

Usage:
    python seed_db.py            # normal run
    python seed_db.py --reset    # drop and recreate all tables first
"""
import csv
import os
import sys

from app import create_app
from app.extensions import db
from app.models import Location, MobileBooth, Service, BoothService, Transaction
from app.utils import apply_tax

SEED_DIR = os.path.join(os.path.dirname(__file__), "seed_data")


def load_csv(name):
    with open(os.path.join(SEED_DIR, name), newline="") as f:
        return list(csv.DictReader(f))


def seed():
    app = create_app()
    with app.app_context():
        if "--reset" in sys.argv:
            db.drop_all()
        db.create_all()

        if Location.query.first():
            print("Database already has data — skipping seed. Use --reset to reload.")
            return

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
            db.session.add(BoothService(
                booth_id=int(row["BoothID"]),
                service_id=int(row["ServiceID"]),
            ))
        db.session.flush()

        # Transactions
        tax_rate = app.config["TAX_RATE"]
        count = 0
        for row in load_csv("transactions.csv"):
            amount = float(row["TransactionAmount"])
            tax_amount, amount_after_tax = apply_tax(amount, tax_rate)
            db.session.add(Transaction(
                id=row["TransactionID"],
                booth_id=int(row["BoothID"]),
                service_id=int(row["ServiceID"]),
                amount=amount,
                tax_amount=tax_amount,
                amount_after_tax=amount_after_tax,
            ))
            count += 1

        db.session.commit()
        print(f"Seeded {len(location_cache)} locations, {len(booth_cache)} booths, "
              f"{len(service_cache)} services, {count} transactions.")


if __name__ == "__main__":
    seed()
