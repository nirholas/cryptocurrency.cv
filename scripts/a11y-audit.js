#!/usr/bin/env node
const pa11y = require('pa11y');

async function runAudit() {
  try {
    const results = await pa11y('https://free-crypto-news.vercel.app', {
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });
    console.log('Pa11y Accessibility Audit Results:');
    console.log('==================================');
    console.log(`Total issues: ${results.issues.length}`);
    console.log('');
    
    if (results.issues.length === 0) {
      console.log('✅ No accessibility issues found!');
    } else {
      results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
        console.log(`   Selector: ${issue.selector}`);
        console.log(`   Context: ${issue.context.substring(0, 100)}...`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error running pa11y:', error.message);
  }
}

runAudit();
