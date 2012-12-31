var dgram = require('dgram');

var Gmetric = require('../lib/gmetric');

describe('gmetric', function() {
  it("should be able to lookup slopes", function(done){
    Gmetric.slope['zero'].should.equal(0);
    Gmetric.slope['positive'].should.equal(1);
    Gmetric.slope['negative'].should.equal(2);
    Gmetric.slope['both'].should.equal(3);
    Gmetric.slope['unspecified'].should.equal(4);
    done();
  });

  it("should have a list of supported types", function(done){
    ("int8" in Gmetric.supported_types).should.equal(true);
    ("uint8" in Gmetric.supported_types).should.equal(true);
    ("int16" in Gmetric.supported_types).should.equal(true);
    ("uint16" in Gmetric.supported_types).should.equal(true);
    ("int32" in Gmetric.supported_types).should.equal(true);
    ("uint32" in Gmetric.supported_types).should.equal(true);
    ("float" in Gmetric.supported_types).should.equal(true);
    ("double" in Gmetric.supported_types).should.equal(true);
    ("int12" in Gmetric.supported_types).should.equal(false);
    done();
  });

  it("should generate the fill length for an xdr string", function(done) {
    var gmetric = new Gmetric();
    gmetric.string_fill_length('awesome').should.equal(1);
    done();
  });

  it("should be able to create a new gmetric object", function(done){
    var gmetric = new Gmetric();
    (typeof gmetric.pack_int === 'function').should.equal(true);
    (typeof gmetric.pack_bool === 'function').should.equal(true);
    (typeof gmetric.pack_string === 'function').should.equal(true);
    done();
  });

  it("be able to properly pack integers with an integer", function(done){
    var gmetric = new Gmetric();
    var buffer = new Buffer(16);
    var pos = gmetric.pack_int(buffer, 33, 0);
    pos.should.equal(4);
    pos = gmetric.pack_int(buffer, 47, pos);
    pos.should.equal(8);
    buffer.readInt32BE(0).should.equal(33);
    buffer.readInt32BE(4).should.equal(47);
    done();
  });

  it("be able to properly pack integers with a string", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var gmetric = new Gmetric();
    var int_pos = gmetric.pack_int(buffer, 33, pos);
    int_pos.should.equal(11);
    buffer.toString('ascii', 0, teststring.length).should.equal(teststring);
    buffer.readInt32BE(teststring.length).should.equal(33);
    gmetric.pack_int(buffer, 47, pos);
    buffer.readInt32BE(teststring.length).should.equal(47);
    done();
  });

  it("should pack the integer 0 when undefined or null", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var gmetric = new Gmetric();
    gmetric.pack_int(buffer, undefined, pos);
    buffer.toString('ascii', 0, teststring.length).should.equal(teststring);
    buffer.readInt32BE(teststring.length).should.equal(0);
    gmetric.pack_int(buffer, null, pos);
    buffer.readInt32BE(teststring.length).should.equal(0);
    done();
  });

  it("should be able to properly pack booleans", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var gmetric = new Gmetric();
    var int_pos = gmetric.pack_bool(buffer, true, pos);
    buffer.toString('ascii', 0, teststring.length).should.equal(teststring);
    int_pos.should.equal(11);
    buffer.readInt32BE(teststring.length).should.equal(1);
    gmetric.pack_bool(buffer, false, pos);
    buffer.readInt32BE(teststring.length).should.equal(0);
    done();
  });

  it("should be able to properly pack xdr strings", function(done){
    var teststring = 'thebeststring';
    var buffer = new Buffer(20);
    var gmetric = new Gmetric();
    var int_pos = gmetric.pack_string(buffer, teststring, 0);
    int_pos.should.equal(20);
    buffer.readInt32BE(0).should.equal(teststring.length);
    buffer.toString('ascii', 4, 17).should.equal(teststring);
    buffer[17].should.equal(0);
    buffer[18].should.equal(0);
    buffer[19].should.equal(0);
    done();
  });

  it("should be able to pack two xdr strings side by side", function(done){
    var longstring  = 'thelongerstring';
    var smallstring = 'smallstr';
    var buffer = new Buffer(128);
    var gmetric = new Gmetric();
    var pos = gmetric.pack_string(buffer, longstring, 0);
    pos.should.equal(20);
    var pos = gmetric.pack_string(buffer, smallstring, pos);
    pos.should.equal(32);
    done();
  });

  it("should throw an error with an incomplete metric", function(done){
    var gmetric = new Gmetric();
    var empty_metric = {};
    (function(){
      gmetric.pack(empty_metric)
    }).should.Throw(Error);
    done();
  });

  it("should throw an error with missing metric name", function(done){
    var gmetric = new Gmetric();
    var broken_metric = { value: 10, type: 'int32' };
    (function(){
      gmetric.pack(broken_metric)
    }).should.Throw(Error);
    done();
  });

  it("should throw an error with missing metric value", function(done){
    var gmetric = new Gmetric();
    var broken_metric = { name: 'bestmetric', type: 'int32' };
    (function(){
      gmetric.pack(broken_metric)
    }).should.Throw(Error);
    done();
  });

  it("should throw an error with missing metric type", function(done){
    var gmetric = new Gmetric();
    var broken_metric = { name: 'bestmetric', value: 10 };
    (function(){
      gmetric.pack(broken_metric)
    }).should.Throw(Error);
    done();
  });

  it("should throw an error on an invalid metric type", function(done){
    var gmetric = new Gmetric();
    var broken_metric = { name: 'bestmetric', value: 10, type: 'brainslug' };
    (function(){
      gmetric.pack(broken_metric)
    }).should.Throw(Error);
    done();
  });

  it("should return an empty list of extra elements", function(done){
    var gmetric = new Gmetric();
    gmetric.extra_elements({}).should.have.length(0);
    done();
  });

  it("should return an empty list of extra elements2", function(done){
    var gmetric = new Gmetric();
    gmetric.extra_elements({}).should.have.length(0);
    done();
  });

  it("should be able to return a list of extra elements", function(done){
    var gmetric = new Gmetric();
    var metric = {
        hostname: 'awesomehost.mydomain.com',
        spoof: false,
        units: 'widgets/sec',
        slope: 'positive',

        name: 'bestmetric',
        value: 10,
        type: 'int32'
      };
    gmetric.extra_elements(metric).should.have.length(0);
    done();
  });

  it("should be able to return a list of extra elements", function(done){
    var gmetric = new Gmetric();
    var metric = {
        hostname: 'awesomehost.mydomain.com',
        group: 'testgroup',
        spoof: false,
        units: 'widgets/sec',
        slope: 'positive',

        name: 'bestmetric',
        value: 10,
        type: 'int32'
      };
    gmetric.extra_elements(metric).should.have.length(1);
    done();
  });

  it("should be able to return a list of extra elements2", function(done){
    var gmetric = new Gmetric();
    var metric = {
        hostname: 'awesomehost.mydomain.com',
        group: 'testgroup',
        spoof: false,
        units: 'widgets/sec',
        slope: 'positive',

        name: 'bestmetric',
        description: 'The best description ever ever',
        value: 10,
        type: 'int32'
      };
    gmetric.extra_elements(metric).should.have.length(2);
    done();
  });

  it("should be able to create a gmetric meta packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var meta = gmetric.create_meta(metric);
    meta.readInt32BE(0).should.equal(128);
    meta.length.should.equal(140);
    done();
  });

  it("should be able to create a gmetric data packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var data = gmetric.create_data(metric);
    data.readInt32BE(0).should.equal(133);
    data.readInt32BE(4).should.equal(metric.hostname.length);
    data.length.should.equal(68);
    done();
  });

  it("should be able to create a simple gmetric packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var packet = gmetric.pack(metric);
    packet.meta.length.should.equal(140);
    packet.data.length.should.equal(68);
    done();
  });

  it("should be able to unpack an integer", function(done){
    var gmetric = new Gmetric();
    var buffer = new Buffer(4);
    var pos = gmetric.pack_int(buffer, 11, 0);
    pos.should.equal(4);
    var unpack = gmetric.unpack_int(buffer, 0);
    unpack.pos.should.equal(4);
    unpack.integer.should.equal(11);
    done();
  });

  it("should be able to unpack an boolean", function(done){
    var gmetric = new Gmetric();
    var buffer = new Buffer(4);
    var pos = gmetric.pack_bool(buffer, true, 0);
    pos.should.equal(4);
    var unpack = gmetric.unpack_bool(buffer, 0);
    unpack.pos.should.equal(4);
    unpack.bool.should.equal(true);

    pos = gmetric.pack_bool(buffer, false, 0);
    pos.should.equal(4);
    unpack = gmetric.unpack_bool(buffer, 0);
    unpack.pos.should.equal(4);
    unpack.bool.should.equal(false);
    done();
  });

  it("should be able to unpack a string", function(done){
    var gmetric = new Gmetric();
    var buffer = new Buffer(12);
    var pos = gmetric.pack_string(buffer, 'awesome', 0);
    pos.should.equal(12);
    var unpack = gmetric.unpack_string(buffer, 0);
    unpack.string.should.equal('awesome');
    unpack.pos.should.equal(12);
    done();
  });

  it("should be able to parse a data packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var packet = gmetric.create_data(metric);
    var data = gmetric.parse_data(packet);
    data.hostname.should.equal('awesomehost.mydomain.com');
    data.name.should.equal('bestmetric');
    data.spoof.should.equal(true);
    parseInt(data.value).should.equal(10);
    done();
  });

  it("should be able to parse a meta packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',
      tmax: 60,
      dmax: 180,

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var packet = gmetric.create_meta(metric);
    var meta = gmetric.parse_meta(packet);
    meta.hostname.should.equal('awesomehost.mydomain.com');
    meta.group.should.equal('testgroup');
    meta.spoof.should.equal(true);
    meta.type.should.equal('int32');
    meta.units.should.equal('widgets/sec');
    meta.slope.should.equal('positive');
    meta.tmax.should.equal(60);
    meta.dmax.should.equal(180);
    done();
  });

  it("should be able to parse a gmetric packet", function(done){
    var gmetric = new Gmetric();
    var metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: true,
      units: 'widgets/sec',
      slope: 'positive',
      tmax: 60,
      dmax: 180,

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };
    var packet = gmetric.pack(metric);

    var meta = gmetric.unpack(packet.meta);
    meta.hostname.should.equal('awesomehost.mydomain.com');
    meta.group.should.equal('testgroup');
    meta.spoof.should.equal(true);
    meta.type.should.equal('int32');
    meta.units.should.equal('widgets/sec');
    meta.slope.should.equal('positive');
    meta.tmax.should.equal(60);
    meta.dmax.should.equal(180);

    var data = gmetric.unpack(packet.data);
    data.hostname.should.equal('awesomehost.mydomain.com');
    data.name.should.equal('bestmetric');
    data.spoof.should.equal(true);
    parseInt(data.value).should.equal(10);
    done();
  });

  it("should be able to send a simple udp packet", function(done){
    var server = dgram.createSocket('udp4');
    var gmetric = new Gmetric();

    server.on('message', function(msg, rinfo) {
      msg.toString().should.equal('awesomebuffer');
      server.close();
    });
    server.on('listening', function(){
      var buffer = new Buffer('awesomebuffer');
      gmetric.send_packet('127.0.0.1', 43278, buffer);
    });
    server.on('close', function() {
      done();
    });
    server.bind(43278);
  });

  it("should be able to send a complete gmetric packet", function(done){
    var server = dgram.createSocket('udp4');
    var gmetric = new Gmetric();
    var meta_done = false;
    var data_done = false;

    var check_complete = function(){
      if (meta_done & data_done){
        server.close();
      }
    };

    var monitor = setInterval(check_complete, 5);
    server.on('message', function(msg, rinfo) {
      var msg_type = msg.readInt32BE(0);
      if(msg_type === 128){
        var meta = gmetric.unpack(msg);
        meta.hostname.should.equal('awesomehost.mydomain.com');
        meta.group.should.equal('testgroup');
        meta.spoof.should.equal(false);
        meta.type.should.equal('int32');
        meta.units.should.equal('widgets/sec');
        meta.slope.should.equal('positive');
        meta.tmax.should.equal(60);
        meta.dmax.should.equal(0);
        meta_done = true;
      } else if (msg_type === 133){
        var data = gmetric.unpack(msg);
        data.hostname.should.equal('awesomehost.mydomain.com');
        data.name.should.equal('bestmetric');
        data.spoof.should.equal(false);
        parseInt(data.value).should.equal(10);
        data_done = true;
      }
    });

    server.on('listening', function(){
      var metric = {
        hostname: 'awesomehost.mydomain.com',
        group: 'testgroup',
        spoof: false,
        units: 'widgets/sec',
        slope: 'positive',

        name: 'bestmetric',
        value: 10,
        type: 'int32'
      };

      gmetric.send('127.0.0.1', 43278, metric);
    });
    server.on('close', function() {
      clearInterval(monitor);
      done();
    });
    server.bind(43278);
  });

  it("should be able to send a spoofed gmetric packet", function(done){
    var server = dgram.createSocket('udp4');
    var gmetric = new Gmetric();
    var meta_done = false;
    var data_done = false;

    var check_complete = function(){
      if (meta_done & data_done){
        server.close();
      }
    };

    var monitor = setInterval(check_complete, 5);
    server.on('message', function(msg, rinfo) {
      var msg_type = msg.readInt32BE(0);
      if(msg_type === 128){
        var meta = gmetric.unpack(msg);
        meta.hostname.should.equal('awesomehost.mydomain.com');
        meta.group.should.equal('testgroup');
        meta.spoof.should.equal(true);
        meta.type.should.equal('int32');
        meta.units.should.equal('widgets/sec');
        meta.slope.should.equal('positive');
        meta.tmax.should.equal(60);
        meta.dmax.should.equal(0);
        meta_done = true;
      } else if (msg_type === 133){
        var data = gmetric.unpack(msg);
        data.hostname.should.equal('awesomehost.mydomain.com');
        data.name.should.equal('bestmetric');
        data.spoof.should.equal(true);
        parseInt(data.value).should.equal(10);
        data_done = true;
      }
    });

    server.on('listening', function(){
      var metric = {
        hostname: 'awesomehost.mydomain.com',
        group: 'testgroup',
        spoof: true,
        units: 'widgets/sec',
        slope: 'positive',

        name: 'bestmetric',
        value: 10,
        type: 'int32'
      };

      gmetric.send('127.0.0.1', 43278, metric);
    });
    server.on('close', function() {
      clearInterval(monitor);
      done();
    });
    server.bind(43278);
  });
});
