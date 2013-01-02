[![build status](https://secure.travis-ci.org/jbuchbinder/node-gmetric.png)](http://travis-ci.org/jbuchbinder/node-gmetric)
NODE-GMETRIC
============

* Module Name : gmetric
* Website : https://github.com/jbuchbinder/node-gmetric

Gmetric packet submission for node.js

Usage
------

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

gmetric.send('127.0.0.1', 8659, metric);
```
