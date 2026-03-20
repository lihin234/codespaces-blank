import time, requests, os
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("TELEGRAM_TOKEN")
URL = "https://codespaces-blank-production-3dba.up.railway.app"

async def start(update, context):
    await update.message.reply_text("🛡️ Guardian Cloud v5.2 Active.")

if __name__ == '__main__':
    if not TOKEN: exit()
    # Hardened Initialization
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    
    print("🤖 Bot is cleaning queue and starting...")
    # drop_pending_updates=True adalah fitur kunci untuk mengatasi Conflict
    app.run_polling(drop_pending_updates=True, close_loop=False)
