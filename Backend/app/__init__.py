from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", Config.CORS_ORIGINS)}},
        supports_credentials=False,
    )

    from app.routes import booths, services, transactions, dashboard, demo
    app.register_blueprint(booths.bp)
    app.register_blueprint(services.bp)
    app.register_blueprint(transactions.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(demo.bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app
