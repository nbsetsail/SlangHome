import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

async function generatePasswords() {
  console.log('🔧 密码哈希生成工具\n');
  
  while (true) {
    const plainPassword = await question('请输入原始密码 (直接回车退出): ');
    
    if (!plainPassword.trim()) {
      break;
    }
    
    const sha256Hash = await sha256(plainPassword);
    const salt = await bcrypt.genSalt(10);
    const bcryptHash = await bcrypt.hash(sha256Hash, salt);
    
    console.log('\n--- 结果 ---');
    console.log(`原始密码: ${plainPassword}`);
    console.log(`SHA-256: ${sha256Hash}`);
    console.log(`bcrypt: ${bcryptHash}`);
    console.log('');
  }
  
  console.log('✅ 完成！');
  rl.close();
}

generatePasswords().catch(console.error);
