const path = require('path');
const fs = require('fs');
const async = require('async');
const debug = require('debug')('bootstrap');
const repl = require('repl');

const config = {};

module.exports = function(options, done) {

  options || (options = {});
  let configPath = options.configPath || './config';
  let initPath = options.initPath || './init';
  const strict = options.strict || false;
  const autoExit = options.autoExit || true;
  const configMode = (process.argv[2] == '--config');
  const replMode = (process.argv[2] == '--console');
  const configAttr = process.argv[3];

  function success() {
    if (replMode) {
      debug('Entering repl mode');
      process.removeAllListeners("uncaughtException");
      process.on("uncaughtException", function(err){
        console.error(err);
      });
      repl.start({}).on("exit", function(){
        process.exit(0);
      });
      return;
    }
    if (done) {
      done();
    }
  }

  function error(err) {
    debug("%s %s", err.message, err.stack)
    if (autoExit) {
      console.error(err)
      return process.exit(1);
    }
    if (done) {
      done(err);
    }
  }

  if (/^\.|\.\.|\//.test(configPath)) {
    configPath = path.join(path.dirname(require.main.filename), configPath);
  }
  if (/^\.|\.\.|\//.test(initPath)) {
    initPath = path.join(path.dirname(require.main.filename), initPath);
  }

  config.env = process.env.NODE_ENV || 'development';

  // load configuration file(s)
  try {
    debug("Loading configuration %s", path.join(configPath, 'all'));
    require(path.join(configPath, 'all')).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configPath, 'all'));
    if (strict) {
      return error(ex)
    }
  }
  try {
    debug("Loading configuration %s", path.join(configPath, config.env));
    require(path.join(configPath, config.env)).call(config);
  }
  catch (ex) {
    debug("Failed to load %s", path.join(configPath, config.env));
    if (strict) {
      return error(ex)
    }
  }

  if (configMode) {
    console.log(config[configAttr]);
    return;
  }

  let plugins = null;
  if (options.init) {
    plugins = options.init;
  }
  else {
    try {
      plugins = fs.readdirSync(initPath);
      plugins.sort();
    }
    catch (err) {
      debug("Failed to load plugins from %s", initPath);
      if (strict) {
        return error(err)
      }
    }
  }

  if (!plugins || plugins.length == 0) {
    return success()
  }
  async.forEachSeries(plugins, (plugin, callback)=> {
    let file = "";
    if (typeof plugin === "string") {
      file = plugin;
      debug("Initializing %s", file);
      const extPos = file.lastIndexOf('.');
      if (extPos > 0)
        file = file.substring(0, extPos);
      try {
        plugin = require(path.join(initPath, file));
      }
      catch (err) {
        debug("Failed to initialize plugins %j", err);
        if (strict) {
          return error(err)
        }
        else {
          debug("Failed to initialize plugins %j", err);
        }
        callback(null)
      }
    }
    plugin.call(config, callback);
  }, (err)=> {
    if (err) {
      debug("Failed to initialize plugins %j", err);
      if (strict) {
        return error(err)
      }
      return;
    }
    success();
  })
}

module.exports.config = config;
