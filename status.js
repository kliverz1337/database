const { MongoClient } = require('mongodb');
const express = require('express');

const router = express.Router();

async function fetchEmails() {
    const uri = 'mongodb://localhost:27017'; // Ganti dengan URI MongoDB Anda
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('validator');
        const collection = database.collection('email_results');

        const successEmails = await collection.find({ status: 'SUCCESS' })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
        const failedEmails = await collection.find({ status: 'FAILED' })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
        
        const successCount = await collection.countDocuments({ status: 'SUCCESS' });
        const failedCount = await collection.countDocuments({ status: 'FAILED' });
        const totalCount = await collection.countDocuments();

        return { successEmails, failedEmails, successCount, failedCount, totalCount };
    } catch (error) {
        console.error('Error fetching emails:', error);
        return { successEmails: [], failedEmails: [], successCount: 0, failedCount: 0, totalCount: 0 };
    } finally {
        await client.close();
    }
}

router.get('/', async (req, res) => {
    const { successEmails, failedEmails, successCount, failedCount, totalCount } = await fetchEmails();

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>XFINITY VALIDATOR</title>
            <style>
                body { background-color: #f8f9fa; }
                .success-email { color: green; }
                .failed-email { color: red; }
                .bordered-card { border: 1px solid #dee2e6; border-radius: .375rem; }
                .status-badge {
                    font-size: 0.8em;
                    padding: 0.5em 0.75em;
                    display: inline-block;
                    width: 100%; /* Membuat lebar badge penuh */
                    text-align: right; /* Mengatur teks agar rata kanan */
                }
            </style>
        </head>
        <body>
            <div class="container my-5">
                <div class="row mt-4">
                    <!-- Bagian Output Jumlah Status -->
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm bordered-card">
                            <div class="card-header text-white bg-primary">
                                <h5 class="mb-0">Jumlah Status Email</h5>
                            </div>
                            <div class="card-body">
                                <h6 class="mb-2">TOTAL EMAIL:
                                    <span class="badge bg-dark status-badge">${totalCount}</span>
                                </h6>
                                <h6 class="text-success mb-2">SUCCESS:
                                    <span class="badge bg-success status-badge">${successCount}</span>
                                </h6>
                                <h6 class="text-danger">FAILED:
                                    <span class="badge bg-danger status-badge">${failedCount}</span>
                                </h6>
                            </div>
                        </div>
                    </div>

                    <!-- Bagian Email Terakhir -->
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm bordered-card">
                            <div class="card-header text-white bg-secondary">
                                <h5 class="mb-0">Email Terakhir</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group">
                                    ${successEmails.map(email => `<li class="list-group-item success-email">${email.email}</li>`).join('')}
                                    ${failedEmails.map(email => `<li class="list-group-item failed-email">${email.email}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Bagian Diagram Lingkaran -->
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm bordered-card">
                            <div class="card-header text-white bg-success">
                                <h5 class="mb-0">Diagram Status Email</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="emailChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                let emailChart;

                function renderChart(successCount, failedCount) {
                    const ctx = document.getElementById('emailChart').getContext('2d');
                    if (emailChart) {
                        emailChart.destroy();
                    }
                    emailChart = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: [
                                \`SUCCESS (\${successCount})\`, 
                                \`FAILED (\${failedCount})\`
                            ],
                            datasets: [{
                                label: 'Email Status',
                                data: [successCount, failedCount],
                                backgroundColor: [
                                    'rgba(75, 192, 192, 0.6)', 
                                    'rgba(255, 99, 132, 0.6)'
                                ],
                                borderColor: [
                                    'rgba(75, 192, 192, 1)',
                                    'rgba(255, 99, 132, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: {
                                    display: true,
                                    text: 'Diagram Email berdasarkan Status'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const count = context.raw || 0;
                                            return \`\${label}: \${count} emails\`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                renderChart(${successCount}, ${failedCount});

                setInterval(async () => {
                    const response = await fetch('/');
                    const text = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    
                    const newEmails = doc.body.querySelector('.list-group').innerHTML;
                    document.querySelector('.list-group').innerHTML = newEmails;

                    const newCounts = doc.body.querySelector('.card-body').innerHTML;
                    document.querySelector('.card-body').innerHTML = newCounts;

                    renderChart(${successCount}, ${failedCount});
                }, 5000);
            </script>
        </body>
        </html>
    `);
});

module.exports = { fetchEmails, router };
