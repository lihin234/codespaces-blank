FROM node:20-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip
WORKDIR /app
COPY . /app
RUN npm install
RUN pip3 install --break-system-packages -r requirements.txt
EXPOSE 8080
# Railway hanya menjalankan Master Node, Python akan dipanggil oleh Node
CMD ["node", "bridge.js"]
