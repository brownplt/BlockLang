goog.provide('Ray.Types');

goog.require('Ray._');

var _ = Ray._;

Ray.Types.atomic_types = [];
var AtomicType = function (type_name) {
  Ray.Types.atomic_types.push(type_name);
  function AtomicTypeConstructor() {
    this.__type__ = type_name;
  }

  AtomicTypeConstructor.prototype.get_all_base_types = function () {
    return [type_name];
  };
  AtomicTypeConstructor.prototype.clone = function() {
    return new AtomicTypeConstructor();
  };

  return AtomicTypeConstructor;
};

// Atomic Types
Ray.Types.Bool = AtomicType('boolean');
Ray.Types.Num = AtomicType('num');
Ray.Types.Str = AtomicType('str');
Ray.Types.Char = AtomicType('char');
// Used to capture expressions which we don't know anything about
Ray.Types.Bottom = AtomicType('bottom');

// Compound Types
/**
 * ListType, the type of list with elem_type elements
 * @param elem_type, the type of the elements of the list
 * @constructor
 */
var ListType = function(elem_type) {
  this.__type__ = 'list';
  this.element_type = elem_type;
};
ListType.prototype.get_all_base_types = function() {
  return this.element_type.get_all_base_types();
};
ListType.prototype.clone = function() {
  return new ListType(this.element_type.clone());
};
Ray.Types.List = ListType;

/**
 * ListOfTypes, A heterogeneous, fixed-length tuple, used for positional arguments
 * @param ls
 * @constructor
 */
var ListOfTypes = function(ls) {
  this.__type__ = 'list_of_types';
  this.list = ls;
};
ListOfTypes.prototype.get_all_base_types = function() {
  var all_base_types = _.reduce(this.list, function(curr_base_types, ty) {
    return curr_base_types.concat(ty.get_all_base_types());
  }, []);
  return _.uniq(all_base_types);
};
ListOfTypes.prototype.clone = function() {
  return new ListOfTypes(_.map(this.list, function(ty) { return ty.clone(); }));
};
Ray.Types.ListOfTypes = ListOfTypes;

/**
 * NArityType, used for rest_args
 * @param base_type
 * @constructor
 */
var NArityType = function(base_type) {
  this.__type__ = 'n_arity';
  this.base_type = base_type;
};
NArityType.prototype.get_all_base_types = function() {
  return this.base_type.get_all_base_types();
};
NArityType.prototype.clone = function() {
  return new NArityType(this.base_type.clone());
}
Ray.Types.NArityType = NArityType;

/**
 * Argument Type
 * @param {?ListOfTypes} list_of_types, types of each of the positional args, shouldn't be null,
 * but rather empty ListOfTypes
 * @param {?NArityType} n_arity_type, type of any remaining arguments which would be collected by the rest arg
 * @constructor
 */
var ArgumentType = function(list_of_types, n_arity_type) {
  this.__type__ = 'input';
  this.p_arg_types = list_of_types || new ListOfTypes([]);
  this.rest_arg_type = n_arity_type || null;
};
ArgumentType.prototype.get_all_base_types = function() {
  var all_base_types = [];
  if(this.p_arg_types) {
    all_base_types = all_base_types.concat(this.p_arg_types.get_all_base_types());
  }

  if(this.rest_arg_type) {
    all_base_types = all_base_types.concat(this.rest_arg_type.get_all_base_types());
  }

  return _.uniq(all_base_types);
};
ArgumentType.prototype.clone = function() {
  return new ArgumentType(this.p_arg_types.clone(), this.rest_arg_type.clone());
};
Ray.Types.ArgumentType = ArgumentType;

/**
 * Function type
 * @param argument_type, the type of the arguments to the function
 * @param return_type, the type of the value returned by the function
 * @constructor
 */
var FunctionType = function(argument_type, return_type) {
  this.__type__ = 'function';
  this.argument_type = argument_type;
  this.return_type = return_type;
};
FunctionType.prototype.get_all_base_types = function() {
  var all_base_types = this.argument_type.get_all_base_types();
  return _.uniq(all_base_types.concat(this.return_type.get_all_base_types()));
};
FunctionType.prototype.clone = function() {
  return new FunctionType(this.argument_type.clone(), this.return_type.clone());
};
Ray.Types.FunctionType = FunctionType;

Ray.Types.bool = function() {
  return new Ray.Types.Bool();
};
Ray.Types.num = function() {
  return new Ray.Types.Num();
};
Ray.Types.str = function() {
  return new Ray.Types.Str();
};
Ray.Types.char = function() {
  return new Ray.Types.Char();
};
Ray.Types.bottom = function() {
  return new Ray.Types.Bottom();
};
Ray.Types.list = function(ty) {
  return new Ray.Types.List(ty);
};

Ray.Types.ty_list = function(args) {
  // var args = Array.prototype.slice.call(arguments, 0);
  return new Ray.Types.ListOfTypes(args);
};
Ray.Types.ty_n_arity = function(ty) {
  return new Ray.Types.NArityType(ty);
};
Ray.Types.p_args = function(/* args */) {
  return new Ray.Types.ArgumentType(new Ray.Types.ListOfTypes(Array.prototype.slice.call(arguments, 0)));
};
Ray.Types.rest_arg = function(ty) {
  return new Ray.Types.ArgumentType(new Ray.Types.ListOfTypes([]), new Ray.Types.NArityType(ty));
};
Ray.Types.args = function(ls, n_arity) {
  return new Ray.Types.ArgumentType(ls, n_arity);
};
Ray.Types.fn = function(args, body) {
  return new Ray.Types.FunctionType(args, body);
};
