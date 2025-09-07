require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const testEmail = async () => {
  try {
    await sendEmail({
      email: process.env.EMAIL_USER, // Sending to self for testing
      subject: 'Test OTP Email from StreetFood Connect',
      message: 'This is a test email to verify your Nodemailer setup.',
    });
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
};

testEmail();
