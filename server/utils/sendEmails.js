// server/utils/sendEmails.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // App Password
  },
});

export async function sendEmails(candidates, {
  subject = `Interview Invitation - ${process.env.COMPANY_NAME || "Our Company"}`,
  template
} = {}) {
  // candidates expected like: [ [name, email, phone, date], ... ]
  for (const row of candidates) {
    const [name, email, phone, date] = row;
    if (!email || email === "Unknown") continue;

    const text = template
      ? template({ name, email, phone, date })
      : `Hello ${name},

We received your application on ${date}. Our recruiter will contact you shortly.

Thanks,
${process.env.COMPANY_NAME || "Recruitment Team"}`;

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER,
      to: email,
      subject,
      text,
    });
  }
}
