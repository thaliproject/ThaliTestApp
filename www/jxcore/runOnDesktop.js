var deviceId = Number(process.argv[2]);
var mode = process.argv[3] || 'native';

if (isNaN(deviceId)) {
    throw new Error('Device number is not a number');
}


var platform = require('thali/NextGeneration/utils/platform');
var mock = require('./mock');
var spawn = require('child_process').spawn;

platform._override(platform.names.ANDROID);
global.Mobile = mock(platform.name);

global.Mobile.getDocumentsPath = function (callback) {
    var path = 'docs-' + Date.now() + '-' + deviceId;
    try {
        require('fs').mkdirSync(path);
        callback(null, path);
    } catch (error) {
        callback(error);
    }
};

var methods = {};
mock.MobileCallInstance.prototype.registerSync = function (impl) {
    methods[this.mobileMethodName] = impl;
};

mock.MobileCallInstance.prototype.call = function () {
    if (this.mobileMethodName === 'dbChange') {
        console.log('dbChange:', arguments[0]);
        return;
    }
    throw new Error(this.mobileMethodName + ' is not implemented');
};

require('./app');

methods.initThali(deviceId, mode);
methods.startThali();
methods.test1();

