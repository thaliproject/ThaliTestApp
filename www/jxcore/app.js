'use strict';

console.log('TestApp started');

// process.env.DEBUG = 'thalisalti:acl';
process.env.SSDP_NT = 'random-ssdp-nt:' + require('./SSDP');

process
  .once('uncaughtException', function (error) {
    console.error(
      'uncaught exception, error: \'%s\', stack: \'%s\'',
      error.toString(), error.stack
    );
    process.exit(1);
  })
  .once('unhandledRejection', function (error, p) {
    console.error(
      'uncaught promise rejection, error: \'%s\', stack: \'%s\'',
      error.toString(), error.stack
    );
    process.exit(2);
  })
  .once('exit', function (code, signal) {
    console.log('process exited, code: \'%s\', signal: \'%s\'', code, signal);
  });

var ExpressPouchDB          = require('express-pouchdb'),
    PouchDB                 = require('pouchdb'),
    PouchDBGenerator        = require('thali/NextGeneration/utils/pouchDBGenerator'),
    //ThaliPeerPoolDefault    = require('thali/NextGeneration/thaliPeerPool/thaliPeerPoolDefault'),
    ThaliPeerPoolOneAtATime = require('thali/NextGeneration/thaliPeerPool/thaliPeerPoolOneAtATime'),
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

