from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app)  # allows the frontend (different port/origin) to call this API

    from app.routes import booths, services, transactions, dashboard
    app.register_blueprint(booths.bp)
    app.register_blueprint(services.bp)
    app.register_blueprint(transactions.bp)
    app.register_blueprint(dashboard.bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app
