const fs = require('fs');
let content = fs.readFileSync('src/lib/crypto-news.ts', 'utf8');

// Fix: the disable script dropped the trailing comma after category
// Pattern: category: 'xxx'\n    disabled: true  → should be category: 'xxx',\n    disabled: true
const fixRegex = /category:\s*'([^']+)'\n(\s+disabled:\s*true)/g;
let fixCount = 0;
content = content.replace(fixRegex, (match, cat, rest) => {
  fixCount++;
  return `category: '${cat}',\n${rest}`;
});

fs.writeFileSync('src/lib/crypto-news.ts', content);
console.log(`Fixed ${fixCount} entries (added missing comma after category)`);
