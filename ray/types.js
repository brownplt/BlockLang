goog.provide('Ray.Types');

goog.require('Ray._');
goog.require('goog.string');

var _ = Ray._;

Ray.Types.get_atomic_type = function(type_name) {
  return Ray.Types.atomic_types[type_name];
};

Ray.Types.atomic_types = {};
var AtomicType = function (type_name, opt_no_register) {
  function AtomicTypeConstructor() {
    this.__type__ = type_name;
  }

  AtomicTypeConstructor.prototype.get_all_base_types = function () {
    return [type_name];
  };
  AtomicTypeConstructor.prototype.clone = function() {
    return new AtomicTypeConstructor();
  };
  AtomicTypeConstructor.prototype.display = function() {
    return goog.string.toTitleCase(type_name);
  };
  AtomicTypeConstructor.prototype.key = function() {
    return type_name;
  };

  if(!opt_no_register) {
    Ray.Types.atomic_types[type_name] = AtomicTypeConstructor;
  }
  return AtomicTypeConstructor;
};

// Atomic Types
Ray.Types.Boolean = AtomicType('boolean');
Ray.Types.Num = AtomicType('num');
Ray.Types.Str = AtomicType('str');
Ray.Types.Char = AtomicType('char');
// Used to capture expressions which we don't know anything about
Ray.Types.Bottom = AtomicType('bottom', true);

Ray.Types.is_atomic_type = function(ty) {
  return !!Ray.Types.get_atomic_type(ty.__type__);
};

