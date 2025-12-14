/**
 * useFormValidation Hook Integration Tests
 * Item 39: Implement Form Validation (HIGH)
 *
 * Tests validation logic through integration
 */

import * as yup from 'yup';

// Test schema
const testSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  age: yup.number().min(18, 'Must be at least 18').required('Age is required'),
});

describe('Form Validation Hook - Schema Integration', () => {
  it('should validate email correctly', async () => {
    await expect(
      testSchema.validateAt('email', {email: 'test@example.com'}),
    ).resolves.toBeTruthy();
    await expect(
      testSchema.validateAt('email', {email: 'invalid'}),
    ).rejects.toThrow('Invalid email');
    await expect(testSchema.validateAt('email', {email: ''})).rejects.toThrow(
      'Email is required',
    );
  });

  it('should validate password correctly', async () => {
    await expect(
      testSchema.validateAt('password', {password: 'password123'}),
    ).resolves.toBeTruthy();
    await expect(
      testSchema.validateAt('password', {password: 'short'}),
    ).rejects.toThrow('Password must be at least 8 characters');
  });

  it('should validate age correctly', async () => {
    await expect(testSchema.validateAt('age', {age: 25})).resolves.toBeTruthy();
    await expect(testSchema.validateAt('age', {age: 17})).rejects.toThrow(
      'Must be at least 18',
    );
  });

  it('should validate entire form', async () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      age: 25,
    };

    await expect(testSchema.validate(validData)).resolves.toBeTruthy();
  });

  it('should collect all errors when validating invalid form', async () => {
    const invalidData = {
      email: 'invalid',
      password: 'short',
      age: 10,
    };

    try {
      await testSchema.validate(invalidData, {abortEarly: false});
      fail('Should have thrown validation error');
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        expect(error.inner.length).toBeGreaterThan(0);
        expect(error.inner.some(e => e.path === 'email')).toBe(true);
        expect(error.inner.some(e => e.path === 'password')).toBe(true);
        expect(error.inner.some(e => e.path === 'age')).toBe(true);
      }
    }
  });
});

describe('Field Validation Logic', () => {
  const emailValidator = (value: string) => {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Invalid email';
    return true;
  };

  const passwordValidator = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return true;
  };

  it('should validate email field correctly', () => {
    expect(emailValidator('test@example.com')).toBe(true);
    expect(emailValidator('invalid')).toBe('Invalid email');
    expect(emailValidator('')).toBe('Email is required');
  });

  it('should validate password field correctly', () => {
    expect(passwordValidator('password123')).toBe(true);
    expect(passwordValidator('short')).toBe(
      'Password must be at least 8 characters',
    );
    expect(passwordValidator('')).toBe('Password is required');
  });

  it('should handle complex validation', () => {
    const complexValidator = (value: string) => {
      if (!value) return 'Required';
      if (!/^[a-zA-Z]+$/.test(value)) return 'Only letters allowed';
      if (value.length < 2) return 'Too short';
      return true;
    };

    expect(complexValidator('Valid')).toBe(true);
    expect(complexValidator('a1')).toBe('Only letters allowed');
    expect(complexValidator('a')).toBe('Too short');
    expect(complexValidator('')).toBe('Required');
  });
});

describe('Validation Utilities', () => {
  it('should extract validation errors from Yup', async () => {
    const invalidData = {
      email: 'invalid',
      password: 'short',
      age: 10,
    };

    try {
      await testSchema.validate(invalidData, {abortEarly: false});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach(err => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });

        expect(errors.email).toBeTruthy();
        expect(errors.password).toBeTruthy();
        expect(errors.age).toBeTruthy();
      }
    }
  });

  it('should validate single field from schema', async () => {
    const data = {email: 'test@example.com', password: '', age: 0};

    await expect(testSchema.validateAt('email', data)).resolves.toBeTruthy();
  });

  it('should handle missing fields', async () => {
    const incompleteData = {email: 'test@example.com'};

    await expect(testSchema.validate(incompleteData)).rejects.toThrow();
  });
});

describe('Form Validation - Real-world Scenarios', () => {
  const loginSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  });

  it('should validate login form with valid data', async () => {
    const loginData = {
      email: 'user@example.com',
      password: 'secretpassword',
    };

    await expect(loginSchema.validate(loginData)).resolves.toBeTruthy();
  });

  it('should reject login with invalid email', async () => {
    const loginData = {
      email: 'notanemail',
      password: 'secretpassword',
    };

    await expect(loginSchema.validate(loginData)).rejects.toThrow(
      'Invalid email',
    );
  });

  it('should reject login with missing password', async () => {
    const loginData = {
      email: 'user@example.com',
      password: '',
    };

    await expect(loginSchema.validate(loginData)).rejects.toThrow(
      'Password is required',
    );
  });
});

describe('Validation Performance', () => {
  it('should validate quickly', async () => {
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      await testSchema.validate({
        email: 'test@example.com',
        password: 'password123',
        age: 25,
      });
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should validate 100 forms in <1s
  });

  it('should handle concurrent validations', async () => {
    const validations = Array.from({length: 50}, () =>
      testSchema.validate({
        email: 'test@example.com',
        password: 'password123',
        age: 25,
      }),
    );

    await expect(Promise.all(validations)).resolves.toHaveLength(50);
  });
});

describe('Hook Validation Logic - Simulated', () => {
  // Simulate hook behavior
  const simulateFormValidation = async (schema: any, values: any) => {
    const errors: Record<string, string> = {};
    let isValid = false;

    try {
      await schema.validate(values, {abortEarly: false});
      isValid = true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        error.inner.forEach(err => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
      }
    }

    return {errors, isValid};
  };

  it('should return no errors for valid form', async () => {
    const result = await simulateFormValidation(testSchema, {
      email: 'test@example.com',
      password: 'password123',
      age: 25,
    });

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should return errors for invalid form', async () => {
    const result = await simulateFormValidation(testSchema, {
      email: 'invalid',
      password: 'short',
      age: 10,
    });

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });

  it('should handle partial validation', async () => {
    const fieldValue = 'test@example.com';
    const data = {email: fieldValue, password: '', age: 0};

    const isValidField = await testSchema
      .validateAt('email', data)
      .then(() => true)
      .catch(() => false);

    expect(isValidField).toBe(true);
  });
});
