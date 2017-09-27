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
    thaliDevice,
    peerPoolType = 'default';

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
                        app.loadedJXCore('deviceready');
                        jxcoreLoaded = true;
                    });
                }, function (error) {
                    console.log('Location permission not granted. Error: ' + error);
                });
            } else {
                jxcore('app.js').loadMainFile(function(ret, err) {
                    app.loadedJXCore('deviceready');
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
    loadedJXCore: function(id) {
        var parentElement = document.getElementById(id);
        var receivedElement = parentElement.querySelector('.received');
        var loadedElement = parentElement.querySelector('.loaded');
        loadedElement.setAttribute('style', 'display:block;');
        receivedElement.setAttribute('style', 'display:none;');
        console.log('jxcore loaded');
    },

    registerFunctions: function () {
        jxcore('dbChange').register(function (change, timeSent) {
            var parentElement = document.getElementById('changes');
            var lastChangeElement = parentElement.querySelector('.lastchange');
            var changeTimeElement = parentElement.querySelector('.changetime');
            var dataSizeElement = parentElement.querySelector('.datasize');

            lastChangeElement.innerHTML = change;
            changeTimeElement.innerHTML = new Date().toLocaleTimeString();
            dataSizeElement.innerHTML = change.length;

            var syncTimeValue = '', transferRateValue = '';

            if (timeSent > -1) {
                syncTimeValue = Date.now() - timeSent;
                // two bytes per char
                // we got time in ms and size in bits (number of chars times size per char), so as the result
                // we get Mbits/s
                transferRateValue = (((change.length * 8 / syncTimeValue) * 1e3) / 1e6).toString() + ' Mbps';
            }

            parentElement.querySelector('.synctime').innerHTML = syncTimeValue.toString();
            parentElement.querySelector('.transferrate').innerHTML = transferRateValue;
        });
    }
};

function initThali (deviceId) {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    thaliDevice = deviceId;
    jxcore('initThali').call(deviceId, thaliMode, peerPoolType, function () {
        document.getElementById("init" + deviceId).setAttribute('style', 'background-color:green;');
        console.log('Thali initialized for device #' + deviceId);
    });
}

function startThali () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('startThali').call(function () {
        document.getElementById("start").setAttribute('style', 'background-color:green;');
        document.getElementById("stop").setAttribute('style', 'background-color:initial;');
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
        document.getElementById("stop").setAttribute('style', 'background-color:green;');
        document.getElementById("start").setAttribute('style', 'background-color:initial;');
        console.log('Thali stopped');
        thaliStarted = false;
    });
}

var dataCounter = 0;
function addData () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    jxcore('addData').call(function () {});
    dataCounter++;
}

var addDataInfinitelyInterval;
function addDataInfinitely () {
    var e = document.getElementById("timeoutValue");
    var timeout = e.options[e.selectedIndex].value;

    addDataInfinitelyInterval = setInterval(function () {
        addData();
    }, timeout);
}

function stopAddingData () {
    clearInterval(addDataInfinitelyInterval);
}

function cleanDB() {
    jxcore('cleanLocalDB').call(function () {
        dataCounter = 0;
        alert('Local database was destroyed. Remember to reinit thali!');
    });
}

function addAttachment () {
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }

    var e = document.getElementById("attachmentSize");
    var attSize = e.options[e.selectedIndex].value;
    
    jxcore('addAttachment').call(attSize, function () {
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

function setPeerPool (type) {
    var currentType = document.getElementById(peerPoolType);
    var newType = document.getElementById(type);
    currentType.setAttribute('style', 'background-color:initial;');
    newType.setAttribute('style', 'background-color:green;');

    peerPoolType = type;
}

function startTest () {
    var testCounter = 0;
    if (!jxcoreLoaded) {
        alert('jxcore not loaded - please wait');
        return;
    }
    var interval = thaliDevice === 1 ? 5000 : 4000;
    setInterval(function () {
        if (testCounter % 3 === 0) {
            if (thaliStarted) {
                stopThali();
            } else {
                startThali();
            }
        } else {
            addData();
        }
        testCounter++;
    }, 5000);
}

app.initialize();
