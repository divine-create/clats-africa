
const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('./src/components/ChildProgress.tsx', 'utf8');
console.log('Read ' + code.length + ' bytes');
