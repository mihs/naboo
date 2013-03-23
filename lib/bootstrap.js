var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var async = require('async');
var debug = require('debug')('bootstrap')

module.exports = function(options) {

  var configs = options.configPath || path.join(path.dirname(require.main.filename), 'config');
  var initPath = options.initPath || path.join(path.dirname(require.main.filename), 'init');
  var start_express = options.start_express;
  var configMode = (process.argv[2] == '--config');
  var configAttr = process.argv[3];

  var app = options.createApp();
  env = process.env.NODE_ENV || 'development';

  // load configuration file(s)
  try {
    require(path.join(configs, 'all'))(app);
  }
  catch (ex) {}
  try {
    require(path.join(configs, env))(app);
  }
  catch (ex) {}

  // this is here to get options of express app
  function appOption(app, key, value) {
    if (typeof(value) == 'undefined')
      if (typeof (app.get) == 'function')
        return app.get(key);
      else
        return app.key;
    else
      if (typeof (app.set) == 'function')
        app.set(key, value);
      else
        app.key = value;
  }

  if (configMode) {
    console.log(appOption(app, configAttr));
    return;
  }

  function startServer() {
    var port = process.env.PORT || appOption(app, 'port') || 80;
    var secure = options.secure;
    if (secure) {
      var secure_port = process.env.SECURE_PORT || appOption(app, 'secure_port') || secure.port || 443;
      debug("Starting secure server on port %s", secure_port)
      https.createServer(secure, app).listen(secure_port);
    }
    debug("Starting server on port %s", port)
    http.createServer(app).listen(port);
  }

  var plugins = null
  if (options.init)
    plugins = init;
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
      plugin(app, callback);
    },
    function(err){
      if (err) {
        console.error(err, err.stack);
        process.exit(1);
      }
      if (start_express)
        startServer();
    })
  }
  else
    if (start_express)
      startServer();
}
