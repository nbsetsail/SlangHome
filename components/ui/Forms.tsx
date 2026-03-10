/**
 * 通用表单组件
 * 基于useForm Hook构建的可复用表单组件
 */

import React from 'react'
import { useForm, validators, formatters, type FormFieldConfig, type UseFormOptions } from '@/hooks/useForm'
import { ErrorMessage } from '@/components/ui/Errors'
import { useTheme } from '@/contexts/ThemeContext'

// 通用输入组件Props
interface CommonInputProps {
  label: string
  placeholder?: string
  required?: boolean
  error?: string
  touched?: boolean
  className?: string
  disabled?: boolean
}

// 文本输入组件
interface TextInputProps extends CommonInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'email' | 'password'
  minLength?: number
  maxLength?: number
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder,
  required,
  error,
  touched,
  className = '',
  disabled = false,
  value,
  onChange,
  onBlur,
  type = 'text',
  minLength,
  maxLength
}) => {
  const { cn: themeCn } = useTheme()
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md ${themeCn.focusRing} ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && touched && (
        <ErrorMessage message={error} type="error" className="mt-1" />
      )}
    </div>
  )
}

// 文本域组件
interface TextAreaProps extends CommonInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  rows?: number
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  required,
  error,
  touched,
  className = '',
  disabled = false,
  value,
  onChange,
  onBlur,
  rows = 4
}) => {
  const { cn: themeCn } = useTheme()
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-md ${themeCn.focusRing} resize-vertical ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {error && touched && (
        <ErrorMessage message={error} type="error" className="mt-1" />
      )}
    </div>
  )
}

// 选择框组件
interface SelectProps extends CommonInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: { value: string; label: string }[]
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder,
  required,
  error,
  touched,
  className = '',
  disabled = false,
  value,
  onChange,
  onBlur,
  options
}) => {
  const { cn: themeCn } = useTheme()
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md ${themeCn.focusRing} ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && touched && (
        <ErrorMessage message={error} type="error" className="mt-1" />
      )}
    </div>
  )
}

// 复选框组件
interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  const { cn } = useTheme()
  
  return (
    <div className="flex items-center mb-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`h-4 w-4 ${cn.colors.text.primary} ${cn.colors.border.ring} border-gray-300 rounded ${
          className
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      <label className={`ml-2 block text-sm text-gray-700 ${disabled ? 'opacity-50' : ''}`}>
        {label}
      </label>
    </div>
  )
}

// 表单容器组件
interface FormContainerProps<T extends Record<string, any>> extends UseFormOptions<T> {
  children: (form: ReturnType<typeof useForm<T>>) => React.ReactNode
  className?: string
  submitButtonText?: string
  cancelButtonText?: string
  onCancel?: () => void
  showActions?: boolean
}

export const FormContainer = <T extends Record<string, any>>({
  children,
  className = '',
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  onCancel,
  showActions = true,
  ...formOptions
}: FormContainerProps<T>) => {
  const form = useForm(formOptions)
  const { cn: themeCn } = useTheme()

  return (
    <form onSubmit={form.handleSubmit} className={className}>
      {children(form)}
      
      {showActions && (
        <div className="flex justify-end space-x-3 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={form.isSubmitting}
              className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 ${themeCn.focusRing} disabled:opacity-50`}
            >
              {cancelButtonText}
            </button>
          )}
          
          <button
            type="submit"
            disabled={form.isSubmitting || !form.isValid}
            className={`px-4 py-2 ${themeCn.primaryButton} rounded-md ${themeCn.focusRing} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {form.isSubmitting ? 'Processing...' : submitButtonText}
          </button>
        </div>
      )}
    </form>
  )
}

// 预制的常用表单验证配置
export const formPresets = {
  login: {
    account: [validators.required('Account is required')],
    password: [validators.required('Password is required')]
  },
  
  register: {
    email: [
      validators.required('Email is required'),
      validators.email('Please enter a valid email address')
    ],
    username: [
      validators.required('Username is required'),
      validators.minLength(3, 'Username must be at least 3 characters')
    ],
    password: [
      validators.required('Password is required'),
      validators.minLength(8, 'Password must be at least 8 characters'),
      validators.pattern(/^[a-zA-Z0-9]+$/, 'Password can only contain letters and numbers')
    ],
    confirmPassword: [
      validators.required('Please confirm your password'),
      validators.confirmPassword('password', 'Passwords do not match')
    ]
  },
  
  userEdit: {
    username: [
      validators.required('Username is required'),
      validators.minLength(3, 'Username must be at least 3 characters')
    ],
    email: [
      validators.required('Email is required'),
      validators.email('Please enter a valid email address')
    ]
  },
  
  slang: {
    phrase: [
      validators.required('Phrase is required'),
      validators.minLength(1, 'Phrase cannot be empty')
    ],
    explanation: [
      validators.required('Explanation is required'),
      validators.minLength(10, 'Explanation must be at least 10 characters')
    ]
  }
}

export { validators, formatters } from '@/hooks/useForm'