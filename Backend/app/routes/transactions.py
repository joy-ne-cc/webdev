from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.extensions import db
from app.models import Transaction, MobileBooth, Service, BoothService
from app.utils import next_transaction_id, parse_transaction_amount, apply_tax

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@bp.get("")
def list_transactions():
    """GET /api/transactions — optionally filter with ?booth_id= or ?service_id=."""
    query = Transaction.query
    try:
        booth_id = _optional_positive_id("booth_id")
        service_id = _optional_positive_id("service_id")
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if booth_id is not None:
        query = query.filter_by(booth_id=booth_id)
    if service_id is not None:
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
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "request body must be a JSON object"}), 400
    booth_id = data.get("booth_id")
    service_id = data.get("service_id")
    raw_amount = data.get("amount")

    if booth_id is None or service_id is None or raw_amount is None:
        return jsonify({"error": "booth_id, service_id and amount are required"}), 400
    if (
        isinstance(booth_id, bool) or not isinstance(booth_id, int) or booth_id <= 0
        or isinstance(service_id, bool) or not isinstance(service_id, int) or service_id <= 0
    ):
        return jsonify({"error": "booth_id and service_id must be positive integers"}), 400

    booth = db.session.get(MobileBooth, booth_id)
    service = db.session.get(Service, service_id)
    if not booth or not service:
        return jsonify({"error": "unknown booth_id or service_id"}), 400

    offers_it = BoothService.query.filter_by(booth_id=booth_id, service_id=service_id).first()
    if not offers_it:
        return jsonify({"error": f"{booth.name} does not offer {service.name}"}), 400

    try:
        amount = parse_transaction_amount(raw_amount)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

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
    try:
        db.session.add(txn)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        current_app.logger.exception("Transaction insert failed due to a database constraint")
        return jsonify({"error": "transaction could not be saved; retry the request"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Transaction insert failed due to a database error")
        return jsonify({"error": "transaction could not be saved"}), 500

    return jsonify(txn.to_dict()), 201


def _optional_positive_id(name):
    raw_value = request.args.get(name)
    if raw_value is None:
        return None
    try:
        value = int(raw_value)
    except ValueError:
        raise ValueError(f"{name} must be a positive integer") from None
    if value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value
