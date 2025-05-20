const express = require("express");
const enquri = express.Router();
const transporter = require("../utils/mailer");
const sanitizeHtml = require("sanitize-html")
enquri.use(express.json());

enquri.post("/", async (req, res) => {
  try {
    const username = sanitizeHtml(req.body.username || "");
    const last = sanitizeHtml(req.body.last || "");
    const email = sanitizeHtml(req.body.email || "");
    const phone = sanitizeHtml(req.body.phone || "");
    const coursename = sanitizeHtml(req.body.coursename || "");
    if (!username || !email || !phone || !coursename) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Admin Notification Email
    transporter.sendMail({
      from: email,
      to: [process.env.BACKUP_GMAIL_ID, process.env.GMAIL_ID],
      subject: "📩 New Course Inquiry Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #2c3e50;">New Inquiry Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px; font-weight: bold;">👤 Name:</td><td style="padding: 10px;">${username} ${last}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">📧 Email:</td><td style="padding: 10px;">${email}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">📞 Phone:</td><td style="padding: 10px;">${phone}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">🎓 Course Name:</td><td style="padding: 10px;">${coursename}</td></tr>
          </table>
        </div>
      `,
    });

    // Confirmation Email to User
    await transporter.sendMail({
      from: process.env.GMAIL_ID,
      to: email,
      subject: "✅ Inquiry Received – Thank You!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaeaea; padding: 20px; background-color: #ffffff;">
          <h2 style="color: #2c3e50;">Hi ${username} ${last}</h2>
          <p>Thank you for reaching out about <strong>${coursename}</strong>. We’ve received your inquiry and will get back to you shortly.</p>
          <p style="margin-top: 15px;">Here’s what you submitted:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
          </ul>
          <p>If you have any urgent questions, feel free to reply to this email.</p>
          <br>
          <p>Best regards,<br><strong>NewUS Dharamshala</strong></p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ccc;">
          <p style="font-size: 14px; color: #555;">
            <strong>📍 Office:</strong> 59, Civil Lines, Chilgari, Dharamshala<br>
            <strong>📧 Contact:</strong> newusdharamshala@gmail.com, newusdshala@gmail.com<br>
            <strong>📞 Phone:</strong> 86796 86796
          </p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Inquiry submitted and confirmation sent.",
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = enquri;
