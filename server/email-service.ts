import nodemailer from 'nodemailer';

export class EmailService {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendVerificationCode(email: string, code: string): Promise<{success: boolean, error?: string, developmentCode?: string}> {
    // In development mode, always show the code
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Email verification code for ${email} is ${code}`);
      return {
        success: true,
        developmentCode: code
      };
    }

    // In production, you would configure real email service here
    // For now, we'll use development mode for all environments
    try {
      // TODO: Configure real email service (Gmail, SendGrid, etc.)
      // const transporter = nodemailer.createTransporter({...});
      // await transporter.sendMail({...});
      
      console.log(`Email verification code for ${email} is ${code}`);
      return {
        success: true,
        developmentCode: code
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: 'Email sending failed'
      };
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}