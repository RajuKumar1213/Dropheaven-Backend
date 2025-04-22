import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'maddison53@ethereal.email',
    pass: 'jn7jnAPss4f63QBp6D',
  },
});

// Function to send OTP email
const sendOtpEmail = async (toEmail, otp) => {
  if (!toEmail) {
    console.error('No email provided to sendOtpToMail');
    throw new Error('Recipient email is required');
  }

  console.log(toEmail, 'email in sendOtpEmail');
  try {
    const mailOptions = {
      from: 'maddison53@ethereal.email',
      to: toEmail.trim(),
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Main function to send OTP via email
const sendOtpToMail = async (email) => {
  if (!email) {
    throw new Error('Email is required to send OTP.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit OTP

  // Sending OTP via Email using Nodemailer
  const emailSent = await sendOtpEmail(email, otp);
  if (emailSent) {
    console.log('OTP sent successfully via email');
  } else {
    throw new Error('Failed to send OTP via email. Please try again later.');
  }

  return otp; // Return OTP for future verification if needed
};

export { sendOtpToMail };
