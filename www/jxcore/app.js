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
    ThaliPeerPoolDefault    = require('thali/NextGeneration/thaliPeerPool/thaliPeerPoolDefault'),
    ThaliPeerPoolOneAtATime = require('thali/NextGeneration/thaliPeerPool/thaliPeerPoolOneAtATime'),
    ThaliReplicationManager = require('thali/NextGeneration/thaliManager'),
    ThaliMobile             = require('thali/NextGeneration/thaliMobile'),
    crypto                  = require('crypto'),
    randomString            = require('randomstring'),
    LeveldownMobile         = require('leveldown-mobile'),
    fs                      = require('fs'),
    path                    = require('path'),
    keysToUse,
    manager,
    localDB,
    localDBchanges,
    myDeviceId = 0;

var Promise = require('bluebird');

var keys = [
    {
        publicKey: 'BNTJE6l6zcgm9yLjRyXn8Z1f2jA5m/60gYIDaJxiLDYJMUmV/5LJMHBSA9RVmjp9tyWQWkn0BWk6cvQiWpt86IE=',
        privateKey: '24lf26NsRnaxvruH3ui73q5vDGYb0phrJVdgUngOFp8='
    },
    {
        publicKey: 'BHaqGoN4VGmYUmK2kJ0UME36mBSKfcp9uXYvnxBLvwCLie05ieFCGJI2wGNkCplMDa7Wm18Y4b69rL7fkKFCFM8=',
        privateKey: 'xRqiCIH1ka1omulZOzQxYJsX1IQOZRALu0+3miOuf2I='
    },
    {
        publicKey: 'BFxk8N7+usEhgrthfquA/CFlAJ5rqQyX4wci/WdP7BKVC9/2lwIihKWycccWHTMCaj5soaPDLxprANxnfWzHvpQ=',
        privateKey: 'vPW1OtKoMFKg972t3V3NwHk8w6ER/mIkiIZVNo8NOGk='
    }
];

var ecdh1 = crypto.createECDH('secp256k1');
ecdh1.generateKeys();
ecdh1.setPublicKey(keys[0].publicKey, 'base64');
ecdh1.setPrivateKey(keys[0].privateKey, 'base64');

var ecdh2 = crypto.createECDH('secp256k1');
ecdh2.generateKeys();
ecdh2.setPublicKey(keys[1].publicKey, 'base64');
ecdh2.setPrivateKey(keys[1].privateKey, 'base64');

var ecdh3 = crypto.createECDH('secp256k1');
ecdh3.generateKeys();
ecdh3.setPublicKey(keys[2].publicKey, 'base64');
ecdh3.setPrivateKey(keys[2].privateKey, 'base64');

Mobile('initThali').registerSync(function (deviceId, mode, peerPoolType) {
    var ecdh,
        dbPrefix,
        thaliMode,
        peerPool;

    if (mode === 'native') {
        thaliMode = ThaliMobile.networkTypes.NATIVE;
    } else if (mode === 'wifi') {
        thaliMode = ThaliMobile.networkTypes.WIFI;
    } else {
        thaliMode = ThaliMobile.networkTypes.BOTH;
    }

    myDeviceId = deviceId;

    switch (deviceId) {
        case 1:
            console.log('thali Using device 1 keys');
            ecdh = ecdh1;
            keysToUse = [ecdh2.getPublicKey(), ecdh3.getPublicKey()];
            break;
        case 2:
            console.log('thali Using device 2 keys');
            ecdh = ecdh2;
            keysToUse = [ecdh1.getPublicKey(), ecdh3.getPublicKey()];
            break;
        case 3:
            console.log('thali Using device 3 keys');
            ecdh = ecdh3;
            keysToUse = [ecdh3.getPublicKey(), ecdh2.getPublicKey()];
            break;
    }

    switch (peerPoolType) {
        case 'default':
            peerPool = new ThaliPeerPoolDefault();
            break;
        case 'oneatatime':
            peerPool = new ThaliPeerPoolOneAtATime();
            break;
        default:
            console.log('Unsupported peer pool type');
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
                peerPool,
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

                        var dataContentPromise = function () {
                            return new Promise(function(resolve, reject) {
                                if (data.doc._id.indexOf("attachment") > -1) {
                                    localDB.getAttachment(data.doc._id, 'attachment')
                                        .then(function (attachmentBuffer) {
                                            resolve(attachmentBuffer.toString());
                                        }).catch(function (err) {
                                        reject();
                                        console.log("TestApp error getting attachment: " + err);
                                    });
                                } else {
                                    resolve(data.doc.content);
                                }
                            });
                        };

                        var sentTimestampPromise = function (dataContent) {
                            return new Promise(function(resolve, reject) {
                                var senderId = dataContent.substr(dataContent.indexOf('[') + 1, dataContent.indexOf('] ') - 1);

                                if (parseInt(senderId) !== parseInt(deviceId)) {
                                    resolve(parseInt(dataContent.substring(dataContent.indexOf('timeSent:')).replace('timeSent:', '')));
                                } else {
                                    resolve(-1);
                                }
                            })
                        };

                        dataContentPromise().then(function (dataContent) {
                            sentTimestampPromise(dataContent).then(function (sentTimestamp) {
                                Mobile('dbChange').call(dataContent, sentTimestamp);
                            });
                        });
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
    var content = data ? data : randomString.generate(16);
    var time = process.hrtime();
    var doc = {
        '_id': 'TestDoc-' + (time[0] + time[1] / 1e9),
        'content': '[' + myDeviceId + '] ' + 'data:' + content + 'timeSent:' + Date.now()
    };
    localDB.put(doc)
        .then(function () {
            console.log('TestApp inserted doc');
        })
        .catch(function (error) {
            console.log('TestApp error while adding data: \'%s\'', error);
        });
});

Mobile('addAttachment').registerSync(function (attSize) {
    var dataLength = parseInt(attSize) * 1024 / 2; // kB to bytes, two bytes per char
    var attachmentContent = '[' + myDeviceId + '] ' + randomString.generate(dataLength);
    var attachment = new Buffer('attachment/attachment:' + attachmentContent + ':timeSent:' + Date.now());

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


var DOCS_COUNT             = 100;
var DOC_SEND_TIMEOUT       = 1000;
var DOC_SEARCH_TIMEOUT     = 2 * 60 * 1000;
var NETWORK_TOGGLE_TIMEOUT = 1 * 60 * 1000;
var SILENCE_TIMEOUT        = 4 * 60 * 1000;

/*
var TIMES_FASTER = 12;
DOC_SEND_TIMEOUT       = Math.round(DOC_SEND_TIMEOUT / TIMES_FASTER);
NETWORK_TOGGLE_TIMEOUT = Math.round(NETWORK_TOGGLE_TIMEOUT / TIMES_FASTER);
SILENCE_TIMEOUT        = Math.round(SILENCE_TIMEOUT / TIMES_FASTER);
*/


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

    var id = round + ':' + (time[0] + time[1] / 1e9);

    //var attachment = new Buffer('Test attachment ' + id);
    //return localDB.putAttachment('documentId-' + id, 'attachmentId-' + id, attachment, 'text/plain')

    return localDB.put({
      _id     : 'TestDoc-' + id,
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

Mobile('cleanLocalDB').registerSync(function () {
    if (localDB) {
        localDB.destroy().then(function () {
            localDB = new PouchDB('testdb');
        });
    }
});

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
