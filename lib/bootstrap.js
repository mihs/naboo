var path = require('path');
var fs = require('fs');
var async = require('async');
var debug = require('debug')('bootstrap');
var repl = require('repl');

var config = {};

module.exports = function(options, done) {

  options || (options = {});
  var configPath = options.configPath || './config';
  var initPath = options.initPath || './init';
  var configMode = (process.argv[2] == '--config');
  var replMode = (process.argv[2] == '--console');
  var configAttr = process.argv[3];

  function success() {
    if (done)
      done();
    if (replMode){
      debug('Entering repl mode');
      process.removeAllListeners("uncaughtException");
      process.on("uncaughtException", function(err){
        console.error(err);
      });
      repl.start({}).on("exit", function(){
        process.exit(0);
      });
    }
  }

  if (/^\.|\.\.|\//.test(configPath))
    configPath = path.join(path.dirname(require.main.filename), configPath);
  if (/^\.|\.\.|\//.test(initPath))
    initPath = path.join(path.dirname(require.main.filename), initPath);

  config.env = process.env.NODE_ENV || 'development';

  // load configuration file(s)
  try {
    debug("Loading configuration %s", path.join(configPath, 'all'));
    require(path.join(configPath, 'all')).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configPath, 'all'));
  }
  try {
    debug("Loading configuration %s", path.join(configPath, config.env));
    require(path.join(configPath, config.env)).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configPath, config.env));
  }

  if (configMode) {
    console.log(config[configAttr]);
    return;
  }

  var plugins = null;
  if (options.init)
    plugins = options.init;
  else {
    try {
      plugins = fs.readdirSync(initPath);
      plugins.sort();
    }
    catch (err) {
      debug("Failed to load plugins from %s", initPath);
    }
  }

  if (plugins) {
    async.forEachSeries(plugins, function(plugin, callback){
      var file = "";
      if (typeof plugin === "string") {
        file = plugin;
        debug("Initializing %s", file);
        var extPos = file.lastIndexOf('.');
        if (extPos > 0)
          file = file.substring(0, extPos);
        plugin = require(path.join(initPath, file));
      }
      plugin.call(config, callback);
    },
    function(err){
      if (err) {
        console.error(err, err.stack);
        process.exit(1);
      }
      success();
    })
  }
  else {
    success();
  }
}

module.exports.config = config;
