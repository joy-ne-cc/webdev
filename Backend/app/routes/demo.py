import hmac

from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("demo", __name__, url_prefix="/api/demo")


@bp.post("/reset")
def reset_demo_data():
    """Restore the CSV demo dataset; available only in local demo mode."""
    if not current_app.config.get("DEMO_MODE"):
        return jsonify({"error": "demo reset is disabled"}), 404
    if request.remote_addr not in {"127.0.0.1", "::1"}:
        return jsonify({"error": "demo reset is available only from this computer"}), 403

    credentials = request.get_json(silent=True)
    if not isinstance(credentials, dict):
        return jsonify({"error": "admin credentials are required"}), 400
    email = str(credentials.get("email", "")).strip().lower()
    password = str(credentials.get("password", ""))
    expected_email = current_app.config["DEMO_ADMIN_EMAIL"]
    expected_password = current_app.config["DEMO_ADMIN_PASSWORD"]
    if not hmac.compare_digest(email, expected_email) or not hmac.compare_digest(password, expected_password):
        return jsonify({"error": "admin credentials were not accepted"}), 401

    try:
        from seed_db import seed_database

        result = seed_database(reset=True)
    except Exception:
        current_app.logger.exception("Demo data reset failed")
        return jsonify({"error": "demo data could not be restored from the seed files"}), 500
    return jsonify({"message": "Demo data restored", "seeded": result}), 200
