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

  it("should be able to create a new gmetric object", function(done){
    var gmetric = new Gmetric('127.0.0.1', 8659, true);
    gmetric._ganglia_host.should.equal('127.0.0.1');
    gmetric._ganglia_port.should.equal(8659);
    gmetric._ganglia_spoof.should.equal(true);
    (typeof gmetric.pack_int === 'function').should.equal(true);
    (typeof gmetric.pack_bool === 'function').should.equal(true);
    (typeof gmetric.pack_string === 'function').should.equal(true);
    done();
  });

  it("be able to properly pack integers", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var gmetric = new Gmetric('127.0.0.1', 8659, true);
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
    var gmetric = new Gmetric('127.0.0.1', 8659, true);
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
    var gmetric = new Gmetric('127.0.0.1', 8659, true);
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
    var gmetric = new Gmetric('127.0.0.1', 8659, true);
    var int_pos = gmetric.pack_string(buffer, teststring, 0);
    int_pos.should.equal(20);
    buffer.readInt32BE(0).should.equal(teststring.length);
    buffer.toString('utf-8', 4, 17).should.equal(teststring);
    buffer[17].should.equal(0);
    buffer[18].should.equal(0);
    buffer[19].should.equal(0);
    done();
  });
});
