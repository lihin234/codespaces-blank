FROM node:20-slim
RUN apt-get update && apt-get install -y python3 python3-pip
WORKDIR /app
COPY . .
RUN npm install --production
RUN pip3 install --break-system-packages flask flask-cors requests python-telegram-bot apscheduler
EXPOSE 8080
CMD ["npm", "start"]
