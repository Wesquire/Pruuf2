/**
 * Item 15: PIN Strength Validation - Validation Tests
 *
 * MEDIUM: Tests PIN strength validation to prevent weak/common PINs
 * Ensures users choose secure PINs
 */

import {describe, it, expect} from '@jest/globals';

// Import PIN validation utilities
const {
  validatePinFormat,
  isSequentialPin,
  isRepeatedPin,
  isCommonPin,
  hasRepeatedPairs,
  validatePinStrength,
  getPinStrength,
  getPinStrengthDescription,
  generateStrongPin,
  hasMinimumEntropy,
} = require('../supabase/functions/_shared/pinValidator.ts');

describe('Item 15: PIN Strength Validation', () => {
  describe('Test 15.1: PIN Format Validation', () => {
    it('should accept valid 4-digit PINs', () => {
      expect(validatePinFormat('1234')).toBe(true);
      expect(validatePinFormat('5678')).toBe(true);
      expect(validatePinFormat('0000')).toBe(true);
      expect(validatePinFormat('9999')).toBe(true);
    });

    it('should reject PINs that are too short', () => {
      expect(validatePinFormat('123')).toBe(false);
      expect(validatePinFormat('12')).toBe(false);
      expect(validatePinFormat('1')).toBe(false);
      expect(validatePinFormat('')).toBe(false);
    });

    it('should reject PINs that are too long', () => {
      expect(validatePinFormat('12345')).toBe(false);
      expect(validatePinFormat('123456')).toBe(false);
    });

    it('should reject non-numeric PINs', () => {
      expect(validatePinFormat('abcd')).toBe(false);
      expect(validatePinFormat('12ab')).toBe(false);
      expect(validatePinFormat('a234')).toBe(false);
      expect(validatePinFormat('12-34')).toBe(false);
      expect(validatePinFormat('12.34')).toBe(false);
    });
  });

  describe('Test 15.2: Sequential PIN Detection', () => {
    it('should detect ascending sequential PINs', () => {
      expect(isSequentialPin('1234')).toBe(true);
      expect(isSequentialPin('2345')).toBe(true);
      expect(isSequentialPin('3456')).toBe(true);
      expect(isSequentialPin('4567')).toBe(true);
      expect(isSequentialPin('5678')).toBe(true);
      expect(isSequentialPin('6789')).toBe(true);
      expect(isSequentialPin('0123')).toBe(true);
    });

    it('should detect descending sequential PINs', () => {
      expect(isSequentialPin('4321')).toBe(true);
      expect(isSequentialPin('5432')).toBe(true);
      expect(isSequentialPin('6543')).toBe(true);
      expect(isSequentialPin('7654')).toBe(true);
      expect(isSequentialPin('8765')).toBe(true);
      expect(isSequentialPin('9876')).toBe(true);
      expect(isSequentialPin('3210')).toBe(true);
    });

    it('should detect wrapping sequential PINs', () => {
      expect(isSequentialPin('9012')).toBe(true);
      expect(isSequentialPin('8901')).toBe(true);
      expect(isSequentialPin('7890')).toBe(true);
    });

    it('should not flag non-sequential PINs', () => {
      expect(isSequentialPin('1357')).toBe(false);
      expect(isSequentialPin('2468')).toBe(false);
      expect(isSequentialPin('1379')).toBe(false);
      expect(isSequentialPin('5739')).toBe(false);
    });
  });

  describe('Test 15.3: Repeated Digit Detection', () => {
    it('should detect all repeated digits', () => {
      expect(isRepeatedPin('0000')).toBe(true);
      expect(isRepeatedPin('1111')).toBe(true);
      expect(isRepeatedPin('2222')).toBe(true);
      expect(isRepeatedPin('3333')).toBe(true);
      expect(isRepeatedPin('4444')).toBe(true);
      expect(isRepeatedPin('5555')).toBe(true);
      expect(isRepeatedPin('6666')).toBe(true);
      expect(isRepeatedPin('7777')).toBe(true);
      expect(isRepeatedPin('8888')).toBe(true);
      expect(isRepeatedPin('9999')).toBe(true);
    });

    it('should not flag PINs with some variation', () => {
      expect(isRepeatedPin('1112')).toBe(false);
      expect(isRepeatedPin('1211')).toBe(false);
      expect(isRepeatedPin('1234')).toBe(false);
    });
  });

  describe('Test 15.4: Common PIN Detection', () => {
    it('should detect top common PINs', () => {
      // Top 10 most common
      expect(isCommonPin('1234')).toBe(true);
      expect(isCommonPin('1111')).toBe(true);
      expect(isCommonPin('0000')).toBe(true);
      expect(isCommonPin('1212')).toBe(true);
      expect(isCommonPin('7777')).toBe(true);
      expect(isCommonPin('1004')).toBe(true);
      expect(isCommonPin('2000')).toBe(true);
      expect(isCommonPin('4444')).toBe(true);
      expect(isCommonPin('2222')).toBe(true);
      expect(isCommonPin('6969')).toBe(true);
    });

    it('should detect common date-based PINs', () => {
      expect(isCommonPin('0101')).toBe(true); // Jan 1
      expect(isCommonPin('1225')).toBe(true); // Christmas
      expect(isCommonPin('0704')).toBe(true); // July 4th
    });

    it('should not flag uncommon PINs', () => {
      expect(isCommonPin('5739')).toBe(false);
      expect(isCommonPin('8264')).toBe(false);
      expect(isCommonPin('3947')).toBe(false);
    });
  });

  describe('Test 15.5: Repeated Pairs Detection', () => {
    it('should detect repeated pair patterns', () => {
      expect(hasRepeatedPairs('1212')).toBe(true);
      expect(hasRepeatedPairs('3434')).toBe(true);
      expect(hasRepeatedPairs('5656')).toBe(true);
      expect(hasRepeatedPairs('7878')).toBe(true);
      expect(hasRepeatedPairs('0909')).toBe(true);
    });

    it('should not flag non-repeated pairs', () => {
      expect(hasRepeatedPairs('1234')).toBe(false);
      expect(hasRepeatedPairs('5678')).toBe(false);
      expect(hasRepeatedPairs('1357')).toBe(false);
    });
  });

  describe('Test 15.6: Comprehensive PIN Strength Validation', () => {
    it('should reject PINs with invalid format', () => {
      const result = validatePinStrength('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_PIN_FORMAT');
    });

    it('should reject repeated digit PINs', () => {
      const result = validatePinStrength('1111');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('same digit');
    });

    it('should reject sequential PINs', () => {
      const result = validatePinStrength('1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('sequential');
    });

    it('should reject repeated pair PINs', () => {
      const result = validatePinStrength('1212');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('repeated pairs');
    });

    it('should reject common PINs', () => {
      // Use '1004' - common PIN but not repeated or sequential
      const result = validatePinStrength('1004');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN_TOO_WEAK');
      expect(result.reason).toContain('too common');
    });

    it('should accept strong PINs', () => {
      expect(validatePinStrength('5739').isValid).toBe(true);
      expect(validatePinStrength('8264').isValid).toBe(true);
      expect(validatePinStrength('3947').isValid).toBe(true);
      expect(validatePinStrength('6182').isValid).toBe(true);
    });
  });

  describe('Test 15.7: PIN Strength Scoring', () => {
    it('should give low score to weak PINs', () => {
      expect(getPinStrength('0000')).toBeLessThan(30);
      expect(getPinStrength('1111')).toBeLessThan(30);
      expect(getPinStrength('1234')).toBeLessThan(50);
      expect(getPinStrength('1212')).toBeLessThan(70);
    });

    it('should give high score to strong PINs', () => {
      expect(getPinStrength('5739')).toBeGreaterThanOrEqual(80);
      expect(getPinStrength('8264')).toBeGreaterThanOrEqual(80);
      expect(getPinStrength('3947')).toBeGreaterThanOrEqual(80);
    });

    it('should score based on digit diversity', () => {
      // All different digits = highest score
      const score4unique = getPinStrength('5739'); // 4 unique (5,7,3,9)
      const score3unique = getPinStrength('1123'); // 3 unique (1,2,3)
      const score2unique = getPinStrength('1121'); // 2 unique (1,2)

      expect(score4unique).toBeGreaterThan(score3unique);
      expect(score3unique).toBeGreaterThan(score2unique);
    });

    it('should return 0 for invalid format', () => {
      expect(getPinStrength('123')).toBe(0);
      expect(getPinStrength('abcd')).toBe(0);
      expect(getPinStrength('')).toBe(0);
    });
  });

  describe('Test 15.8: PIN Strength Description', () => {
    it('should describe very weak PINs', () => {
      expect(getPinStrengthDescription('0000')).toBe('Very Weak');
      expect(getPinStrengthDescription('1111')).toBe('Very Weak');
    });

    it('should describe weak PINs', () => {
      expect(getPinStrengthDescription('1234')).toMatch(/Weak|Fair/);
    });

    it('should describe strong PINs', () => {
      expect(getPinStrengthDescription('5739')).toMatch(/Strong|Good/);
      expect(getPinStrengthDescription('8264')).toMatch(/Strong|Good/);
    });
  });

  describe('Test 15.9: Generate Strong PIN', () => {
    it('should generate a valid 4-digit PIN', () => {
      const pin = generateStrongPin();
      expect(pin).toHaveLength(4);
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    it('should generate a PIN that passes validation', () => {
      const pin = generateStrongPin();
      const validation = validatePinStrength(pin);
      expect(validation.isValid).toBe(true);
    });

    it('should generate different PINs', () => {
      const pins = new Set();
      for (let i = 0; i < 10; i++) {
        pins.add(generateStrongPin());
      }
      // Should have generated at least 5 different PINs out of 10
      expect(pins.size).toBeGreaterThanOrEqual(5);
    });

    it('should generate high-strength PINs', () => {
      const pin = generateStrongPin();
      const strength = getPinStrength(pin);
      expect(strength).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Test 15.10: Entropy Check', () => {
    it('should require at least 3 unique digits', () => {
      expect(hasMinimumEntropy('1234')).toBe(true); // 4 unique
      expect(hasMinimumEntropy('1237')).toBe(true); // 4 unique
      expect(hasMinimumEntropy('1123')).toBe(true); // 3 unique
      expect(hasMinimumEntropy('1112')).toBe(false); // 2 unique
      expect(hasMinimumEntropy('1111')).toBe(false); // 1 unique
    });
  });

  describe('Test 15.11: Edge Cases', () => {
    it('should handle PIN with leading zeros', () => {
      expect(validatePinStrength('0123').isValid).toBe(false); // Sequential
      expect(validatePinStrength('0147').isValid).toBe(true); // Strong
    });

    it('should validate PINs at boundary values', () => {
      expect(validatePinFormat('0000')).toBe(true);
      expect(validatePinFormat('9999')).toBe(true);
    });

    it('should handle null/undefined gracefully', () => {
      expect(validatePinFormat(null as any)).toBe(false);
      expect(validatePinFormat(undefined as any)).toBe(false);
    });
  });

  describe('Test 15.12: Real-World Scenarios', () => {
    it('should reject commonly chosen PINs', () => {
      const commonChoices = [
        '1234', // Most common
        '0000', // All zeros
        '1111', // All ones
        '1212', // Repeated pair
        '7777', // Lucky number
        '1004', // "I love you" (10/04)
        '6969', // Immature choice
      ];

      commonChoices.forEach(pin => {
        const validation = validatePinStrength(pin);
        expect(validation.isValid).toBe(false);
      });
    });

    it('should accept reasonably strong PINs', () => {
      const goodChoices = ['5739', '8264', '3947', '6182', '9375'];

      goodChoices.forEach(pin => {
        const validation = validatePinStrength(pin);
        expect(validation.isValid).toBe(true);
      });
    });
  });
});

describe('Item 15: Integration Test - PIN Creation Flow', () => {
  it('should validate PIN during account creation', () => {
    // User attempts to create account with weak PIN
    const weakPin = '1234';
    const weakValidation = validatePinStrength(weakPin);

    expect(weakValidation.isValid).toBe(false);
    expect(weakValidation.error).toBe('PIN_TOO_WEAK');
    // Frontend should show error: weakValidation.reason

    // User chooses a strong PIN
    const strongPin = '5739';
    const strongValidation = validatePinStrength(strongPin);

    expect(strongValidation.isValid).toBe(true);
    // Proceed with account creation
  });

  it('should provide helpful feedback for PIN strength', () => {
    const testPins = [
      {pin: '0000', expectedFeedback: /same digit|weak/i}, // Caught by repeated check
      {pin: '1234', expectedFeedback: /sequential|weak/i},
      {pin: '1212', expectedFeedback: /repeated|weak/i},
      {pin: '5739', expectedFeedback: /strong|good/i},
    ];

    testPins.forEach(({pin, expectedFeedback}) => {
      const validation = validatePinStrength(pin);
      if (!validation.isValid) {
        expect(validation.reason).toMatch(expectedFeedback);
      } else {
        const description = getPinStrengthDescription(pin);
        expect(description).toMatch(expectedFeedback);
      }
    });
  });

  it('should handle PIN change validation', () => {
    const oldPin = '1234'; // User's current weak PIN
    const newPin1 = '4321'; // Still weak (reverse sequential)
    const newPin2 = '5739'; // Strong PIN

    // Try to change to another weak PIN
    expect(validatePinStrength(newPin1).isValid).toBe(false);

    // Change to strong PIN - should succeed
    expect(validatePinStrength(newPin2).isValid).toBe(true);
  });
});
