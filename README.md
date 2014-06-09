# naboo

Node Application BOOtstrap

## Overview

Naboo is a VERY light tool that starts up your Nodejs application. It bootstraps your application by loading:
* configuration files specific to the environment specified by `NODE_ENV`
* plugins (i.e. just functions, in simpler terms)
All the files are loaded sequentially so that you can load your plugins in a specific order.

A configuration object is exported by the library for your convenience. This same object is passed as the context for all the configuration files and plugins. Any field that you set while configuring and loading plugins is available in this object.

## Usage

```
var naboo = require('naboo');
naboo(options, function(){
  // when this runs the app is started, all plugins loaded
  // the process just exits in case of an error
});

```

### Options

* `configPath` The path where the environment specific configuration files are stored.
* `initPath` The path where the plugins are stored. Files in this directory are first sorted by name and then loaded one at a time, in order.
* `init` If you want to customize the plugin order, pass an array with either strings or functions. If an element is a string, a file with the name specified by the element is loaded from `initPath` and executed as a plugin. If an element is a function, that function is executed as a plugin.

### Process parameters

* `--config <field>` After all the configuration files are loaded (before loading the plugins), the loader outputs the field `<field>` of the configuration object (`require('naboo').config[<field>]`) and then exits. Useful when dynamically building assets whose contents depend on the environment configuration.
* `--console` After all the configuration files, the plugins and the final function are called, the loader enters repl mode.

## Plugins

A plugin is a simple Javascript function with the context set to the config object and one parameter, a node-style callback function (the first parameter is the error, the second is the result). When the plugin finishes the processing it should call the callback function.

```
Example dbloader.js

module.exports = function(done) {
  self = this;
  db.connect(function(err, dbobject){
    if (err)
      return done(err);
    self.db = dbobject;
    done()
  });
}
```

If a plugin calls the callback function with an error, the loader stops all further processing, logs the error to STDERR and exists with code `1`.

## Configuration object

The configuration files, as well as the plugins must export one function (i.e. their module.exports points to a function).
The loader call that function with the context set to the configuration object (a plain js object). You can set any field on the configuration object. The configuration object can be accessed at any time in the application  by importing it from `naboo`.

```
var config = require('naboo').config;
```
