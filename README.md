# Overview #

This is a simple Thali native test application.

# Build instructions #

In order to build the application follow the steps:

1. Clone 2 GIT repos in the same location:
    * https://github.com/czyzm/ThaliTestApp.git (master branch)
    * https://github.com/thaliproject/Thali_CordovaPlugin.git (master branch)
1. You need to have sinopia configured and running as described in Thali_CordovaPlugin.
Custom express-pouchdb (1.0.5-thali) must be available.
1. Enter the ThaliTestApp folder and run:
`./prepare.sh`
1. Now you can build the cordova app using command:
`cordova build android --device`
**NOTE:** You need to build the app for each device separately using different set of ECDH keys for each device.
You need to manually modify file www/jxcore/app.js by commenting out lines for Phone 1 or for Phone 2:
    ```
    // Phone 1
    // var ecdh = ecdh1;
    // keysToUse = [ecdh2.getPublicKey()];
    
    // Phone 2
    var ecdh = ecdh2;
    keysToUse = [ecdh1.getPublicKey()];
    ```
    Before each build it may be necessary to delete platforms/android/gradle.properties file.
1. After installing the application on device remember to add needed permission by executing:
`adb -s <DEVICE_ID> shell pm grant com.example.ThaliTestApp android.permission.ACCESS_COARSE_LOCATION`
