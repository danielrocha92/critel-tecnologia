const fs = require('fs');
const https = require('https');

const urls = {
  'pizza-hut': 'https://www.vectorlogo.zone/logos/pizza_hut/pizza_hut-ar21.svg',
  'kfc': 'https://www.vectorlogo.zone/logos/kfc/kfc-ar21.svg'
};

Object.keys(urls).forEach(brand => {
  https.get(urls[brand], (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(`./public/${brand}.svg`, data);
      console.log(`Saved ${brand}.svg`);
    });
  }).on('error', err => console.log('Error: ', err.message));
});
