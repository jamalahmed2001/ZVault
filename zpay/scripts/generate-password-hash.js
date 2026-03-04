import { hash } from 'bcryptjs';

async function generateHash() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node generate-password-hash.js <password>');
    process.exit(1);
  }
  const hashedPassword = await hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  console.log('\nUse this hash in your SQL INSERT statement.');
}

generateHash().catch(console.error);
