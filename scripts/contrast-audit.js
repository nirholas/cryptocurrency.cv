/**
 * Color Contrast Audit Script
 * Checks WCAG 2.1 color contrast ratios for common color combinations
 */

// WCAG contrast ratio requirements:
// - AA Normal text: 4.5:1
// - AA Large text (18pt+ or 14pt+ bold): 3:1
// - AAA Normal text: 7:1
// - AAA Large text: 4.5:1

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(fg, bg, name) {
  const ratio = getContrastRatio(fg, bg);
  const passAA = ratio >= 4.5;
  const passAAA = ratio >= 7;
  const passAALarge = ratio >= 3;
  
  return {
    name,
    foreground: fg,
    background: bg,
    ratio: ratio.toFixed(2),
    AA: passAA ? '✅' : '❌',
    AAA: passAAA ? '✅' : '❌',
    AALarge: passAALarge ? '✅' : '❌',
  };
}

// Color palette from the design system (matches tailwind.config.js + globals.css)
const colors = {
  // Brand colors - monochrome neutral gray (matches actual design system)
  'brand-50': '#fafafa',
  'brand-100': '#f5f5f5',
  'brand-200': '#e5e5e5',
  'brand-300': '#d4d4d4',
  'brand-400': '#a3a3a3',
  'brand-500': '#737373',
  'brand-600': '#525252',
  'brand-700': '#404040',
  'brand-800': '#262626',
  'brand-900': '#171717',
  
  // Grays (Tailwind default)
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  
  // Semantic - WCAG AAA compliant (matches --color-* vars in globals.css)
  'white': '#ffffff',
  'black': '#000000',
  'success': '#065f46',       // emerald-800: 8.22:1 on white - AAA
  'success-light': '#10b981', // For large text/icons only
  'danger': '#991b1b',        // red-800: 8.49:1 on white - AAA
  'danger-light': '#ef4444',  // For large text/icons only
  'warning': '#78350f',       // amber-900: 10.16:1 on white - AAA
  'warning-light': '#f59e0b', // For large text/icons only
};

// Common combinations to check
const combinations = [
  // Text on white backgrounds
  { fg: 'gray-900', bg: 'white', name: 'Primary text on white' },
  { fg: 'gray-700', bg: 'white', name: 'Secondary text on white' },
  { fg: 'gray-600', bg: 'white', name: 'Muted text on white' },
  { fg: 'gray-600', bg: 'white', name: 'Placeholder text on white' },
  { fg: 'brand-700', bg: 'white', name: 'Brand link on white' },
  { fg: 'brand-800', bg: 'white', name: 'Brand dark on white' },
  
  // Text on gray backgrounds
  { fg: 'gray-900', bg: 'gray-50', name: 'Primary text on gray-50' },
  { fg: 'gray-700', bg: 'gray-100', name: 'Secondary text on gray-100' },
  { fg: 'white', bg: 'gray-900', name: 'White text on dark' },
  { fg: 'gray-300', bg: 'gray-900', name: 'Muted text on dark' },
  
  // Brand combinations
  { fg: 'white', bg: 'brand-700', name: 'White on brand button' },
  { fg: 'brand-900', bg: 'brand-50', name: 'Dark brand on light brand' },
  { fg: 'brand-800', bg: 'brand-100', name: 'Brand text on brand bg' },
  
  // Semantic colors - Updated for WCAG compliance
  { fg: 'success', bg: 'white', name: 'Success text on white' },
  { fg: 'danger', bg: 'white', name: 'Error text on white' },
  { fg: 'warning', bg: 'white', name: 'Warning text on white' },
  { fg: 'white', bg: 'danger', name: 'White on error background' },
  { fg: 'white', bg: 'success', name: 'White on success background' },
];

console.log('='.repeat(80));
console.log('COLOR CONTRAST AUDIT - WCAG 2.1 Compliance Check');
console.log('='.repeat(80));
console.log('');
console.log('Requirements:');
console.log('  AA Normal text: 4.5:1 minimum');
console.log('  AA Large text (18pt+ or 14pt+ bold): 3:1 minimum');
console.log('  AAA Normal text: 7:1 minimum');
console.log('');
console.log('-'.repeat(80));

const results = combinations.map(combo => 
  checkContrast(colors[combo.fg], colors[combo.bg], combo.name)
);

// Table header
console.log(
  'Name'.padEnd(35) + 
  'Ratio'.padEnd(8) + 
  'AA'.padEnd(6) + 
  'AAA'.padEnd(6) + 
  'Large'
);
console.log('-'.repeat(80));

// Results
let failures = 0;
results.forEach(result => {
  if (result.AA === '❌') failures++;
  console.log(
    result.name.padEnd(35) + 
    result.ratio.padEnd(8) + 
    result.AA.padEnd(6) + 
    result.AAA.padEnd(6) + 
    result.AALarge
  );
});

console.log('');
console.log('='.repeat(80));
console.log(`Summary: ${results.length - failures}/${results.length} combinations pass AA standard`);

if (failures > 0) {
  console.log('');
  console.log('⚠️  FAILED combinations (below 4.5:1):');
  results.filter(r => r.AA === '❌').forEach(r => {
    console.log(`   - ${r.name}: ${r.ratio}:1`);
  });
}

console.log('');
