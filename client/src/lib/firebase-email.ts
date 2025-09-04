import { auth } from './firebase';
import { 
  sendEmailVerification, 
  applyActionCode,
  checkActionCode,
  ActionCodeSettings
} from 'firebase/auth';

export class FirebaseEmailVerification {
  private static lastSendTime = 0;
  private static readonly SEND_COOLDOWN = 60000; // 1 minute cooldown
  
  // Send email verification to current user
  static async sendVerificationEmail(): Promise<{success: boolean, error?: string}> {
    try {
      if (!auth.currentUser) {
        return {success: false, error: 'no_user_logged_in'};
      }

      // Check if email is already verified
      if (auth.currentUser.emailVerified) {
        return {success: false, error: 'email_already_verified'};
      }

      // Check cooldown to prevent too many requests
      const now = Date.now();
      if (now - this.lastSendTime < this.SEND_COOLDOWN) {
        const remainingTime = Math.ceil((this.SEND_COOLDOWN - (now - this.lastSendTime)) / 1000);
        return {success: false, error: `too_many_requests_wait_${remainingTime}`};
      }

      const actionCodeSettings: ActionCodeSettings = {
        url: window.location.origin, // Redirect URL after verification
        handleCodeInApp: false
      };

      // Send without custom settings first to avoid unauthorized-continue-uri error
      await sendEmailVerification(auth.currentUser);
      
      // Update last send time
      this.lastSendTime = now;
      
      console.log('Email verification sent successfully via Firebase');
      return {success: true};
    } catch (error: any) {
      console.error('Error sending email verification via Firebase:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        return {success: false, error: 'too_many_requests'};
      } else if (error.code === 'auth/user-token-expired') {
        return {success: false, error: 'token_expired'};
      } else if (error.code === 'auth/network-request-failed') {
        return {success: false, error: 'network_error'};
      }

      return {success: false, error: 'send_failed'};
    }
  }

  // Verify email with action code (from email link)
  static async verifyEmailWithCode(actionCode: string): Promise<{success: boolean, error?: string}> {
    try {
      // Check the action code first
      const info = await checkActionCode(auth, actionCode);
      
      if (info.operation !== 'EMAIL_SIGNIN' && info.operation !== 'VERIFY_EMAIL') {
        return {success: false, error: 'invalid_code'};
      }

      // Apply the action code to verify the email
      await applyActionCode(auth, actionCode);
      
      // Reload the user to get updated emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }

      console.log('Email verification successful');
      return {success: true};
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      
      if (error.code === 'auth/invalid-action-code') {
        return {success: false, error: 'invalid_code'};
      } else if (error.code === 'auth/expired-action-code') {
        return {success: false, error: 'code_expired'};
      }

      return {success: false, error: 'verification_failed'};
    }
  }

  // Check if current user's email is verified
  static isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
  }

  // Get current user's email
  static getCurrentUserEmail(): string | null {
    return auth.currentUser?.email || null;
  }

  // Reload user to get updated verification status
  static async reloadUser(): Promise<void> {
    if (auth.currentUser) {
      await auth.currentUser.reload();
    }
  }
}