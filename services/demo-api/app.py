import os
import time
from flask import Flask, jsonify, request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor


SERVICE_NAME = os.getenv("SERVICE_NAME", "demo-api")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
TENANT = os.getenv("TENANT", "shared")
OTEL_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()


REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["service", "tenant", "method", "path", "status"],
)
LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["service", "tenant", "method", "path"],
)


def configure_tracing() -> None:
    resource = Resource.create(
        {
            "service.name": SERVICE_NAME,
            "service.version": SERVICE_VERSION,
            "service.namespace": "platform-guardrails-lab",
            "tenant": TENANT,
        }
    )
    provider = TracerProvider(resource=resource)
    if OTEL_ENDPOINT:
        provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=OTEL_ENDPOINT))
        )
    else:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
    trace.set_tracer_provider(provider)


configure_tracing()
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)


@app.after_request
def collect_metrics(response):
    path = request.path
    if path == "/metrics":
        return response
    duration = time.perf_counter() - getattr(request, "_start_time", time.perf_counter())
    labels = {
        "service": SERVICE_NAME,
        "tenant": TENANT,
        "method": request.method,
        "path": path,
    }
    LATENCY.labels(**labels).observe(duration)
    REQUESTS.labels(status=response.status_code, **labels).inc()
    return response


@app.before_request
def mark_start():
    request._start_time = time.perf_counter()


@app.get("/")
def index():
    return jsonify(
        {
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "tenant": TENANT,
            "message": "platform guardrails lab demo API",
        }
    )


@app.get("/healthz")
def healthz():
    return jsonify({"status": "ok"}), 200


@app.get("/readyz")
def readyz():
    return jsonify({"status": "ready"}), 200


@app.get("/slow")
def slow():
    delay = float(request.args.get("seconds", "0.25"))
    delay = max(0.0, min(delay, 5.0))
    time.sleep(delay)
    return jsonify({"status": "ok", "slept_seconds": delay})


@app.get("/fail")
def fail():
    return jsonify({"status": "error", "message": "intentional demo failure"}), 500


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
