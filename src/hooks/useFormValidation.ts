/**
 * Form Validation Hook
 * Item 39: Implement Form Validation (HIGH)
 *
 * Provides real-time form validation with Yup schemas
 */

import { useState, useCallback } from 'react';
import * as yup from 'yup';

interface ValidationErrors {
  [key: string]: string;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: ValidationErrors;
  touched: { [key in keyof T]?: boolean };
  isValid: boolean;
  isValidating: boolean;
  setValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: yup.Schema<T>,
  initialValues: T
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key in keyof T]?: boolean }>({});
  const [isValidating, setIsValidating] = useState(false);

  // Set a single field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when value changes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Set multiple values at once
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  // Mark a field as touched (user interacted with it)
  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  // Validate a single field
  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      try {
        // Extract the field schema from the main schema
        await schema.validateAt(field as string, values);

        // Clear error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });

        return true;
      } catch (error) {
        if (error instanceof yup.ValidationError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: error.message,
          }));
        }
        return false;
      }
    },
    [schema, values]
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);

    try {
      await schema.validate(values, { abortEarly: false });
      setErrors({});
      setIsValidating(false);
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const validationErrors: ValidationErrors = {};
        error.inner.forEach(err => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        setErrors(validationErrors);
      }
      setIsValidating(false);
      return false;
    }
  }, [schema, values]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Check if form is valid (no errors and at least one field touched)
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    setValues,
  };
}

/**
 * Simplified validation hook for single field validation
 */
export function useFieldValidation(
  validator: (value: any) => boolean | string,
  initialValue: any = ''
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const validate = useCallback(() => {
    const result = validator(value);
    if (typeof result === 'string') {
      setError(result);
      return false;
    }
    if (!result) {
      setError('Invalid value');
      return false;
    }
    setError('');
    return true;
  }, [validator, value]);

  const handleChange = useCallback((newValue: any) => {
    setValue(newValue);
    if (touched) {
      // Re-validate on change after first touch
      const result = validator(newValue);
      if (typeof result === 'string') {
        setError(result);
      } else {
        setError('');
      }
    }
  }, [validator, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  return {
    value,
    error,
    touched,
    isValid: !error && touched,
    setValue: handleChange,
    onBlur: handleBlur,
    validate,
  };
}
