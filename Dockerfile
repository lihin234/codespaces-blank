# Gunakan OS Linux dengan Node.js v20 bawaan
FROM node:20-slim

# Bypass interaksi saat instalasi OS
ENV DEBIAN_FRONTEND=noninteractive

# Update OS dan paksa instalasi Python3 + PIP
RUN apt-get update && apt-get install -y python3 python3-pip

# Tentukan folder kerja di dalam server Railway
WORKDIR /app

# Pindahkan semua file proyek Anda ke dalam server
COPY . /app

# Instalasi Dependencies Node.js
RUN npm install

# Instalasi Dependencies Python (Bypass proteksi PEP-668 Debian)
RUN pip3 install --break-system-packages -r requirements.txt

# Eksekusi Paralel Backend (Terminal Bridge & Guardian Bot)
CMD ["sh", "-c", "node bridge.js & python3 guardian_bot.py"]
