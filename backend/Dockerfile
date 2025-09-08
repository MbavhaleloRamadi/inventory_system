# ./backend/Dockerfile

FROM python:3.10-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/backend  

# Working directory (where manage.py lives)
WORKDIR /backend

# Install dependencies
COPY requirements.txt /backend/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /backend/

# Expose port
EXPOSE 8000

# Run Gunicorn
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
