const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    // Replace navbar logos
    content = content.replace(/<img src="\.\/images\/logo\.png"/g, '<img src="./images/logo-white.png"');
    content = content.replace(/<img src="\.\/images\/logo-black\.png"/g, '<img src="./images/logo-white.png"');

    fs.writeFileSync(p, content);
});
console.log('Done replacing logos html');
