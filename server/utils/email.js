import nodemailer from 'nodemailer';

// Create a transporter using environment variables or fallback to a test account
const createTransporter = async () => {
  // If SMTP is provided in env, use it
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal test account for local development
  // In a real production scenario, you would log a warning if SMTP is not configured
  console.log('Using ethereal test email account...');
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: '"Nile Booking" <noreply@nilebooking.co>', // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't want to break the app if email fails
    return null;
  }
};
