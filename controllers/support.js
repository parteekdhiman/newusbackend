const express = require("express");
const router = express.Router();
const transporter = require("../utils/mailer");
const sanitizeHtml = require("sanitize-html");

function cleanInput(dirty) {
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

router.post("/", async (req, res) => {
  const fullname = cleanInput(req.body.fullname || "");
  const email = cleanInput(req.body.email || "");
  const phone = cleanInput(req.body.phone || "");
  const subject = cleanInput(req.body.subject || "");
  const message = cleanInput(req.body.message || "");

  if (!fullname || !email || !message) {
    return res
      .status(400)
      .json({ error: "Please fill in all required fields." });
  }

  try {
    const supportHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#2a9d8f;">New Support Form Submission</h2>
        <p><strong>Name:</strong> ${fullname}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#264653;">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <p><strong>Message: ${message}</strong></p>
        <p style="background:#f0f0f0; padding: 1em; border-radius: 5px; white-space: pre-wrap;"></p>
      </div>
    `;

    await transporter.sendMail({
      from: `${email}`,
      to: [process.env.BACKUP_GMAIL_ID, process.env.GMAIL_ID],
      subject: subject || "New Support Form Submission",
      html: supportHtml,
    });

    const autoReplyHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #444;">
        <p>Dear <strong>${fullname}</strong>,</p>
        <p>Thank you for reaching out to us. We've received your message and will get back to you as soon as possible.</p>
        <hr style="border:none; border-top:1px solid #ddd; margin:1em 0;">
        <p><strong>Your Message:</strong></p>
        <blockquote style="background:#e9f5f2; padding:1em; border-left:4px solid #2a9d8f; white-space: pre-wrap;">${message}</blockquote>
        <p>Best regards,<br>Your Company Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `${process.env.GMAIL_ID}`,
      to: email,
      subject: "Thank you for contacting us!",
      html: autoReplyHtml,
    });

    res
      .status(200)
      .json({ message: "Form submitted and auto-reply sent successfully." });
  } catch (error) {
    console.error("Support form mail error:", error);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
});

module.exports = router;
