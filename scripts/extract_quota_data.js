const fs = require('fs');

// Read the raw JS file
const src = fs.readFileSync('/tmp/quota_raw.js', 'utf8');
const jsonSrc = src.replace(/^const DB = /, '').replace(/;\s*\n*$/, '');
const db = JSON.parse(jsonSrc);

const result = {};
let totalItems = 0;

for (const [sheet, items] of Object.entries(db)) {
  result[sheet] = items.map(it => ({
    id: it.id,
    trade: it.trade || '',
    name: it.name,
    spec: (it.spec || '').trim(),
    unit: it.unit,
    price: it.price,
    remark: it.remark || ''
  }));
  totalItems += result[sheet].length;
  console.log(`  ${sheet}: ${result[sheet].length} items`);
}

console.log(`\nTotal: ${totalItems} items across ${Object.keys(result).length} sheets`);

// Write clean JSON
const outPath = '/Users/alick/Documents/GitHub/decoration-pricing-system/data/seeds/enterprise_benchmark_prices.json';
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Written to ${outPath}`);
console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
