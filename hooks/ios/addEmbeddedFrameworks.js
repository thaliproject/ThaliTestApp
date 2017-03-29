'use strict';

var fs = require('fs');
var nativeInstaller = require('../../../Thali_CordovaPlugin/thali/install/ios/nativeInstaller');
var path = require('path');

module.exports = function (context) {
  var cordovaUtil =
    context.requireCordovaModule('cordova-lib/src/cordova/util');
  var ConfigParser = context.requireCordovaModule('cordova-lib').configparser;
  var projectRoot = cordovaUtil.isCordova();
  var xml = cordovaUtil.projectConfig(projectRoot);
  var cfg = new ConfigParser(xml);

  var temp = path.join(projectRoot, 'plugins', 'org.thaliproject.p2p');

  var iOSInfrastructureFolder = path.join(temp, 'lib', 'ios');
  var testingInfrastructureForlder = path.join(
    temp, 'src', 'ios', 'Testing');
  var thaliCoreProjectFolder = path.join(
    temp, 'lib', 'ios', 'Carthage', 'Checkouts', 'thali-ios');

  console.log('DIR: ' + iOSInfrastructureFolder);

  var projectPath = path.join(
    projectRoot, 'platforms', 'ios', cfg.name() + '.xcodeproj');

  return nativeInstaller.addFramework(projectPath, thaliCoreProjectFolder,
    iOSInfrastructureFolder, false, testingInfrastructureForlder);
}
