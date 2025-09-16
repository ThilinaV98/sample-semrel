/**
 * User Dashboard Component
 * Enhanced dashboard with analytics integration and real-time updates
 */

class UserDashboard {
  constructor(userId, config = {}) {
    this.userId = userId;
    this.config = {
      refreshInterval: config.refreshInterval || 30000, // 30 seconds
      showAnalytics: config.showAnalytics !== false,
      theme: config.theme || 'light',
      ...config
    };
    this.widgets = new Map();
    this.isInitialized = false;
    this.refreshTimer = null;
  }

  /**
   * Initialize the dashboard with widgets
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load user preferences
      const preferences = await this.loadUserPreferences();
      this.applyPreferences(preferences);

      // Initialize default widgets
      await this.initializeWidgets();

      // Set up auto-refresh
      this.startAutoRefresh();

      this.isInitialized = true;
      console.log(`Dashboard initialized for user ${this.userId}`);
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load user preferences from storage
   */
  async loadUserPreferences() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          theme: 'light',
          widgetOrder: ['stats', 'recent-activity', 'analytics'],
          autoRefresh: true
        });
      }, 100);
    });
  }

  /**
   * Apply user preferences to dashboard
   */
  applyPreferences(preferences) {
    if (preferences.theme) {
      this.config.theme = preferences.theme;
    }
    if (preferences.autoRefresh !== undefined) {
      this.config.autoRefresh = preferences.autoRefresh;
    }
  }

  /**
   * Initialize dashboard widgets
   */
  async initializeWidgets() {
    const defaultWidgets = [
      { id: 'stats', type: 'statistics', priority: 1 },
      { id: 'recent-activity', type: 'activity-feed', priority: 2 },
      { id: 'analytics', type: 'analytics-chart', priority: 3 }
    ];

    for (const widgetConfig of defaultWidgets) {
      const widget = await this.createWidget(widgetConfig);
      this.widgets.set(widgetConfig.id, widget);
    }
  }

  /**
   * Create a dashboard widget
   */
  async createWidget(config) {
    const widget = {
      id: config.id,
      type: config.type,
      priority: config.priority,
      data: null,
      lastUpdated: null,
      isLoading: false
    };

    await this.refreshWidget(widget);
    return widget;
  }

  /**
   * Refresh a specific widget's data
   */
  async refreshWidget(widget) {
    widget.isLoading = true;

    try {
      switch (widget.type) {
        case 'statistics':
          widget.data = await this.fetchStatistics();
          break;
        case 'activity-feed':
          widget.data = await this.fetchRecentActivity();
          break;
        case 'analytics-chart':
          widget.data = await this.fetchAnalyticsData();
          break;
        default:
          throw new Error(`Unknown widget type: ${widget.type}`);
      }

      widget.lastUpdated = new Date();
      widget.isLoading = false;
    } catch (error) {
      widget.isLoading = false;
      console.error(`Failed to refresh widget ${widget.id}:`, error);
    }
  }

  /**
   * Fetch user statistics
   */
  async fetchStatistics() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalLogins: Math.floor(Math.random() * 1000) + 500,
          sessionsToday: Math.floor(Math.random() * 50) + 10,
          averageSessionTime: Math.floor(Math.random() * 30) + 15
        });
      }, 200);
    });
  }

  /**
   * Fetch recent user activity
   */
  async fetchRecentActivity() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { action: 'Login', timestamp: new Date(Date.now() - 300000), details: 'Web browser' },
          { action: 'Profile Update', timestamp: new Date(Date.now() - 3600000), details: 'Changed avatar' },
          { action: 'Document Upload', timestamp: new Date(Date.now() - 7200000), details: 'report.pdf' }
        ]);
      }, 150);
    });
  }

  /**
   * Fetch analytics data
   */
  async fetchAnalyticsData() {
    if (!this.config.showAnalytics) {
      return null;
    }

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          pageViews: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 50),
          clickEvents: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 20),
          conversionRate: (Math.random() * 10 + 2).toFixed(2)
        });
      }, 300);
    });
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    if (!this.config.autoRefresh || this.refreshTimer) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      this.refreshAllWidgets();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh all widgets
   */
  async refreshAllWidgets() {
    const refreshPromises = Array.from(this.widgets.values()).map(widget =>
      this.refreshWidget(widget)
    );

    try {
      await Promise.all(refreshPromises);
      console.log('All widgets refreshed successfully');
    } catch (error) {
      console.error('Error refreshing widgets:', error);
    }
  }

  /**
   * Add a custom widget
   */
  addWidget(id, type, priority = 999) {
    if (this.widgets.has(id)) {
      throw new Error(`Widget with id '${id}' already exists`);
    }

    const widget = {
      id,
      type,
      priority,
      data: null,
      lastUpdated: null,
      isLoading: false
    };

    this.widgets.set(id, widget);
    this.refreshWidget(widget);
  }

  /**
   * Remove a widget
   */
  removeWidget(id) {
    return this.widgets.delete(id);
  }

  /**
   * Get widget data
   */
  getWidget(id) {
    return this.widgets.get(id);
  }

  /**
   * Get all widgets sorted by priority
   */
  getAllWidgets() {
    return Array.from(this.widgets.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Update dashboard theme
   */
  setTheme(theme) {
    this.config.theme = theme;
    // In a real implementation, this would update the UI
    console.log(`Dashboard theme updated to: ${theme}`);
  }

  /**
   * Export dashboard configuration
   */
  exportConfig() {
    return {
      userId: this.userId,
      config: { ...this.config },
      widgets: Array.from(this.widgets.values()).map(({ id, type, priority }) => ({
        id, type, priority
      }))
    };
  }

  /**
   * Cleanup dashboard resources
   */
  destroy() {
    this.stopAutoRefresh();
    this.widgets.clear();
    this.isInitialized = false;
    console.log(`Dashboard destroyed for user ${this.userId}`);
  }
}

/**
 * Create a performance monitoring decorator
 * @param {Logger} logger - Logger instance for performance tracking
 * @returns {Function} Decorator function
 */
function withPerformanceTracking(logger) {
  return function decorator(target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      const start = performance.now();
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - start;
        logger?.logPerformance?.(propertyName, duration, {
          userId: this.userId,
          method: propertyName
        });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logger?.logPerformance?.(propertyName, duration, {
          userId: this.userId,
          method: propertyName,
          error: error.message
        });
        throw error;
      }
    };

    return descriptor;
  };
}

module.exports = { UserDashboard, withPerformanceTracking };