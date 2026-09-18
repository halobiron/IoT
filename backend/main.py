"""Application entry point for the IoT monitoring service."""

import os
import threading
from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS

from app.api.routes import api_bp
from app.api.swagger_config import register_swagger_docs
from app.core.config import API_HOST, API_PORT, Config
from app.services.data_service import IoTMQTTReceiver


BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"


def create_app():
    """Create the web application and register its modular API routes."""
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=["*"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    app.register_blueprint(api_bp)
    register_swagger_docs(app)

    @app.route("/")
    def serve_frontend():
        return send_from_directory(FRONTEND_DIR / "public", "home-page.html")

    @app.route("/src/<path:filename>")
    def serve_source(filename):
        return send_from_directory(FRONTEND_DIR / "src", filename)

    @app.route("/<path:filename>")
    def serve_static(filename):
        return send_from_directory(FRONTEND_DIR / "public", filename)

    return app


def start_mqtt_receiver():
    IoTMQTTReceiver().start_receiving()


def main():
    app = create_app()

    # Werkzeug runs the module twice in debug mode; start MQTT only in its child.
    should_start_mqtt = not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if should_start_mqtt:
        threading.Thread(target=start_mqtt_receiver, daemon=True).start()

    app.run(host=API_HOST, port=API_PORT, debug=app.debug)


if __name__ == "__main__":
    main()
