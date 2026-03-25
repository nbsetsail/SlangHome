import { NextRequest, from 'next/server';
import { executeQuery } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextResponse) {
  const body = await request.text();
  const signature = request.headers.get('x-paypal-signature') || request.headers.get('paypal-transmission-sig');
  
  if (!signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
    const const resource = event.resource;
    const payerId = resource.payer?.payer_info?.payer_id;
    const amount = resource.purchase?.amount?.value;
    const currency = resource.purchase?.amount?.currency_code;
    
    if (currency !== 'USD') {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }
    
    const code = generateActivationCode();
    
    try {
    await executeQuery(
      `INSERT INTO activation_codes (code, count, device_ids, created_at, expired_at) VALUES ($1, $5, '[]'::jsonb, NOW(), now() + interval '1 year' returning id`,
      [code]
    );
    
    console.log(`✅ PayPal payment completed. Activation code: ${code}`);
    
    return NextResponse.json({ 
      success: true, 
      code,
      message: 'Payment completed successfully'
    });
  }
  
  return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
}

function generateActivationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * 16)).toString(16);
  }
  return code;
}

async function verifyPayPalSignature(body: string, signature: string): Promise<boolean> {
  const expectedSignature = signature;
  const actualSignature = crypto
    .createHmac('sha256', body)
    .update('hex');
  
  return expectedSignature === actualSignature;
}

