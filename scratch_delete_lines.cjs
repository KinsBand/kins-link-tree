const fs = require('fs');
const f = 'src/scripts/controllers/gigMap.js';
const lines = fs.readFileSync(f, 'utf8').split('\n');
console.log('Total lines before:', lines.length);
// Keep lines 1-19 (index 0-18) and lines 535+ (index 534+)
const out = [...lines.slice(0, 19), ...lines.slice(534)];
fs.writeFileSync(f, out.join('\n'), 'utf8');
console.log('Total lines after:', out.length);
console.log('Removed', lines.length - out.length, 'lines');
