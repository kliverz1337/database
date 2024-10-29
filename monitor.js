const os = require('os');
const express = require('express');
const router = express.Router();

// Fungsi untuk mendapatkan informasi sistem
function getSystemInfo() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuLoad = os.loadavg(); // Beban CPU dalam interval 1, 5, 15 menit

    return {
        uptime: os.uptime(),
        totalMemory: (totalMemory / (1024 ** 3)).toFixed(2) + ' GB',
        freeMemory: (freeMemory / (1024 ** 3)).toFixed(2) + ' GB',
        usedMemory: ((totalMemory - freeMemory) / (1024 ** 3)).toFixed(2) + ' GB',
        memoryUsage: ((1 - freeMemory / totalMemory) * 100).toFixed(2) + '%',
        cpuModel: cpus[0].model,
        cpuCount: cpus.length,
        loadAverage: cpuLoad.map(load => load.toFixed(2)), // Beban CPU per interval
    };
}

// API untuk mendapatkan data pemantauan sistem
router.get('/api/monitor', (req, res) => {
    res.json(getSystemInfo());
});

// Endpoint untuk menyajikan HTML dan JavaScript
router.get('/monitor', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Realtime System Monitor</title>
        <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {
                background-color: #f8f9fa;
                color: #343a40;
            }
            .card {
                border-radius: 10px;
            }
            h1 {
                color: #007bff;
            }
            .status {
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container mt-5">
            <h1 class="text-center">Realtime System Monitor</h1>
            <div id="system-info" class="mt-4">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card p-3">
                            <h5>Memory Usage</h5>
                            <p class="status" id="totalMemory"></p>
                            <p class="status" id="usedMemory"></p>
                            <p class="status" id="freeMemory"></p>
                            <p class="status" id="memoryUsage"></p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card p-3">
                            <h5>CPU Usage</h5>
                            <p class="status" id="cpuModel"></p>
                            <p class="status" id="cpuCount"></p>
                            <p class="status" id="loadAverage"></p>
                            <p class="status" id="cpuLoad"></p>
                            <p class="status" id="uptime"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            async function fetchSystemInfo() {
                try {
                    const response = await fetch('/api/monitor');
                    const data = await response.json();

                    document.getElementById('totalMemory').innerText = 'Total Memory: ' + data.totalMemory;
                    document.getElementById('usedMemory').innerText = 'Used Memory: ' + data.usedMemory;
                    document.getElementById('freeMemory').innerText = 'Free Memory: ' + data.freeMemory;
                    document.getElementById('memoryUsage').innerText = 'Memory Usage: ' + data.memoryUsage;
                    document.getElementById('cpuModel').innerText = 'CPU Model: ' + data.cpuModel;
                    document.getElementById('cpuCount').innerText = 'CPU Cores: ' + data.cpuCount;
                    document.getElementById('loadAverage').innerText = 'Load Average (1m, 5m, 15m): ' + data.loadAverage.join(', ');
                    document.getElementById('cpuLoad').innerText = 'CPU Load (1m, 5m, 15m): ' + data.loadAverage.join(', ');
                    document.getElementById('uptime').innerText = 'Uptime: ' + Math.floor(data.uptime / 60) + ' minutes';
                } catch (error) {
                    console.error('Error fetching system info:', error);
                }
            }

            setInterval(fetchSystemInfo, 2000);
            fetchSystemInfo();
        </script>
    </body>
    </html>
    `);
});

// Ekspor router
module.exports = router;
