var path = require('path');
var fs = require('fs');
var async = require('async');
var debug = require('debug')('bootstrap')

var config = {};
module.exports.config = config;

module.exports = function(options, done) {

  var configs = options.configPath || path.join(path.dirname(require.main.filename), 'config');
  var initPath = options.initPath || path.join(path.dirname(require.main.filename), 'init');
  var configMode = (process.argv[2] == '--config');
  var configAttr = process.argv[3];

  env = process.env.NODE_ENV || 'development';

  // load configuration file(s)
  try {
    debug("Loading configuration %s", path.join(configs, 'all'))
    require(path.join(configs, 'all')).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configs, 'all'))
  }
  try {
    debug("Loading configuration %s", path.join(configs, env))
    require(path.join(configs, env)).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configs, env))
  }

  if (configMode) {
    console.log(config[configAttr]);
    return;
  }

  var plugins = null
  if (options.init)
    plugins = options.init;
  else {
    try {
      plugins = fs.readdirSync(initPath);
      plugins.sort();
    }
    catch (err) {}
  }

  if (plugins) {
    async.forEachSeries(plugins, function(file, callback){
      debug("Initializing %s", file)
      extPos = file.lastIndexOf('.')
      if (extPos > 0)
        file = file.substring(0, extPos)
      plugin = require(path.join(initPath, file));
      plugin.call(config, callback);
    },
    function(err){
      if (err) {
        console.error(err, err.stack);
        process.exit(1);
      }
      if (done != null) {
        done();
      }
    })
  }
  else {
    if (done != null) {
      done();
    }
  }
}
