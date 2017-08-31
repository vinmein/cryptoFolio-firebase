const functions = require('firebase-functions');
const request = require('request');
const Promise = require('promise');
const bittrex = require('node.bittrex.api');

const BITTREX_API_KEY = "b6be9227a60a45e78fd49521a09a1fb4";
const BITTREX_API_SECRET = "3e207c6f62904c8f93eb20fdaa45a6ae";
const bittrex_Url = "https://bittrex.com/api/v1.1/"

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

