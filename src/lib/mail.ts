import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Cafeteria Pre-Order" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Cafeteria Pre-Order System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #FF6B00; text-align: center;">Cafeteria Pre-Order System</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for logging into the Cafeteria Pre-Order System is:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; color: #333; margin: 20px 0; padding: 10px; border: 1px dashed #FF6B00; border-radius: 5px;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 Cafeteria Pre-Order System</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}
