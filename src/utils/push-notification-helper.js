import { subscribeNotification, unsubscribeNotification } from './api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const PushNotification = {
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await this.subscribeUser(registration);
  },

  async subscribeUser(registration) {
    const vapidPublicKey =
      'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    try {
     
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('User is subscribed:', subscription);

  
      const subData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this._arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this._arrayBufferToBase64(subscription.getKey('auth')),
        },
      };

      const response = await subscribeNotification(subData);
      console.log('✅ Subscription sent to server:', response);

    } catch (err) {
      console.error('❌ Failed to subscribe user:', err);
    }
  },

  async unsubscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('ℹ️ No active subscription found.');
        return;
      }

      const endpoint = subscription.endpoint;

      await subscription.unsubscribe();
      console.log('🚫 Unsubscribed locally from push notifications.');

      const response = await unsubscribeNotification(endpoint);
      console.log('✅ Unsubscribed from server:', response);

    } catch (err) {
      console.error('❌ Failed to unsubscribe user:', err);
    }
  },

  async requestPermission() {
    const currentPermission = Notification.permission;

    if (currentPermission === 'granted') {
      console.log('Notification permission already granted.');
      await this.init();
      return 'granted';
    }

    if (currentPermission === 'denied') {
      console.error('Notification permission was previously denied.');
      return 'denied';
    }

    if (currentPermission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.init();
        return 'granted';
      } else {
        console.error('Notification permission denied.');
        return 'denied';
      }
    }

    return 'default';
  },

  _arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
  },
};

export default PushNotification;
