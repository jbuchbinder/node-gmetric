/**
 * Module dependencies.
 */

var dgram  = require('dgram'),
    socket = require('dgram').createSocket('udp4'),
    slope  = require('./gmetric').slope,
    utils  = require('./utils');

/**
 * Gmetric Commands prototype.
 */

module.exports = exports = Commands;

function Commands(){}

/**
 * Packs an integer as a big endian unsigned long.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 * @param {Buffer} (target) The target Buffer to pack onto
 * @param {Integer} (i) The integer to pack
 * @param {Integer} (pos) The position to begin the pack
 */

Commands.prototype.pack_int = function(target, i, pos){
  if (i === undefined || i === null){
    i = 0;
  }
  target.writeInt32BE(i, pos);
  return pos + 4;
}

/**
 * Packs a boolean as a big endian unsigned long.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 * @param {Buffer} (target) The target Buffer to pack onto
 * @param {Integer} (b) The boolean to pack
 * @param {Integer} (pos) The position to begin the pack
 */

Commands.prototype.pack_bool = function(target, b, pos){
  return this.pack_int(target, (b ? 1 : 0), pos);
}

/**
 * Packs a string matching the xdr format.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 * @param {Buffer} (target) The target Buffer to pack onto
 * @param {String} (data) The string to pack
 * @param {Integer} (pos) The position to begin the pack
 */

Commands.prototype.pack_string = function(target, data, pos){
  if (data === null || data === undefined){
    data = "";
  }
  var len = data.length;
  pos += this.pack_int(target, len, pos);

  len = ((len + 3) / 4) * 4;
  var fill_length = (len - data.length);
  pos += target.write(data, pos);
  target.fill(0, pos, (pos + fill_length));
  return pos + fill_length;
}

/**
 * Create the final package from a metric to send to the gmond target.
 * @param {Object} (metric)
 */

Commands.prototype.pack = function(metric){
  metric = utils.merge({
    hostname: '',
    group:    '',
    spoof:    0,
    units:     '',
    slope:    'both',
    tmax:     60,
    dmax:     0
  }, metric);

  if (metric['spoof'] === true){
    metric['spoof'] = 1;
  } else if(metric['spoof'] === false){
    metric['spoof'] = 0;
  }
}

Commands.prototype.writedata = function(buf, host, name, type, val, spoof ) {
  this.pack_int( buf, 128 + 5 );          // string message
  this.pack_string( buf, host );          // hostname
  this.pack_string( buf, name );          // name of the metric
  this.pack_bool( buf, spoof != null );   // spoof hostname flag
  this.pack_string( buf, "%s" );          //
}

Commands.prototype.writemeta = function ( buf, host, name, type, units, slope, tmax, dmax, spoof, group ) {
    this.pack_int( buf, 128 ); // gmetadata_full
    this.pack_string( buf, spoof == null ? host : spoof );
    this.pack_string( buf, name );
    this.pack_bool( buf, spoof != null );

    this.pack_string( buf, this.typeToString(type) );
    this.pack_string( buf, name );
    this.pack_string( buf, units );
    this.pack_int( buf, slope );
    this.pack_int( buf, tmax );
    this.pack_int( buf, dmax );

    if (spoof == null) {
        if (group != null) {
            this.pack_int( buf, 1 );
            this.pack_string( buf, GROUP );
            this.pack_string( buf, group );
        } else {
            this.pack_int( buf, 1 );
        }
    } else {
        if (group != null) {
            this.pack_int( buf, 2 );
        } else {
            this.pack_int( buf, 1 );
        }
        this.pack_string( buf, SPOOF_HOST );
        this.pack_string( buf, spoof );
        if (group != null) {
            this.pack_string( buf, GROUP );
            this.pack_string( buf, group );
        }
    }
}

Commands.prototype.sendUdp = function( message, host, port ){
    var buffer = new Buffer(message);
    socket.send(buffer, 0, buffer.length, port, host, function( err, bytes ){
        if (err) {
            console.log(err);
        }
    });
}

Commands.prototype.close = function() {
    socket.close();
}

Commands.prototype.sendMetric = function( host, name, value, units, type, slope, tmax, dmax, group ) {
    // Meta payload
    var meta_message = new Buffer(256);
    this.writemeta( meta_message, host, name, type, units, slope, tmax, dmax, this._ganglia_spoof, group );
    this.sendUdp( meta_message.length, this._ganglia_host, this._ganglia_port );

    // Data payload
    var message = new Buffer(256);
    this.writedata( message, host, name, type, value, this._ganglia_spoof );
    this.sendUdp( message.length, this._ganglia_host, this._ganglia_port );
}



var GROUP      = "GROUP";
var SPOOF_HOST = "SPOOF_HOST";