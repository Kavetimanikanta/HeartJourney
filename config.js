// Edit these values for your business — nothing else in the backend needs to change.
module.exports = {
  PORT: Number(process.env.PORT || 3000),
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL || process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 3000}`,
  APP_NAME: process.env.APP_NAME || process.env.PRODUCT_NAME || 'My website',
  PRODUCT_NAME: process.env.PRODUCT_NAME || 'Dil Se Shayari',
  PRICE: Number(process.env.PRODUCT_PRICE_INR || 149),
  MERCHANT_UPI: process.env.UPI_ID || '9346694527@ybl',
  UPI_PAYEE_NAME: process.env.UPI_PAYEE_NAME || 'Dil Se Shayari',
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '91934694527',
  EBOOK_URL: process.env.EBOOK_URL || '/ebook.pdf',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme123',
  ADMIN_KEY: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || 'changeme123',
  DOWNLOAD_TOKEN_SECRET: process.env.DOWNLOAD_TOKEN_SECRET || 'download-secret',
  DOWNLOAD_TOKEN_EXPIRY: process.env.DOWNLOAD_TOKEN_EXPIRY || '48h',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply@example.com',
  ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'owner@example.com'
};
