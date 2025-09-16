/**
 * Analytics tracking module
 * Provides user event tracking and metrics collection
 */

class Analytics {
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || '/api/analytics';
    this.userId = config.userId || null;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate a unique session identifier
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Track a user event
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   */
  track(event, properties = {}) {
    const payload = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.sendEvent(payload);
  }

  /**
   * Track page view
   * @param {string} page - Page name or URL
   */
  trackPageView(page) {
    this.track('page_view', { page });
  }

  /**
   * Send event to analytics endpoint
   * @param {Object} payload - Event payload
   */
  async sendEvent(payload) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error.message);
    }
  }
}

module.exports = Analytics;