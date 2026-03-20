import time, requests, os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
# Gunakan URL Railway Anda sebagai target
BASE_URL = "codespaces-blank-production-3dba.up.railway.app"
WINNUX_URL = f"https://{BASE_URL}"

async def ping_task(context):
    headers = {'User-Agent': 'Mozilla/5.0 Winnux-Guardian'}
    try:
        # Mengetuk pintu Node.js (Port Utama)
        requests.get(WINNUX_URL, headers=headers, timeout=10)
        print(f"[{time.strftime('%H:%M:%S')}] 🛡️ Heartbeat sent to Cloud Bridge")
    except:
        print("❌ Ping failed")

async def start(update, context):
    jobs = context.job_queue.get_jobs_by_name("job")
    if not jobs:
        context.job_queue.run_repeating(ping_task, interval=30, first=1, name="job")
    
    kb = [[InlineKeyboardButton("🌐 Buka Winnux OS", web_app=WebAppInfo(url=WINNUX_URL))]]
    await update.message.reply_text("🛡️ **Winnux Guardian 24/7 Online!**\nServer terjaga oleh infrastruktur Railway.", 
                                  reply_markup=InlineKeyboardMarkup(kb), parse_mode="Markdown")

if __name__ == '__main__':
    if not TELEGRAM_TOKEN:
        print("Token missing!")
        exit()
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("🤖 Telegram Bot Standby...")
    app.run_polling()
