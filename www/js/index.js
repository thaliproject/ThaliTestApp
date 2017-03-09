/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var thaliMode = 'both',
    jxcoreLoaded = false,
    thaliStarted = false,
    thaliDevice;

var TCP_NATIVE = 'tcp',
    BLUETOOTH = 'AndroidBluetooth'

var localDevice = {
    latestDoc: null,
    latestTime: null,
    totalDocs: 0,
};

var remoteDevice = {
    id: {
        wifi: null,
        native: null,
    },
    latestDoc: null,
    latestTime: null,
    totalDocs: 0,
    available: {
        wifi: false,
        native: false
    }
};

var peers = {};

var localDeviceUI, remoteDeviceUI, peersUI;

function initUI() {
    var box1 = document.querySelector('[data-device="1"]');
    var box2 = document.querySelector('[data-device="2"]');
    var device1ui = {
        box: box1,
        lastchange: box1.querySelector('.lastchange'),
        changetime: box1.querySelector('.changetime'),
        totaldocs: box1.querySelector('.totaldocs'),
        availability: box1.querySelector('.availability'),
    };
    var device2ui = {
        box: box2,
        lastchange: box2.querySelector('.lastchange'),
        changetime: box2.querySelector('.changetime'),
        totaldocs: box2.querySelector('.totaldocs'),
        availability: box2.querySelector('.availability'),
    };

    if (String(thaliDevice) === '1') {
        localDeviceUI = device1ui;
        remoteDeviceUI = device2ui;
    } else {
        localDeviceUI = device2ui;
        remoteDeviceUI = device1ui;
    }
    peersUI = {
        list: document.querySelector('.peerlist')
    };

    localDeviceUI.box.classList.add('active');
    remoteDeviceUI.box.classList.remove('active');
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        jxcore.isReady(function() {
            app.registerFunctions();
            if (window.ThaliPermissions) {
                // requestLocationPermission ensures that the application has
                // the required ACCESS_COARSE_LOCATION permission in Android.
                window.ThaliPermissions.requestLocationPermission(function () {
                    console.log('Application has the required permission.');
                    jxcore('app.js').loadMainFile(function(ret, err) {
                        console.log('jxcore loaded');
                        jxcoreLoaded = true;
                    });
                }, function (error) {
                    console.log('Location permission not granted. Error: ' + error);
                });
            } else {
                jxcore('app.js').loadMainFile(function(ret, err) {
                    console.log('jxcore loaded');
                    jxcoreLoaded = true;
                });
            }
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');
        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        console.log('Received Event: ' + id);
    },
    registerFunctions: function () {
        jxcore('dbChange').register(function (doc) {
            var parentElement = document.getElementById('changes');
            var lastChangeElement = parentElement.querySelector('.lastchange');
            var changeTimeElement = parentElement.querySelector('.changetime');
            lastChangeElement.innerHTML = '[' + doc.source + '] ' + doc.content;
            var now = new Date().toLocaleTimeString();
            changeTimeElement.innerHTML = now;

            var device = (String(thaliDevice) === String(doc.source)) ?
                         localDevice :
                         remoteDevice;
            device.latestDoc = doc.content;
            device.totalDocs++;
            device.latestTime = now;
            render();
        });

        jxcore('peerChange').register(function (peer) {
            var id = peer.peerIdentifier;
            if (peer.peerAvailable) {
                peers[id] = peer;
            } else {
                delete peers[id];
                var type = peer.connectionType === TCP_NATIVE ? 'wifi': 'native';
                if (remoteDevice.id[type] === id) {
                    remoteDevice.id[type] = null;
                    remoteDevice.available[type] = false;
                }
            }
            render();
        });

        jxcore('peerHasData').register(function (advertisement) {
            
        })

    }
};

function initThali (deviceId) {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    thaliDevice = deviceId;
    jxcore('initThali').call(deviceId, thaliMode, function () {
        initUI();
        console.log('Thali initialized for device #' + deviceId);
    });
}

function startThali () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('startThali').call(function () {
        console.log('Thali started');
        thaliStarted = true;
    });
}

function stopThali () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('stopThali').call(function () {
        console.log('Thali stopped');
        thaliStarted = false;
    });
}

var dataCounter = 0;
function addData (addAttachment) {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('addData').call('Test data #' + dataCounter, addAttachment, function () {});
    dataCounter++;
}

function addAttachment () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('addAttachment').call(function () {
        console.log('adding attachment');
    });
}

function test (name) {
  if (!jxcoreLoaded) {
      alert('jxcore not loaded - please wait');
      return;
  }
  jxcore(name).call(function () {
      console.log('test data finished, name: %s', name);
  });
}

function setMode (mode) {
    var currentModeElement = document.getElementById(thaliMode);
    var newModeElement = document.getElementById(mode);
    currentModeElement.setAttribute('style', 'background-color:initial;');
    newModeElement.setAttribute('style', 'background-color:green;');

    thaliMode = mode;
}

function startTest () {
    var testCounter = 0;
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    var interval = thaliDevice === 1 ? 5000 : 4000;
    setInterval(function () {
        if (testCounter % 15 === 0) {
            startThali();
        } else if (testCounter % 15 === 13) {
            stopThali();
        }
        addData();
        testCounter++;
    }, 5000);
}

function render() {
    localDeviceUI.lastchange.textContent = localDevice.latestDoc;
    localDeviceUI.changetime.textContent = localDevice.latestTime;
    localDeviceUI.totaldocs.textContent = localDevice.totalDocs;

    remoteDeviceUI.lastchange.textContent = remoteDevice.latestDoc;
    remoteDeviceUI.changetime.textContent = remoteDevice.latestTime;
    remoteDeviceUI.totaldocs.textContent = remoteDevice.totalDocs;

    var av = [];
    if (remoteDevice.available.wifi) av.push('W');
    if (remoteDevice.available.native) av.push('N');
    remoteDeviceUI.availability.textContent = av.join(',');

    var peersContent = document.createDocumentFragment();
    Object.keys(peers).forEach(function (k) {
        var peer = peers[k];
        var li = document.createElement('li');
        var content = peer.peerIdentifier + ':' + peer.generation;
        var type = peer.connectionType === TCP_NATIVE ? 'W' : 'N';
        content += ' [' + type + ']';
        li.textContent = content;
        peersContent.appendChild(li);
    });
    var list = peersUI.list;
    list.innerHTML = '';
    list.appendChild(peersContent);
}

app.initialize();
