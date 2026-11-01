from flask import Blueprint, jsonify
from app.extensions import db
from app.models import MobileBooth, BoothService

bp = Blueprint("booths", __name__, url_prefix="/api/booths")


@bp.get("")
def list_booths():
    """GET /api/booths — populates the Mobile Booth dropdown."""
    booths = MobileBooth.query.order_by(MobileBooth.id).all()
    return jsonify([b.to_dict() for b in booths])


@bp.get("/<int:booth_id>/services")
def booth_services(booth_id):
    """GET /api/booths/<id>/services — populates the Service dropdown,
    filtered to only what this booth actually offers (requirement c)."""
    if db.session.get(MobileBooth, booth_id) is None:
        return jsonify({"error": "booth not found"}), 404
    links = BoothService.query.filter_by(booth_id=booth_id).order_by(BoothService.service_id).all()
    return jsonify([link.service.to_dict() for link in links])
