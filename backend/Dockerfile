# Multi-stage: tầng build có JDK+Maven, tầng runtime chỉ có JRE.
# Ảnh cuối không chứa JDK, mã nguồn hay ~/.m2.

# ---------- TẦNG 1: BUILD ----------
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /build

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw

RUN ./mvnw -B dependency:go-offline

COPY src/ src/

# Bỏ test: đã chạy ở job 3 của CI, và Testcontainers cần Docker-in-Docker.
RUN ./mvnw -B clean package -DskipTests

RUN cp target/*.jar /build/app.jar

# ---------- TẦNG 2: RUNTIME ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# curl cho HEALTHCHECK bên dưới.
RUN apk add --no-cache curl

# Chạy bằng user thường, không phải root.
RUN addgroup -S lingualoop && adduser -S -D -G lingualoop lingualoop

WORKDIR /app

COPY --from=build --chown=lingualoop:lingualoop /build/app.jar /app/app.jar

USER lingualoop

EXPOSE 8080

# start-period=60s: chừa thời gian Spring Boot khởi động, chưa tính là unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:8080/actuator/health || exit 1

# Exec form: java là PID 1, nhận SIGTERM để shutdown mượt.
# MaxRAMPercentage=75.0: mặc định JVM chỉ lấy 25% RAM container làm heap.
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "/app/app.jar"]
