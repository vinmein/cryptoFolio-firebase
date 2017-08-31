const functions = require('firebase-functions');
const request = require('request');
const Promise = require('promise');
const bittrex = require('node.bittrex.api');
const crypto = require('crypto');
const storage = require('@google-cloud/storage');

const BITTREX_API_KEY = "b6be9227a60a45e78fd49521a09a1fb4";
const BITTREX_API_SECRET = "3e207c6f62904c8f93eb20fdaa45a6ae";
const BITTREX_URL = "https://bittrex.com/api/v1.1/"



bittrex.options({
    'apikey': BITTREX_API_KEY,
    'apisecret': BITTREX_API_SECRET,
});
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    admin.database().ref('/messages').push({original: original}).then(snapshot => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        res.redirect(303, snapshot.ref);
    });
});


exports.getBittrexCoins = functions.https.onRequest((req, res) => {
    bittrex.getcurrencies(function (data, err) {
        if (err) {
            return res.send(err);
        }
        if (data.success) {
            for (var i in data.result) {
                var coin = data.result[i];
                coin.source = "BITTREX"
                admin.database().ref('/coins').push(coin).then(snapshot => {
                    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
                    //res.redirect(303, snapshot.ref);
                });
                // bittrex.getticker({market: data.result[i].MarketName}, function (ticker) {
                //     console.log(ticker);
                // });
            }
            return res.send(data);
        } else {
            return res.send(data);
        }

    })
});


exports.listCoins = functions.https.onRequest((req, res) => {
    var ref =  admin.database().ref('/coins')
    var query = ref.orderByChild('CurrencyLong')

    query.on("value", function(snapshot) {
        res.send(snapshot.val());
    }, function (errorObject) {
        res.send({"error": "The read failed: " + errorObject.code});
    });
});




// Firebase Project ID and Service Account Key.
const gcs = storage({
    projectId: 'cryptofolio-f4d85',
    keyFilename: './serviceAccountKey.json'
});

const bucket = gcs.bucket('cryptofolio-f4d85.appspot.com');

function saveImage(url) {

    // Generate a random HEX string using crypto (a native node module).
    const randomFileName = crypto.randomBytes(16).toString('hex');

    // Fetch image info using a HTTP HEAD request.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
    request.head(url, (error, info) => {
        if (error) {
            return console.error(error);
        }

        // Download image from Pixelz, then save the image to Firebase
        // using the Google Cloud API and the magic of Node Streams.
        // https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/v0.52.0/storage/file
        // http://stackoverflow.com/questions/28355079/how-do-node-js-streams-work
        request(url)
            .pipe(
                bucket.file(`sample/images/${randomFileName}`).createWriteStream({
                    metadata: {
                        contentType: info.headers['content-type']
                    }
                })
            )
            .on('error', (err) => {

                // Do something if the upload fails.
                console.error(err);
            })
            .on('finish', () => {

                // Do something when everything is done.

                // Get download url for stored image
                console.log('Image successfully uploaded to Firebase Storage!')
            });
    });
}

exports.getProcessedImage = functions.https.onRequest((req, res) => {
    console.log(req.body.processedImageURL);
    /*
     if (req.body && req.body.processedImageURL) {

     // Get image from Pixelz and save it to Firebase Storage.
     saveImage(req.body.processedImageURL);

     return res.status(200).end();
     }

     res.status(400).end();
     */

    const url = 'https://www2.chemistry.msu.edu/courses/cem352/SS2017_Wulff/MichiganState.jpg'
    console.log(url);
    saveImage(url);
    console.log('Saving url');
    res.status(200).send();
});