/*
 * Typical usage:
 *
 * jx runOnDesktop.js 1 native &> logs/thali-1.log & \
 * jx runOnDesktop.js 2 native &> logs/thali-2.log
 *
 */

var deviceId = Number(process.argv[2]);
var mode = process.argv[3] || 'native';

if (isNaN(deviceId)) {
  throw new Error('Device number is not a number');
}


var os    = require('os');
var tmp   = require('tmp');
var path  = require('path');
var spawn = require('child_process').spawn;

var platform = require('thali/NextGeneration/utils/platform');
var mock = require('./mock');

platform._override(platform.names.ANDROID);
global.Mobile = mock(platform.name);

function getTmpDirectory () {
  if (platform.isMobile) {
    return os.tmpdir();
  }

  tmp.setGracefulCleanup();
  if (tmpObject === null) {
    tmpObject = tmp.dirSync({
      unsafeCleanup: true
    });
  }
  return tmpObject.name;
}

global.Mobile.getDocumentsPath = function (callback) {
  var documentsPath = path.join(getTmpDirectory(), 'docs-' + Date.now() + '-' + deviceId);
  try {
    require('fs').mkdirSync(documentsPath);
    callback(null, documentsPath);
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
methods.testData();
