console.log('TestApp started');

var ExpressPouchDB          = require('express-pouchdb'),
    PouchDB                 = require('pouchdb'),
    PouchDBGenerator        = require('thali/NextGeneration/utils/pouchDBGenerator'),
    ThaliPeerPoolDefault    = require('thali/NextGeneration/thaliPeerPool/thaliPeerPoolDefault'),
    ThaliReplicationManager = require('thali/NextGeneration/thaliManager'),
    ThaliMobile             = require('thali/NextGeneration/thaliMobile'),
    crypto                  = require('crypto'),
    LeveldownMobile         = require('leveldown-mobile'),
    fs                      = require('fs'),
    path                    = require('path'),
    keysToUse,
    manager,
    localDB,
    localDBchanges,
    myDeviceId = 0;

var ecdh1 = crypto.createECDH('secp256k1');
ecdh1.generateKeys();
ecdh1.setPublicKey('BNTJE6l6zcgm9yLjRyXn8Z1f2jA5m/60gYIDaJxiLDYJMUmV/5LJMHBSA9RVmjp9tyWQWkn0BWk6cvQiWpt86IE=', 'base64');
ecdh1.setPrivateKey('24lf26NsRnaxvruH3ui73q5vDGYb0phrJVdgUngOFp8=', 'base64');

var ecdh2 = crypto.createECDH('secp256k1');
ecdh2.generateKeys();
ecdh2.setPublicKey('BHaqGoN4VGmYUmK2kJ0UME36mBSKfcp9uXYvnxBLvwCLie05ieFCGJI2wGNkCplMDa7Wm18Y4b69rL7fkKFCFM8=', 'base64');
ecdh2.setPrivateKey('xRqiCIH1ka1omulZOzQxYJsX1IQOZRALu0+3miOuf2I=', 'base64');

Mobile('initThali').registerSync(function (deviceId, mode) {
    var ecdh,
        dbPrefix,
        thaliMode;

    if (mode === 'native') {
        thaliMode = ThaliMobile.networkTypes.NATIVE;
    } else {
        thaliMode = ThaliMobile.networkTypes.WIFI;
    }

    myDeviceId = deviceId;
    if (deviceId === 1) {
        console.log('thali Using device 1 keys');
        ecdh = ecdh1;
        keysToUse = [ecdh2.getPublicKey()];
    } else {
        console.log('thali Using device 2 keys');
        ecdh = ecdh2;
        keysToUse = [ecdh1.getPublicKey()];
    }

    Mobile.getDocumentsPath(function(err, location) {
        if (err) {
            console.log('TestApp Error getting path');
            return;
        }
        else {
            dbPrefix = path.join(location, 'database');

            if (!fs.existsSync(dbPrefix)) {
                fs.mkdirSync(dbPrefix);
            }

            console.log('TestApp initialize thali');
            PouchDB = PouchDBGenerator(PouchDB, dbPrefix + '/', {
                defaultAdapter: LeveldownMobile
            });

            manager = new ThaliReplicationManager(
                ExpressPouchDB,
                PouchDB,
                'testdb',
                ecdh,
                new ThaliPeerPoolDefault(),
                thaliMode);

            localDB = new PouchDB('testdb');

            var options = {
                since: 'now',
                live: true,
                timeout: false,
                include_docs: true,
                attachments: true,
                batch_size: 40
            };

            var registerLocalDBChanges = function () {
                return localDB.changes(options).on('change', function(data) {
                    Mobile('dbChange').call(data.doc.content);
                })
                    .on('error', function (err) {
                        console.log(err);
                        localDBchanges.cancel();
                        localDBchanges = registerLocalDBChanges();
                    });
            };

            localDBchanges = registerLocalDBChanges();
        }
    });
});

Mobile('startThali').registerSync(function () {
    console.log('TestApp start thali');
    manager.start(keysToUse);
});

Mobile('stopThali').registerSync(function () {
    console.log('TestApp stop thali');
    manager.stop();
});

Mobile('addData').registerSync(function (data) {
    var doc = {
        "_id": "TestDoc" + (new Date().toString()),
        "content": "[" + myDeviceId + "] " + data
    };
    localDB.put(doc);
});