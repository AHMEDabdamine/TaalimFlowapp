import twilio from 'twilio';

// Multi-provider SMS service configuration
const SMS_PROVIDERS = {
  TWILIO: 'twilio',
  NEXMO: 'nexmo',
  TEXTLOCAL: 'textlocal',
  CLICKATELL: 'clickatell',
  BULKSMS: 'bulksms'
};

// Default provider (can be changed via environment variable)
const DEFAULT_SMS_PROVIDER = process.env.SMS_PROVIDER || SMS_PROVIDERS.TWILIO;

// Twilio configuration
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

// Initialize Twilio client if credentials are available
if (twilioAccountSid && twilioAuthToken) {
  twilioClient = twilio(twilioAccountSid, twilioAuthToken);
}

export class SMSService {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendVerificationCode(phoneNumber: string, code: string): Promise<{success: boolean, error?: string, developmentCode?: string}> {
    // In development mode, always return success with the code for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`Development mode: Verification code for ${phoneNumber} is ${code}`);
      return {
        success: true, 
        developmentCode: code,
        error: undefined
      };
    }

    switch (DEFAULT_SMS_PROVIDER) {
      case SMS_PROVIDERS.TWILIO:
        return await this.sendViaTwilio(phoneNumber, code);
      case SMS_PROVIDERS.TEXTLOCAL:
        return await this.sendViaTextLocal(phoneNumber, code);
      case SMS_PROVIDERS.NEXMO:
        return await this.sendViaNexmo(phoneNumber, code);
      case SMS_PROVIDERS.CLICKATELL:
        return await this.sendViaClickatell(phoneNumber, code);
      case SMS_PROVIDERS.BULKSMS:
        return await this.sendViaBulkSMS(phoneNumber, code);
      default:
        // Return development code as fallback
        console.log(`No SMS provider configured. Development code: ${code}`);
        return {
          success: true, 
          developmentCode: code,
          error: 'no_sms_provider'
        };
    }
  }

  // Twilio implementation
  private static async sendViaTwilio(phoneNumber: string, code: string): Promise<{success: boolean, error?: string, developmentCode?: string}> {
    if (!twilioClient || !twilioPhoneNumber) {
      console.error('Twilio not configured - SMS verification disabled');
      console.log(`Development fallback: Verification code for ${phoneNumber} is ${code}`);
      return {
        success: true, 
        developmentCode: code,
        error: 'twilio_not_configured'
      };
    }

    try {
      const message = await twilioClient.messages.create({
        body: `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`,
        from: twilioPhoneNumber,
        to: phoneNumber
      });

      console.log(`SMS sent via Twilio to ${phoneNumber}: ${message.sid}`);
      return {success: true};
    } catch (error: any) {
      console.error('Error sending SMS via Twilio:', error);
      
      // Check for specific Twilio error codes
      if (error.code === 21608) {
        console.log(`Twilio trial account restriction. Development code: ${code}`);
        return {
          success: true, 
          developmentCode: code,
          error: 'trial_account_restriction'
        };
      } else if (error.code === 21212) {
        console.log(`Invalid phone number. Development code: ${code}`);
        return {
          success: true, 
          developmentCode: code,
          error: 'invalid_phone_number'
        };
      }
      
      console.log(`Twilio error. Development code: ${code}`);
      return {
        success: true, 
        developmentCode: code,
        error: 'sms_failed'
      };
    }
  }

  // TextLocal implementation (Popular in Algeria)
  private static async sendViaTextLocal(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    const sender = process.env.TEXTLOCAL_SENDER || 'VERIFY';

    if (!apiKey) {
      return {success: false, error: 'TextLocal not configured'};
    }

    try {
      const message = `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`;
      const response = await fetch('https://api.textlocal.in/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          apikey: apiKey,
          numbers: phoneNumber,
          message: message,
          sender: sender
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log(`SMS sent via TextLocal to ${phoneNumber}`);
        return {success: true};
      } else {
        console.error('TextLocal error:', data);
        return {success: false, error: 'sms_failed'};
      }
    } catch (error) {
      console.error('Error sending SMS via TextLocal:', error);
      return {success: false, error: 'sms_failed'};
    }
  }

  // Nexmo (Vonage) implementation
  private static async sendViaNexmo(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    const apiKey = process.env.NEXMO_API_KEY;
    const apiSecret = process.env.NEXMO_API_SECRET;
    const fromNumber = process.env.NEXMO_FROM_NUMBER || 'VERIFY';

    if (!apiKey || !apiSecret) {
      return {success: false, error: 'Nexmo not configured'};
    }

    try {
      const message = `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`;
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          from: fromNumber,
          to: phoneNumber,
          text: message
        })
      });

      const data = await response.json();
      
      if (data.messages && data.messages[0].status === '0') {
        console.log(`SMS sent via Nexmo to ${phoneNumber}`);
        return {success: true};
      } else {
        console.error('Nexmo error:', data);
        return {success: false, error: 'sms_failed'};
      }
    } catch (error) {
      console.error('Error sending SMS via Nexmo:', error);
      return {success: false, error: 'sms_failed'};
    }
  }

  // Clickatell implementation
  private static async sendViaClickatell(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    const apiKey = process.env.CLICKATELL_API_KEY;

    if (!apiKey) {
      return {success: false, error: 'Clickatell not configured'};
    }

    try {
      const message = `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`;
      const response = await fetch('https://platform.clickatell.com/messages/http/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [phoneNumber],
          text: message
        })
      });

      const data = await response.json();
      
      if (data.messages && data.messages[0].accepted) {
        console.log(`SMS sent via Clickatell to ${phoneNumber}`);
        return {success: true};
      } else {
        console.error('Clickatell error:', data);
        return {success: false, error: 'sms_failed'};
      }
    } catch (error) {
      console.error('Error sending SMS via Clickatell:', error);
      return {success: false, error: 'sms_failed'};
    }
  }

  // BulkSMS implementation
  private static async sendViaBulkSMS(phoneNumber: string, code: string): Promise<{success: boolean, error?: string}> {
    const username = process.env.BULKSMS_USERNAME;
    const password = process.env.BULKSMS_PASSWORD;

    if (!username || !password) {
      return {success: false, error: 'BulkSMS not configured'};
    }

    try {
      const message = `رمز التحقق الخاص بك: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`;
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      
      const response = await fetch('https://api.bulksms.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          body: message
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`SMS sent via BulkSMS to ${phoneNumber}`);
        return {success: true};
      } else {
        console.error('BulkSMS error:', data);
        return {success: false, error: 'sms_failed'};
      }
    } catch (error) {
      console.error('Error sending SMS via BulkSMS:', error);
      return {success: false, error: 'sms_failed'};
    }
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Simple validation for Algerian phone numbers
    const algerianPhoneRegex = /^(\+213|0)[567]\d{8}$/;
    return algerianPhoneRegex.test(phoneNumber);
  }

  static formatPhoneNumber(phoneNumber: string): string {
    // Format Algerian phone numbers to international format
    if (phoneNumber.startsWith('0')) {
      return '+213' + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('+213')) {
      return '+213' + phoneNumber;
    }
    return phoneNumber;
  }
}