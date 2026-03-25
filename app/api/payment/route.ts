import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { emailService } from '@/lib/email';

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}

async function sendActivationCodeEmail(to: string, code: string, amount: string): Promise<boolean> {
  const subject = 'Your Slang Home Activation Code';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 28px; font-weight: bold; color: #3b82f6; text-align: center; margin: 20px 0; padding: 20px; background: #fff; border: 2px dashed #3b82f6; border-radius: 8px; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Support!</h1>
          <p>Slang Home Premium Activation</p>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>Thank you for supporting Slang Home! Your contribution helps us continue improving the service.</p>
          
          <div class="info">
            <strong>Contribution Amount:</strong> ${amount}
          </div>
          
          <p>Here is your activation code:</p>
          <div class="code">${code}</div>
          
          <h3>How to activate:</h3>
          <ol>
            <li>Open the Slang Home browser extension</li>
            <li>Click the "Activate" button</li>
            <li>Enter the code above</li>
            <li>Enjoy premium features!</li>
          </ol>
          
          <p>If you have any questions, feel free to reply to this email.</p>
          
          <p>Best regards,<br>The Slang Home Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Slang Home. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Thank You for Your Support!

Hello,

Thank you for supporting Slang Home! Your contribution helps us continue improving the service.

Contribution Amount: ${amount}

Your activation code: ${code}

How to activate:
1. Open the Slang Home browser extension
2. Click the "Activate" button
3. Enter the code above
4. Enjoy premium features!

If you have any questions, feel free to reply to this email.

Best regards,
The Slang Home Team

© ${new Date().getFullYear()} Slang Home. All rights reserved.
  `;

  return emailService.sendEmail(to, subject, html, text);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Payment] Received:', JSON.stringify(body, null, 2));
    
    const { 
      email,
      amount,
      currency,
      transaction_id
    } = body.data || body;
    
    if (!email) {
      console.error('[Payment] No email provided');
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }
    
    const activationCode = generateActivationCode();
    
    await executeQuery(
      `INSERT INTO activation_codes (code, email, amount, currency, count, device_ids) VALUES ($1, $2, $3, $4, $5, '[]'::jsonb)`,
      [activationCode, email, parseFloat(amount) || 0, currency || 'USD', 5]
    );
    
    console.log(`[Payment] Generated code ${activationCode} for ${email}, amount: ${amount} ${currency}`);
    
    const amountDisplay = currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
    const emailSent = await sendActivationCodeEmail(email, activationCode, amountDisplay);
    
    if (!emailSent) {
      console.error('[Payment] Failed to send email');
    }
    
    return NextResponse.json({ 
      success: true, 
      code: activationCode,
      emailSent 
    });
    
  } catch (error) {
    console.error('[Payment] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Payment endpoint is active',
    timestamp: new Date().toISOString()
  });
}
