# Overview #

This is a simple Thali native test application.

# Build instructions #

In order to build the application follow the steps:

1. Clone 2 GIT repos in the same location:
    * https://github.com/czyzm/ThaliTestApp.git (master branch)
    * https://github.com/thaliproject/Thali_CordovaPlugin.git (master_1274_trivial branch)
1. You need to have sinopia configured and running as described in Thali_CordovaPlugin.
Custom express-pouchdb (1.0.5-thali) must be available.
1. Enter the Thali_CordovaPlugin folder and run:
`./build.sh`
1. Enter the ThaliTestApp folder and run:
`./prepare.sh`
1. Now you can build the cordova app using command:
`cordova build android --device`
**NOTE:** Before each build it may be necessary to delete platforms/android/gradle.properties file.

# Run instructions #
1. On first run you will be asked for location permissions - it must be granted
if you want to use native mode.
1. When app starts on two devices select mode (WiFi or Native) on both devices using buttons. 
1. On both devices init Thali - you must use button Init Thali #1 on first device
and Init Thali #2 on second device in order to have Thali working
(related to ECDH keys used by devices).
1. Now you can start/stop Thali on both devices using buttons Start Thali and Stop Thali.
1. Button Add data adds data to local PouchDB. The added document content is:
   `[<ID>] TEST DATA #<SEQ>`
   where <ID> is id of device that created this document (corresponding to number used by Init Thali button),
   <SEQ> is sequential number of document created by gived device.
   In the LAST CHANGE field you may see the last change reported by PouchDB
   (TIME RECEIVED shows time when the change was received).
   This way you may check if the replication is working. Note that also your own changes are
   logged in LAST CHANGE. The 
 
