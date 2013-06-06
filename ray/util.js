// Functions to help define the language AST nodes
define([], function() {
  function construct(constructor, args) {
    function Builder() {
      return constructor.apply(this, args);
    }
    Builder.prototype = constructor.prototype;
    var b = new Builder();
    b.constructor = constructor; // So we can figure out the constructor later to clone it
  };

  function product(/* args */) {
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

  function clone_constructor() {
    var props = this.__props__;
    function cloner(prop) {
      return typeof prop === 'object' ? this.R.clone(prop) : prop;
    };
    var cloned_props = _.map(props, cloner);
    return construct(this.constructor, cloned_props);
  }

  return this;
});