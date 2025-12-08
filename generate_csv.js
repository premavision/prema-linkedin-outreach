const fs = require('fs');

const header = 'name,linkedinUrl,role,company\n';
let content = header;

for (let i = 1; i <= 200; i++) {
  content += `Test User ${i},https://www.linkedin.com/in/testuser${i},Role ${i},Company ${i}\n`;
}

fs.writeFileSync('large_test.csv', content);
console.log('Created large_test.csv with 200 rows');
