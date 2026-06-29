// Gera o par de chaves VAPID para push notifications.
// Uso: npm run vapid:generate
const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();

console.log("\nAdicione estas chaves ao seu .env / Vercel Environment Variables:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"\n`);
