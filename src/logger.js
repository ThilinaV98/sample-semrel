/**
 * Logger utility class
 * 
 * Provides structured logging functionality for the sample application.
 * This class demonstrates logging best practices and provides different
 * log levels for various application events.
 */

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.logLevel = this._getLogLevel();
    this.colors = {
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      INFO: '\x1b[36m',    // Cyan
      DEBUG: '\x1b[90m',   // Gray
      RESET: '\x1b[0m'     // Reset
    };
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {*} data - Additional data to log
   */
  error(message, data = null) {
    this._log('ERROR', message, data);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {*} data - Additional data to log
   */
  warn(message, data = null) {
    this._log('WARN', message, data);
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {*} data - Additional data to log
   */
  info(message, data = null) {
    this._log('INFO', message, data);
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {*} data - Additional data to log
   */
  debug(message, data = null) {
    this._log('DEBUG', message, data);
  }

  /**
   * Log a message with custom level
   * @private
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {*} data - Additional data to log
   */
  _log(level, message, data) {
    // Check if this log level should be output
    if (this.levels[level] > this.levels[this.logLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = this.colors[level] || '';
    const reset = this.colors.RESET;
    
    // Format the log entry
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data })
    };

    // Console output with color
    if (process.env.NODE_ENV !== 'test') {
      const baseMessage = `${color}[${timestamp}] ${level.padEnd(5)} [${this.context}] ${message}${reset}`;
      
      if (data !== null && data !== undefined) {
        console.log(baseMessage);
        
        if (typeof data === 'object') {
          console.log(`${color}${JSON.stringify(data, null, 2)}${reset}`);
        } else {
          console.log(`${color}${data}${reset}`);
        }
      } else {
        console.log(baseMessage);
      }
    }

    // In production or structured logging environments,
    // you might want to send logs to external services
    this._sendToExternalLogger(logEntry);
  }

  /**
   * Get the current log level from environment
   * @private
   * @returns {string} Log level
   */
  _getLogLevel() {
    const envLogLevel = process.env.LOG_LEVEL || 'INFO';
    const normalizedLevel = envLogLevel.toUpperCase();
    
    if (Object.keys(this.levels).includes(normalizedLevel)) {
      return normalizedLevel;
    }
    
    return 'INFO';
  }

  /**
   * Send log entry to external logging service (placeholder)
   * @private
   * @param {Object} logEntry - Structured log entry
   */
  _sendToExternalLogger(logEntry) {
    // In a real application, you might send logs to services like:
    // - CloudWatch Logs
    // - Elasticsearch
    // - Splunk
    // - DataDog
    // - New Relic
    // etc.
    
    // For now, this is just a placeholder
    if (process.env.EXTERNAL_LOGGING === 'true') {
      // Example: Send to external service
      // externalLogService.send(logEntry);
    }
  }

  /**
   * Create a child logger with additional context
   * @param {string} childContext - Additional context for child logger
   * @returns {Logger} New logger instance
   */
  createChild(childContext) {
    const fullContext = `${this.context}:${childContext}`;
    return new Logger(fullContext);
  }

  /**
   * Log request information (useful for Express middleware)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in milliseconds
   */
  logRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 400) {
      this.warn(message, logData);
    } else {
      this.info(message, logData);
    }
  }

  /**
   * Log application startup information
   * @param {Object} config - Application configuration
   */
  logStartup(config) {
    this.info('🚀 Application starting up');
    this.info(`📦 Version: ${config.version || 'unknown'}`);
    this.info(`🌍 Environment: ${config.environment || process.env.NODE_ENV || 'development'}`);
    this.info(`🔧 Log Level: ${this.logLevel}`);
    
    if (config.port) {
      this.info(`📡 Port: ${config.port}`);
    }
  }

  /**
   * Log application shutdown
   * @param {number} uptime - Application uptime in seconds
   */
  logShutdown(uptime) {
    this.info(`⏹️ Application shutting down after ${Math.floor(uptime)}s uptime`);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} additionalData - Additional performance data
   */
  logPerformance(operation, duration, additionalData = {}) {
    const perfData = {
      operation,
      duration: `${duration}ms`,
      ...additionalData,
      timestamp: new Date().toISOString()
    };

    const level = duration > 1000 ? 'WARN' : 'INFO'; // Warn if operation takes > 1 second
    this._log(level, `Performance: ${operation} completed in ${duration}ms`, perfData);
  }

  /**
   * Get current logger configuration
   * @returns {Object} Logger configuration
   */
  getConfig() {
    return {
      context: this.context,
      logLevel: this.logLevel,
      availableLevels: Object.keys(this.levels),
      externalLogging: process.env.EXTERNAL_LOGGING === 'true'
    };
  }
}

/**
 * Create a request logging middleware for Express
 * @param {string} context - Logger context
 * @returns {Function} Express middleware function
 */
function createRequestLogger(context = 'HTTP') {
  const logger = new Logger(context);
  
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, res, duration);
    });
    
    next();
  };
}

module.exports = { 
  Logger, 
  createRequestLogger 
};