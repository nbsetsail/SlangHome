import { executeQuery } from '@/lib/db';

export async function createActivationCodesTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS activation_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      count INT DEFAULT 5,
      device_ids JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expired_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year')
    )
  `);
  console.log('✅ activation_codes表创建成功');
}

export async function generateCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let j = 0; j < 12; j++) {
    if (j > 0 && j % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const result = await executeQuery<{ code: string }[]>(
    `INSERT INTO activation_codes (code) VALUES ($1) ON CONFLICT DO NOTHING RETURNING code`,
    [code]
  );
  
  return result.rows[0]?.code : null;
}

export async function generateCodes(count: number = 10) {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = await generateCode();
    codes.push(code);
  }
  
  console.log(`✅ Generated ${count} codes:`);
  codes.forEach(c => console.log(`  ${c}`));
  return codes;
}

