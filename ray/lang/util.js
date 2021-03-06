// Functions to help define the language AST nodes
goog.provide('Ray.Util');

goog.require('goog.array');
goog.require('goog.object');

var Util = Ray.Util;

Util.install = function(obj) {
  goog.object.forEach(Util, function(v,k) {
    if(k !== 'install') {
      obj[k] = v;
    }
  });
};

Util.construct = function(constructor, props, types) {
  function Builder() {
    return constructor.apply(this, props.concat(types));
  }
  Builder.prototype = constructor.proto;
  var b = new Builder();
  b.constructor = constructor; // So we can figure out the constructor later to clone it
  return b;
};

Util.product = function(arg_props, type_props) {
  var args = arg_props.slice();
  var types = type_props ? type_props.slice() : [];
  var __constructor__ = function(/* args */) {
    this.__args__ = args;
    for(var i = 0; i < args.length; i++) {
      this[args[i]] = arguments[i];
    }
    this.__types__ = types;
    for(var i= 0; i < types.length; i++) {
      this[types[i]] = arguments[i + args.length];
    }
  };
  __constructor__.__args__ = args;
  __constructor__.__types__ = types;
  return __constructor__;
};

Util.clone_constructor = function(R) {
  var args = this.__args__;
  var types = this.__types__;
  var self = this;
  function cloner(prop_name) {
    var prop = self[prop_name];
    if (typeof prop === 'object') {
      return Util.clone_constructor.R.clone(prop);
    } else {
      return prop;
    }
  }
  var cloned_args = goog.array.map(args, cloner);
  var cloned_types = goog.array.map(types, cloner);
  return Util.construct(this.__node_constructor__, cloned_args, cloned_types);
};
