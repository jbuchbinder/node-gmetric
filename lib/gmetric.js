
// vim: tabstop=4:softtabstop=4:shiftwidth=4:expandtab

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

function createGmetric ( ganglia_host, ganglia_port, ganglia_spoof ) {
    var gmetric = {}
    gmetric._ganglia_host  = ganglia_host;
    gmetric._ganglia_port  = ganglia_port;
    gmetric._ganglia_spoof = ganglia_spoof;
    utils.merge(gmetric, proto)
    return gmetric;
}

// Exports

exports = module.exports = createGmetric;

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
exports.VALUE_FLOAT          = VALUE_FLOAT;
exports.VALUE_DOUBLE         = VALUE_DOUBLE;
