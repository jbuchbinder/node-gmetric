var utils = require('../lib/utils');

describe('utils', function() {
  it("should be able to merge two object properties", function(done){
    var spoofed_metric = {
      hostname: 'awesomehost.mydomain.com',
      group: 'testgroup',
      spoof: 1,
      units: 'widgets/sec',
      slope: 'positive',

      name: 'bestmetric',
      value: 10,
      type: 'int32'
    };

    var metric = utils.merge({
      hostname: '',
      group:    '',
      spoof:    0,
      units:    '',
      slope:    'both',
      tmax:     60,
      dmax:     0
    }, spoofed_metric);

    metric.hostname.should.equal('awesomehost.mydomain.com');
    metric.group.should.equal('testgroup');
    metric.spoof.should.equal(1);
    metric.units.should.equal('widgets/sec');
    metric.slope.should.equal('positive');
    metric.tmax.should.equal(60);
    metric.dmax.should.equal(0);
    metric.name.should.equal('bestmetric');
    metric.value.should.equal(10);
    metric.type.should.equal('int32');
    done();
  });
});
