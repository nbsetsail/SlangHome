/**
 * 通用表单处理Hook
 * 解决项目中重复的表单状态管理和验证逻辑
 */

import { useState, useCallback, useMemo } from 'react'

// 表单字段类型定义
export type FormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'

// 表单字段配置
export interface FormFieldConfig<T = any> {
  name: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  initialValue?: T
  validator?: (value: T) => string | null
  formatter?: (value: T) => T
  dependencies?: string[] // 依赖的其他字段
}

// 表单验证错误
export interface FormErrors {
  [fieldName: string]: string
}

// 表单状态
export interface FormState<T> {
  values: T
  errors: FormErrors
  touched: { [fieldName: string]: boolean }
  isSubmitting: boolean
  isValid: boolean
}

// 表单配置
export interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: { [key: string]: (value: any, values: T) => string | null }
  onSubmit: (values: T) => Promise<void> | void
  onChange?: (values: T, changedField: string) => void
  onBlur?: (fieldName: string) => void
}

// 内置验证器
export const validators = {
  required: (message: string = 'This field is required') => 
    (value: any): string | null => {
      if (value === null || value === undefined || value === '') {
        return message
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message
      }
      return null
    },

  email: (message: string = 'Please enter a valid email address') =>
    (value: string): string | null => {
      if (!value) return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : message
    },

  minLength: (min: number, message?: string) => 
    (value: string): string | null => {
      if (!value) return null
      const defaultMessage = `Must be at least ${min} characters`
      return value.length >= min ? null : (message || defaultMessage)
    },

  maxLength: (max: number, message?: string) => 
    (value: string): string | null => {
      if (!value) return null
      const defaultMessage = `Must be no more than ${max} characters`
      return value.length <= max ? null : (message || defaultMessage)
    },

  pattern: (regex: RegExp, message: string) => 
    (value: string): string | null => {
      if (!value) return null
      return regex.test(value) ? null : message
    },

  confirmPassword: (passwordField: string, message: string = 'Passwords do not match') =>
    (value: string, values: any): string | null => {
      return value === values[passwordField] ? null : message
    },

  minValue: (min: number, message?: string) =>
    (value: number): string | null => {
      if (value === undefined || value === null) return null
      const defaultMessage = `Must be at least ${min}`
      return value >= min ? null : (message || defaultMessage)
    },

  maxValue: (max: number, message?: string) =>
    (value: number): string | null => {
      if (value === undefined || value === null) return null
      const defaultMessage = `Must be no more than ${max}`
      return value <= max ? null : (message || defaultMessage)
    }
}

// 格式化器
export const formatters = {
  trim: (value: string): string => value.trim(),
  lowercase: (value: string): string => value.toLowerCase(),
  uppercase: (value: string): string => value.toUpperCase(),
  capitalize: (value: string): string => 
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  numeric: (value: string): string => value.replace(/[^0-9]/g, ''),
  alphanumeric: (value: string): string => value.replace(/[^a-zA-Z0-9]/g, '')
}

export const useForm = <T extends Record<string, any>>(options: UseFormOptions<T>) => {
  const { initialValues, validationSchema = {}, onSubmit, onChange, onBlur } = options
  
  // 表单状态
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [fieldName: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 计算表单是否有效
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           Object.values(touched).some(Boolean)
  }, [errors, touched])

  // 验证单个字段
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const validator = (validationSchema as any)[fieldName] as ((value: any, values: T) => string | null) | undefined
    if (validator) {
      return validator(value, values)
    }
    return null
  }, [validationSchema, values])

  // 验证所有字段
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    Object.keys(values).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName as keyof T])
      if (error) {
        newErrors[fieldName] = error
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validateField])

  // 处理字段变更
  const handleChange = useCallback((
    fieldName: string, 
    value: any,
    shouldValidate: boolean = false
  ) => {
    setValues(prev => {
      const newValues = {
        ...prev,
        [fieldName]: value
      }
      
      // 触发onChange回调
      onChange?.(newValues, fieldName)
      
      // 如果字段已被触碰且需要验证
      if (shouldValidate || touched[fieldName]) {
        const error = validateField(fieldName, value)
        setErrors(prevErrors => ({
          ...prevErrors,
          [fieldName]: error || ''
        }))
      }
      
      return newValues
    })
  }, [onChange, touched, validateField])

  // 处理字段失焦
  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    onBlur?.(fieldName)
    
    // 验证该字段
    const error = validateField(fieldName, values[fieldName as keyof T])
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))
  }, [onBlur, validateField, values])

  // 重置表单
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // 提交表单
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault?.()
    
    // 标记所有字段为已触碰
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as { [key: string]: boolean })
    setTouched(allTouched)
    
    // 验证表单
    const isValid = validateForm()
    if (!isValid) return
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm, onSubmit])

  // 手动设置错误
  const setError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [])

  // 清除错误
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  // 手动触发验证
  const triggerValidation = useCallback((fieldName?: string) => {
    if (fieldName) {
      const error = validateField(fieldName, values[fieldName as keyof T])
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }))
    } else {
      validateForm()
    }
  }, [validateField, validateForm, values])

  return {
    // 状态
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    
    // 方法
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setError,
    clearError,
    triggerValidation,
    validateForm,
    
    // 便利方法
    getFieldProps: (fieldName: string) => ({
      name: fieldName,
      value: values[fieldName],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(fieldName, e.target.value, true),
      onBlur: () => handleBlur(fieldName),
      error: errors[fieldName],
      touched: touched[fieldName]
    }),
    
    getInputProps: (fieldName: string) => ({
      name: fieldName,
      value: values[fieldName],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(fieldName, e.target.value, true),
      onBlur: () => handleBlur(fieldName),
      error: errors[fieldName],
      touched: touched[fieldName],
      id: fieldName
    })
  }
}

// 便利的表单字段Hook
export const useFormField = <T>(
  initialValue: T,
  validator?: (value: T) => string | null
) => {
  const [value, setValue] = useState<T>(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const handleChange = (newValue: T) => {
    setValue(newValue)
    if (touched && validator) {
      setError(validator(newValue))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    if (validator) {
      setError(validator(value))
    }
  }

  const reset = () => {
    setValue(initialValue)
    setError(null)
    setTouched(false)
  }

  return {
    value,
    error,
    touched,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    reset,
    isValid: !error && touched
  }
}

export default useForm