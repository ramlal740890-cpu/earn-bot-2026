# 🚀 Earn Bot 2026 - Premium Earning Telegram Bot

Ye ek advanced Telegram Earning Bot hai jise **Vercel** aur **Firebase** ka use karke banaya gaya hai. Isme ek premium Web App Dashboard hai jahan users ads dekh kar aur daily bonus claim karke paise kama sakte hain.

## ✨ Features
- 💎 **Premium UI:** Tailwind CSS se bana modern dashboard.
- ⏱️ **15s Timer:** Ads watch karne par automatic point collection.
- 💰 **Daily Bonus:** Har 24 ghante mein points claim karne ka system.
- 💳 **Withdrawal:** Dashboard se hi UPI ID ke through payout request.
- 📢 **Refer & Earn:** Friends ko invite karne par extra points.
- 🛠️ **Firebase Backend:** User ka balance aur withdrawal data safe store hota hai.

## 🛠️ Setup Instructions

### 1. Firebase Setup
- Ek naya Firebase project banayein.
- **Firestore Database** enable karein aur rules mein `allow read, write: if true;` set karein.
- **Service Account JSON** download karein (Project Settings > Service Accounts).

### 2. Vercel Deployment
- GitHub repository ko Vercel se connect karein.
- Niche diye gaye **Environment Variables** add karein:
  - `BOT_TOKEN`: Aapka Telegram Bot Token (@BotFather se).
  - `ADMIN_ID`: Aapka numerical Telegram ID.
  - `FIREBASE_SERVICE_ACCOUNT`: Firebase JSON ka poora content (Minified).

### 3. Webhook Set Karein
Deploy hone ke baad niche di gayi link ko browser mein run karein:
`https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_APP>.vercel.app/api/bot`

## 📁 Project Structure
- `api/bot.js` - Main Telegram Bot logic.
- `index.html` - Premium Web App Dashboard.
- `package.json` - Dependencies aur scripts.
- `.env.example` - Environment variables ka template.

---
**Developed by:** [Trendmansun](https://trendmansun.com/gst-app)  
**YouTube:** [@Trendmansun](https://www.youtube.com/@Trendmansun)
