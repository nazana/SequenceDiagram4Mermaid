#!/usr/bin/env node

const httpServer = require('http-server');
const path = require('path');
const opener = require('opener');

const port = 8080;
const root = path.join(__dirname, '..');

const server = httpServer.createServer({
    root: root,
    cache: -1,
    robots: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
    }
});

server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Starting Mermaid Editor...`);
    console.log(`Serving at ${url}`);
    console.log('Hit CTRL-C to stop the server');

    opener(url);
});
