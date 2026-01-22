/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Style files
  '*.{css,scss}': [
    'prettier --write',
  ],
  
  // JSON, YAML, Markdown
  '*.{json,yaml,yml,md}': [
    'prettier --write',
  ],
  
  // Type checking for TypeScript files
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
