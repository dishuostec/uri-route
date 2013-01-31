"use strict";

var route_capture = require('./route-capture');

/**
 * @constructor
 * @param {string} pattern
 * @param {Object.<string, string>} regex
 * @param {function(Object.<string, string>, Object)} callback
 */
function Simple_Route(pattern, regex, callback) {
  this.capture = new route_capture(pattern, regex);
  this.callback = callback;
};

/**
 * @param {Object.<string, string>} default_value
 */
Simple_Route.prototype.set_default = function(default_value) {
  this.capture.set_default(default_value);
  return this;
};

/**
 * @param {string} uri
 */
Simple_Route.prototype.uri = function(uri) {
  var group = this.capture.exec(uri);
  if (group === null) {
    return false;
  }

  this.callback(group, uri);
  return true;
};

/**
 * @constructor
 * @param {function(Object.<string, string>, Object)} callback
 */
function Route(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('uri-route: wrong params');
  }

  this.callback = callback;
  this._routes = [];
  this._capture = [];
};

Route.prototype.current_capture = null;

/**
 * @param {string} route_name
 * @param {string} pattern
 * @param {Object.<string, string>=} regex
 */
Route.prototype.add = function(route_name, pattern, regex) {
  if ( ! pattern) {
    throw new TypeError('uri-route: wrong params');
  }

  if (this._routes.indexOf(route_name) !== -1) {
    throw new Error('uri-route: route name existed');
  }
  var capture = new route_capture(pattern, regex);

  this._routes.push(route_name);
  this._capture.push(capture);

  this.current_capture = capture;

  return this;
};

Route.prototype.set_default = function(default_value) {
  if (this.current_capture) {
    this.current_capture.set_default(default_value);
  }
  return this;
};

/**
 * @param {string} uri
 */
Route.prototype.uri = function(uri) {
  var group = null;
  var route_found = this._capture.some(function(capture) {
    group = capture.exec(uri);
    if (group !== null) {
      return true;  //break 'some';
    }
  }, this);

  if (route_found) {
    this.callback(group, uri);
    return true;
  }
  
  return false;
};

/**
 * @param {string=} pattern
 * @param {Object.<string, string>=} regex
 * @param {function(Object.<string, string>, Object)} callback
 */
var route_factory = function(pattern, regex, callback) {
  switch (arguments.length) {
    case 1:
      return new Route(pattern); //'pattern' is callback
      break;
    case 2:
      callback = regex; //'regex' is callback
      regex = null;
    default:
      return new Simple_Route(pattern, regex, callback);
  }
};

module.exports = route_factory;
