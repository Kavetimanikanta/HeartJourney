require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./config');

const app = express();

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

// ---- File upload setup (payment screenshots) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeOrderId = (req.body.orderId || 'order').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${safeOrderId}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// optional: email setup (nodemailer)
const nodemailer = require('nodemailer');
let mailTransport = null;
if(process.env.SMTP_HOST){
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR)); // used by the admin order list below

// ---- Helpers ----
function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ---- Routes ----

// Customer submits name/phone/email + payment screenshot after paying.
app.post('/api/orders', (req, res) => {
  upload.single('screenshot')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    const { orderId, name, phone, email, whatsapp } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }
    if (!phone || !/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit phone number is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Payment screenshot is required.' });
    }

    const orders = readOrders();
    const order = {
      id: orders.length + 1,
      orderId: orderId || `order_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      whatsapp: (whatsapp || '').trim(),
      screenshot: `/uploads/${req.file.filename}`,
      price: config.PRICE,
      status: 'pending_verification',
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    writeOrders(orders);

    // send admin email notification if mail configured
    if(mailTransport){
      const adminMsg = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'owner@example.com',
        subject: `New order received: ${order.orderId} — ${config.PRODUCT_NAME}`,
        text: `New order ${order.orderId} received from ${order.name} (${order.phone}).`,
        html: `<p>New order <strong>${order.orderId}</strong> received from ${order.name} (${order.phone}).</p>`
      };
      mailTransport.sendMail(adminMsg).catch(()=>{});
    }

    // send customer email with ebook link (if email provided)
    if(mailTransport && order.email){
      try{
        const siteOrigin = config.CLIENT_BASE_URL || process.env.SITE_ORIGIN || `http://localhost:${config.PORT}`;
        const ebookUrl = siteOrigin + (config.EBOOK_URL || '/ebook.pdf');
        const customerMsg = {
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: order.email,
          subject: `Your order ${order.orderId} — ${config.APP_NAME}`,
          text: `Namaste! Aapka ${config.APP_NAME} ebook ready hai. Download: ${ebookUrl} \n\nOrder ID: ${order.orderId} \n\nShukriya for your order!`,
          html: `<p>Namaste! 🙏</p><p>Aapka <strong>${config.APP_NAME}</strong> ebook ready hai.</p><p><a href="${ebookUrl}" target="_blank">Download your ebook</a></p><p>Order ID: <strong>${order.orderId}</strong></p><p>Shukriya for your order!</p>`
        };
        // attach PDF if present in public folder
        const ebookPath = path.join(__dirname, 'public', (config.EBOOK_URL || '/ebook.pdf').replace(/^\//,''));
        if(fs.existsSync(ebookPath)){
          customerMsg.attachments = [{ filename: path.basename(ebookPath), path: ebookPath }];
        }
        mailTransport.sendMail(customerMsg).catch(()=>{});
      }catch(e){ /* ignore email errors */ }
    }

    res.json({ success: true, message: 'Order received', orderId: order.orderId });
  });
});

// Simple admin view of submitted orders: /api/orders?adminUsername=USER&adminKey=PASSWORD
function isAdmin(req){
  if (req.query.key === config.ADMIN_KEY) {
    return true;
  }
  const usernameMatches = req.query.adminUsername === config.ADMIN_USERNAME;
  const passwordMatches = req.query.adminPassword === config.ADMIN_PASSWORD;
  const keyMatches = req.query.adminKey === config.ADMIN_KEY;
  return usernameMatches && (passwordMatches || keyMatches);
}

app.get('/api/orders', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  res.json({ success: true, orders: readOrders() });
});

// Approve an order (mark as paid) — requires admin login
app.post('/api/orders/:orderId/approve', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const orders = readOrders();
  const ord = orders.find(o => o.orderId === req.params.orderId || String(o.id) === req.params.orderId);
  if (!ord) return res.status(404).json({ success: false, error: 'Order not found' });
  ord.status = 'paid';
  ord.approvedAt = new Date().toISOString();
  writeOrders(orders);
  res.json({ success: true, order: ord });
});

// Public config the frontend can read instead of hardcoding values (optional use).
app.get('/api/config', (req, res) => {
  res.json({
    appName: config.APP_NAME,
    productName: config.PRODUCT_NAME,
    merchantUpi: config.MERCHANT_UPI,
    whatsappNumber: config.WHATSAPP_NUMBER,
    price: config.PRICE,
    ebookUrl: config.EBOOK_URL,
    clientBaseUrl: config.CLIENT_BASE_URL
  });
});

app.listen(config.PORT, () => {
  console.log(`Server running at http://localhost:${config.PORT}`);
  console.log(`Admin order list: http://localhost:${config.PORT}/api/orders?key=${config.ADMIN_KEY}`);
});
