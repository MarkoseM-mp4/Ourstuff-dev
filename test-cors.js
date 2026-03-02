const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/items',
    method: 'GET',
    headers: {
        'Origin': 'http://localhost:3000'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('CORS Header:', res.headers['access-control-allow-origin']);
        console.log('Response:', data.substring(0, 100));
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});

req.end();
