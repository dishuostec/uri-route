"use strict";

/**
 * Route capture
 * @constructor
 * @param {string=} pattern
 * @param {Object.<string, string>=} regex
 */
function route_capture(pattern, regex) {
  pattern = this.make(pattern, regex);
  this.regex = new RegExp(pattern);
};

/**
 * @const
 * @type {string}
 */
route_capture.prototype.name_pattern = /<([-a-z\d _]+)>/ig;

/**
 * @const
 * @type {string}
 */
route_capture.prototype.default_group_regexp = '[^/.,;?\\n]+';

/** @type {?Regexp} */
route_capture.prototype.regex = null;

/** @type {Array.<string>} */
route_capture.prototype.names = [];

/** @type {Object.<string, string>} */
route_capture.prototype.default_value = {};

route_capture.prototype.set_default = function(obj) {
  this.default_value = obj;
};

/**
 * @param {string=} pattern
 * @param {Object.<string, string>=} regex
 */
route_capture.prototype.make = function(pattern, regex) {
  var default_group_regexp = this.default_group_regexp;
  var names = [];

  regex = this.escape_group_regexp(regex || {});

  pattern = pattern
    .replace(/[.*+?^$]/g, '\\$&')              //escape special char
    .replace(/\(/g, '(?:').replace(/\)/g, ')?') //turn (...) to (?:...)?
    
    //get name of capture groups
    .replace(this.name_pattern, function(match, group_name) {
      if (names.indexOf(group_name) !== -1) {
        throw Error('Named capture group: duplicate group name');
      }

      names.push(group_name);
      return '(' + (regex.hasOwnProperty(group_name)
              ?
              regex[group_name]
              :
              default_group_regexp) + ')';
    });

  this.names = names;
  return '^' + pattern + '$';
};

/**
 * @param {Object.<string, string>=} regex
 */
route_capture.prototype.escape_group_regexp = function(regex) {
  for (var key in regex) {
    regex[key] = regex[key].replace(/\(/g, '(?:');
  }

  return regex;
};

/**
 * @param {string} string
 */
route_capture.prototype.exec = function(string) {
  var match = this.regex.exec(string);

  if ( ! match) {
    return null;
  }
  match.shift();
  
  var groups = {};
  var got = {};

  this.names.forEach(function(name, i) {
    groups[name] = null;
    
    if (typeof match[i] !== 'undefined') {
      got[name] = match[i];
    }
  });

  mixin(groups, this.default_value);
  mixin(groups, got);

  return groups;
};

function mixin(receiver, supplier) {
    if (Object.keys) {
        Object.keys(supplier).forEach(function(property) {
            Object.defineProperty(receiver, property, Object.getOwnPropertyDescriptor(supplier, property));
        });
    } else {
        for (var property in supplier) {
            if (supplier.hasOwnProperty(property)) {
                receiver[property] = supplier[property];
            }
        }
    }
}

module.exports = route_capture;
