FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

ENV PORT=8080 \
    SERVICE_NAME=java-telemetry-api \
    SERVICE_VERSION=0.1.0 \
    DB_PATH=/data/orders.db

WORKDIR /app
COPY --from=build /src/target/java-telemetry-api-0.1.0.jar /app/app.jar

RUN addgroup --system --gid 10001 appuser \
  && adduser --system --uid 10001 --gid 10001 appuser \
  && mkdir -p /data \
  && chown -R 10001:10001 /app /data

USER 10001:10001

EXPOSE 8080

CMD ["java", "-jar", "/app/app.jar"]
