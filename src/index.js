#!/usr/bin/env node

/**
 * Sample Semantic Release Application
 *
 * A simple Express.js web server demonstrating semantic versioning
 * and automated release workflows with GitHub Actions.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Import our utility modules
const { Calculator } = require('./calculator');
const { UserManager } = require('./userManager');
const { Logger } = require('./logger');

// Initialize logger
const logger = new Logger('SampleApp');

// Get package information for version display
const packagePath = path.join(__dirname, '../package.json');
const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize services
const calculator = new Calculator();
const userManager = new UserManager();

// Routes
app.get('/', (req, res) => {
  const uptime = process.uptime();

  res.json({
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
    status: 'running',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    message: '🎉 Welcome to the Sample Semantic Release Application!',
    endpoints: {
      health: '/health',
      version: '/version',
      calculator: '/api/calculator',
      users: '/api/users',
    },
  });
});

app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageInfo.version,
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.json(healthCheck);
});

app.get('/version', (req, res) => {
  res.json({
    version: packageInfo.version,
    name: packageInfo.name,
    releaseDate: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA || 'unknown',
    buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
  });
});

// Calculator API routes
app.post('/api/calculator/add', (req, res) => {
  try {
    const { a, b } = req.body;

    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({ error: 'Both a and b must be numbers' });
    }

    const result = calculator.add(a, b);
    logger.info(`Addition performed: ${a} + ${b} = ${result}`);

    res.json({
      operation: 'addition',
      inputs: { a, b },
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Addition operation failed:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calculator/multiply', (req, res) => {
  try {
    const { a, b } = req.body;

    if (typeof a !== 'number' || typeof b !== 'number') {
      return res.status(400).json({ error: 'Both a and b must be numbers' });
    }

    const result = calculator.multiply(a, b);
    logger.info(`Multiplication performed: ${a} * ${b} = ${result}`);

    res.json({
      operation: 'multiplication',
      inputs: { a, b },
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Multiplication operation failed:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management API routes
app.get('/api/users', (req, res) => {
  try {
    const users = userManager.getAllUsers();
    res.json({
      users,
      count: users.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get users:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const user = userManager.createUser(name, email);
    logger.info(`User created: ${user.name} (${user.email})`);

    res.status(201).json({
      message: 'User created successfully',
      user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create user:', error.message);

    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = userManager.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res) => {
  logger.error('Unhandled error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Sample Semantic Release App v${packageInfo.version} started`);
  logger.info(`📡 Server listening on port ${PORT}`);
  logger.info(`🌐 Health check available at: http://localhost:${PORT}/health`);
  logger.info(`📊 API documentation: http://localhost:${PORT}/`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server };
