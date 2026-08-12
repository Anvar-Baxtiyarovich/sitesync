# 📱 SiteSync Mobile Application Build Guide (CapacitorJS & PWA)

Ushbu yo'riqnoma orqali SiteSync loyihasini **Android (`.apk`)** va **iOS (`.ipa`)** mobil ilovalariga o'girish hamda **PWA (Progressive Web App)** shaklida o'rnatish mumkin.

---

## ⚡ 1-USUL: PWA (Nol o'rnatish - 1 Daqiqada)

Foydalanuvchi ilovani Play Market yoki App Store ga kirmasdan, telefon brauzerida ishlatishi mumkin:

1. Telefon brauzerida (Chrome / Safari) Vercel saytingizni ochasiz (masalan: `https://sitesync.vercel.app`).
2. Brauzer menyusidan **"Asosiy ekranga qo'shish" (Add to Home Screen)** tugmasini bosing.
3. Telefoningiz ekranida **SiteSync** ilova belgisi paydo bo'ladi va to'liq ekranda (fullscreen native app) ishlaydi.

---

## 📦 2-USUL: Capacitor.js Orqali Android APK Yaratish

### 1. Paketlarni o'rnatish (Lokal terminalda):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### 2. Android platformasini qo'shish:
```bash
npx cap add android
```

### 3. Android Studio da ochish va APK tayyorlash:
```bash
npx cap open android
```
- Android Studio ochilgach: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** tugmasini bosing.
- Tayyor `.apk` fayli telefoningizga o'rnatiladi!

---

## 🔄 Avtomatik Sinxronizatsiya Afzalligi:
`capacitor.config.json` da server URL Vercel bilan bog'langanligi sababli, **kelajakda Vercel'da kodingizni yangilasangiz, foydalanuvchilarning telefonidagi mobil ilova ham avtomatik ravishda yangilanadi!**
