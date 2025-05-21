const express = require('express');
const app = express();

app.use('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl || !/^http:\/\/\d{1,3}(\.\d{1,3}){3}/.test(targetUrl)) {
        return res.status(400).send('Invalid or missing IP URL');
    }

    try {
        const http = require('http');
        const parsedUrl = new URL(targetUrl);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 80,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
        };

        const proxyReq = http.request(options, (proxyRes) => {
            console.log(`[${new Date().toISOString()}] Response from ${targetUrl}:`);
            console.log(`Status Code: ${proxyRes.statusCode}`);
            console.log('Headers:', proxyRes.headers);

            let responseBody = '';
            proxyRes.on('data', (chunk) => {
                responseBody += chunk;
            });

            proxyRes.on('end', () => {
                console.log('Response Body:', responseBody);
                console.log('----------------------------------------');
            });

            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error(err);
            res.status(502).send('Proxy error');
        });

        proxyReq.end();
    } catch (err) {
        res.status(500).send('Internal error');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
