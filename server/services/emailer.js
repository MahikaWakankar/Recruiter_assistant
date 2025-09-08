import nodemailer from 'nodemailer';

export function createTransporter({ host, port, user, pass }) {
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

export async function sendRecruitmentEmail(transporter, { to, from, candidateName, companyName }) {
  const subject = `Exciting Opportunity at ${companyName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hello ${candidateName || 'there'}!</h2>
      
      <p>Thank you for sharing your resume with us. After reviewing your profile, we're impressed with your background and would love to discuss potential opportunities at <strong>${companyName}</strong>.</p>
      
      <p>We have several positions that might be a great fit for your skills and experience. Would you be available for a brief 20-30 minute call this week to explore these opportunities?</p>
      
      <p>Please reply with your availability, and we'll schedule a convenient time to connect.</p>
      
      <p>Looking forward to hearing from you!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p><strong>Best regards,</strong><br/>
        Recruitment Team<br/>
        <strong>${companyName}</strong></p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  return info.messageId;
}

