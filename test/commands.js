var cmds = require('../lib/commands');

describe('commands', function() {
  it("be able to properly pack integers", function(done){
    var buffer = new Buffer(11);
    var pos = buffer.write('awesome');
    var int_pos = cmds.pack_int(buffer, 33, pos);
    int_pos.should.equal(11);
    buffer.toString('utf-8', 0, 7).should.equal("awesome");
    buffer.readInt32BE(7).should.equal(33);
    cmds.pack_int(buffer, 47, pos);
    buffer.readInt32BE(7).should.equal(47);
    done();
  });

  it("should pack the integer 0 when undefined or null", function(done){
    var buffer = new Buffer(11);
    var pos = buffer.write('awesome');
    cmds.pack_int(buffer, undefined, pos);
    buffer.toString('utf-8', 0, 7).should.equal("awesome");
    buffer.readInt32BE(7).should.equal(0);
    cmds.pack_int(buffer, null, pos);
    buffer.readInt32BE(7).should.equal(0);
    done();
  });

  it("should be able to properly pack booleans", function(done){
    var buffer = new Buffer(11);
    var pos = buffer.write('awesome');
    var int_pos = cmds.pack_bool(buffer, true, pos);
    buffer.toString('utf-8', 0, 7).should.equal("awesome");
    int_pos.should.equal(11);
    buffer.readInt32BE(7).should.equal(1);
    cmds.pack_bool(buffer, false, pos);
    buffer.readInt32BE(7).should.equal(0);
    done();
  });

  it("should be able to properly pack xdr strings", function(done){
    var teststring = "thebeststring";
    var buffer = new Buffer(20);
    cmds.pack_string(buffer, teststring, 0);
    buffer.readInt32BE(0).should.equal(teststring.length);
    buffer.toString('utf-8', 4, 17).should.equal(teststring);
    buffer[17].should.equal(0);
    buffer[18].should.equal(0);
    buffer[19].should.equal(0);
    done();
  });
});
