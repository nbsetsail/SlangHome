import { z } from 'zod'

// User registration schema
// password is SHA-256 hash (64 hex characters) from frontend
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be at most 20 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(25, 'Display name must be at most 25 characters long')
    .regex(/^[\p{L}\p{N}\s_-]+$/u, 'Display name contains invalid characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().length(64, 'Invalid password format').regex(/^[a-fA-F0-9]{64}$/, 'Invalid password format'),
  verificationCode: z.string().length(6, 'Verification code must be 6 digits')
})

// User login schema
// password is SHA-256 hash (64 hex characters) from frontend
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().length(64, 'Invalid password format').regex(/^[a-fA-F0-9]{64}$/, 'Invalid password format')
})

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
})

// Password reset schema
// newPassword is SHA-256 hash (64 hex characters) from frontend
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().length(64, 'Invalid password format').regex(/^[a-fA-F0-9]{64}$/, 'Invalid password format'),
  confirmPassword: z.string().length(64, 'Invalid password format').regex(/^[a-fA-F0-9]{64}$/, 'Invalid password format')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Like schema
export const likeSchema = z.object({
  slangId: z.union([z.string(), z.number()]).refine(val => {
    if (typeof val === 'string') return val.length >= 1
    return val >= 1
  }, 'Slang ID is required'),
  userId: z.string().min(1, 'User ID is required')
})

// Favorite schema
export const favoriteSchema = z.object({
  slangId: z.union([z.string(), z.number()]).refine(val => {
    if (typeof val === 'string') return val.length >= 1
    return val >= 1
  }, 'Slang ID is required'),
  userId: z.string().min(1, 'User ID is required')
})

// Comment schema
export const commentSchema = z.object({
  slangId: z.string().min(1, 'Slang ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  content: z.string().min(1, 'Comment content is required')
})

// Comment like schema
export const commentLikeSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  userId: z.string().min(1, 'User ID is required')
})

// Search schema
export const searchSchema = z.object({
  keyword: z.string().min(1, 'Search keyword is required'),
  userId: z.string().optional()
})

// Slang creation schema
export const slangCreateSchema = z.object({
  phrase: z.string().min(1, 'Phrase is required'),
  explanation: z.string().min(1, 'Explanation is required'),
  example: z.string().optional(),
  origin: z.string().optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
  user_id: z.string().min(1, 'User ID is required')
})

// User creation schema (admin)
export const userCreateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be at most 20 characters long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(25, 'Display name must be at most 25 characters long')
    .regex(/^[\p{L}\p{N}\s_-]+$/u, 'Display name contains invalid characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.string().optional().default('user')
})

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(25, 'Display name must be at most 25 characters long')
    .regex(/^[\p{L}\p{N}\s_-]+$/u, 'Display name contains invalid characters'),
  gender: z.string().optional(),
  bio: z.string().max(200, 'Bio must be at most 200 characters').optional(),
  show_rank: z.boolean().optional(),
  show_achievement: z.boolean().optional(),
  equipped_achievement: z.string().optional()
})

// Validate function
export function validateSchema(schema, data) {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map(err => err.message).join(', ')
      }
    }
    return {
      success: false,
      error: 'Invalid data format'
    }
  }
}

// PK WebSocket message schemas
export const PK_MESSAGE_MAX_SIZE = 1024

export const pkJoinQueueSchema = z.object({
  type: z.literal('join_queue')
})

export const pkCancelQueueSchema = z.object({
  type: z.literal('cancel_queue')
})

export const pkAnswerSchema = z.object({
  type: z.literal('answer'),
  questionIndex: z.number().int().min(0).max(4),
  answerIndex: z.number().int().min(-1).max(3),
  answerTime: z.number().int().min(0).max(15000)
})

export const pkLeaveRoomSchema = z.object({
  type: z.literal('leave_room')
})

export const pkMessageSchema = z.discriminatedUnion('type', [
  pkJoinQueueSchema,
  pkCancelQueueSchema,
  pkAnswerSchema,
  pkLeaveRoomSchema
])

export function validatePKMessage(data) {
  try {
    const validatedData = pkMessageSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error.errors) {
      return {
        success: false,
        error: error.errors.map(err => err.message).join(', ')
      }
    }
    return {
      success: false,
      error: 'Invalid message format'
    }
  }
}
