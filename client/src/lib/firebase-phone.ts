import { auth } from './firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  linkWithCredential,
  reauthenticateWithCredential,
  updatePhoneNumber
} from 'firebase/auth';

export class FirebasePhoneVerification {
  private static recaptchaVerifier: RecaptchaVerifier | null = null;
  private static confirmationResult: any = null;

  // Initialize reCAPTCHA verifier
  static initializeRecaptcha(containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> {
    return new Promise((resolve, reject) => {
      try {
        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear();
        }

        this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });

        resolve(this.recaptchaVerifier);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Send SMS verification code
  static async sendVerificationCode(phoneNumber: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!this.recaptchaVerifier) {
        await this.initializeRecaptcha();
      }

      if (!this.recaptchaVerifier) {
        return {success: false, error: 'reCAPTCHA not initialized'};
      }

      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );

      console.log('SMS sent successfully via Firebase');
      return {success: true};
    } catch (error: any) {
      console.error('Error sending SMS via Firebase:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        return {success: false, error: 'invalid_phone_number'};
      } else if (error.code === 'auth/too-many-requests') {
        return {success: false, error: 'too_many_requests'};
      } else if (error.code === 'auth/captcha-check-failed') {
        return {success: false, error: 'captcha_failed'};
      }

      // Handle billing not enabled error
      if (error.code === 'auth/billing-not-enabled') {
        return {success: false, error: 'billing_not_enabled'};
      }

      return {success: false, error: 'sms_failed'};
    }
  }

  // Verify the SMS code
  static async verifyCode(code: string): Promise<{success: boolean, error?: string, credential?: any}> {
    try {
      if (!this.confirmationResult) {
        return {success: false, error: 'No verification in progress'};
      }

      const result = await this.confirmationResult.confirm(code);
      console.log('Phone verification successful', result);
      
      return {success: true, credential: result};
    } catch (error: any) {
      console.error('Error verifying SMS code:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        return {success: false, error: 'invalid_code'};
      } else if (error.code === 'auth/code-expired') {
        return {success: false, error: 'code_expired'};
      }

      return {success: false, error: 'verification_failed'};
    }
  }

  // Link phone number to existing user account
  static async linkPhoneToAccount(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!auth.currentUser) {
        return {success: false, error: 'No user logged in'};
      }

      // Create phone credential
      const credential = PhoneAuthProvider.credential(
        this.confirmationResult.verificationId,
        code
      );

      // Link credential to current user
      await linkWithCredential(auth.currentUser, credential);
      
      console.log('Phone number linked successfully');
      return {success: true};
    } catch (error: any) {
      console.error('Error linking phone number:', error);
      
      if (error.code === 'auth/provider-already-linked') {
        return {success: false, error: 'phone_already_linked'};
      } else if (error.code === 'auth/invalid-verification-code') {
        return {success: false, error: 'invalid_code'};
      }

      return {success: false, error: 'linking_failed'};
    }
  }

  // Update phone number for existing user
  static async updateUserPhoneNumber(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!auth.currentUser) {
        return {success: false, error: 'No user logged in'};
      }

      // Create phone credential
      const credential = PhoneAuthProvider.credential(
        this.confirmationResult.verificationId,
        code
      );

      // Update phone number
      await updatePhoneNumber(auth.currentUser, credential);
      
      console.log('Phone number updated successfully');
      return {success: true};
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        return {success: false, error: 'invalid_code'};
      } else if (error.code === 'auth/requires-recent-login') {
        return {success: false, error: 'requires_recent_login'};
      }

      return {success: false, error: 'update_failed'};
    }
  }

  // Clean up reCAPTCHA verifier
  static cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // Format phone number for Firebase (international format)
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Algerian phone numbers
    if (cleaned.startsWith('213')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+213' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '+213' + cleaned;
    }
    
    // Return as is if already formatted
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    return '+213' + cleaned;
  }

  // Validate phone number format
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    // Algerian phone numbers: +213 followed by 9 digits
    const algerianPhoneRegex = /^\+213[567]\d{8}$/;
    return algerianPhoneRegex.test(formatted);
  }
}