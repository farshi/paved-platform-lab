package lab.guardrails;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.DoubleAdder;
import java.util.concurrent.atomic.LongAdder;

public final class App {
  private static final String SERVICE_NAME = env("SERVICE_NAME", "java-telemetry-api");
  private static final String SERVICE_VERSION = env("SERVICE_VERSION", "0.1.0");
  private static final String TENANT = env("TENANT", "shared");
  private static final String DB_PATH = env("DB_PATH", "/tmp/orders.db");
  private static final int PORT = Integer.parseInt(env("PORT", "8080"));
  private static final int ERROR_RATE_PERCENT = Integer.parseInt(env("ERROR_RATE_PERCENT", "0"));
  private static final double DEFAULT_SLOW_SECONDS = Double.parseDouble(env("DEFAULT_SLOW_SECONDS", "0.8"));
  private static final Metrics METRICS = new Metrics();
  private static final Tracer TRACER = initOpenTelemetry().getTracer("java-telemetry-api");

  private App() {
  }

  public static void main(String[] args) throws Exception {
    initDb();

    HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", PORT), 0);
    server.createContext("/", exchange -> handle(exchange, App::root));
    server.createContext("/healthz", exchange -> handle(exchange, App::health));
    server.createContext("/readyz", exchange -> handle(exchange, App::health));
    server.createContext("/success", exchange -> handle(exchange, App::success));
    server.createContext("/orders", exchange -> handle(exchange, App::orders));
    server.createContext("/slow", exchange -> handle(exchange, App::slow));
    server.createContext("/fail", exchange -> handle(exchange, App::fail));
    server.createContext("/metrics", App::metrics);
    server.setExecutor(Executors.newFixedThreadPool(8));
    server.start();
    System.out.printf("java-telemetry-api listening on :%d%n", PORT);
  }

  private static void handle(HttpExchange exchange, Handler handler) throws IOException {
    long started = System.nanoTime();
    String method = exchange.getRequestMethod();
    String path = exchange.getRequestURI().getPath();
    Span span = TRACER.spanBuilder(method + " " + path).startSpan();
    int status = 500;
    try {
      span.setAttribute("service.name", SERVICE_NAME);
      span.setAttribute("service.version", SERVICE_VERSION);
      span.setAttribute("http.request.method", method);
      span.setAttribute("url.path", path);
      Response response = handler.run(exchange);
      status = response.status();
      write(exchange, response.status(), response.body(), response.contentType());
      if (status >= 500) {
        span.setStatus(StatusCode.ERROR);
      }
    } catch (Exception error) {
      span.recordException(error);
      span.setStatus(StatusCode.ERROR);
      write(exchange, 500, json("error", error.getMessage()), "application/json");
    } finally {
      span.setAttribute(AttributeKey.longKey("http.response.status_code"), status);
      span.end();
      double seconds = (System.nanoTime() - started) / 1_000_000_000.0;
      METRICS.record(method, path, status, seconds);
    }
  }

  private static Response root(HttpExchange exchange) {
    return Response.json(
        200,
        "{\"service\":\"" + SERVICE_NAME
            + "\",\"version\":\"" + SERVICE_VERSION
            + "\",\"tenant\":\"" + TENANT
            + "\",\"runtime\":\"java-httpserver-sqlite"
            + "\",\"message\":\"Hello, I am a Java telemetry endpoint. I write SQLite orders and emit Prometheus metrics and OpenTelemetry traces for the platform guardrails demo.\"}");
  }

  private static Response health(HttpExchange exchange) {
    return Response.json(200, "{\"status\":\"ok\"}");
  }

  private static Response success(HttpExchange exchange) {
    if (shouldFail()) {
      return Response.json(500, "{\"status\":\"error\",\"message\":\"configured demo failure\"}");
    }
    return Response.json(200, "{\"status\":\"ok\"}");
  }

  private static Response orders(HttpExchange exchange) throws SQLException {
    if (shouldFail()) {
      return Response.json(500, "{\"status\":\"error\",\"message\":\"order service failure\"}");
    }

    if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
      String item = query(exchange.getRequestURI()).getOrDefault("item", "demo-order");
      long id = createOrder(item);
      return Response.json(201, "{\"id\":" + id + ",\"item\":\"" + escapeJson(item) + "\"}");
    }

