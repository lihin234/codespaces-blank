import time, requests, os, logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
# URL Railway Anda
WINNUX_URL = "https://codespaces-blank-production-3dba.up.railway.app"

# Variabel Internal Bot
stats = {
    "status": "Healthy",
    "ping_count": 0,
    "last_ping": "Never",
}

# --- FUNGSI PENJAGA (KEEP-ALIVE) ---
async def ping_task(context: ContextTypes.DEFAULT_TYPE):
    headers = {'User-Agent': 'Mozilla/5.0 Winnux-Guardian'}
    try:
        res = requests.get(WINNUX_URL, headers=headers, timeout=10)
        stats["ping_count"] += 1
        stats["last_ping"] = time.strftime('%H:%M:%S')
        print(f"🛡️ Heartbeat #{stats['ping_count']} OK")
    except Exception as e:
        print(f"❌ Ping Failed: {e}")

# --- HANDLER PERINTAH /START ---
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Jalankan penjadwal jika belum ada
    jobs = context.job_queue.get_jobs_by_name("guardian_job")
    if not jobs:
        context.job_queue.run_repeating(ping_task, interval=60, first=1, name="guardian_job")
    
    keyboard = [[InlineKeyboardButton("🌐 Buka Winnux OS", web_app=WebAppInfo(url=WINNUX_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🛡️ **Winnux Cloud Guardian v5.0**\n\n"
        "Status: Bot Aktif Menjaga Railway.\n"
        "Ketik /status untuk melihat kesehatan server.",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

# --- HANDLER PERINTAH /STATUS (YANG TADI HILANG) ---
async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = (f"📊 **Winnux System Health**\n\n"
           f"• Server: ONLINE (Railway)\n"
           f"• Guardian: ACTIVE\n"
           f"• Total Heartbeats: {stats['ping_count']}\n"
           f"• Last Pulse: {stats['last_ping']}\n\n"
           f"✅ Semua sistem tersinkronisasi.")
    await update.message.reply_text(msg, parse_mode="Markdown")

if __name__ == '__main__':
    if not TELEGRAM_TOKEN:
        print("❌ ERROR: TELEGRAM_TOKEN missing in Variables!")
        exit()

    print("🤖 Python Bot is initializing...")
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    
    # DAFTARKAN SEMUA PERINTAH DI SINI
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("status", status_command))
    
    print("🚀 Bot is Polling...")
    app.run_polling()
