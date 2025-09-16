/**
 * Notification System
 * Real-time notification management with multiple delivery channels
 */

class NotificationSystem {
  constructor(config = {}) {
    this.config = {
      enableEmail: config.enableEmail !== false,
      enablePush: config.enablePush !== false,
      enableSMS: config.enableSMS || false,
      defaultPriority: config.defaultPriority || 'normal',
      retryAttempts: config.retryAttempts || 3,
      ...config
    };
    this.channels = new Map();
    this.queue = [];
    this.subscribers = new Set();
    this.isProcessing = false;
  }

  /**
   * Initialize notification system
   */
  async initialize() {
    await this.setupChannels();
    this.startProcessor();
    console.log('Notification system initialized');
  }

  /**
   * Setup notification channels
   */
  async setupChannels() {
    if (this.config.enableEmail) {
      this.channels.set('email', {
        type: 'email',
        enabled: true,
        endpoint: this.config.emailEndpoint || 'smtp://localhost:587',
        retryCount: 0
      });
    }

    if (this.config.enablePush) {
      this.channels.set('push', {
        type: 'push',
        enabled: true,
        endpoint: this.config.pushEndpoint || 'https://fcm.googleapis.com/fcm/send',
        retryCount: 0
      });
    }

    if (this.config.enableSMS) {
      this.channels.set('sms', {
        type: 'sms',
        enabled: true,
        endpoint: this.config.smsEndpoint || 'https://api.twilio.com/2010-04-01',
        retryCount: 0
      });
    }
  }

  /**
   * Send notification
   */
  async sendNotification(notification) {
    const enrichedNotification = this.enrichNotification(notification);

    if (enrichedNotification.immediate) {
      return this.processNotification(enrichedNotification);
    } else {
      this.queue.push(enrichedNotification);
      return { queued: true, id: enrichedNotification.id };
    }
  }

  /**
   * Enrich notification with metadata
   */
  enrichNotification(notification) {
    return {
      id: notification.id || this.generateId(),
      timestamp: new Date().toISOString(),
      priority: notification.priority || this.config.defaultPriority,
      channels: notification.channels || ['email'],
      retryAttempts: 0,
      maxRetries: this.config.retryAttempts,
      immediate: notification.priority === 'critical',
      ...notification
    };
  }

  /**
   * Process a single notification
   */
  async processNotification(notification) {
    const results = [];

    for (const channelType of notification.channels) {
      const channel = this.channels.get(channelType);

      if (!channel || !channel.enabled) {
        results.push({
          channel: channelType,
          status: 'skipped',
          reason: 'Channel not available'
        });
        continue;
      }

      try {
        const result = await this.deliverToChannel(notification, channel);
        results.push({
          channel: channelType,
          status: 'success',
          deliveryTime: result.deliveryTime,
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          channel: channelType,
          status: 'failed',
          error: error.message,
          retryScheduled: notification.retryAttempts < notification.maxRetries
        });

        if (notification.retryAttempts < notification.maxRetries) {
          notification.retryAttempts++;
          setTimeout(() => this.processNotification(notification),
                    Math.pow(2, notification.retryAttempts) * 1000);
        }
      }
    }

    // Notify subscribers
    this.notifySubscribers('notification:processed', {
      notification,
      results
    });

    return {
      id: notification.id,
      results,
      processed: true
    };
  }

  /**
   * Deliver notification to specific channel
   */
  async deliverToChannel(notification, channel) {
    const startTime = Date.now();

    // Simulate delivery based on channel type
    switch (channel.type) {
      case 'email':
        await this.simulateEmailDelivery(notification);
        break;
      case 'push':
        await this.simulatePushDelivery(notification);
        break;
      case 'sms':
        await this.simulateSMSDelivery(notification);
        break;
    }

    return {
      deliveryTime: Date.now() - startTime,
      messageId: `${channel.type}_${this.generateId()}`
    };
  }

  /**
   * Simulate email delivery
   */
  async simulateEmailDelivery(notification) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Email delivery failed'));
        }
      }, Math.random() * 500 + 100);
    });
  }

  /**
   * Simulate push notification delivery
   */
  async simulatePushDelivery(notification) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate
          resolve();
        } else {
          reject(new Error('Push delivery failed'));
        }
      }, Math.random() * 200 + 50);
    });
  }

  /**
   * Simulate SMS delivery
   */
  async simulateSMSDelivery(notification) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.15) { // 85% success rate
          resolve();
        } else {
          reject(new Error('SMS delivery failed'));
        }
      }, Math.random() * 300 + 100);
    });
  }

  /**
   * Start queue processor
   */
  startProcessor() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    setInterval(() => {
      if (this.queue.length > 0) {
        const notification = this.queue.shift();
        this.processNotification(notification);
      }
    }, 1000);
  }

  /**
   * Subscribe to notification events
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Get system stats
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeChannels: Array.from(this.channels.keys()),
      subscriberCount: this.subscribers.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Shutdown notification system
   */
  shutdown() {
    this.isProcessing = false;
    this.queue.length = 0;
    this.subscribers.clear();
    console.log('Notification system shutdown');
  }
}

module.exports = { NotificationSystem };