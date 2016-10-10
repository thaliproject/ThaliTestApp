mkdir -p thaliDontCheckIn/localdev
cordova platform add android
cd www/jxcore
jx npm install ../../../Thali_CordovaPlugin/thali/ --save --no-optional --autoremove "*.gz"
jx npm install --no-optional --autoremove "*.gz"
find . -name "*.gz" -delete