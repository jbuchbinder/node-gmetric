(function() {
  /**
   * Module dependencies.
   */

  var dgram  = require('dgram'),
      socket = require('dgram').createSocket('udp4'),
      Gmetric;

  /**
   *  The Gmetric class.
   */

  Gmetric = (function(){
    function Gmetric(ganglia_host, ganglia_port, ganglia_spoof){
      this._ganglia_host  = ganglia_host;
      this._ganglia_port  = ganglia_port;
      this._ganglia_spoof = ganglia_spoof;
    }

    /**
     * Packs an integer as a big endian unsigned long.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param {Buffer} (target) The target Buffer to pack onto
     * @param {Integer} (i) The integer to pack
     * @param {Integer} (pos) The position to begin the pack
     */

    Gmetric.prototype.pack_int = function(target, i, pos){
      if (i === undefined || i === null){
        i = 0;
      }
      target.writeInt32BE(i, pos);
      return pos + 4;
    };

    /**
     * Packs a boolean as a big endian unsigned long.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param {Buffer} (target) The target Buffer to pack onto
     * @param {Integer} (b) The boolean to pack
     * @param {Integer} (pos) The position to begin the pack
     */

    Gmetric.prototype.pack_bool = function(target, b, pos){
      return this.pack_int(target, (b ? 1 : 0), pos);
    };

    /**
     * Packs a string matching the xdr format.
     * refs: http://code.google.com/p/embeddedgmetric/wiki/GmetricProtocol
     * refs: http://www.ietf.org/rfc/rfc4506.txt
     * @param {Buffer} (target) The target Buffer to pack onto
     * @param {String} (data) The string to pack
     * @param {Integer} (pos) The position to begin the pack
     */

    Gmetric.prototype.pack_string = function(target, data, pos){
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
    };

    /**
     * Create the final package from a metric to send to the gmond target.
     * @param {Object} (metric)
     */

    Gmetric.prototype.pack = function(metric){
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

}).call(this);
