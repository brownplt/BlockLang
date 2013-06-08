// Functions to help define the language AST nodes
goog.provide('ray.util');

goog.require('ray.underscore');

ray.util = function() {

  var _ = ray.underscore;

  var util = {};

  util.construct = function(constructor, args) {
    function Builder() {
      return constructor.apply(this, args);
    }
    Builder.prototype = constructor.proto;
    var b = new Builder();
    b.constructor = constructor; // So we can figure out the constructor later to clone it
    return b;
  };

  util.product = function(/* args */) {
    var props = Array.prototype.slice.call(arguments, 0);
    var __constructor__ = function(/* args */) {
      this.__props__ = props;
      for(var i = 0; i < props.length; i++) {
        this[props[i]] = arguments[i];
      }
    };
    __constructor__.__props__ = props;
    return __constructor__;
  };

  util.clone_constructor = function() {
    var props = this.__props__;
    var self = this;
    function cloner(prop_name) {
      var prop = self[prop_name];
      if (typeof prop === 'object') {
          return self.R.clone(prop);
      } else {
          return prop;
      }
    };
    var cloned_props = _.map(props, cloner);
    return construct(this.__node_constructor__, cloned_props);
  };

  return util;

};