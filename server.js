const express = require('express');
const { MongoClient } = require('mongodb');
const { fetchEmails, router: statusRouter } = require('./status'); // Impor router dan fungsi fetchEmails dari status.js
const monitorRouter = require('./monitor');

const app = express();
const port = 3000; // Anda dapat mengubah port sesuai kebutuhan

// Fungsi untuk menambahkan email dan status ke database
async function addEmail(email, status) {
    const uri = 'mongodb://localhost:27017'; // Ganti dengan URI MongoDB Anda
    const client = new MongoClient(uri);

    try {
        // Koneksikan ke MongoDB
        await client.connect();
        const database = client.db('validator');
        const collection = database.collection('email_results');

        // Periksa apakah email sudah ada di dalam koleksi
        const existingEmail = await collection.findOne({ email });
        if (existingEmail) {
            return null; // Mengembalikan null jika email sudah ada
        }

        // Tambahkan email dan status ke database
        const result = await collection.insertOne({ email, status, timestamp: new Date() });
        return result.insertedId; // Mengembalikan ID dari dokumen yang baru ditambahkan
    } catch (error) {
        console.error('Error adding email:', error);
        return null; // Mengembalikan null jika terjadi kesalahan
    } finally {
        // Pastikan untuk menutup koneksi
        await client.close();
    }
}

// Gunakan router dari status.js
app.use('/', statusRouter);
// Menggunakan router monitor
app.use('/', monitorRouter);

// Endpoint untuk memeriksa email dengan parameter email
app.get('/check', async (req, res) => {
    const emailToCheck = req.query.email; // Ambil email dari parameter query

    if (!emailToCheck) {
        return res.json({ error: 'Email parameter is required' });
    }

    const uri = 'mongodb://localhost:27017'; // Ganti dengan URI MongoDB Anda
    const client = new MongoClient(uri);

    try {
        // Koneksikan ke MongoDB
        await client.connect();
        const database = client.db('validator');
        const collection = database.collection('email_results');

        // Cek status email dalam database
        const emailRecord = await collection.findOne({ email: emailToCheck });

        if (emailRecord) {
            return res.json({ email: emailRecord.email, status: emailRecord.status });
        } else {
            return res.json({ message: 'Email not found' });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        return res.json({ error: 'Internal Server Error' });
    } finally {
        // Pastikan untuk menutup koneksi
        await client.close();
    }
});

// Endpoint untuk menambahkan email dan status
app.get('/add', async (req, res) => {
    const email = req.query.email; // Ambil email dari parameter query
    const status = req.query.status; // Ambil status dari parameter query

    if (!email || !status) {
        return res.json({ error: 'Both email and status parameters are required' });
    }

    const insertedId = await addEmail(email, status);

    if (insertedId) {
        return res.json({ message: `Email ${email} with status ${status} added successfully.` });
    } else {
        return res.json({ message: `Email ${email} already exists.` });
    }
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
