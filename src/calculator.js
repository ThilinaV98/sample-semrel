/**
 * Calculator utility class
 *
 * Provides basic mathematical operations for the sample application.
 * This class demonstrates simple functionality that can be easily tested
 * and serves as an example for semantic versioning scenarios.
 */

class Calculator {
  constructor() {
    this.history = [];
    this.maxHistorySize = 100;
  }

  /**
   * Add two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Sum of a and b
   */
  add(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }

    const result = a + b;
    this._addToHistory('add', [a, b], result);
    return result;
  }

  /**
   * Subtract two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Difference of a and b
   */
  subtract(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }

    const result = a - b;
    this._addToHistory('subtract', [a, b], result);
    return result;
  }

  /**
   * Multiply two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Product of a and b
   */
  multiply(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }

    const result = a * b;
    this._addToHistory('multiply', [a, b], result);
    return result;
  }

  /**
   * Divide two numbers
   * @param {number} a - Dividend
   * @param {number} b - Divisor
   * @returns {number} Quotient of a and b
   */
  divide(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both arguments must be numbers');
    }

    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }

    // Fix: Handle edge case where result is -0
    const result = a / b;
    const cleanResult = Object.is(result, -0) ? 0 : result;
    this._addToHistory('divide', [a, b], cleanResult);
    return cleanResult;
  }

  /**
   * Calculate power of a number
   * @param {number} base - Base number
   * @param {number} exponent - Exponent
   * @returns {number} Result of base^exponent
   */
  power(base, exponent) {
    if (typeof base !== 'number' || typeof exponent !== 'number') {
      throw new Error('Both arguments must be numbers');
    }

    const result = Math.pow(base, exponent);
    this._addToHistory('power', [base, exponent], result);
    return result;
  }

  /**
   * Calculate square root of a number
   * @param {number} n - Number to find square root of
   * @returns {number} Square root of n
   */
  sqrt(n) {
    if (typeof n !== 'number') {
      throw new Error('Argument must be a number');
    }

    if (n < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }

    const result = Math.sqrt(n);
    this._addToHistory('sqrt', [n], result);
    return result;
  }

  /**
   * Get calculation history
   * @returns {Array} Array of historical calculations
   */
  getHistory() {
    return this.history.map((calc) => ({
      ...calc,
      inputs: [...calc.inputs],
    }));
  }

  /**
   * Clear calculation history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Get the last calculation result
   * @returns {Object|null} Last calculation or null if no history
   */
  getLastCalculation() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Add calculation to history
   * @private
   * @param {string} operation - Operation name
   * @param {Array} inputs - Input parameters
   * @param {number} result - Calculation result
   */
  _addToHistory(operation, inputs, result) {
    const calculation = {
      operation,
      inputs: [...inputs],
      result,
      timestamp: new Date().toISOString(),
    };

    this.history.push(calculation);

    // Limit history size to prevent memory issues
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Get statistics about calculations performed
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const operationCounts = {};
    const totalCalculations = this.history.length;

    this.history.forEach((calc) => {
      operationCounts[calc.operation] = (operationCounts[calc.operation] || 0) + 1;
    });

    return {
      totalCalculations,
      operationCounts,
      mostUsedOperation: Object.keys(operationCounts).reduce(
        (a, b) => (operationCounts[a] > operationCounts[b] ? a : b),
        null
      ),
      historySize: this.history.length,
      maxHistorySize: this.maxHistorySize,
    };
  }
}

module.exports = { Calculator };
