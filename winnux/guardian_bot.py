import time, requests, threading, os, socket
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from dotenv import load_dotenv

# --- LOAD RAHASIA ---
load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
BASE_URL = "redesigned-fiesta-g5pvr5g9q5wcw7qv" 
DOMAIN = ".app.github.dev"
WINNUX_URL = f"https://{BASE_URL}-5173{DOMAIN}"

if not TELEGRAM_TOKEN:
    print("❌ ERROR: Token tidak ditemukan di file .env!")
    exit()

TARGETS = {
    "App": WINNUX_URL,
    "Bridge": f"https://{BASE_URL}-3001{DOMAIN}",
    "API": f"https://{BASE_URL}-3002{DOMAIN}"
}

stats = {
    "status": "Healthy",
    "ping_count": 0,
    "last_ping": "Never",
    "targets_status": {"App": "OK", "Bridge": "OK", "API": "OK", "SSH": "OK"},
    "next_ping": 30,
    "server_uptime": 0
}

app = Flask(__name__); CORS(app); socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
@app.route('/stats')
def get_stats(): return jsonify(stats)

def broadcast_stats():
    while True:
        stats["server_uptime"] += 1
        if stats["next_ping"] > 0: stats["next_ping"] -= 1
        socketio.emit('live_update', stats)
        time.sleep(1)

async def ping_task(context):
    all_ok = True
    for name, url in TARGETS.items():
        try:
            res = requests.get(url, timeout=10, allow_redirects=True)
            if "github" in res.text.lower():
                stats["targets_status"][name] = "PRIVATE"
                all_ok = False
            else:
                stats["targets_status"][name] = "ONLINE" if res.status_code < 500 else "ERR"
        except:
            stats["targets_status"][name] = "OFFLINE"
            all_ok = False
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(2)
        ssh_status = s.connect_ex(('127.0.0.1', 2222))
        stats["targets_status"]["SSH"] = "ONLINE" if ssh_status == 0 else "OFFLINE"
        if ssh_status != 0: all_ok = False

    stats["ping_count"] += 1
    stats["last_ping"] = time.strftime('%H:%M:%S')
    stats["status"] = "Healthy" if all_ok else "Warning"
    stats["next_ping"] = 30

async def start(update, context):
    if not context.job_queue.get_jobs_by_name("job"):
        context.job_queue.run_repeating(ping_task, interval=30, first=1, name="job")
    kb = [[InlineKeyboardButton("🌐 Buka Winnux OS", web_app=WebAppInfo(url=WINNUX_URL))]]
    await update.message.reply_text("🛡️ **Guardian v4.7 (Secured) AKTIF!**", reply_markup=InlineKeyboardMarkup(kb), parse_mode="Markdown")

if __name__ == '__main__':
    threading.Thread(target=broadcast_stats, daemon=True).start()
    threading.Thread(target=lambda: socketio.run(app, host='0.0.0.0', port=3002, allow_unsafe_werkzeug=True), daemon=True).start()
    tg = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    tg.add_handler(CommandHandler("start", start))
    tg.run_polling()
