from flask import Blueprint, jsonify
from app.models import Service

bp = Blueprint("services", __name__, url_prefix="/api/services")


@bp.get("")
def list_services():
    """GET /api/services — full catalog with monthly limit + revenue rate."""
    services = Service.query.order_by(Service.id).all()
    return jsonify([s.to_dict() for s in services])
