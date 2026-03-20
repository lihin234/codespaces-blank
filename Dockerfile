FROM node:20-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip
WORKDIR /app
COPY package.json .
# Instalasi bersih tanpa diganggu file lama
RUN npm install
COPY . .
RUN pip3 install --break-system-packages -r requirements.txt
EXPOSE 8080
CMD ["sh", "-c", "node bridge.js & python3 guardian_bot.py"]
