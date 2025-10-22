FROM python:3.11-slim


# Accept build arg for environment
ARG ENVIRONMENT
ENV ENVIRONMENT=$ENVIRONMENT

WORKDIR /app

# Copy requirements and application code
COPY backend/pyproject.toml backend/run.py /app/
COPY backend/src/ /app/src/
# Copy the entire backend directory to handle optional files
COPY backend/ /app/backend/

# Create directory for credentials
RUN mkdir -p /app/credentials

# Install pip and dependencies
RUN pip install .

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Run the application
CMD ["python", "run.py"] 