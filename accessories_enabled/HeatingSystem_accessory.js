var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null; // in case there were any problems
var fs = require('fs');
var path = require('path');

//The relay seems to be on when there is no vaultage and off when the PIN is set to "1"
var ON_VALUE = "0";
var OFF_VALUE = "1";

// Generate a consistent UUID for our Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the accessory name.
var UUID = uuid.generate('hap-nodejs:accessories:HeatingSystem');

// This is the Accessory that we'll return to HAP-NodeJS that represents our accessory.
var accessory = exports.accessory = new Accessory('Heating System', UUID);

// set some basic properties (these values are arbitrary and setting them is optional)
accessory
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Oltica")
  .setCharacteristic(Characteristic.Model, "Rev-1")
  .setCharacteristic(Characteristic.SerialNumber, "A1S2NASF88EW");

// listen for the "identify" event for this Accessory
accessory.on('identify', function(paired, callback) {
  console.log("%s: Identifying: %s", new Date(), this.displayName);
  callback(); // success
});


// Add service
var addService = function(name, opts) {
  // Add the actual accessory Service and listen for change events from iOS.
  // We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
  var svc = accessory
    .addService(Service.Outlet, name, name);

  svc.getCharacteristic(Characteristic.On)
    .on('set', opts.set.bind(svc));

  // We want to intercept requests for our current power state so we can query the hardware itself instead of
  // allowing HAP-NodeJS to return the cached Characteristic.value.
  svc.getCharacteristic(Characteristic.On)
    .on('get', opts.get.bind(svc));
}

// CENTRAL HEATING SERVICE
var centralHeatingSwitchFilePath = process.env["HEATING_SWITCH_FILE_PATH"] || "/tmp/pin1";
addService("Heating", {
  get: function(callback) {
    var val = fs.readFileSync(centralHeatingSwitchFilePath).toString().trim();
    callback(null, val === ON_VALUE);
  },
  set: function(on, callback) {
    console.log("%s: Turning the %s: %s", new Date(), this.displayName, (on ? "on" : "off"));

    if (on) {
      fs.writeFileSync(centralHeatingSwitchFilePath, ON_VALUE);
      console.log("%s: %s is now on.", new Date(), this.displayName);
    } else {
      fs.writeFileSync(centralHeatingSwitchFilePath, OFF_VALUE);
      console.log("%s: %s is now off.", new Date(), this.displayName);
    }

    callback();
  }
});

// HOT WATER SERVICE (wired as per http://www.draytoncontrols.co.uk/sites/default/files/Motorised%20Valve%20Installer%20Guide.pdf)
var hotWaterOnSwitchFilePath = process.env["HOT_WATER_ON_SWITCH_FILE_PATH"] || "/tmp/pin2";
addService("Hot Water", {
  get: function(callback) {
    var val = fs.readFileSync(hotWaterOnSwitchFilePath).toString().trim();
    callback(null, val === ON_VALUE);
  },
  set: function(on, callback) {
    console.log("%s: Turning the %s: %s", new Date(), this.displayName, (on ? "on" : "off"));

    if (on) {
      fs.writeFileSync(hotWaterOnSwitchFilePath, ON_VALUE);
      console.log("%s: %s is now on.", new Date(), this.displayName);
    } else {
      fs.writeFileSync(hotWaterOnSwitchFilePath, OFF_VALUE);
      console.log("%s: %s is now off.", new Date(), this.displayName);
    }

    callback();
  }
});


