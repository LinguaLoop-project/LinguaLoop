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
# Không dùng Alpine: Azure Speech SDK mang thư viện native build cho glibc,
# cần libstdc++ và OpenSSL, nên không nạp được trên musl (lỗi
# "libstdc++.so.6: No such file or directory" khi chấm Shadowing).
FROM eclipse-temurin:21-jre-jammy AS runtime

# curl cho HEALTHCHECK; libstdc++6, libssl3, ca-certificates cho Speech SDK.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl libstdc++6 libssl3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Chạy bằng user thường, không phải root.
RUN groupadd --system lingualoop \
 && useradd --system --gid lingualoop --no-create-home lingualoop

WORKDIR /app

COPY --from=build --chown=lingualoop:lingualoop /build/app.jar /app/app.jar

USER lingualoop

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod

# start-period=60s: chừa thời gian Spring Boot khởi động, chưa tính là unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:8080/actuator/health || exit 1

# Exec form: java là PID 1, nhận SIGTERM để shutdown mượt.
# MaxRAMPercentage=75.0: mặc định JVM chỉ lấy 25% RAM container làm heap.
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "/app/app.jar"]
