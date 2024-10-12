const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// Initialize Secret Manager Client
const client = new SecretManagerServiceClient();

// Function to retrieve secret from Secret Manager
async function accessSecretVersion() {
    const [version] = await client.accessSecretVersion({
        name: 'projects/zodiaccurate/secrets/service-account-credentials/versions/latest',
    });
    return JSON.parse(version.payload.data.toString());
}

// Initialize Firebase Admin SDK with credentials from Secret Manager
accessSecretVersion().then((key) => {
    admin.initializeApp({
        credential: admin.credential.cert(key),
        databaseURL: "https://zodiaccurate-e9aaf-default-rtdb.firebaseio.com/",
    });
});

// Middleware to parse JSON request body
app.use(express.json());

// Endpoint to handle form submission
app.post('/', (req, res) => {
    console.log("Request received:", new Date());

    const formData = req.body;

    admin.database().ref('/test').push(formData)
        .then(() => {
            console.log("Data written to Firebase:", new Date());
            return res.status(200).send('Form data saved successfully to Realtime Database');
        })
        .catch((error) => {
            console.error("Error writing data:", error);
            return res.status(500).send('Error saving data: ' + error.message);
        });
});


// Expose the Cloud Function as an HTTPS endpoint
exports.submitForm = functions.https.onRequest(app);