var Promise = require('bluebird');

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
    } else if (mode === 'wifi') {
        thaliMode = ThaliMobile.networkTypes.WIFI;
    } else {
        thaliMode = ThaliMobile.networkTypes.BOTH;
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
                //new ThaliPeerPoolDefault(),
                new ThaliPeerPoolOneAtATime(),
                thaliMode);

            localDB = new PouchDB('testdb');

            var options = {
                since: 'now',
                live: true,
                timeout: false,
                include_docs: true,
                attachments: true,
                binary: true,
                batch_size: 40
            };

            var registerLocalDBChanges = function () {
                return localDB.changes(options)
                    .on('change', function(data) {
                        console.log("TestApp got " + data.doc._id);
                        if (data.doc._id.indexOf("TestAtt") > -1) {
                            localDB.getAttachment(data.doc._id, 'attachment')
                                .then(function (attachmentBuffer) {
                                    Mobile('dbChange').call(attachmentBuffer.toString());
                                }).catch(function (err) {
                                console.log("TestApp error getting attachment: " + err);
                            });
                        } else {
                            Mobile('dbChange').call(data.doc.content);
                        }
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
    var time = process.hrtime();
    var doc = {
        '_id': 'TestDoc-' + (time[0] + time[1] / 1e9),
        'content': '[' + myDeviceId + '] ' + data
    };
    localDB.put(doc)
        .then(function () {
            console.log('TestApp inserted doc');
        })
        .catch(function (error) {
            console.log('TestApp error while adding data: \'%s\'', error);
        });
});

var attachmentIndex = 0;

Mobile('addAttachment').registerSync(function () {
    var attachment = new Buffer('attachment/attachment:' + attachmentIndex + ':' + new Date());
    attachmentIndex ++;

    localDB
    .putAttachment(
      attachment.toString(),
      'attachment',
      attachment,
      'text/plain'
    )
        .then(function () {
            console.log('sent attachment');
        })
        .catch(function (error) {
            console.error('got error: \'%s\'', error);
        });
});


var DOCS_COUNT             = 60;
var DOC_SEND_TIMEOUT       = 1000;
var DOC_SEARCH_TIMEOUT     = 2 * 60 * 1000;
var NETWORK_TOGGLE_TIMEOUT = 1 * 60 * 1000;
var SILENCE_TIMEOUT        = 4 * 60 * 1000;

var TIMES_FASTER = 12;
DOC_SEND_TIMEOUT       /= TIMES_FASTER;
// DOC_SEARCH_TIMEOUT     /= TIMES_FASTER;
NETWORK_TOGGLE_TIMEOUT /= TIMES_FASTER;
SILENCE_TIMEOUT        /= TIMES_FASTER;


function waitForRemoteDocs(pouchDB, round, docsCount) {
  function allDocsFound() {
    // We want to find at least 'docsCount' documents.
    return docsCount === 0;
  }

  function verifyDoc(doc) {
    if (
      doc.deviceId === undefined || doc.deviceId === null ||
      doc.round    === undefined || doc.round    === null
    ) {
      // console.log('this is not our doc');
    } else if (doc.deviceId === myDeviceId) {
      // console.log('local doc found');
    } else if (doc.round === round) {
      docsCount--;
      console.log('remote doc found, %d docs remaining', docsCount);
    }
  }

  return new Promise(function (resolve, reject) {
    var error;
    var completed = false;
    function complete () {
      if (completed) {
        return;
      }
      completed = true;

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }
    var changesFeed = pouchDB.changes({
      live: true,
      include_docs: true
    })
      .on('change', function (change) {
        verifyDoc(change.doc);
        if (allDocsFound()) {
          changesFeed.cancel();
        }
      })
      .on('complete', function (info) {
        if (info.errors && info.errors.length > 0) {
          error = info.errors[0];
        }
        complete();
      })
      .on('error', function (err) {
        error = err;
        complete();
      });
  });
}

function native (target, value) {
  return new Promise(function (resolve, reject) {
    Mobile(target).callNative(value, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function sendData (round, wantToggleWiFi, wantToggleBluetooth) {
  console.log('sending new docs');

  function send(attempts, timeout) {
    var time = process.hrtime();

    return localDB.put({
      _id     : 'TestDoc-' + (time[0] + time[1] / 1e9),
      deviceId: myDeviceId,
      round   : round
    })
      .then(function () {
        console.log('sent new doc, round: %d', round);

        if (attempts > 0) {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              send(attempts - 1, timeout)
                .then(resolve)
                .catch(reject);
            }, timeout);
          });
        }
      });
  }

  // We want to wait for remote docs before 'send' in order not to use 'since: 0'.
  var waitPromise = waitForRemoteDocs(localDB, round, DOCS_COUNT);

  return send(DOCS_COUNT, DOC_SEND_TIMEOUT)
    .then(function () {
      console.log('all docs sent, waiting for remote docs');

      return new Promise(function (resolve, reject) {
        waitPromise
          .then(resolve)
          .catch(reject);
        setTimeout(function () {
          reject('docs search timeout');
        }, DOC_SEARCH_TIMEOUT);
      });
    })
    .then(function () {
      console.log('all docs found');

      return new Promise(function (resolve) {
        setTimeout(resolve, NETWORK_TOGGLE_TIMEOUT);
      });
    })
    .then(function () {
      console.log('disabling network');

      var promises = [];
      if (wantToggleWiFi) {
        promises.push(native('setWifiRadioState', false));
      }
      if (wantToggleBluetooth) {
        // TODO toggle bluetooth is not implemented.
        // promises.push(native('toggleBluetooth', false));
      }
      return Promise.all(promises);
    })
    .then(function () {
      console.log('doing nothing');

      return new Promise(function (resolve) {
        setTimeout(resolve, SILENCE_TIMEOUT);
      });
    })
    .then(function () {
      console.log('enabling network');

      var promises = [];
      if (wantToggleWiFi) {
        promises.push(native('setWifiRadioState', true));
      }
      if (wantToggleBluetooth) {
        // TODO toggle bluetooth is not implemented.
        // promises.push(native('toggleBluetooth', true));
      }
      return Promise.all(promises);
    });
}

function infiniteSendData (round, wantToggleWiFi, wantToggleBluetooth) {
  if (!localDB) {
    return Promise.reject('please provide a db instance');
  }

  return sendData(round, wantToggleWiFi, wantToggleBluetooth)
    .then(function () {
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          infiniteSendData(round + 1)
            .then(resolve)
            .catch(reject);
        });
      });
    });
}

Mobile('testData').registerSync(function () {
  infiniteSendData(0, false, false)
    .catch(function (error) {
      console.log('got error: \'%s\'', error);
      process.exit(3);
    });
});

Mobile('testDataToggleWifi').registerSync(function () {
  infiniteSendData(0, true, false)
    .catch(function (error) {
      console.log('got error: \'%s\'', error);
      process.exit(4);
    });
});

Mobile('testDataToggleBluetooth').registerSync(function () {
  infiniteSendData(0, false, true)
    .catch(function (error) {
      console.log('got error: \'%s\'', error);
      process.exit(4);
    });
});

Mobile('testDataToggleBoth').registerSync(function () {
  infiniteSendData(0, true, true)
    .catch(function (error) {
      console.log('got error: \'%s\'', error);
      process.exit(5);
    });
});
