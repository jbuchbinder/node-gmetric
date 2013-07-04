node-gmetric [![build status](https://secure.travis-ci.org/jbuchbinder/node-gmetric.png?branch=master)](http://travis-ci.org/jbuchbinder/node-gmetric)
============

* Module Name : gmetric
* Website : https://github.com/jbuchbinder/node-gmetric

Gmetric packet submission for node.js

Sending metrics
---------------

### Unspoofed

```javascript
var Gmetric = require('gmetric');

var gmetric = new Gmetric();
var metric = {
  hostname: 'awesomehost.mydomain.com',
  group: 'testgroup',
  units: 'widgets/sec',
  slope: 'positive',

  name: 'bestmetric',
  value: 10,
  type: 'int32'
};

gmetric.send('127.0.0.1', 8649, metric);
```

### Spoofed

```javascript
var Gmetric = require('gmetric');

var gmetric = new Gmetric();
var metric = {
  hostname: '192.168.20.15:awesomehost.mydomain.com',
  group: 'testgroup',
  spoof: true,
  units: 'widgets/sec',
  slope: 'positive',

  name: 'bestmetric',
  value: 10,
  type: 'int32'
};

gmetric.send('127.0.0.1', 8649, metric);
```

Receiving and unpacking metrics
-------------------------------

```javascript
var util = require('util'),
    dgram = require('dgram'),
    server = dgram.createSocket('udp4');

var Gmetric = require('gmetric'),
    gmetric = new Gmetric();

server.on('message', function(msg, rinfo) {
  var msg_type = msg.readInt32BE(0);
  if(msg_type === 128){
    var meta = gmetric.unpack(msg);
    console.log('Received Meta Packet:');
    console.log(util.inspect(meta) + "\n");
  } else if (msg_type === 133){
    var data = gmetric.unpack(msg);
    console.log('Received Data Packet:');
    console.log(util.inspect(data) + "\n");
  }
});

server.on('listening', function(){
  console.log('Gmetric server listening...');
});

server.bind(8649);
```
