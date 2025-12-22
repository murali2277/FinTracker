import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Create a transporter
  // For Gmail, use service: 'gmail'
  // ideally params should be in .env
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // For Gmail, this must be an "App Password" if 2FA is on
    },
  });

  const mailOptions = {
    from: `"FinTracker Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
