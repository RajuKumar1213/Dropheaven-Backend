import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com', // Brevo SMTP server
  port: 587, // Use 587 for TLS
  auth: {
    user: '8bb3ea001@smtp-brevo.com', // Your Brevo login email
    pass: '4NkzgOdDw6sVfRbY', // SMTP password you copied
  },
});

// Function to send OTP email
const sendOtpEmail = async (toEmail, otp) => {
  if (!toEmail) {
    throw new Error('Recipient email is required');
  }

  try {
    const mailOptions = {
      from: '8bb3ea001@smtp-brevo.com',
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

// SENDING OTP USING RESEND

// import { Resend } from 'resend';
// import dotenv from 'dotenv';

// dotenv.config();

// const resend = new Resend(process.env.RESEND_API_KEY);

// // Function to send OTP email
// const sendOtpEmail = async (toEmail, otp) => {
//   if (!toEmail) {
//     throw new Error('Recipient email is required');
//   }

//   try {
//     const { data, error } = await resend.emails.send({
//       from: 'onboarding@resend.dev', // You can customize this later
//       to: [toEmail],
//       subject: 'OTP Verification',
//       html: `<p>Your OTP for verification is: <strong>${otp}</strong></p>`,
//     });

//     if (error) {
//       console.error('Resend Error:', error);
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error('Failed to send Resend email:', error);
//     return false;
//   }
// };

// const sendOtpToMail = async (email) => {
//   if (!email) {
//     throw new Error('Email is required to send OTP.');
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

//   const emailSent = await sendOtpEmail(email, otp);
//   if (emailSent) {
//     console.log('OTP sent successfully via email');
//   } else {
//     throw new Error('Failed to send OTP via email. Please try again later.');
//   }

//   return otp;
// };

// export { sendOtpToMail };
