import time, requests, threading, os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# --- KONFIGURASI ---
TELEGRAM_TOKEN = "8612294814:AAHadl3xcYCDwygsSvc4n-Df0roR5Dq4vC8"
BASE_URL = "redesigned-fiesta-g5pvr5g9q5wcw7qv" 
DOMAIN = ".app.github.dev"
WINNUX_URL = f"https://{BASE_URL}-5173{DOMAIN}"
INFRA_URL = f"https://{BASE_URL}{DOMAIN}/" # URL Utama Infrastruktur

TARGETS = {
    "App": WINNUX_URL,
    "Bridge": f"https://{BASE_URL}-3001{DOMAIN}",
    "API": f"https://{BASE_URL}-3002{DOMAIN}"
}

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

stats = {
    "status": "Healthy",
    "ping_count": 0,
    "last_ping": "Never",
    "targets_status": {"App": "OK", "Bridge": "OK", "API": "OK"},
    "next_ping": 30,
    "server_uptime": 0
}

# --- 1. REAL-TIME ENGINE ---
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@app.route('/stats')
def get_stats(): return jsonify(stats)

def broadcast_stats():
    while True:
        stats["server_uptime"] += 1
        if stats["next_ping"] > 0: stats["next_ping"] -= 1
        socketio.emit('live_update', stats)
        time.sleep(1)

# --- 2. LOGIKA PENGECEKAN (30 DETIK) ---
async def ping_task(context):
    all_ok = True
    for name, url in TARGETS.items():
        try:
            res = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
            if "github" in res.text.lower() or "sign in" in res.text.lower():
                stats["targets_status"][name] = "PRIVATE"
                all_ok = False
            else:
                stats["targets_status"][name] = "ONLINE" if res.status_code < 500 else "ERR"
        except:
            stats["targets_status"][name] = "OFFLINE"
            all_ok = False
    
    stats["ping_count"] += 1
    stats["last_ping"] = time.strftime('%H:%M:%S')
    stats["status"] = "Healthy" if all_ok else "Warning"
    stats["next_ping"] = 30

# --- 3. LOGIKA AKSES INFRASTRUKTUR (1 MENIT) ---
async def infra_keepalive_task(context):
    try:
        # Mengakses URL utama .github.dev
        requests.get(INFRA_URL, headers=HEADERS, timeout=15)
        print(f"[{time.strftime('%H:%M:%S')}] 🛡️ Infra Keep-Alive Success!")
    except Exception as e:
        print(f"Infra Keep-Alive Failed: {e}")

# --- 4. BOT TELEGRAM ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Jalankan Pengecekan Port (30s)
    if not context.job_queue.get_jobs_by_name("job_30s"):
        context.job_queue.run_repeating(ping_task, interval=30, first=1, name="job_30s")
    
    # Jalankan Akses Infrastruktur (60s)
    if not context.job_queue.get_jobs_by_name("job_60s"):
        context.job_queue.run_repeating(infra_keepalive_task, interval=60, first=5, name="job_60s")
    
    kb = [[InlineKeyboardButton("🌐 Buka Winnux OS", web_app=WebAppInfo(url=WINNUX_URL))]]
    await update.message.reply_text(f"🛡️ **Guardian Engine v4.4 AKTIF!**\n- Port Check: 30s\n- Infra Keep-Alive: 60s", 
                                  reply_markup=InlineKeyboardMarkup(kb), parse_mode="Markdown")

if __name__ == '__main__':
    threading.Thread(target=broadcast_stats, daemon=True).start()
    def run_socket():
        socketio.run(app, host='0.0.0.0', port=3002, allow_unsafe_werkzeug=True)
    threading.Thread(target=run_socket, daemon=True).start()
    
    tg = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    tg.add_handler(CommandHandler("start", start))
    tg.run_polling()
