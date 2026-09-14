from flask import Blueprint, jsonify
from sqlalchemy import func
from app.extensions import db
from app.models import Transaction, MobileBooth, Service

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

# NOTE: the case study's Appendix 1 data has no per-transaction date field —
# it's described as "the month of February 2021" as a single batch. So
# "cumulative" here means "across all seeded transactions", i.e. one month's
# worth. If your seed data later spans multiple months, filter by month here.


@bp.get("/service-summary")
def service_summary():
    """Req f: cumulative total and amount remaining vs monthly limit, per service."""
    rows = (
        db.session.query(
            Service.id, Service.name, Service.monthly_limit,
            func.coalesce(func.sum(Transaction.amount), 0).label("cumulative_total"),
        )
        .outerjoin(Transaction, Transaction.service_id == Service.id)
        .group_by(Service.id)
        .order_by(Service.id)
        .all()
    )
    return jsonify([
        {
            "service": name,
            "monthly_limit": float(limit),
            "cumulative_total": float(total),
            "amount_remaining": float(limit) - float(total),
        }
        for _id, name, limit, total in rows
    ])


@bp.get("/booth-revenue")
def booth_revenue():
    """Req g: cumulative revenue per booth = sum(amount * revenue_per_kwacha)."""
    rows = (
        db.session.query(
            MobileBooth.id, MobileBooth.name,
            func.coalesce(func.sum(Transaction.amount * Service.revenue_per_kwacha), 0).label("revenue"),
        )
        .outerjoin(Transaction, Transaction.booth_id == MobileBooth.id)
        .outerjoin(Service, Transaction.service_id == Service.id)
        .group_by(MobileBooth.id)
        .order_by(MobileBooth.id)
        .all()
    )
    return jsonify([{"booth": name, "cumulative_revenue": float(rev)} for _id, name, rev in rows])


@bp.get("/frequency")
def frequency():
    """Req h: how often each service is used, at each booth."""
    rows = (
        db.session.query(
            MobileBooth.name, Service.name, func.count(Transaction.id)
        )
        .join(Transaction, Transaction.booth_id == MobileBooth.id)
        .join(Service, Transaction.service_id == Service.id)
        .group_by(MobileBooth.id, Service.id)
        .order_by(MobileBooth.id, Service.id)
        .all()
    )
    return jsonify([{"booth": b, "service": s, "count": c} for b, s, c in rows])


@bp.get("/totals")
def totals():
    """Req i: total revenue generated, and total capital (credit) required.

    Total capital = sum of every service's monthly limit — the total float
    the company needs on hand to cover all services at all booths for a
    month. (Assumption — the brief names this figure but doesn't define the
    formula; adjust here if your lecturer means something more specific.)
    """
    total_revenue = (
        db.session.query(func.coalesce(func.sum(Transaction.amount * Service.revenue_per_kwacha), 0))
        .join(Service, Transaction.service_id == Service.id)
        .scalar()
    )
    total_capital = db.session.query(func.coalesce(func.sum(Service.monthly_limit), 0)).scalar()
    return jsonify({"total_revenue": float(total_revenue), "total_capital": float(total_capital)})


@bp.get("/pie")
def pie():
    """Req j: pie chart data for the totals above — ready to hand to any chart lib."""
    data = totals().get_json()
    return jsonify({
        "labels": ["Total revenue", "Total capital"],
        "values": [data["total_revenue"], data["total_capital"]],
    })
