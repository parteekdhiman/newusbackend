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
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
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
          <p>Thanks for your interest in <b>${course}</b>. We’ll reach out soon with details.</p>
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

// Export for Vercel
export default app;

// Start locally (dev only)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
