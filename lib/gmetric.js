(function() {
  /**
   * Module dependencies.
   */

  var dgram  = require('dgram'),
      socket = require('dgram').createSocket('udp4'),
      utils  = require('./utils');

  /**
   *  The Gmetric class.
   */

  var Gmetric = (function(){
    function Gmetric(){}

    /**
     * Packs an integer as a big endian unsigned long.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Buffer}  (target) The target Buffer to pack onto
     * @param  {Integer} (i) The integer to pack
     * @param  {Integer} (pos) The position to begin the pack
     * @return {Integer} The current position in the buffer
     */

    Gmetric.prototype.pack_int = function(target, i, pos){
      if (i === undefined || i === null){
        i = 0;
      }
      i = parseInt(i);
      target.writeInt32BE(i, pos);
      return pos + 4;
    };

    /**
     * Packs a boolean as a big endian unsigned long.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Buffer}  (target) The target Buffer to pack onto
     * @param  {Integer} (b) The boolean to pack
     * @param  {Integer} (pos) The position to begin the pack
     * @return {Integer} The current position in the buffer
     */

    Gmetric.prototype.pack_bool = function(target, b, pos){
      return this.pack_int(target, (b ? 1 : 0), pos);
    };

    /**
     * Packs a string matching the xdr format.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Buffer}  (target) The target Buffer to pack onto
     * @param  {String}  (data) The string to pack
     * @param  {Integer} (pos) The position to begin the pack
     * @return {Integer} The current position in the buffer
     */

    Gmetric.prototype.pack_string = function(target, data, pos){
      if (data === null || data === undefined){
        data = "";
      }
      data = data.toString();
      var len = data.length;
      pos = this.pack_int(target, len, pos);

      len = ((len + 3) / 4) * 4;
      var fill_length = (len - data.length);
      pos += target.write(data, pos);
      target.fill(0, pos, (pos + fill_length));
      return pos + fill_length;
    };

    /**
     * Creates the metadata buffer for the gmetric packet.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Object} (metric) The gmetric metric hash
     * @return {Object} The metadata buffer and it's length
     */

    Gmetric.prototype.create_meta = function(metric){
      var buffer = new Buffer(1024), pos = 0;
      pos = this.pack_int(buffer, 128, pos);                // gmetadata_full
      pos = this.pack_string(buffer, metric.hostname, pos); // hostname
      pos = this.pack_string(buffer, metric.name, pos);     // metric name
      pos = this.pack_bool(buffer, metric.spoof, pos);      // spoof flag

      pos = this.pack_string(buffer, metric.type, pos);     // metric type
      pos = this.pack_string(buffer, metric.name, pos);     // metric name
      pos = this.pack_string(buffer, metric.units, pos);    // metric units
      pos = this.pack_int(buffer,
        module.exports.slope[metric.slope], pos);           // slope derivative
      pos = this.pack_int(buffer, metric.tmax, pos);        // max between
      pos = this.pack_int(buffer, metric.dmax, pos);        // lifetime

      // Magic Number: The number of extra data elements
      pos = this.pack_int(buffer, 1, pos);

      // Metadata Extra Data: key/value functionality
      pos = this.pack_string(buffer, "GROUP", pos);
      pos = this.pack_string(buffer, metric.group, pos);
      return { buffer: buffer.slice(0, pos), length: pos+1 };
    };

    /**
     * Creates the data buffer for the gmetric packet.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Object} (metric) The gmetric metric hash
     * @return {Object} The data buffer and it's length
     */

    Gmetric.prototype.create_data = function(metric){
      var buffer = new Buffer(512), pos = 0;
      pos = this.pack_int(buffer, 128+5, pos);                // string message
      pos = this.pack_string(buffer, metric.hostname, pos);   // hostname
      pos = this.pack_string(buffer, metric.name, pos);       // metric name
      pos = this.pack_bool(buffer, metric.spoof, pos);        // spoof flag
      pos = this.pack_string(buffer, "%s", pos);              //
      return { buffer: buffer.slice(0, pos), length: pos+1 };
    };

    /**
     * Create the final package from a metric to send to the gmond target.
     * @param  {Object} (metric) The metric packet to merge and pack
     * @return {Buffer} The packaged gmetric packet buffer
     */

    Gmetric.prototype.pack = function(metric){
      metric = utils.merge({
        hostname: '',
        group:    '',
        spoof:    0,
        units:    '',
        slope:    'both',
        tmax:     60,
        dmax:     0
      }, metric);

      // Convert bools to ints
      if (metric['spoof'] === true){
        metric['spoof'] = 1;
      } else if(metric['spoof'] === false){
        metric['spoof'] = 0;
      }

      if ("name"  in metric !== true ||
          "value" in metric !== true ||
          "type"  in metric !== true){
        throw new Error("Missing name, value, type");
      }

      if (metric['type'] in module.exports.supported_types !== true){
        throw new Error("Invalid metric type");
      }

      var meta = this.create_meta(metric);
      var data = this.create_data(metric);
      return Buffer.concat([meta.buffer,data.buffer], meta.length+data.length);
    };

    return Gmetric;

  })();

  /**
   * Expose `createGmetric()`.
   */

  module.exports = Gmetric;

  /**
   * Expose slope.
   */

  module.exports.slope = {
    zero: 0,
    positive: 1,
    negative: 2,
    both: 3,
    unspecified: 4
  }

  /**
   * Expose supported_types.
   */

  module.exports.supported_types = {
    string: true,
    int8: true,
    uint8: true,
    int16: true,
    uint16: true,
    int32: true,
    uint32: true,
    float: true,
    double: true
  }

}).call(this);
