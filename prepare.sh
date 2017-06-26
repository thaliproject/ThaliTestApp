#!/usr/bin/env bash

set -euo pipefail

NVM_NODEJS_ORG_MIRROR=https://jxcore.azureedge.net
export NVM_NODEJS_ORG_MIRROR
JX_NPM_JXB=jxb311
export JX_NPM_JXB

../Thali_CordovaPlugin/thali/install/setUpDesktop.sh

# cordova-custom-config allows to use custom flags in config.xml
cordova plugin add cordova-custom-config --fetch --save

mkdir -p thaliDontCheckIn/localdev
cordova platform add ios
cordova platform add android

cd www/jxcore
jx npm install ../../../Thali_CordovaPlugin/thali/ --save --no-optional --autoremove "*.gz"

jx npm install --no-optional --autoremove "*.gz"
find . -name "*.gz" -delete
