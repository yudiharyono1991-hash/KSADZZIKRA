const https = require('https');
https.get('https://ksamart.ks-adzzikra.id/index.html', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('HTML length:', data.length);
    const m = data.match(/src=\"(\/assets\/index-[^\"]+\.js)\"/);
    if (m) {
      console.log('JS Path:', m[1]);
      https.get('https://ksamart.ks-adzzikra.id' + m[1], (res2) => {
        let jsData = '';
        res2.on('data', d => jsData += d);
        res2.on('end', () => {
          if (jsData.includes('limit(10000)')) console.log('Found 10000 limit!');
          else if (jsData.includes('limit(1000)')) console.log('Found 1000 limit!');
          else console.log('Not found');
        });
      });
    } else {
      console.log('No match found');
    }
  });
});
