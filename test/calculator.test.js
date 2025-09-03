/**
 * Calculator utility tests
 * 
 * Unit tests for the Calculator class
 */

const { Calculator } = require('../src/calculator');

describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('Addition', () => {
    it('should add two positive numbers', () => {
      const result = calculator.add(2, 3);
      expect(result).toBe(5);
    });

    it('should add negative numbers', () => {
      const result = calculator.add(-2, -3);
      expect(result).toBe(-5);
    });

    it('should add positive and negative numbers', () => {
      const result = calculator.add(-5, 3);
      expect(result).toBe(-2);
    });

    it('should add decimal numbers', () => {
      const result = calculator.add(2.5, 1.3);
      expect(result).toBeCloseTo(3.8);
    });

    it('should add zero', () => {
      expect(calculator.add(5, 0)).toBe(5);
      expect(calculator.add(0, 5)).toBe(5);
      expect(calculator.add(0, 0)).toBe(0);
    });

    it('should throw error for non-number inputs', () => {
      expect(() => calculator.add('2', 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.add(2, '3')).toThrow('Both arguments must be numbers');
      expect(() => calculator.add(null, 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.add(undefined, 3)).toThrow('Both arguments must be numbers');
    });
  });

  describe('Subtraction', () => {
    it('should subtract two positive numbers', () => {
      const result = calculator.subtract(5, 3);
      expect(result).toBe(2);
    });

    it('should subtract negative numbers', () => {
      const result = calculator.subtract(-2, -3);
      expect(result).toBe(1);
    });

    it('should subtract to negative result', () => {
      const result = calculator.subtract(3, 5);
      expect(result).toBe(-2);
    });

    it('should subtract decimal numbers', () => {
      const result = calculator.subtract(5.7, 2.3);
      expect(result).toBeCloseTo(3.4);
    });

    it('should subtract zero', () => {
      expect(calculator.subtract(5, 0)).toBe(5);
      expect(calculator.subtract(0, 5)).toBe(-5);
    });

    it('should throw error for non-number inputs', () => {
      expect(() => calculator.subtract('5', 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.subtract(5, '3')).toThrow('Both arguments must be numbers');
    });
  });

  describe('Multiplication', () => {
    it('should multiply two positive numbers', () => {
      const result = calculator.multiply(4, 5);
      expect(result).toBe(20);
    });

    it('should multiply negative numbers', () => {
      const result = calculator.multiply(-3, -4);
      expect(result).toBe(12);
    });

    it('should multiply positive and negative', () => {
      const result = calculator.multiply(-3, 4);
      expect(result).toBe(-12);
    });

    it('should multiply by zero', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
      expect(calculator.multiply(0, 5)).toBe(0);
    });

    it('should multiply decimal numbers', () => {
      const result = calculator.multiply(2.5, 4);
      expect(result).toBe(10);
    });

    it('should throw error for non-number inputs', () => {
      expect(() => calculator.multiply('4', 5)).toThrow('Both arguments must be numbers');
      expect(() => calculator.multiply(4, '5')).toThrow('Both arguments must be numbers');
    });
  });

  describe('Division', () => {
    it('should divide two positive numbers', () => {
      const result = calculator.divide(10, 2);
      expect(result).toBe(5);
    });

    it('should divide negative numbers', () => {
      const result = calculator.divide(-10, -2);
      expect(result).toBe(5);
    });

    it('should divide positive and negative', () => {
      const result = calculator.divide(-10, 2);
      expect(result).toBe(-5);
    });

    it('should divide decimal numbers', () => {
      const result = calculator.divide(7.5, 2.5);
      expect(result).toBe(3);
    });

    it('should handle division resulting in decimal', () => {
      const result = calculator.divide(7, 3);
      expect(result).toBeCloseTo(2.333333);
    });

    it('should throw error for division by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error for non-number inputs', () => {
      expect(() => calculator.divide('10', 2)).toThrow('Both arguments must be numbers');
      expect(() => calculator.divide(10, '2')).toThrow('Both arguments must be numbers');
    });
  });

  describe('Power', () => {
    it('should calculate positive power', () => {
      const result = calculator.power(2, 3);
      expect(result).toBe(8);
    });

    it('should calculate power of zero', () => {
      const result = calculator.power(5, 0);
      expect(result).toBe(1);
    });

    it('should calculate zero to power', () => {
      const result = calculator.power(0, 3);
      expect(result).toBe(0);
    });

    it('should calculate negative power', () => {
      const result = calculator.power(2, -2);
      expect(result).toBe(0.25);
    });

    it('should calculate decimal power', () => {
      const result = calculator.power(4, 0.5);
      expect(result).toBe(2);
    });

    it('should throw error for non-number inputs', () => {
      expect(() => calculator.power('2', 3)).toThrow('Both arguments must be numbers');
      expect(() => calculator.power(2, '3')).toThrow('Both arguments must be numbers');
    });
  });

  describe('Square Root', () => {
    it('should calculate square root of positive number', () => {
      const result = calculator.sqrt(9);
      expect(result).toBe(3);
    });

    it('should calculate square root of zero', () => {
      const result = calculator.sqrt(0);
      expect(result).toBe(0);
    });

    it('should calculate square root of decimal', () => {
      const result = calculator.sqrt(2.25);
      expect(result).toBe(1.5);
    });

    it('should calculate square root of 1', () => {
      const result = calculator.sqrt(1);
      expect(result).toBe(1);
    });

    it('should throw error for negative number', () => {
      expect(() => calculator.sqrt(-1)).toThrow('Cannot calculate square root of negative number');
    });

    it('should throw error for non-number input', () => {
      expect(() => calculator.sqrt('9')).toThrow('Argument must be a number');
      expect(() => calculator.sqrt(null)).toThrow('Argument must be a number');
    });
  });

  describe('History Management', () => {
    it('should track calculation history', () => {
      calculator.add(2, 3);
      calculator.multiply(4, 5);
      
      const history = calculator.getHistory();
      expect(history).toHaveLength(2);
      
      expect(history[0]).toEqual({
        operation: 'add',
        inputs: [2, 3],
        result: 5,
        timestamp: expect.any(String)
      });
      
      expect(history[1]).toEqual({
        operation: 'multiply',
        inputs: [4, 5],
        result: 20,
        timestamp: expect.any(String)
      });
    });

    it('should get last calculation', () => {
      calculator.add(2, 3);
      calculator.multiply(4, 5);
      
      const lastCalc = calculator.getLastCalculation();
      expect(lastCalc).toEqual({
        operation: 'multiply',
        inputs: [4, 5],
        result: 20,
        timestamp: expect.any(String)
      });
    });

    it('should return null for last calculation when no history', () => {
      const lastCalc = calculator.getLastCalculation();
      expect(lastCalc).toBeNull();
    });

    it('should clear history', () => {
      calculator.add(2, 3);
      calculator.multiply(4, 5);
      
      expect(calculator.getHistory()).toHaveLength(2);
      
      calculator.clearHistory();
      expect(calculator.getHistory()).toHaveLength(0);
      expect(calculator.getLastCalculation()).toBeNull();
    });

    it('should limit history size', () => {
      const maxSize = calculator.maxHistorySize;
      
      // Perform more calculations than max history size
      for (let i = 0; i < maxSize + 10; i++) {
        calculator.add(i, i + 1);
      }
      
      const history = calculator.getHistory();
      expect(history).toHaveLength(maxSize);
      
      // Should contain the most recent calculations
      const lastCalc = calculator.getLastCalculation();
      expect(lastCalc.inputs).toEqual([maxSize + 8, maxSize + 9]);
    });

    it('should return copies of history to prevent external modification', () => {
      calculator.add(2, 3);
      
      const history1 = calculator.getHistory();
      const history2 = calculator.getHistory();
      
      // Should be different objects
      expect(history1).not.toBe(history2);
      expect(history1[0]).not.toBe(history2[0]);
      
      // Modifying returned history should not affect internal state
      history1[0].result = 999;
      
      const history3 = calculator.getHistory();
      expect(history3[0].result).toBe(5); // Original value preserved
    });
  });

  describe('Statistics', () => {
    it('should return empty statistics for new calculator', () => {
      const stats = calculator.getStatistics();
      
      expect(stats).toEqual({
        totalCalculations: 0,
        operationCounts: {},
        mostUsedOperation: null,
        historySize: 0,
        maxHistorySize: 100
      });
    });

    it('should track operation counts', () => {
      calculator.add(1, 2);
      calculator.add(3, 4);
      calculator.multiply(2, 3);
      calculator.subtract(5, 2);
      calculator.add(6, 7);
      
      const stats = calculator.getStatistics();
      
      expect(stats.totalCalculations).toBe(5);
      expect(stats.operationCounts).toEqual({
        add: 3,
        multiply: 1,
        subtract: 1
      });
      expect(stats.mostUsedOperation).toBe('add');
      expect(stats.historySize).toBe(5);
    });

    it('should handle tie for most used operation', () => {
      calculator.add(1, 2);
      calculator.multiply(2, 3);
      
      const stats = calculator.getStatistics();
      expect(['add', 'multiply']).toContain(stats.mostUsedOperation);
    });
  });
});