// Push notification utilities for the client side
import { apiRequest } from './queryClient';

export class PushNotificationClient {
  private static vapidPublicKey: string | null = null;

  /**
   * Get VAPID public key from server
   */
  static async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    try {
      const response = await apiRequest('GET', '/api/push/vapid-public-key');
      this.vapidPublicKey = response.publicKey;
      return this.vapidPublicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current permission status
   */
  static getPermission(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    return await Notification.requestPermission();
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribe(): Promise<PushSubscription | null> {
    try {
      // Check if already supported
      if (!this.isSupported()) {
        console.warn('Push notifications not supported');
        return null;
      }

      // Request permission if needed
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe on client
        await subscription.unsubscribe();
        
        // Remove from server
        await this.removeSubscriptionFromServer(subscription);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  static async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  static async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.isSupported()) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Send subscription to server
   */
  private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const keys = subscription.getKey ? {
      p256dh: subscription.getKey('p256dh'),
      auth: subscription.getKey('auth')
    } : { p256dh: null, auth: null };

    const subscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh ? this.arrayBufferToBase64(keys.p256dh) : '',
      auth: keys.auth ? this.arrayBufferToBase64(keys.auth) : '',
      userAgent: navigator.userAgent
    };

    await apiRequest('POST', '/api/push/subscribe', subscriptionData);
  }

  /**
   * Remove subscription from server
   */
  private static async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    await apiRequest('POST', '/api/push/unsubscribe', { 
      endpoint: subscription.endpoint 
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return window.btoa(binary);
  }

  /**
   * Show a test notification
   */
  static async showTestNotification(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      throw new Error('Notifications not permitted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('اختبار الإشعارات', {
      body: 'هذا إشعار تجريبي للتأكد من عمل النظام',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'test',
      requireInteraction: false
    });
  }
}

export default PushNotificationClient;