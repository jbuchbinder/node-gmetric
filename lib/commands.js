/**
 * Module dependencies.
 */

var dgram = require('dgram'),
    socket = require('dgram').createSocket('udp4');

/**
 * Gmetric commands prototype.
 */

var commands = exports = module.exports =  {};

var GROUP      = "GROUP";
var SPOOF_HOST = "SPOOF_HOST";

/**
 * Packs an integer as a big endian unsigned long.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 * @param {Buffer} (target) The target Buffer to pack onto
 * @param {Integer} (i) The integer to pack
 * @param {Integer} (pos) The position to begin the pack
 */
commands.pack_int = function ( target, i, pos ) {
    if ( i === undefined || i === null ) {
        i = 0;
    }
    pos += target.writeInt32BE(i, pos);
    return pos;
}

/**
 * Packs a boolean as a big endian unsigned long.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 * @param {Buffer} (target) The target Buffer to pack onto
 * @param {Integer} (b) The boolean to pack
 * @param {Integer} (pos) The position to begin the pack
 */
commands.pack_bool = function ( target, b, pos ) {
    pos += this.pack_int( target, ( b ? 1 : 0 ), pos );
    return pos;
}

/**
 * Packs a string matching the xdr format.
 * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
 * refs: http://www.ietf.org/rfc/rfc4506.txt
 */
commands.pack_string = function ( target, s, pos ) {
    if (s === null) {
        this.pack_int( buf, 0 );
        for (var i = 0; i < 4; i++) {

            buf.add_byte( 0 );
        }
        return;
    }
    this.pack_int( buf, s.length );
    buf.add_string(s);
    var offset = s.length % 4;
    if (offset != 0) {
        for (var i = offset; i < 4; i++) {
            buf.add_byte( 0 );
        }
    }
}

commands.typeToString = function ( t ) {
    switch (t) {
        case VALUE_UNKNOWN:        return "unknown";
        case VALUE_STRING:         return "string";
        case VALUE_UNSIGNED_SHORT: return "uint16";
        case VALUE_SHORT:          return "int16";
        case VALUE_UNSIGNED_INT:   return "uint32";
        case VALUE_INT:            return "int32";
        case VALUE_FLOAT:          return "float";
        case VALUE_DOUBLE:         return "double";
        default:                   return "unknown";
    }
}

commands.typeToFormatString = function ( t ) {
    switch (parseInt(t)) {
        case VALUE_UNKNOWN:        return "";
        case VALUE_STRING:         return "%s";
        case VALUE_UNSIGNED_SHORT: return "%uh";
        case VALUE_SHORT:          return "%h";
        case VALUE_UNSIGNED_INT:   return "%u";
        case VALUE_INT:            return "%d";
        case VALUE_FLOAT:          return "%f";
        case VALUE_DOUBLE:         return "%lf";
        default:                   return "";
    }
}

commands.writevalue = function ( buf, host, name, type, val, spoof ) {
    this.pack_int( buf, 128 + 5 );
    this.pack_string( buf, host );
    this.pack_string( buf, name );
    this.pack_bool( buf, spoof != null );
    this.pack_string( buf, "%s" );

    switch (type) {
        case VALUE_UNSIGNED_SHORT:
        case VALUE_SHORT:
        case VALUE_UNSIGNED_INT:
        case VALUE_INT:
        case VALUE_FLOAT:
        case VALUE_DOUBLE:
        case VALUE_STRING:
        case VALUE_UNKNOWN:
        default:
            this.pack_string( buf, val + "" );
            break;
    }
}

commands.writemeta = function ( buf, host, name, type, units, slope, tmax, dmax, spoof, group ) {
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

commands.sendUdp = function(message, host, port) {
    var buffer = new Buffer(message);
    socket.send(buffer, 0, buffer.length, port, host, function (err, bytes) {
        if (err) {
            console.log(err);
        }
    });
}

commands.close = function() {
    socket.close();
}

commands.sendMetric = function ( host, name, value, units, type, slope, tmax, dmax, group ) {
    // Write meta data
    var meta_message = new Buffer(256);
    this.writemeta( meta_message, host, name, type, units, slope, tmax, dmax, this._ganglia_spoof, group );
    this.sendUdp(meta_message.length, this._ganglia_host, this._ganglia_port);

    // Write value packet
    var message = new Buffer(256);
    this.writevalue( message, host, name, type, value, this._ganglia_spoof );
    this.sendUdp(message.length, this._ganglia_host, this._ganglia_port);
}
