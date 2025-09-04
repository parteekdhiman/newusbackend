// Main API entry point for Vercel serverless functions
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

dotenv.config();

// Create Express app
const app = express();

// Configure middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend server is running ✅" });
});

// Lead submission endpoint
app.post("/api/lead", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }

    const adminMail = {
      from: `"Newus Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `📩 New Contact from ${firstName} ${lastName}`,
      html: `
        <h2 style="color:#4f46e5;">New Lead Received</h2>
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
        <div style="font-family:sans-serif;padding:20px;background:#f9fafb;border-radius:10px;">
          <h2 style="color:#4f46e5;">Hi ${firstName},</h2>
          <p>Thanks for reaching out! We've received your message and our team will respond within <b>24 hours</b>.</p>
          <blockquote style="border-left:4px solid #4f46e5;padding-left:10px;margin:15px 0;color:#374151;">
            ${message || "No message provided."}
          </blockquote>
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

// Newsletter subscription endpoint
app.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ ok: false, error: "Email is required" });

    // Admin gets subscriber info
    await transporter.sendMail({
      from: `"Newus Newsletter" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "📬 New Newsletter Subscription",
      html: `<p>New subscriber: <b>${email}</b></p>`,
    });

    // Auto-reply to subscriber
    await transporter.sendMail({
      from: `"Newus Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Newus Newsletter!",
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f0f9ff;border-radius:10px;">
          <h2 style="color:#0ea5e9;">Welcome aboard! 🎉</h2>
          <p>Hi there! You've successfully subscribed to our newsletter. Stay tuned for updates, tips, and exciting offers!</p>
          <p style="margin-top:20px;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} Newus. All rights reserved.</p>
        </div>
      `,
    });

    res.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Newsletter Error:", err);
    res.status(500).json({ ok: false, error: "Subscription failed" });
  }
});

// Course inquiry endpoint
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
        <h2 style="color:#4f46e5;">New Course Inquiry</h2>
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
        <div style="font-family:sans-serif;padding:20px;background:#f9fafb;border-radius:10px;">
          <h2 style="color:#4f46e5;">Hi ${fullName},</h2>
          <p>Thanks for showing interest in our <b>${course}</b> program. Our team will reach out soon with details.</p>
          <p style="margin-top:20px;">Regards,<br/><b>The Newus Team</b></p>
        </div>
      `,
    });

    res.json({ ok: true, emailSent: true, brochureUrl: brochureUrl });
  } catch (err) {
    console.error("Course Inquiry Error:", err);
    res.status(500).json({ ok: false, error: "Inquiry failed" });
  }
});

// Export app for Vercel
export default app;

// Start server locally (only in dev)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
