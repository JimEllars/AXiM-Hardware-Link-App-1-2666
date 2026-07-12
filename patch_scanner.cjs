const fs = require('fs');
const code = fs.readFileSync('src/components/NetworkScanner.jsx', 'utf8');

const regexFinally = /finally \{\s*setScanning\(false\);\s*\}/g;
let newCode = code.replace(regexFinally, '');

// Ensure setScanning(false) and setScanState('IDLE') are in the catch block if not already
if (!newCode.includes('setScanning(false)') && !newCode.includes('setScanState(\'IDLE\')') && newCode.includes('catch (err) {')) {
  // It's already in the catch block per my previous edit
}

fs.writeFileSync('src/components/NetworkScanner.jsx', newCode);
