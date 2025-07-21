# ./backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory to match docker-compose.yml
WORKDIR /backend

# Copy and install requirements
COPY requirements.txt /backend/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project code
COPY . /backend/