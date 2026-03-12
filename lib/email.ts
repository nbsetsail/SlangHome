import nodemailer, { TransportOptions } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  from: string
  fromName: string
  user?: string
  password?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
    
    const transportOptions: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 10000,
      socketTimeout: 10000,
      greetingTimeout: 5000,
      logger: true,
      debug: process.env.NODE_ENV === 'development'
    }
    
    if (config.user && config.password) {
      transportOptions.auth = {
        user: config.user,
        pass: config.password
      }
    }
    
    this.transporter = nodemailer.createTransport(transportOptions)
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Email server connection verified')
      return true
    } catch (error) {
      console.error('Email server connection failed:', error)
      return false
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to send email to ${to} (attempt ${attempt}/${maxRetries})...`);
        
        const mailOptions = {
          from: `"${this.config.fromName}" <${this.config.from}>`,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''),
        }

        const result = await this.transporter.sendMail(mailOptions)
        console.log(`✅ Email sent to ${to}: ${result.messageId}`)
        return true
      } catch (error) {
        console.error(`❌ Failed to send email (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt === maxRetries) {
          console.error(`💥 All ${maxRetries} attempts failed for email to ${to}`)
          return false
        }
        
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
    
    return false
  }

  async sendWelcomeEmail(to: string, username: string, confirmationLink?: string): Promise<boolean> {
    const subject = 'Welcome to Slang Home!'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Slang Home!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Thank you for joining our community of language enthusiasts!</p>
            
            <p>With your account, you can:</p>
            <ul>
              <li>Submit new slang terms and definitions</li>
              <li>Vote on existing slang entries</li>
              <li>Comment and discuss slang usage</li>
              <li>Track slang evolution over time</li>
            </ul>
            
            ${confirmationLink ? `
            <p>To complete your registration, please confirm your email address:</p>
            <a href="${confirmationLink}" class="button">Confirm Email Address</a>
            <p><small>Or copy this link: ${confirmationLink}</small></p>
            ` : ''}
            
            <p>If you have any questions, feel free to reply to this email.</p>
            
            <p>Happy exploring!<br>The Slang Home Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${to}. If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `Welcome to Slang Home!

Hi ${username},

Thank you for joining our community of language enthusiasts!

With your account, you can:
- Submit new slang terms and definitions
- Vote on existing slang entries
- Comment and discuss slang usage
- Track slang evolution over time

${confirmationLink ? `To complete your registration, please confirm your email address:
${confirmationLink}` : ''}

If you have any questions, feel free to reply to this email.

Happy exploring!
The Slang Home Team

This email was sent to ${to}. If you didn't create an account, please ignore this email.`

    return this.sendEmail(to, subject, html, text)
  }

  async sendPasswordResetEmail(to: string, username: string, resetLink: string): Promise<boolean> {
    const subject = 'Reset Your Slang Home Password'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef3c7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>We received a request to reset your password for your Slang Home account.</p>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>To reset your password, click the button below:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p><small>Or copy this link: ${resetLink}</small></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
            
            <p>Best regards,<br>The Slang Home Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${to}. If you didn't request a password reset, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `Password Reset Request - Slang Home

Hi ${username},

We received a request to reset your password for your Slang Home account.

Important: This link will expire in 1 hour for security reasons.

To reset your password, click the link below:
${resetLink}

If you didn't request a password reset, you can safely ignore this email. Your account remains secure.

Best regards,
The Slang Home Team

This email was sent to ${to}. If you didn't request a password reset, please ignore this email.`

    return this.sendEmail(to, subject, html, text)
  }

  async sendNotificationEmail(to: string, username: string, title: string, message: string, actionLink?: string): Promise<boolean> {
    const subject = `${title} - Slang Home`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .code { font-size: 32px; font-weight: bold; color: #4f46e5; text-align: center; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; letter-spacing: 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            ${message}
            
            ${actionLink ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${actionLink}" class="button">Take Action</a>
              </div>
            ` : ''}
            
            <p>Best regards,<br>The Slang Home Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${to}. You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `${title}

Hi ${username},

${message}

${actionLink ? `Take action: ${actionLink}` : ''}

Best regards,
The Slang Home Team

This email was sent to ${to}. You can manage your notification preferences in your account settings.`

    return this.sendEmail(to, subject, html, text)
  }

  async sendVerificationCodeEmail(to: string, verificationCode: string): Promise<boolean> {
    const subject = 'Verify Your Email - Slang Home'
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Slang Home</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>Thank you for registering with Slang Home. Please use the following verification code to complete your registration:</p>
            <div class="code">${verificationCode}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Slang Home. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
      Verify Your Email - Slang Home
      
      Hello,
      
      Thank you for registering with Slang Home. Please use the following verification code to complete your registration:
      
      Verification Code: ${verificationCode}
      
      This code will expire in 10 minutes.
      
      If you didn't request this verification, please ignore this email.
      
      © 2026 Slang Home. All rights reserved.
    `

    return this.sendEmail(to, subject, html, text)
  }
}

export const emailService = new EmailService({
  host: process.env.EMAIL_HOST || '127.0.0.1',
  port: parseInt(process.env.EMAIL_PORT || '1025'),
  secure: process.env.EMAIL_SECURE === 'true',
  from: process.env.EMAIL_FROM || 'dev@slanghome.local',
  fromName: process.env.EMAIL_FROM_NAME || 'Slang Home',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
})

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED !== 'false'
}
