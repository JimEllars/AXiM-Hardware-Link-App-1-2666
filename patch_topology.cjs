const fs = require('fs');
let code = fs.readFileSync('src/components/NetworkTopology.jsx', 'utf8');

const badBlock3 = `.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {

        }
      });`;

const goodBlock3 = `.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          void err;
        }
      });`;

code = code.replace(badBlock3, goodBlock3);

fs.writeFileSync('src/components/NetworkTopology.jsx', code);
