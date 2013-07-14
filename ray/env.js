goog.provide('Ray.Env');

goog.require('Ray.Util');

goog.require('goog.array');
goog.require('goog.object');

/**
 * Environments, CS173 Style.
 * An environment is either:
 * an EmptyEnv, or
 * an ExtendEnv of (name * value * environment).
 *
 * These are immutable, so when I create an ExtendEnv, I must recursively copy all of the sub-environments,
 * so that both the original environment and the extended environment persist.
 */

/**
 * An empty environment
 * @constructor
 */
var EmptyEnv = function() {
};
EmptyEnv.prototype = {
  clone: function() {
    return new EmptyEnv();
  },
  toString: function() {
    return "empty-env";
  },
  lookup: function(name) {
    return null;
  },
  extend: function(name, value) {
    return new ExtendEnv(name, value, this);
  },
  allBoundNames: function() {
    return [];
  },
  dict: function(d) {
    return d;
  }
};

Ray.Env.EmptyEnv = EmptyEnv;

/**
 * An old environment extended with a binding of name to value
 * @param name
 * @param value
 * @param env
 * @constructor
 */
var ExtendEnv = function(name, value, env) {
  this.name = name;
  this.value = value;
  this.env = env;
};
ExtendEnv.prototype = {
  clone: function() {
    return new ExtendEnv(this.name, this.value, this.env.clone());
  },
  toString: function() {
    return '(' + this.name + ': ' + (this.value.R.display(this.value)) + ', ' + this.env.toString() + ')';
  },
  lookup: function(name) {
    return this.name === name ? this.value : this.env.lookup(name);
  },
  extend: function(name, value) {
    return new ExtendEnv(name, value, this);
  },
  allBoundNames: function() {
    return [this.name].concat(this.env.allBoundNames());
  },
  dict: function(d) {
    d[this.name] = this.value;
    return this.env.dict(d);
  }
};

Ray.Env.ExtendEnv = ExtendEnv;

/**
 * A faster environment that is mutable, so should only be used if we can guarantee
 * that it is being accessed by a single caller
 * @constructor
 */
var FastEnv = function() {
  this.env = {};
};
FastEnv.prototype = {
  clone: function() {
    var newEnv = new FastEnv();
    goog.object.forEach(this.env, function(value, name) {
      newEnv.extend(name, value);
    });
    return newEnv;
  },
  toString: function() {
    var str = "";
    goog.object.forEach(this.env, function(value, name) {
      str += '(' + name + ': ' + value.R.display(value) + ', ';
    });
    str += 'empty-env';
    var envKeys = goog.object.getKeys(this.env);
    for(var i = 0; i < envKeys.length; i++) {
      str +=  ')';
    }
    return str;
  },
  lookup: function(name) {
    return this.env[name] || null;
  },
  extend: function(name, value) {
    this.env[name] = value;
    return this;
  },
  allBoundNames: function() {
    return goog.object.getKeys(this.env);
  },
  dict: function(d) {
    goog.oject.forEach(this.env, function(value, name) {
      d[name] = value;
    });
    return d;
  }
};

// Convenience function to create an empty environment
Ray.Env.emptyEnv = function() {
  return new EmptyEnv();
};

// Convenience function to extend an environment
Ray.Env.extendEnv = function(name, value, env) {
  return this.env.extend(name, value);
};

// Convenience method to create an empty fast environment
Ray.Env.emptyFastEnv = function() {
  return new FastEnv();
};

