import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

// Load .env only when running locally
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

// Middleware
const allowedOrigins = [
  'https://newus.in',
  'https://newus-tau.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Add FRONTEND_URL from environment if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Normalize possible trailing slash on origin
    const normalizedOrigin = origin?.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(normalizedOrigin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ------------------ ROUTES ------------------



app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Newus API</title>
    </head>
    <body>
      <h1>🚀 Welcome to Newus API</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/health">/health</a></li>
        <li><a href="/lead">/lead</a></li>
      </ul>
    </body>
    </html>
  `);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend server is running ✅" });
});

// Lead submission
app.post("/api/lead", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const adminMail = {
      from: `"Newus Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📩 New Contact from ${firstName} ${lastName}`,
      html: `
        <h2>New Lead Received</h2>
        <p><b>Name:</b> ${firstName} ${lastName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message || "No message provided"}</p>
      `,
    };

    const userMail = {
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Thanks for contacting Newus",
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f9fafb;">
          <h2>Hi ${firstName},</h2>
          <p>Thanks for reaching out! We'll respond within <b>24 hours</b>.</p>
          <blockquote>${message || "No message provided."}</blockquote>
          <p>Best regards,<br/><b>The Newus Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Lead Error:", err);
    res.status(500).json({ ok: false, error: "Email sending failed" });
  }
});

// Newsletter
app.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: "Email is required" });

    await transporter.sendMail({
      from: `"Newus Newsletter" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "📬 New Newsletter Subscription",
      html: `<p>New subscriber: <b>${email}</b></p>`,
    });

    await transporter.sendMail({
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Newus Newsletter!",
      html: `
        <div style="padding:20px;background:#f0f9ff;">
          <h2>Welcome aboard! 🎉</h2>
          <p>You’ve successfully subscribed to our newsletter.</p>
          <p style="margin-top:20px;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} Newus. All rights reserved.</p>
        </div>
      `,
    });

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Newsletter Error:", err);
    res.status(500).json({ ok: false, error: "Subscription failed" });
  }
});

// Course inquiry
app.post("/api/course-inquiry", async (req, res) => {
  try {
    const { fullName, email, course, brochureUrl } = req.body;
    if (!fullName || !email || !course) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    await transporter.sendMail({
      from: `"Newus Courses" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🎓 Course Inquiry: ${course}`,
      html: `
        <h2>New Course Inquiry</h2>
        <p><b>Name:</b> ${fullName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Course:</b> ${course}</p>
      `,
    });

    await transporter.sendMail({
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📘 Inquiry Received: ${course}`,
      html: `
        <div style="padding:20px;background:#f9fafb;">
          <h2>Hi ${fullName},</h2>
          <p>Thanks for your interest in <b>${course}</b>. We'll reach out soon with details.</p>
          <p>Regards,<br/><b>The Newus Team</b></p>
        </div>
      `,
    });

    res.json({ ok: true, emailSent: true, brochureUrl });
  } catch (err) {
    console.error("Course Inquiry Error:", err);
    res.status(500).json({ ok: false, error: "Inquiry failed" });
  }
});

// Registration/Enrollment form
app.post("/api/register", async (req, res) => {
  try {
    const { name, address, contact, email, stream, passout, whatsappNo } = req.body;
    
    if (!name || !contact || !email || !whatsappNo) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email address" });
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contact.replace(/[\s\-()]/g, ""))) {
      return res.status(400).json({ ok: false, error: "Invalid contact number" });
    }

    const adminMail = {
      from: `"Newus Registration" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📝 New Registration: ${name}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f9fafb;">
          <h2>New Registration Received</h2>
          <div style="background:white;padding:20px;border-radius:8px;margin-top:15px;">
            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Contact:</b> ${contact}</p>
            <p><b>WhatsApp:</b> ${whatsappNo}</p>
            ${address ? `<p><b>Address:</b> ${address}</p>` : ''}
            ${stream ? `<p><b>Stream:</b> ${stream}</p>` : ''}
            ${passout ? `<p><b>Passout Year:</b> ${passout}</p>` : ''}
          </div>
          <p style="margin-top:20px;color:#6b7280;font-size:14px;">
            This is an automated message from the Newus registration form.
          </p>
        </div>
      `,
    };

    const userMail = {
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Registration Successful - Welcome to Newus!",
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f9fafb;">
          <div style="background:white;padding:30px;border-radius:8px;max-width:600px;margin:0 auto;">
            <h2 style="color:#3b82f6;margin-top:0;">Hi ${name},</h2>
            <p>Thank you for registering with <b>Newus Dharamshala</b>! 🎉</p>
            <p>We've received your registration details and our team will get in touch with you shortly.</p>
            
            <div style="background:#f0f9ff;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #3b82f6;">
              <p style="margin:0;"><b>What's Next?</b></p>
              <ul style="margin:10px 0;padding-left:20px;">
                <li>Our team will review your registration</li>
                <li>We'll contact you within 24 hours</li>
                <li>We'll guide you through the enrollment process</li>
              </ul>
            </div>
            
            <p>If you have any questions, feel free to contact us at:</p>
            <p>
              📞 <b>Phone:</b> 86796 86796<br/>
              📧 <b>Email:</b> newusdharamshala@gmail.com
            </p>
            
            <p style="margin-top:30px;">Best regards,<br/><b>The Newus Team</b></p>
          </div>
          <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:20px;">
            © ${new Date().getFullYear()} Newus Dharamshala. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    res.json({ ok: true, emailSent: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ ok: false, error: "Registration failed" });
  }
});

// Export for Vercel
export default app;

// Start locally (dev only)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
