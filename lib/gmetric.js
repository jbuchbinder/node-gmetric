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
      pos = this.pack_int(target, data.length, pos);

      var fill_length = this.string_fill_length(data);
      pos += target.write(data, pos);
      target.fill(0, pos, (pos + fill_length));
      return pos + fill_length;
    };

    /**
     * Returns the xdr fill length for a given string.
     * @param  {String} (str) The string to retrieve the fill length for
     * @return {Integer} The xdr fill length for the given string
     */

    Gmetric.prototype.string_fill_length = function(str){
      var len = str.length;
      len = ((len + 3) / 4) * 4;
      return (len - str.length);
    };

    /**
     * Creates the metadata buffer for the gmetric packet.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Object} (metric) The gmetric metric hash
     * @return {Buffer} The meta buffer
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
      return buffer.slice(0, pos);
    };

    /**
     * Creates the data buffer for the gmetric packet.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param  {Object} (metric) The gmetric metric hash
     * @return {Buffer} The data buffer
     */

    Gmetric.prototype.create_data = function(metric){
      var buffer = new Buffer(512), pos = 0;
      pos = this.pack_int(buffer, 128+5, pos);                // string message
      pos = this.pack_string(buffer, metric.hostname, pos);   // hostname
      pos = this.pack_string(buffer, metric.name, pos);       // metric name
      pos = this.pack_bool(buffer, metric.spoof, pos);        // spoof flag
      pos = this.pack_string(buffer, "%s", pos);              //
      return buffer.slice(0, pos);
    };

    /**
     * Create the final package from a metric to send to the gmond target.
     * @param  {Object} (metric) The metric packet to merge and pack
     * @return {Object} The gmetric meta and data packets
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
      return { meta: meta,  data: data };
    };

    /**
     * Unpacks a gmetric meta packet.
     * TODO: Finish up gmetric parser
     */

    Gmetric.prototype.parse_meta = function(meta_packet){
      if (meta_packet.readInt32BE(0) !== 128){
        throw new Error("Invalid meta packet");
      }
    };

    /**
     * Unpacks a gmetric data packet.
     * TODO: Finish up gmetric parser
     */

    Gmetric.prototype.parse_data = function(data_packet){
      if (data_packet.readInt32BE(0) !== 133){
        throw new Error("Invalid data packet");
      }
    };

    /**
     * Unpacks a gmetric packet.
     * TODO: Finish up unpacking
     */

    Gmetric.prototype.unpack = function(packet){
    };

    /**
     * Sends a packet buffer over UDP.
     * @param {String} (host) The target host
     * @param {Integer} (port) The target port
     * @param {Buffer} (packet) The packet buffer to send
     */

    Gmetric.prototype.send_packet = function(host, port, packet){
      socket.send(packet, 0, packet.length, port, host
        , function (err, bytes){
          if (err){
            console.log(err);
          }
        });
    };

    /**
     * Sends a metric packet over UDP.
     * @param {String} (host) The target host
     * @param {Integer} (port) The target port
     * @param {Object} (metric) The metric to send
     */

    Gmetric.prototype.send = function(host, port, metric){
      var packet = this.pack(metric);
      this.send_packet(host, port, packet.meta);
      this.send_packet(host, port, packet.data);
    };

    /**
     * Closes the udp socket.
     */

    Gmetric.prototype.close = function() {
        socket.close();
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
