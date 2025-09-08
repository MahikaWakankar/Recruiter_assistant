import express from 'express';
import rateLimit from 'express-rate-limit';
import Candidate from '../models/Candidate.js';
import { createTransporter, sendRecruitmentEmail } from '../services/emailer.js';

const router = express.Router();

// Rate limiting for email sending
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 emails per hour
  message: { error: 'Too many emails sent, please try again later' }
});

// Create transporter
const transporter = createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS
});

// Send email to candidate
router.post('/send/:id', emailLimiter, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (!candidate.email) {
      return res.status(400).json({ error: 'Candidate email is missing' });
    }
    
    if (candidate.status === 'emailed') {
      return res.status(400).json({ error: 'Email already sent to this candidate' });
    }

    console.log(`Sending email to: ${candidate.email}`);
    
    const messageId = await sendRecruitmentEmail(transporter, {
      to: candidate.email,
      from: process.env.FROM_EMAIL,
      candidateName: candidate.name,
      companyName: process.env.COMPANY_NAME || 'Our Company'
    });

    // Update candidate status
    candidate.status = 'emailed';
    candidate.emailSentAt = new Date();
    await candidate.save();

    res.json({
      success: true,
      messageId,
      message: `Email sent successfully to ${candidate.email}`
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
});

// Test email configuration
router.get('/test', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Email configuration is valid' });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ error: 'Email configuration failed', details: error.message });
  }
});

export default router;