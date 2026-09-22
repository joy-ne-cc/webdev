from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models import Transaction, MobileBooth, Service, BoothService
from app.utils import next_transaction_id, apply_tax

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@bp.get("")
def list_transactions():
    """GET /api/transactions — optionally filter with ?booth_id= or ?service_id=."""
    query = Transaction.query
    booth_id = request.args.get("booth_id", type=int)
    service_id = request.args.get("service_id", type=int)
    if booth_id:
        query = query.filter_by(booth_id=booth_id)
    if service_id:
        query = query.filter_by(service_id=service_id)
    transactions = query.order_by(Transaction.id).all()
    return jsonify([t.to_dict() for t in transactions])


@bp.post("")
def create_transaction():
    """POST /api/transactions — body: {"booth_id": int, "service_id": int, "amount": number}

    Auto-generates the TransactionID (req a), validates the booth actually
    offers the chosen service (req c / R12), and calculates tax + the data-bar
    percentage (req d).
    """
    data = request.get_json(silent=True) or {}
    booth_id = data.get("booth_id")
    service_id = data.get("service_id")
    amount = data.get("amount")

    if not all([booth_id, service_id, amount]):
        return jsonify({"error": "booth_id, service_id and amount are required"}), 400

    booth = MobileBooth.query.get(booth_id)
    service = Service.query.get(service_id)
    if not booth or not service:
        return jsonify({"error": "unknown booth_id or service_id"}), 400

    offers_it = BoothService.query.filter_by(booth_id=booth_id, service_id=service_id).first()
    if not offers_it:
        return jsonify({"error": f"{booth.name} does not offer {service.name}"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a positive number"}), 400

    last = Transaction.query.order_by(Transaction.id.desc()).first()
    new_id = next_transaction_id(last.id if last else None)
    tax_amount, amount_after_tax = apply_tax(amount, current_app.config["TAX_RATE"])

    txn = Transaction(
        id=new_id,
        booth_id=booth_id,
        service_id=service_id,
        amount=amount,
        tax_amount=tax_amount,
        amount_after_tax=amount_after_tax,
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify(txn.to_dict()), 201
