FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY data/ ./data/
COPY verify_setup.py .
COPY test_rag_systems.py .

# Copy documentation
COPY RAG_COMPARISON_README.md .
COPY QUICKSTART.md .
COPY DELIVERY_SUMMARY.md .

# Create results directory
RUN mkdir -p results

# Set Python path
ENV PYTHONPATH=/app/src

# Run verification on build
RUN python verify_setup.py

# Default command: run demo
CMD ["python", "src/demo/side_by_side_comparison.py"]
