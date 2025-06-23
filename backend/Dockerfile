FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE=raw_code.settings


WORKDIR /code
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
