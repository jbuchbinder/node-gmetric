var cmds = require('../lib/commands');

describe('commands', function() {
  it("be able to properly pack integers", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var int_pos = cmds.pack_int(buffer, 33, pos);
    int_pos.should.equal(11);
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
    buffer.readInt32BE(teststring.length).should.equal(33);
    cmds.pack_int(buffer, 47, pos);
    buffer.readInt32BE(teststring.length).should.equal(47);
    done();
  });

  it("should pack the integer 0 when undefined or null", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    cmds.pack_int(buffer, undefined, pos);
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
    buffer.readInt32BE(teststring.length).should.equal(0);
    cmds.pack_int(buffer, null, pos);
    buffer.readInt32BE(teststring.length).should.equal(0);
    done();
  });

  it("should be able to properly pack booleans", function(done){
    var teststring = 'awesome';
    var buffer = new Buffer(11);
    var pos = buffer.write(teststring);
    var int_pos = cmds.pack_bool(buffer, true, pos);
    buffer.toString('utf-8', 0, teststring.length).should.equal(teststring);
    int_pos.should.equal(11);
    buffer.readInt32BE(teststring.length).should.equal(1);
    cmds.pack_bool(buffer, false, pos);
    buffer.readInt32BE(teststring.length).should.equal(0);
    done();
  });

  it("should be able to properly pack xdr strings", function(done){
    var teststring = 'thebeststring';
    var buffer = new Buffer(20);
    var int_pos = cmds.pack_string(buffer, teststring, 0);
    int_pos.should.equal(20);
    buffer.readInt32BE(0).should.equal(teststring.length);
    buffer.toString('utf-8', 4, 17).should.equal(teststring);
    buffer[17].should.equal(0);
    buffer[18].should.equal(0);
    buffer[19].should.equal(0);
    done();
  });
});
