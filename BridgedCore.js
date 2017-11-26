var fs = require('fs');
var path = require('path');
var storage = require('node-persist');
var uuid = require('./').uuid;
var Bridge = require('./').Bridge;
var Accessory = require('./').Accessory;
var accessoryLoader = require('./lib/AccessoryLoader');

console.log("HAP-NodeJS starting...");

// Initialize our storage system
storage.initSync();

// Start by creating our Bridge which will host all loaded Accessories
var bridge = new Bridge('Node Bridge', uuid.generate("Node Bridge"));

// Listen for bridge identification event
bridge.on('identify', function(paired, callback) {
  console.log("Node Bridge identify");
  callback(); // success
});

// Load up all accessories in the /accessories folder
var dir = path.join(__dirname, "accessories_enabled");
var accessories = accessoryLoader.loadDirectory(dir);

// Add them all to the bridge
accessories.forEach(function(accessory) {
  console.log("Added accessory: %s", accessory.displayName);
  bridge.addBridgedAccessory(accessory);
});

// Publish the Bridge on the local network.
bridge.publish({
  username: process.env["USERNAME"] || "CC:22:3D:E3:CE:F1",
  port: 51826,
  pincode: process.env["PINCODE"] || "000-00-000",
  category: Accessory.Categories.BRIDGE
});
