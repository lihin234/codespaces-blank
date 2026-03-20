#!/bin/sh

# 1. Jalankan Master Bridge (Node.js) di latar belakang
node bridge.js &

# 2. Tunggu 2 detik agar Node.js sukses mengunci Port 8080
sleep 2

# 3. Jalankan Guardian Bot (Python)
python3 guardian_bot.py
