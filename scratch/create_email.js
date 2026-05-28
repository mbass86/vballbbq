import nodemailer from 'nodemailer';

async function createAccount() {
  try {
    console.log('Generating a free temporary SMTP account on ethereal.email...');
    const account = await nodemailer.createTestAccount();
    console.log('\n=== ETHEREAL SMTP CREDENTIALS ===');
    console.log(`SMTP_HOST: ${account.smtp.host}`);
    console.log(`SMTP_PORT: ${account.smtp.port}`);
    console.log(`SMTP_USER: ${account.web ? account.user : 'N/A'}`);
    console.log(`SMTP_PASS: ${account.pass}`);
    console.log(`SMTP_FROM: "VolleyFest" <${account.user}>`);
    console.log(`Web Mailbox Login URL: ${account.web}`);
    console.log('=================================\n');
    console.log('To make your server use these credentials, run this command in your terminal:');
    console.log(`\nfly secrets set SMTP_HOST=${account.smtp.host} SMTP_PORT=${account.smtp.port} SMTP_USER=${account.user} SMTP_PASS=${account.pass} SMTP_FROM="VolleyFest <${account.user}>"`);
  } catch (err) {
    console.error('Error generating test account:', err);
  }
}

createAccount();
