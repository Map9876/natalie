FROM python:3.9-slim

WORKDIR /app

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app /app

# 设置容器启动时执行的命令
CMD ["python", "main.py"]