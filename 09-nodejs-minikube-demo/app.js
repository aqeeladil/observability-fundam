const express = require('express');
const client = require('prom-client');

const app = express();
const register = client.register;

// Collect default metrics (e.g., CPU, memory)
client.collectDefaultMetrics();

// Create a custom counter metric for HTTP requests
const httpRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'status']
});

// Simulate HTTP requests
app.get('/', (req, res) => {
    httpRequests.inc({ method: 'GET', status: '200' }); // Increment on GET success
    res.send('Hello, World!');
});

app.get('/error', (req, res) => {
    httpRequests.inc({ method: 'GET', status: '500' }); // Increment on GET error
    res.status(500).send('Internal Server Error');
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(3000, () => console.log('App running on port 3000'));
