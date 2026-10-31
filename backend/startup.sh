#!/bin/bash
if [ -d "/antenv" ]; then
    source /antenv/bin/activate
fi
gunicorn -w 1 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 600 --access-logfile - --error-logfile -
