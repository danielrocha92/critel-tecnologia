const fs = require('fs');
const https = require('https');

const urls = {
  'bradesco': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Banco_Bradesco_logo.svg',
  'pizza-hut': 'https://upload.wikimedia.org/wikipedia/sco/d/d2/Pizza_Hut_logo.svg',
  'kfc': 'https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg',
  'sonda': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo-sonda.svg'
};

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

Object.keys(urls).forEach(brand => {
  https.get(urls[brand], options, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      https.get(res.headers.location, options, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => fs.writeFileSync(`./public/${brand}.svg`, data));
      });
    } else {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(`./public/${brand}.svg`, data);
        console.log(`Saved ${brand}.svg`);
      });
    }
  }).on('error', err => console.log('Error: ', err.message));
});
