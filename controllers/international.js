const express = require("express");
const inter = express.Router();
const validator = require("validator");
const transporter = require("../utils/mailer");

// Email Templates
const getAdminEmailHTML = ({ name, phone, email }) => `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f7ff; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 25px; box-shadow: 0 8px 24px rgba(78, 107, 255, 0.15); }
        h2 { color: rgb(78, 107, 255); font-weight: 700; margin-top: 0; }
        p { font-size: 16px; line-height: 1.5; }
        .highlight { color: rgb(78, 107, 255); font-weight: 600; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>New International Form Submission</h2>
        <p><span class="highlight">Name:</span> ${name}</p>
        <p><span class="highlight">Phone:</span> ${phone}</p>
        <p><span class="highlight">Email:</span> ${email}</p>
        <hr />
        <p>Thank you for your interest! Our team will get back to you shortly.</p>
        <div class="footer">© ${new Date().getFullYear()} International Certification Programs</div>
      </div>
    </body>
  </html>
`;

const getAutoReplyHTML = (name) => `
   <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f7ff; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 25px; box-shadow: 0 8px 24px rgba(78, 107, 255, 0.15); }
        h2 { color: rgb(78, 107, 255); font-weight: 700; margin-top: 0; }
        p { font-size: 16px; line-height: 1.5; }
        a.button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 25px;
          background-color: rgb(78, 107, 255);
          color: white !important;
          text-decoration: none;
          font-weight: 600;
          border-radius: 30px;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Hello ${name},</h2>
        <p>Thank you for submitting the International Certification form.</p>
        <p>We appreciate your interest and will connect with you soon with more information.</p>
        <p>Meanwhile, feel free to revisit our website or contact us anytime.</p>
        <a href="https://newus.in" class="button" target="_blank">Visit Our Website</a>
        <div class="footer">© ${new Date().getFullYear()} International Certification Programs by newus dharamshala</div>
      </div>
    </body>
  </html>
`;

// POST /api/send-email
inter.post("/", async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    return res
      .status(400)
      .json({ error: "Name, phone, and email are required." });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    await transporter.sendMail({
      from: `"International Certification" <${email}>`,
      to: process.env.GMAIL_ID,
      subject: "New International Form Submission",
      html: getAdminEmailHTML({ name, phone, email }),
    });

    await transporter.sendMail({
      from: `"International Certification" <${process.env.GMAIL_ID}>`,
      to: email,
      subject: "Thank you for your submission",
      html: getAutoReplyHTML(name),
    });

    return res.status(200).json({ message: "Emails sent successfully." });
  } catch (err) {
    console.error("Email send failed:", err);
    return res.status(500).json({ error: "Failed to send emails." });
  }
});

module.exports = inter;
