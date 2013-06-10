goog.provide('ray.env');

goog.require('ray.util');
goog.require('ray.underscore');

/**
 * Environments, CS173 Style.
 * An environment is either:
 * an EmptyEnv, or
 * an ExtendEnv of (name * value * environment).
 *
 * These are immutable, so when I create an ExtendEnv, I must recursively copy all of the sub-environments,
 * so that both the original environment and the extended environment persist.
 */
ray.env = function() {

  var global = window;
  var _ = ray.underscore;

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
      return new ExtendEnv(name, value, this.clone());
    },
    all_bound_names: function() {
      return [];
    },
    dict: function(d) {
      return d;
    }
  };

  var ExtendEnv = function(name, value, env) {
    this.name = name;
    this.value = value;
    this.env = env.clone();
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
      return new ExtendEnv(name, value, this.clone());
    },
    all_bound_names: function() {
      return [this.name].concat(this.env.all_bound_names());
    },
    dict: function(d) {
      d[this.name] = this.value;
      return this.env.dict(d);
    }
  };

  var FastEnv = function() {
    this.env = {};
  };
  FastEnv.prototype = {
    clone: function() {
      var new_env = new FastEnv();
      _.each(this.env, function(value, name) {
        new_env.extend(name, value);
      });
      return new_env;
    },
    toString: function() {
      var str = "";
      _.each(this.env, function(value, name) {
        str += '(' + name + ': ' + value.R.display(value) + ', ';
      });
      str += 'empty-env';
      str += _.times(_.size(this.env), function(n) { return ')'; }).join('');
      return str;
    },
    lookup: function(name) {
      return this.env[name] || null;
    },
    extend: function(name, value) {
      this.env[name] = value;
      return this;
    },
    all_bound_names: function() {
      return _.keys(this.env);
    },
    dict: function(d) {
      _.each(this.env, function(value, name) {
        d[name] = value;
      });
      return d;
    }
  };

  return {
    empty_env: function() {
      return new EmptyEnv();
    },
    extend_env: function(name, value, env) {
      return this.env.extend(name, value);
    },
    empty_fast_env: function() {
      return new FastEnv();
    }
  };
};
