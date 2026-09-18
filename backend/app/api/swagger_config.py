"""Swagger documentation for the Blueprint-based API.

The specification is separate from request handlers so it never creates a
second, conflicting set of API routes.
"""

from flask import jsonify


def _query(name, description, schema_type="string", **options):
    return {
        "name": name,
        "in": "query",
        "description": description,
        "schema": {"type": schema_type, **options},
    }


def _json_response(description="Successful response"):
    return {
        "description": description,
        "content": {"application/json": {"schema": {"type": "object"}}},
    }


def _get(summary, parameters=None):
    operation = {"tags": ["Sensors"], "summary": summary, "responses": {"200": _json_response()}}
    if parameters:
        operation["parameters"] = parameters
    return {"get": operation}


def build_openapi_spec():
    """Return an OpenAPI document matching the routes in ``app.api.routes``."""
    paths = {
        "/api/v1/sensors/sensor-data": _get("Get the latest sensor reading"),
        "/api/v1/sensors/home-data": _get("Get current sensor and LED data"),
        "/api/v1/sensors/led-status": _get("Get LED states and pending commands"),
        "/api/v1/sensors/available-dates": _get("List dates containing sensor data"),
        "/api/v1/sensors/available-led-dates": _get("List dates containing LED history"),
        "/api/v1/sensors/sensor-data-list": _get(
            "List sensor readings",
            [_query("page", "Page number", "integer", minimum=1), _query("per_page", "Rows per page", "integer", minimum=1, maximum=100), _query("sort_field", "timestamp, temperature, humidity, or light"), _query("sort_order", "asc or desc"), _query("search", "Search value"), _query("search_criteria", "all, time, temperature, humidity, or light"), _query("sample", "Return every nth row", "integer", minimum=1)],
        ),
        "/api/v1/sensors/sensor-data/chart": _get(
            "Get readings for a chart",
            [_query("date", "Date in YYYY-MM-DD"), _query("limit", "Maximum readings, or all")],
        ),
        "/api/v1/sensors/action-history": _get(
            "List LED action history",
            [_query("page", "Page number", "integer", minimum=1), _query("per_page", "Rows per page", "integer", minimum=1, maximum=100), _query("search", "Search value"), _query("device_filter", "Device filter"), _query("state_filter", "ON, OFF, or all")],
        ),
        "/api/v1/sensors/led-stats": _get(
            "Get LED usage statistics",
            [_query("cache", "Use cached results", "boolean"), _query("date", "Date in YYYY-MM-DD")],
        ),
        "/api/v1/sensors/thresholds": {
            **_get("Get sensor thresholds"),
            "post": {
                "tags": ["Sensors"],
                "summary": "Update sensor thresholds",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"type": "object"}}},
                },
                "responses": {"200": _json_response(), "400": _json_response("Invalid threshold values")},
            },
        },
        "/api/v1/sensors/led-control": {
            "post": {
                "tags": ["Sensors"],
                "summary": "Send an LED command",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["led_id", "action"],
                                "properties": {
                                    "led_id": {"type": "string", "enum": ["LED1", "LED2", "LED3", "ALL"]},
                                    "action": {"type": "string", "enum": ["ON", "OFF"]},
                                },
                            }
                        }
                    },
                },
                "responses": {"200": _json_response(), "400": _json_response("Invalid command"), "500": _json_response("MQTT error")},
            }
        },
        "/api/v1/auth/login": {
            "post": {
                "tags": ["Authentication"],
                "summary": "Log in and receive a JWT",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["username", "password"],
                                "properties": {
                                    "username": {"type": "string"},
                                    "password": {"type": "string", "format": "password"},
                                },
                            }
                        }
                    },
                },
                "responses": {"200": _json_response(), "401": _json_response("Invalid credentials")},
            }
        },
    }

    return {
        "openapi": "3.0.3",
        "info": {"title": "IoT Monitoring System API", "version": "1.0.0", "description": "REST API for sensor monitoring and LED control."},
        "servers": [{"url": "/", "description": "Current server"}],
        "tags": [{"name": "Sensors"}, {"name": "Authentication"}],
        "paths": paths,
    }


def register_swagger_docs(app):
    """Expose an OpenAPI document and a Swagger UI without duplicate API routes."""

    @app.get("/docs/openapi.json")
    def openapi_spec():
        return jsonify(build_openapi_spec())

    @app.get("/docs/")
    def swagger_ui():
        return """<!doctype html><html><head><title>IoT API documentation</title>
<link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css\"></head>
<body><div id=\"swagger-ui\"></div>
<script src=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js\"></script>
<script>SwaggerUIBundle({url: '/docs/openapi.json', dom_id: '#swagger-ui'});</script>
</body></html>"""
