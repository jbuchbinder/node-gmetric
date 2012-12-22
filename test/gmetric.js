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
    gmetric.string_fill_length('awesome').should.equal(3);
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
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
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
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
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
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
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
    buffer.toString('utf-8', 4, 17).should.equal(teststring);
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
    pos.should.equal(22);
    var pos = gmetric.pack_string(buffer, smallstring, pos);
    pos.should.equal(37);
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
    meta.length.should.equal(148);
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
    var buffer = data.buffer;
    buffer.readInt32BE(0).should.equal(133);
    buffer.readInt32BE(4).should.equal(metric.hostname.length);
    data.length.should.equal(66);
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
    packet.length.should.equal(214);
    done();
  });

  // it("should be able to generate a spoofed packet", function(done){
  //   var gmetric = new Gmetric();
  //   var spoofed_metric = {
  //       hostname: 'awesomehost.mydomain.com',
  //       group: 'testgroup',
  //       spoof: true,
  //       units: 'widgets/sec',
  //       slope: 'positive',

  //       name: 'bestmetric',
  //       value: 10,
  //       type: 'int32'
  //   };
  //   var packet = gmetric.pack(spoofed_metric);
  //   packet.hostname.should.equal('awesomehost.mydomain.com');
  //   packet.group.should.equal('testgroup');
  //   packet.spoof.should.equal(1);
  //   packet.units.should.equal('widgets/sec');
  //   packet.slope.should.equal('positive');
  //   packet.tmax.should.equal(60);
  //   packet.dmax.should.equal(0);
  //   packet.name.should.equal('bestmetric');
  //   packet.value.should.equal(10);
  //   packet.type.should.equal('int32');
  //   done();
  // });

  // it("should be able to merge non-spoofed gmetric packets", function(done){
  //   var gmetric = new Gmetric();
  //   var spoofed_metric = {
  //       hostname: 'awesomehost.mydomain.com.cool.omgosh.wtf',
  //       group: 'testgroup',
  //       spoof: false,
  //       units: 'widgets/sec',
  //       slope: 'positive',

  //       name: 'bestmetric',
  //       value: 10,
  //       type: 'int32'
  //   };
  //   var packet = gmetric.pack(spoofed_metric);
  //   packet.hostname.should.equal('awesomehost.mydomain.com.cool.omgosh.wtf');
  //   packet.group.should.equal('testgroup');
  //   packet.spoof.should.equal(0);
  //   packet.units.should.equal('widgets/sec');
  //   packet.slope.should.equal('positive');
  //   packet.tmax.should.equal(60);
  //   packet.dmax.should.equal(0);
  //   packet.name.should.equal('bestmetric');
  //   packet.value.should.equal(10);
  //   packet.type.should.equal('int32');
  //   done();
  // });
});
