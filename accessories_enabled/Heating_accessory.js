var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null; // in case there were any problems
var fs = require('fs');
var path = require('path');
var switchFilePath = process.env["SWITCH_FILE_PATH"] || "/tmp/pin1";

// here's a fake hardware device that we'll expose to HomeKit
var HEATING_INTERFACE_CONTROLLER = {
  setHeating: function(on, callback) {
    console.log("%s: Turning the heating: %s", new Date(), (on ? "on" : "off"));

    if (on) {
      fs.writeFileSync(switchFilePath, "1");
      console.log("%s: Heating is now on.", new Date());
    } else {
      fs.writeFileSync(switchFilePath, "0");
      console.log("%s: Heating is now off.", new Date());
    }

    callback();
  },
  getHeatingState: function(callback) {
    var val = fs.readFileSync(switchFilePath).toString().trim();
    callback(null, val === "1");
  },

  identify: function() {
    console.log("%s: Identify the heating.", new Date());
  }
}

// Generate a consistent UUID for our heating Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the accessory name.
var UUID = uuid.generate('hap-nodejs:accessories:Heating');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var heating = exports.accessory = new Accessory('Heating', UUID);

// set some basic properties (these values are arbitrary and setting them is optional)
heating
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Oltica")
  .setCharacteristic(Characteristic.Model, "Rev-1")
  .setCharacteristic(Characteristic.SerialNumber, "A1S2NASF88EW");

// listen for the "identify" event for this Accessory
heating.on('identify', function(paired, callback) {
  HEATING_INTERFACE_CONTROLLER.identify();
  callback(); // success
});

// Add the actual heating Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
heating
  .addService(Service.Outlet, "Heating") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    HEATING_INTERFACE_CONTROLLER.setHeating(value, callback);
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
heating
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    HEATING_INTERFACE_CONTROLLER.getHeatingState(function(err, state) {
      if(state) {
        console.log("%s: Heating is on.", new Date());
      } else {
        console.log("%s: Heating is off.", new Date());
      }

      callback(err, state);
    });
  });
