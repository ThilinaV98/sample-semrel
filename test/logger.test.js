/**
 * Logger utility tests
 *
 * Basic tests to improve coverage for logger functionality
 */

const { Logger } = require('../src/logger');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger('TestLogger');
  });

  describe('Core Logging Functions', () => {
    it('should create logger with default context', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger.context).toBe('App');
    });

    it('should create logger with custom context', () => {
      expect(logger.context).toBe('TestLogger');
    });

    it('should have all log levels', () => {
      expect(logger.levels).toEqual({
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
      });
    });

    it('should call _log method for each log level', () => {
      const spy = jest.spyOn(logger, '_log');

      logger.error('test error');
      logger.warn('test warning');
      logger.info('test info');
      logger.debug('test debug');

      expect(spy).toHaveBeenCalledWith('ERROR', 'test error', null);
      expect(spy).toHaveBeenCalledWith('WARN', 'test warning', null);
      expect(spy).toHaveBeenCalledWith('INFO', 'test info', null);
      expect(spy).toHaveBeenCalledWith('DEBUG', 'test debug', null);

      spy.mockRestore();
    });

    it('should log with additional data', () => {
      const spy = jest.spyOn(logger, '_log');
      const testData = { key: 'value' };

      logger.info('test message', testData);

      expect(spy).toHaveBeenCalledWith('INFO', 'test message', testData);
      spy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    it('should create child logger', () => {
      const childLogger = logger.createChild('Child');
      expect(childLogger.context).toBe('TestLogger:Child');
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should get logger configuration', () => {
      const config = logger.getConfig();
      expect(config).toHaveProperty('context', 'TestLogger');
      expect(config).toHaveProperty('logLevel');
      expect(config).toHaveProperty('availableLevels');
      expect(config).toHaveProperty('externalLogging');
    });
  });

  describe('Log Level Management', () => {
    it('should respect log level filtering', () => {
      // Create logger with ERROR level (only ERROR messages should be logged)
      const errorLogger = new Logger('ErrorTest');
      errorLogger.logLevel = 'ERROR';

      // Spy on _sendToExternalLogger to count actual log outputs
      const externalLogSpy = jest.spyOn(errorLogger, '_sendToExternalLogger');

      errorLogger.debug('debug message'); // Should be filtered out
      errorLogger.info('info message'); // Should be filtered out
      errorLogger.warn('warn message'); // Should be filtered out
      errorLogger.error('error message'); // Should pass through

      // Only the error message should have been processed
      expect(externalLogSpy).toHaveBeenCalledTimes(1);

      externalLogSpy.mockRestore();
    });
  });

  describe('Special Logging Functions', () => {
    it('should log request information', () => {
      const mockReq = {
        method: 'GET',
        url: '/test',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '127.0.0.1',
      };

      const mockRes = {
        statusCode: 200,
      };

      const spy = jest.spyOn(logger, 'info');

      logger.logRequest(mockReq, mockRes, 150);

      expect(spy).toHaveBeenCalledWith(
        'GET /test 200 150ms',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          statusCode: 200,
          duration: '150ms',
        })
      );

      spy.mockRestore();
    });

    it('should log startup information', () => {
      const spy = jest.spyOn(logger, 'info');

      logger.logStartup({ version: '1.0.0', port: 3000 });

      expect(spy).toHaveBeenCalledWith('🚀 Application starting up');
      expect(spy).toHaveBeenCalledWith('📦 Version: 1.0.0');
      expect(spy).toHaveBeenCalledWith('📡 Port: 3000');

      spy.mockRestore();
    });

    it('should log performance metrics', () => {
      const spy = jest.spyOn(logger, '_log');

      logger.logPerformance('database-query', 500, { query: 'SELECT * FROM users' });

      expect(spy).toHaveBeenCalledWith(
        'INFO',
        'Performance: database-query completed in 500ms',
        expect.objectContaining({
          operation: 'database-query',
          duration: '500ms',
          query: 'SELECT * FROM users',
        })
      );

      spy.mockRestore();
    });
  });
});
