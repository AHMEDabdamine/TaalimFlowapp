import webpush from 'web-push';
import { storage } from './storage';
import { InsertNotificationLog } from '../shared/schema';

// VAPID keys for web push (should be in environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BM1Jxm3XrXYklM4AgpKxNNk6drPf8iFREMiEcFrFu9-RD7bSXzXNU7ixSTEH1vwXTfLSwaCQr8Y-MT_zTvytDaM';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Zwi2KjZN-lCX0saTyK4P1HDqlR27L3TYnMfE9MMRT3M';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@madrasti.app';

// Configure web-push
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  type: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class PushNotificationService {
  
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Send push notification to a specific user
   */
  static async sendToUser(
    schoolId: number, 
    userId: number, 
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's push subscriptions
      const subscriptions = await storage.getUserPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        await this.logNotification(schoolId, userId, payload, false, 'No push subscriptions');
        return false;
      }

      let successCount = 0;
      const errors: string[] = [];

      // Send to all user's devices
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          const notificationPayload = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192x192.png',
            badge: payload.badge || '/icon-192x192.png',
            tag: payload.tag || payload.type,
            requireInteraction: payload.requireInteraction || false,
            data: {
              ...payload.data,
              type: payload.type,
              url: payload.data?.url || '/'
            },
            dir: 'rtl',
            lang: 'ar'
          };

          await webpush.sendNotification(
            pushSubscription, 
            JSON.stringify(notificationPayload)
          );
          
          successCount++;
          
          // Update last used timestamp
          await storage.updatePushSubscriptionLastUsed(subscription.id);
          
        } catch (error: any) {
          console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
          errors.push(`Subscription ${subscription.id}: ${error.message}`);
          
          // Remove invalid subscriptions (410 Gone)
          if (error.statusCode === 410) {
            await storage.deletePushSubscription(subscription.id);
          }
        }
      }

      const success = successCount > 0;
      const errorMessage = errors.length > 0 ? errors.join('; ') : null;
      
      await this.logNotification(schoolId, userId, payload, success, errorMessage);
      
      return success;
      
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      await this.logNotification(schoolId, userId, payload, false, error.message);
      return false;
    }
  }

  /**
   * Send push notification to multiple users in a school
   */
  static async sendToUsers(
    schoolId: number, 
    userIds: number[], 
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      const sent = await this.sendToUser(schoolId, userId, payload);
      if (sent) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Broadcast notification to all users in a school
   */
  static async broadcastToSchool(
    schoolId: number, 
    payload: NotificationPayload,
    excludeUserIds: number[] = []
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all users in the school with push subscriptions
      const users = await storage.getUsersWithPushSubscriptions(schoolId);
      
      const targetUsers = users.filter(user => !excludeUserIds.includes(user.id));
      const userIds = targetUsers.map(user => user.id);
      
      return await this.sendToUsers(schoolId, userIds, payload);
      
    } catch (error: any) {
      console.error('Error broadcasting to school:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Send notification to users with specific roles
   */
  static async sendToRoles(
    schoolId: number, 
    roles: string[], 
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      const users = await storage.getUsersByRoles(schoolId, roles);
      const userIds = users.map(user => user.id);
      
      return await this.sendToUsers(schoolId, userIds, payload);
      
    } catch (error: any) {
      console.error('Error sending to roles:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Log notification attempt to database
   */
  private static async logNotification(
    schoolId: number,
    userId: number | null,
    payload: NotificationPayload,
    success: boolean,
    error?: string | null
  ): Promise<void> {
    try {
      const logData: InsertNotificationLog = {
        schoolId,
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || null,
        type: payload.type,
        success,
        error: error || null
      };
      
      await storage.createNotificationLog(logData);
    } catch (logError) {
      console.error('Failed to log notification:', logError);
    }
  }

  /**
   * Create notification payloads for different types
   */
  static createMessageNotification(senderName: string, content: string): NotificationPayload {
    return {
      title: `رسالة جديدة من ${senderName}`,
      body: content.length > 100 ? content.substring(0, 100) + '...' : content,
      type: 'message',
      tag: 'message',
      requireInteraction: true,
      data: {
        url: '/messages'
      }
    };
  }

  static createAnnouncementNotification(title: string, content: string): NotificationPayload {
    return {
      title: `إعلان جديد: ${title}`,
      body: content.length > 100 ? content.substring(0, 100) + '...' : content,
      type: 'announcement',
      tag: 'announcement',
      data: {
        url: '/announcements'
      }
    };
  }

  static createGroupNotification(groupName: string, message: string): NotificationPayload {
    return {
      title: `تحديث من ${groupName}`,
      body: message,
      type: 'group',
      tag: 'group',
      data: {
        url: '/groups'
      }
    };
  }

  static createAttendanceNotification(studentName: string, groupName: string): NotificationPayload {
    return {
      title: 'تحديث الحضور',
      body: `تم تسجيل حضور ${studentName} في ${groupName}`,
      type: 'attendance',
      tag: 'attendance',
      data: {
        url: '/groups'
      }
    };
  }
}

export default PushNotificationService;