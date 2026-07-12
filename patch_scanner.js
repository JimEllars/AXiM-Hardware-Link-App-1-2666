const fs = require('fs');
let code = fs.readFileSync('src/components/NetworkScanner.jsx', 'utf8');

code = code.replace(/console\.log\([^)]+\);/g, '');
code = code.replace(/console\.error\([^)]+\);/g, '');
code = code.replace(/} else if \(status === 'SUBSCRIBED'\) \{\s+\}/, '');
code = code.replace(/} else if \(status === 'CLOSED'\) \{\s+\}/, '');
code = code.replace(/if \(status === 'SUBSCRIBED'\) \{\s+\} else if/g, 'if');

fs.writeFileSync('src/components/NetworkScanner.jsx', code);
