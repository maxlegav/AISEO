# AISEO Scraping Service Dockerfile
# Multi-stage build: Python 3.11 + vnu.jar (W3C validator) + Lychee (link checker)

# Stage 1: Download vnu.jar (W3C Nu Html Checker)
FROM eclipse-temurin:11-jre-jammy AS vnu-stage
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    wget -q -O /vnu.jar https://github.com/validator/validator/releases/download/latest/vnu.jar && \
    rm -rf /var/lib/apt/lists/*

# Stage 2: Download lychee (Rust link checker binary) — multi-arch
FROM debian:bookworm-slim AS lychee-stage
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates && \
    ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then LYCHEE_ARCH="aarch64-unknown-linux-gnu"; \
    else LYCHEE_ARCH="x86_64-unknown-linux-gnu"; fi && \
    echo "Downloading lychee for architecture: $LYCHEE_ARCH" && \
    wget -q -O /tmp/lychee.tar.gz "https://github.com/lycheeverse/lychee/releases/latest/download/lychee-${LYCHEE_ARCH}.tar.gz" && \
    tar -xzf /tmp/lychee.tar.gz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/lychee && \
    rm -rf /var/lib/apt/lists/* /tmp/*

# Stage 3: Final Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Install system dependencies: JRE (for vnu.jar) + Chromium + libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jre-headless \
    chromium \
    chromium-driver \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy tools from build stages
COPY --from=vnu-stage /vnu.jar /app/vnu.jar
COPY --from=lychee-stage /usr/local/bin/lychee /usr/local/bin/lychee

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK stopwords (needed for keyword extraction)
RUN python -c "import nltk; nltk.download('stopwords', download_dir='/usr/local/nltk_data')"

# Verify all CLI tools work at build time (fail fast, not at runtime)
RUN echo "=== Verifying CLI tools ===" && \
    java -jar /app/vnu.jar --version && echo "✓ vnu.jar OK" && \
    lychee --version && echo "✓ lychee OK" && \
    chromium --version && echo "✓ chromium OK" && \
    python -c "from nltk.corpus import stopwords; stopwords.words('french'); stopwords.words('english')" && echo "✓ NLTK stopwords OK" && \
    echo "=== All tools verified ==="

# Copy application code
COPY src/ ./src/

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check — passes Bearer token from env (silent-drop middleware requires it)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -sf -H "Authorization: Bearer $PROCESSING_SERVICE_API_KEY" http://localhost:8080/health || exit 1

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
