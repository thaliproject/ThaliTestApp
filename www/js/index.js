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

var thaliMode = 'native';

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
            if (window.ThaliPermissions) {
                // requestLocationPermission ensures that the application has
                // the required ACCESS_COARSE_LOCATION permission in Android.
                window.ThaliPermissions.requestLocationPermission(function () {
                    console.log('Application has the required permission.');
                    jxcore('app.js').loadMainFile(function(ret, err) {
                        console.log('jxcore loaded');
                        app.registerFunctions();
                    });
                }, function (error) {
                    console.log('Location permission not granted. Error: ' + error);
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
        jxcore('dbChange').register(function (change) {
            var parentElement = document.getElementById('changes');
            var lastChangeElement = parentElement.querySelector('.lastchange');
            var changeTimeElement = parentElement.querySelector('.changetime');
            lastChangeElement.innerHTML = change;
            changeTimeElement.innerHTML = new Date().toLocaleTimeString();
        });
    }

};

function initThali (deviceId) {
    jxcore('initThali').call(deviceId, thaliMode, function () {
        console.log('Thali initialized for device #' + deviceId);
    });
}

function startThali () {
    jxcore('startThali').call(function () {
        console.log('Thali started');
    });
}

function stopThali () {
    jxcore('stopThali').call(function () {
        console.log('Thali stopped');
    });
}

var dataCounter = 0;
function addData () {
    jxcore('addData').call('Test data #' + dataCounter, function () {});
    dataCounter++;
}

function addAttachment () {
    jxcore('addAttachment').call(function () {
        console.log('adding attachment');
    });
}

function testByNumber (number) {
  jxcore('test' + number).call(function () {
    console.log('test %d finished', number);
  });
}

function setMode (mode) {
    var currentModeElement = document.getElementById(thaliMode);
    var newModeElement = document.getElementById(mode);
    currentModeElement.setAttribute('style', 'background-color:initial;');
    newModeElement.setAttribute('style', 'background-color:green;');

    thaliMode = mode;
}

app.initialize();
