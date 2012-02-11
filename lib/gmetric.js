
var SLOPE_ZERO        = 0;
var SLOPE_POSITIVE    = 1;
var SLOPE_NEGATIVE    = 2;
var SLOPE_BOTH        = 3;
var SLOPE_UNSPECIFIED = 4;

var VALUE_UNKNOWN         = 0;
var VALUE_STRING          = 1;
var VALUE_UNSIGNED_SHORT  = 2;
var VALUE_SHORT           = 3;
var VALUE_UNSIGNED_INT    = 4;
var VALUE_INT             = 5;
var VALUE_FLOAT           = 6;
var VALUE_DOUBLE          = 7;

var SPOOF_HOST = "SPOOF_HOST";

function gmetric ( ganglia_host, ganglia_port, ganglia_spoof ) {
    this._ganglia_host  = ganglia_host;
    this._ganglia_port  = ganglia_port;
    this._ganglia_spoof = ganglia_spoof;
}

gmetric.prototype.append_int = function ( buf, i ) {
    var pos = buf.byteLength('binary');
    buf[pos    ] = ((i << 24) & 0xff);
    buf[pos + 1] = ((i << 16) & 0xff);
    buf[pos + 2] = ((i >>  8) & 0xff);
    buf[pos + 3] = ( i        & 0xff);
}

gmetric.prototype.append_bool = function ( buf, b ) {
    var pos = buf.byteLength('binary');
    buf[pos] = ( b ? 1 : 0 );
}

gmetric.prototype.append_xdr_string = function ( buf, s ) {
    this.append_int( buf, s.length );
    buf.write(s);
    var offset = s.length % 4;
    if (offset != 0) {
        var pos = buf.byteLength('binary');
        for (var i = offset; i < 4; i++) {
            buf[pos] = 0;
            pos++;
        }
    }
}

gmetric.prototype.typeToString = function ( t ) {
    switch (t) {
        case VALUE_UNKNOWN:        return "unknown";
        case VALUE_STRING:         return "string";
        case VALUE_UNSIGNED_SHORT: return "uint16";
        case VALUE_SHORT:          return "int16";
        case VALUE_UNSIGNED_INT:   return "uint32";
        case VALUE_INT:            return "int32";
        case VALUE_FLOAT:          return "float";
        case VALUE_DOUBLE:         return "double";
    }
    return "unknown";
}

gmetric.prototype.typeToFormatString = function ( t ) {
    switch (t) {
        case VALUE_UNKNOWN:        return "";
        case VALUE_STRING:         return "%s";
        case VALUE_UNSIGNED_SHORT: return "%uh";
        case VALUE_SHORT:          return "%h";
        case VALUE_UNSIGNED_INT:   return "%u";
        case VALUE_INT:            return "%d";
        case VALUE_FLOAT:          return "%f";
        case VALUE_DOUBLE:         return "%lf";
    }
    return "";
}

gmetric.prototype.writevalue = function ( buf, host, name, type, val, spoof ) {
    this.append_int( buf, 128 + type );
    this.append_xdr_string( buf, host );
    this.append_xdr_string( buf, name );
    this.append_bool( buf, spoof != null );
    
    this.append_xdr_string( buf, this.typeToString( type ) );
    
    switch (type) {
        case VALUE_UNSIGNED_SHORT:
        case VALUE_SHORT:
        case VALUE_UNSIGNED_INT:
        case VALUE_INT:
            this.append_int( buf, val );
            break;
        case VALUE_FLOAT:
        case VALUE_DOUBLE:
        case VALUE_STRING:
        case VALUE_UNKNOWN:
            this.append_xdr_string( buf, val );
            break;
    }
}

gmetric.prototype.writemeta = function ( buf, host, name, type, units, slope, tmax, dmax, spoof ) {
    this.append_int( buf, 128 ); // gmetadata_full
    this.append_xdr_string( buf, host );
    this.append_xdr_string( buf, name );
    this.append_bool( buf, spoof != null );

    this.append_xdr_string( buf, type );
    this.append_xdr_string( buf, name );
    this.append_xdr_string( buf, units );
    this.append_int( buf, slope );
    this.append_int( buf, tmax );
    this.append_int( buf, dmax );
    
    if (spoof == null) {
        this.append_int( buf, 0 );
    } else {
        this.append_bool( buf, true );
        this.append_xdr_string( buf, SPOOF_HOST );
        this.append_xdr_string( buf, spoof );
    }
}

gmetric.prototype.sendMetric = function ( host, name, value, units, type, slope, tmax, dmax ) {
    var dgram = require('dgram');
    var message = new Buffer(512);
    this.writemeta( message, host, name, type, units, slope, tmax, dmax, this._ganglia_spoof );
    this.writedata( message, host, name, type, value, this._ganglia_spoof );
    var client = dgram.createSocket("udp4");
    client.send(message, 0, message.length, this._ganglia_port, this._ganglia_host, function(err, bytes) {
        client.close();
    });
}

// Exports

exports.gmetric = gmetric;

exports.SLOPE_ZERO        = SLOPE_ZERO;
exports.SLOPE_POSITIVE    = SLOPE_POSITIVE;
exports.SLOPE_NEGATIVE    = SLOPE_NEGATIVE;
exports.SLOPE_BOTH        = SLOPE_BOTH;
exports.SLOPE_UNSPECIFIED = SLOPE_UNSPECIFIED;

exports.VALUE_UNKNOWN        = VALUE_UNKNOWN;
exports.VALUE_STRING         = VALUE_STRING;
exports.VALUE_UNSIGNED_SHORT = VALUE_UNSIGNED_SHORT;
exports.VALUE_SHORT          = VALUE_SHORT;
exports.VALUE_UNSIGNED_INT   = VALUE_UNSIGNED_INT;
exports.VALUE_INT            = VALUE_INT;
exports.VALUE_FRONT          = VALUE_FLOAT;
exports.VALUE_DOUBLE         = VALUE_DOUBLE;
