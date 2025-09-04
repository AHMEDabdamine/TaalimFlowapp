import { auth } from '@/lib/firebase';
import { 
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode 
} from 'firebase/auth';

export class FirebasePasswordReset {
  private static lastSendTime = 0;
  private static readonly SEND_COOLDOWN = 60000; // 1 minute cooldown
  
  // Send password reset email
  static async sendPasswordResetEmail(email: string): Promise<{success: boolean, error?: string}> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {success: false, error: 'invalid_email'};
      }

      // Check cooldown to prevent too many requests
      const now = Date.now();
      if (now - this.lastSendTime < this.SEND_COOLDOWN) {
        const remainingTime = Math.ceil((this.SEND_COOLDOWN - (now - this.lastSendTime)) / 1000);
        return {success: false, error: `too_many_requests_wait_${remainingTime}`};
      }

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email);
      
      // Update last send time
      this.lastSendTime = now;
      
      console.log('Password reset email sent successfully via Firebase');
      return {success: true};
    } catch (error: any) {
      console.error('Error sending password reset email via Firebase:', error);
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/user-not-found') {
        return {success: false, error: 'user_not_found'};
      } else if (error.code === 'auth/too-many-requests') {
        return {success: false, error: 'too_many_requests'};
      } else if (error.code === 'auth/invalid-email') {
        return {success: false, error: 'invalid_email'};
      } else if (error.code === 'auth/network-request-failed') {
        return {success: false, error: 'network_error'};
      } else {
        return {success: false, error: 'unknown_error'};
      }
    }
  }

  // Verify password reset code
  static async verifyPasswordResetCode(code: string): Promise<{success: boolean, email?: string, error?: string}> {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return {success: true, email};
    } catch (error: any) {
      console.error('Error verifying password reset code:', error);
      
      if (error.code === 'auth/invalid-action-code') {
        return {success: false, error: 'invalid_code'};
      } else if (error.code === 'auth/expired-action-code') {
        return {success: false, error: 'expired_code'};
      } else {
        return {success: false, error: 'unknown_error'};
      }
    }
  }

  // Reset password with code
  static async resetPassword(code: string, newPassword: string): Promise<{success: boolean, error?: string}> {
    try {
      if (newPassword.length < 6) {
        return {success: false, error: 'password_too_short'};
      }

      await confirmPasswordReset(auth, code, newPassword);
      console.log('Password reset successfully');
      return {success: true};
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      if (error.code === 'auth/invalid-action-code') {
        return {success: false, error: 'invalid_code'};
      } else if (error.code === 'auth/expired-action-code') {
        return {success: false, error: 'expired_code'};
      } else if (error.code === 'auth/weak-password') {
        return {success: false, error: 'weak_password'};
      } else {
        return {success: false, error: 'unknown_error'};
      }
    }
  }
}