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
    keysToUse;

console.log('TestApp create keys');
var ecdh1 = crypto.createECDH('secp256k1');
ecdh1.generateKeys();
ecdh1.setPublicKey('BNTJE6l6zcgm9yLjRyXn8Z1f2jA5m/60gYIDaJxiLDYJMUmV/5LJMHBSA9RVmjp9tyWQWkn0BWk6cvQiWpt86IE=', 'base64');
ecdh1.setPrivateKey('24lf26NsRnaxvruH3ui73q5vDGYb0phrJVdgUngOFp8=', 'base64');

var ecdh2 = crypto.createECDH('secp256k1');
ecdh2.generateKeys();
ecdh2.setPublicKey('BHaqGoN4VGmYUmK2kJ0UME36mBSKfcp9uXYvnxBLvwCLie05ieFCGJI2wGNkCplMDa7Wm18Y4b69rL7fkKFCFM8=', 'base64');
ecdh2.setPrivateKey('xRqiCIH1ka1omulZOzQxYJsX1IQOZRALu0+3miOuf2I=', 'base64');

// Phone 1
var ecdh = ecdh1;
keysToUse = [ecdh2.getPublicKey()];

// Phone 2
// var ecdh = ecdh2;
// keysToUse = [ecdh1.getPublicKey()];

console.log('TestApp get path');
var dbPrefix;
Mobile.getDocumentsPath(function(err, location) {
    if (err) {
        console.log('TestApp Error getting path');
        return;
    }
    else {
        console.log('TestApp got path');
        dbPrefix = path.join(location, 'database');

        if (!fs.existsSync(dbPrefix)) {
            fs.mkdirSync(dbPrefix);
        }

        console.log('TestApp initialize thali');
        PouchDB = PouchDBGenerator(PouchDB, dbPrefix + '/', {
            defaultAdapter: LeveldownMobile
        });

        var manager = new ThaliReplicationManager(
            ExpressPouchDB,
            PouchDB,
            'testdb',
            ecdh,
            new ThaliPeerPoolDefault(),
            ThaliMobile.networkTypes.NATIVE);

        console.log('TestApp start thali');
        manager.start(keysToUse);
    }
});