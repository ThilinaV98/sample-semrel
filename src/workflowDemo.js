/**
 * Workflow Demo Module
 *
 * This module demonstrates the Git workflow process
 * for feature development and release management.
 */

class WorkflowDemo {
  constructor() {
    this.version = '1.0.0';
    this.features = [];
  }

  /**
   * Add a new feature to the demo
   * @param {string} name - Feature name
   * @param {string} description - Feature description
   * @returns {object} Feature object
   */
  addFeature(name, description) {
    const feature = {
      id: Date.now(),
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    this.features.push(feature);
    return feature;
  }

  /**
   * Get all features
   * @returns {Array} List of features
   */
  getFeatures() {
    return this.features;
  }

  /**
   * Get demo status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      version: this.version,
      featureCount: this.features.length,
      lastUpdated: new Date().toISOString(),
      message: 'Workflow Demo Module Active',
    };
  }
}

module.exports = { WorkflowDemo };