Ray.Types.is_bottom = function(ty) {
  return ty.__type__ === 'bottom';
};

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
ListType.prototype.display = function() {
  return '(Listof ' + this.element_type.display() + ')';
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
ListOfTypes.prototype.display = function() {
  return '(' + _.map(this.list, function(ty) { return ty.display(); }).join(' * ') + ')';
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
};
NArityType.prototype.display = function() {
  return '(' + this.base_type.display() + ' ...)';
};
Ray.Types.NArityType = NArityType;

/**
 * Argument Type
 * @param {?ListOfTypes} list_of_types, types of each of the positional args, shouldn't be null,
 * but rather empty ListOfTypes
 * @param {?NArityType} n_arity_type, type of any remaining arguments which would be collected by the rest arg
 * @constructor
 */
var ArgumentType = function(list_of_types, n_arity_type) {
  this.__type__ = 'args';
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
ArgumentType.prototype.display = function() {
  return '{' + this.p_arg_types.display() + (this.rest_arg_type ? (' ' + this.rest_arg_type.display()) : '') + '}';
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
FunctionType.prototype.display = function() {
  return '(' + this.argument_type.display() + ' -> ' + this.return_type.display() + ')';
};
Ray.Types.FunctionType = FunctionType;

Ray.Types.bool = function() {
  return new Ray.Types.Boolean();
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

Ray.Types.is_match = function(ty1, ty2) {
  if(ty2.__type__ === 'bottom' ||
     ty1.__type__ === 'bottom') {
    return true;
  }
  switch(ty1.__type__) {
    case 'boolean':
      return ty2.__type__ === 'boolean';
    case 'num':
      return ty2.__type__ === 'num';
    case 'str':
      return ty2.__type__ === 'str';
    case 'char':
      return ty2.__type__ === 'char';
    case 'list':
      return ty2.__type__ === 'list' &&
        Ray.Types.is_match(ty1.element_type, ty2.element_type);
    case 'list_of_types':
      return ty2.__type__ === 'list_of_types' &&
        _.every(_.zip(ty1.list, ty2.list), function(pair) {
          return Ray.Types.is_match(pair[0], pair[1]);
        });
    case 'n_arity':
      return ty2.__type__ === 'n_arity' &&
        Ray.Types.is_match(ty1.base_type, ty2.base_type);
    case 'args':
      if(ty2.__type__ === 'args' &&
         Ray.Types.is_match(ty1.p_arg_types, ty2.p_arg_types)) {

          return (ty1.rest_arg_type && ty2.rest_arg_type) ?
            Ray.Types.is_match(ty1.rest_arg_type, ty2.rest_arg_type) :
            (!ty1.rest_arg_type && !ty2.rest_arg_type);
      } else {
        return false;
      }
    case 'function':
      return ty2.__type__ === 'function' &&
        Ray.Types.is_match(ty1.argument_type, ty2.argument_type) &&
        Ray.Types.is_match(ty1.return_type, ty2.return_type);
    default:
      return false;
      break;
  }
};

Ray.Types.is_same = function(ty1, ty2) {  
  switch(ty1.__type__) {
    case 'bottom':
      return ty2.__type__ === 'bottom';
    case 'boolean':
      return ty2.__type__ === 'boolean';
    case 'num':
      return ty2.__type__ === 'num';
    case 'str':
      return ty2.__type__ === 'str';
    case 'char':
      return ty2.__type__ === 'char';
    case 'list':
      return ty2.__type__ === 'list' &&
             Ray.Types.is_same(ty1.element_type, ty2.element_type);
    case 'list_of_types':
      return ty2.__type__ === 'list_of_types' &&
             _.every(_.zip(ty1.list, ty2.list), function(pair) {
               return Ray.Types.is_same(pair[0], pair[1]);
             });
    case 'n_arity':
      return ty2.__type__ === 'n_arity' &&
             Ray.Types.is_same(ty1.base_type, ty2.base_type);
    case 'args':
      if(ty2.__type__ === 'args' &&
         Ray.Types.is_same(ty1.p_arg_types, ty2.p_arg_types)) {

        return (ty1.rest_arg_type && ty2.rest_arg_type) ?
               Ray.Types.is_same(ty1.rest_arg_type, ty2.rest_arg_type) :
               (!ty1.rest_arg_type && !ty2.rest_arg_type);
      } else {
        return false;
      }
    case 'function':
      return ty2.__type__ === 'function' &&
             Ray.Types.is_same(ty1.argument_type, ty2.argument_type) &&
             Ray.Types.is_same(ty1.return_type, ty2.return_type);
    default:
      return false;
      break;
  }
};



/**
 * Picks the more specific type of the pair.
 * This will only work correctly if ty1 and ty2 match!!!
 * @param ty1
 * @param ty2
 * @returns {*}
 */
Ray.Types.principal_type_ = function(ty1, ty2) {
  if(ty1.__type__ === 'bottom') {
    return ty2;
  } else if(ty2.__type__ === 'bottom') {
    return ty1;
  } else {
    switch(ty1.__type__) {
      case 'boolean':
      case 'num':
      case 'str':
      case 'char':
        return ty1;

      case 'list':
        return new Ray.Types.ListType(Ray.Types.principal_type_(ty1.element_type, ty2.element_type));

      case 'list_of_types':
        return new Ray.Types.ListOfTypes(_.map(_.zip(ty1.list, ty2.list), function(pair) {
          return Ray.Types.principal_type_(pair[0], pair[1]);
        }));

      case 'n_arity':
        return new Ray.Types.NArityType(Ray.Types.principal_type_(ty1.base_type, ty2.base_type));

      case 'args':
        var p_arg_types = _.map(_.zip(ty1.p_arg_types, ty2.p_arg_types), function(pair) {
          return Ray.Types.principal_type_(pair[0], pair[1]);
        });
        var rest_arg_type = ty1.rest_arg_type ?
                            Ray.Types.principal_type_(ty1.rest_arg_type, ty2.rest_arg_type) :
                            null;
        return new Ray.Types.ArgumentType(p_arg_types, rest_arg_type);

      case 'function':
        return new Ray.Types.FunctionType(Ray.Types.principal_type_(ty1.argument_type, ty2.argument_type),
                                          Ray.Types.principal_type_(ty1.return_type, ty2.return_type));

      default:
        throw 'Unknown type for ty1!';
    }
  }
};

Ray.Types.principal_type = function(types) {
  return _.reduce(types, function(curr, ty) {
    return Ray.Types.principal_type_(curr, ty);
  });
};