    return Response.json(200, listOrders());
  }

  private static Response slow(HttpExchange exchange) throws InterruptedException {
    double seconds = Double.parseDouble(query(exchange.getRequestURI()).getOrDefault("seconds", String.valueOf(DEFAULT_SLOW_SECONDS)));
    Thread.sleep(Math.max(0L, (long) (seconds * 1000)));
    return Response.json(200, "{\"status\":\"ok\",\"slept_seconds\":" + seconds + "}");
  }

  private static Response fail(HttpExchange exchange) {
    return Response.json(500, "{\"status\":\"error\",\"message\":\"intentional demo failure\"}");
  }

  private static void metrics(HttpExchange exchange) throws IOException {
    write(exchange, 200, METRICS.render(), "text/plain; version=0.0.4");
  }

  private static boolean shouldFail() {
    return ERROR_RATE_PERCENT > 0 && ThreadLocalRandom.current().nextInt(100) < ERROR_RATE_PERCENT;
  }

  private static void initDb() throws SQLException {
    try (Connection connection = connection();
         Statement statement = connection.createStatement()) {
      statement.executeUpdate("""
        create table if not exists orders (
          id integer primary key autoincrement,
          item text not null,
          created_at text not null
        )
        """);
    }
  }

  private static long createOrder(String item) throws SQLException {
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement(
           "insert into orders(item, created_at) values(?, ?)",
           Statement.RETURN_GENERATED_KEYS)) {
      statement.setString(1, item);
      statement.setString(2, Instant.now().toString());
      statement.executeUpdate();
      try (ResultSet keys = statement.getGeneratedKeys()) {
        return keys.next() ? keys.getLong(1) : -1;
      }
    }
  }

  private static String listOrders() throws SQLException {
    List<String> rows = new ArrayList<>();
    try (Connection connection = connection();
         PreparedStatement statement = connection.prepareStatement("select id, item, created_at from orders order by id desc limit 10");
         ResultSet result = statement.executeQuery()) {
      while (result.next()) {
        rows.add("{\"id\":" + result.getLong("id")
          + ",\"item\":\"" + escapeJson(result.getString("item"))
          + "\",\"created_at\":\"" + result.getString("created_at") + "\"}");
      }
    }
    return "{\"orders\":[" + String.join(",", rows) + "]}";
  }

  private static Connection connection() throws SQLException {
    return DriverManager.getConnection("jdbc:sqlite:" + DB_PATH);
  }

  private static OpenTelemetry initOpenTelemetry() {
    String endpoint = env("OTEL_EXPORTER_OTLP_ENDPOINT", "");
    if (endpoint.isBlank()) {
      return GlobalOpenTelemetry.get();
    }

    Resource resource = Resource.getDefault().toBuilder()
      .put("service.name", SERVICE_NAME)
      .put("service.version", SERVICE_VERSION)
      .put("service.namespace", "platform-guardrails-lab")
      .build();

    OtlpHttpSpanExporter exporter = OtlpHttpSpanExporter.builder()
      .setEndpoint(endpoint)
      .build();
    SdkTracerProvider provider = SdkTracerProvider.builder()
      .setResource(resource)
      .addSpanProcessor(BatchSpanProcessor.builder(exporter).build())
      .build();
    Runtime.getRuntime().addShutdownHook(new Thread(provider::close));
    return OpenTelemetrySdk.builder().setTracerProvider(provider).build();
  }

  private static Map<String, String> query(URI uri) {
    Map<String, String> values = new ConcurrentHashMap<>();
    String raw = uri.getRawQuery();
    if (raw == null || raw.isBlank()) {
      return values;
    }
    for (String part : raw.split("&")) {
      String[] pair = part.split("=", 2);
      values.put(decode(pair[0]), pair.length > 1 ? decode(pair[1]) : "");
    }
    return values;
  }

  private static String decode(String value) {
    return java.net.URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private static void write(HttpExchange exchange, int status, String body, String contentType) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", contentType);
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private static String env(String name, String fallback) {
    String value = System.getenv(name);
    return value == null || value.isBlank() ? fallback : value;
  }

  private static String json(String key, String value) {
    return "{\"" + key + "\":\"" + escapeJson(value) + "\"}";
  }

  private static String escapeJson(String value) {
    return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  @FunctionalInterface
  interface Handler {
    Response run(HttpExchange exchange) throws Exception;
  }

  record Response(int status, String body, String contentType) {
    static Response json(int status, String body) {
      return new Response(status, body, "application/json");
    }
  }

  static final class Metrics {
    private static final double[] BUCKETS = {0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10};
    private final ConcurrentHashMap<String, LongAdder> requests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LongAdder> buckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DoubleAdder> sums = new ConcurrentHashMap<>();

    void record(String method, String path, int status, double seconds) {
      String requestKey = "service=\"" + SERVICE_NAME + "\",tenant=\"" + TENANT + "\",method=\"" + method + "\",path=\"" + path + "\",status=\"" + status + "\"";
      requests.computeIfAbsent(requestKey, ignored -> new LongAdder()).increment();

      String base = "service=\"" + SERVICE_NAME + "\",tenant=\"" + TENANT + "\",method=\"" + method + "\",path=\"" + path + "\"";
      counts.computeIfAbsent(base, ignored -> new LongAdder()).increment();
      sums.computeIfAbsent(base, ignored -> new DoubleAdder()).add(seconds);
      for (double bucket : BUCKETS) {
        if (seconds <= bucket) {
          buckets.computeIfAbsent(base + ",le=\"" + trim(bucket) + "\"", ignored -> new LongAdder()).increment();
        }
      }
      buckets.computeIfAbsent(base + ",le=\"+Inf\"", ignored -> new LongAdder()).increment();
    }

    String render() {
      StringBuilder body = new StringBuilder();
      body.append("# HELP http_requests_total Total HTTP requests.\n");
      body.append("# TYPE http_requests_total counter\n");
      requests.forEach((labels, value) -> body.append("http_requests_total{").append(labels).append("} ").append(value.sum()).append('\n'));
      body.append("# HELP http_request_duration_seconds HTTP request duration.\n");
      body.append("# TYPE http_request_duration_seconds histogram\n");
      buckets.forEach((labels, value) -> body.append("http_request_duration_seconds_bucket{").append(labels).append("} ").append(value.sum()).append('\n'));
      counts.forEach((labels, value) -> body.append("http_request_duration_seconds_count{").append(labels).append("} ").append(value.sum()).append('\n'));
      sums.forEach((labels, value) -> body.append("http_request_duration_seconds_sum{").append(labels).append("} ").append(value.sum()).append('\n'));
      return body.toString();
    }

    private static String trim(double value) {
      return String.format(Locale.ROOT, "%s", value).replaceAll("\\.0$", "");
    }
  }
}
