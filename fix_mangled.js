const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const badIdx = code.indexOf('dynamic";');
if (badIdx !== -1) {
  // Fix the page.tsx file
  fs.writeFileSync('src/app/dashboard/page.tsx', code.substring(0, badIdx));
  console.log('Fixed file');
} else {
  console.log('Not found');
}
