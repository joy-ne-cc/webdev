from app.extensions import db


class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    booths = db.relationship("MobileBooth", back_populates="location")

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class MobileBooth(db.Model):
    __tablename__ = "mobile_booths"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)  # e.g. "Wina1"
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)

    location = db.relationship("Location", back_populates="booths")
    services = db.relationship("BoothService", back_populates="booth")
    transactions = db.relationship("Transaction", back_populates="booth")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location.name if self.location else None,
        }


class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(40), unique=True, nullable=False)
    monthly_limit = db.Column(db.Numeric(12, 2), nullable=False)
    revenue_per_kwacha = db.Column(db.Numeric(6, 4), nullable=False)

    booths = db.relationship("BoothService", back_populates="service")
    transactions = db.relationship("Transaction", back_populates="service")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "monthly_limit": float(self.monthly_limit),
            "revenue_per_kwacha": float(self.revenue_per_kwacha),
        }


class BoothService(db.Model):
    """Which services a given booth actually offers (the M:N link)."""

    __tablename__ = "booth_services"

    booth_id = db.Column(db.Integer, db.ForeignKey("mobile_booths.id"), primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), primary_key=True)

    booth = db.relationship("MobileBooth", back_populates="services")
    service = db.relationship("Service", back_populates="booths")


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.String(10), primary_key=True)  # e.g. "WB0000309"
    booth_id = db.Column(db.Integer, db.ForeignKey("mobile_booths.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(12, 2), nullable=False)
    amount_after_tax = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    booth = db.relationship("MobileBooth", back_populates="transactions")
    service = db.relationship("Service", back_populates="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "booth": self.booth.name if self.booth else None,
            "location": self.booth.location.name if self.booth and self.booth.location else None,
            "service": self.service.name if self.service else None,
            "revenue_per_kwacha": float(self.service.revenue_per_kwacha) if self.service else None,
            "amount": float(self.amount),
            "tax_amount": float(self.tax_amount),
            "amount_after_tax": float(self.amount_after_tax),
            # data bar (requirement d): tax as a share of the original amount,
            # 0-100, so the frontend can render it directly as a bar width %
            "tax_share_pct": round(float(self.tax_amount) / float(self.amount) * 100, 2) if self.amount else 0,
        }
