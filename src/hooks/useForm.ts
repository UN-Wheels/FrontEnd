'use client';
import { useState, useCallback } from 'react';
import { ValidationError } from '../types';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => ValidationError[];
  onSubmit: (values: T) => Promise<void> | void;
}

export function useForm<T extends object>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      
      setValues(prev => ({
        ...prev,
        [name]: newValue,
      }));

      // Clear error for field when it changes
      setErrors(prev => prev.filter(error => error.field !== name));
    },
    []
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => new Set(prev).add(name));
  }, []);

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      const error = errors.find(e => e.field === fieldName);
      return error?.message;
    },
    [errors]
  );

  const isFieldTouched = useCallback(
    (fieldName: string): boolean => {
      return touched.has(fieldName);
    },
    [touched]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (validate) {
        const validationErrors = validate(values);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched(new Set());
  }, [initialValues]);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldError,
    isFieldTouched,
    reset,
    setFieldValue,
    setValues,
  };
}
