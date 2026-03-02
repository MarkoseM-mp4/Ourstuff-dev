const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    // Replace inline styles for active tabs. 
    // Variations found: 
    // style="color:var(--primary);font-weight:700;" 
    // style="color:var(--primary); font-weight:700;"
    content = content.replace(/style="color:\s*var\(--primary\);\s*font-weight:\s*700;"/g, 'style="color:#CBD5E1;font-weight:700;"');

    fs.writeFileSync(p, content);
});
console.log('Done replacing active tab colors');
