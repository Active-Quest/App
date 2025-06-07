FROM python:3.10

WORKDIR /app
COPY . .

RUN pip intall --no-cache-dir -r requirements.txt

EXPOSE 3737
CMD ["python", "server.py"]
