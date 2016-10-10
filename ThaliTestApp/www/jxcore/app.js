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
var ecdhS7 = crypto.createECDH('secp256k1');
ecdhS7.generateKeys();
ecdhS7.setPublicKey('BNTJE6l6zcgm9yLjRyXn8Z1f2jA5m/60gYIDaJxiLDYJMUmV/5LJMHBSA9RVmjp9tyWQWkn0BWk6cvQiWpt86IE=', 'base64');
ecdhS7.setPrivateKey('24lf26NsRnaxvruH3ui73q5vDGYb0phrJVdgUngOFp8=', 'base64');

var ecdhS6 = crypto.createECDH('secp256k1');
ecdhS6.generateKeys();
ecdhS6.setPublicKey('BHaqGoN4VGmYUmK2kJ0UME36mBSKfcp9uXYvnxBLvwCLie05ieFCGJI2wGNkCplMDa7Wm18Y4b69rL7fkKFCFM8=', 'base64');
ecdhS6.setPrivateKey('xRqiCIH1ka1omulZOzQxYJsX1IQOZRALu0+3miOuf2I=', 'base64');

// S7
var ecdh = ecdhS7;
keysToUse = [ecdhS6.getPublicKey()];

// S6
// var ecdh = ecdhS6;
// keysToUse = [ecdhS7.getPublicKey()];

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