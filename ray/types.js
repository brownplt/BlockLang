goog.provide('Ray.Types');

goog.require('goog.array');
goog.require('goog.string');

var uniques = function(ls) {
  var set = [];
  goog.array.forEach(ls, function(elem) {
    if(!goog.array.contains(set, elem)) {
      set.push(elem);
    }
  });
  return set;
};

Ray.Types.getAtomicType = function(type_name) {
  return Ray.Types.atomicTypes_[type_name];
};

Ray.Types.atomicTypes_ = {};
var AtomicType = function (type_name, opt_noRegister) {
  function AtomicTypeConstructor() {
    this.outputType_ = type_name;
  }

  AtomicTypeConstructor.prototype.getAllBaseTypes = function () {
    return [type_name];
  };
  AtomicTypeConstructor.prototype.clone = function() {
    return new AtomicTypeConstructor();
  };
  AtomicTypeConstructor.prototype.display = function() {
    return goog.string.toTitleCase(type_name);
  };
  AtomicTypeConstructor.key = function() {
    return type_name;
  };
  AtomicTypeConstructor.prototype.key = AtomicTypeConstructor.key;

  if(!opt_noRegister) {
    Ray.Types.atomicTypes_[type_name] = AtomicTypeConstructor;
  }
  return AtomicTypeConstructor;
};

// Atomic Types
Ray.Types.Boolean = AtomicType('boolean');
Ray.Types.Num = AtomicType('num');
Ray.Types.Str = AtomicType('str');
Ray.Types.Char = AtomicType('char');
// Used to capture expressions which we don't know anything about
Ray.Types.Unknown = AtomicType('unknown', true);
// We don't want to register it as an ordinary type,
// so that we don't generate a color for it.

Ray.Types.getBaseTypes = function() {
  var atomic_types = goog.object.getValues(Ray.Types.atomicTypes_);
  atomic_types.push(Ray.Types.Unknown);
  return atomic_types;
};


Ray.Types.isAtomicType = function(type) {
  return !!Ray.Types.getAtomicType(type.outputType_);
};

Ray.Types.isUnknown = function(ty) {
  return ty.outputType_ === 'unknown';
};

// Compound Types
/**
 * ListType, the type of list with elementType elements
 * @param elementType, the type of the elements of the list
 * @constructor
 */
var ListType = function(elementType) {
  this.outputType_ = 'list';
  this.elementType = elementType;
};
ListType.prototype.getAllBaseTypes = function() {
  return this.elementType.getAllBaseTypes();
};
ListType.prototype.clone = function() {
  return new ListType(this.elementType.clone());
};
ListType.prototype.display = function() {
  return '(Listof ' + this.elementType.display() + ')';
};
Ray.Types.List = ListType;

/**
 * ListOfTypes, A heterogeneous, fixed-length tuple, used for positional arguments
 * @param ls
 * @constructor
 */
var ListOfTypes = function(ls) {
  this.outputType_ = 'list_of_types';
  this.list = ls;
};
ListOfTypes.prototype.getAllBaseTypes = function() {
  var all_base_types = goog.array.reduce(this.list, function(curr_base_types, ty) {
    return curr_base_types.concat(ty.getAllBaseTypes());
  }, []);
  return uniques(all_base_types);
};
ListOfTypes.prototype.clone = function() {
  return new ListOfTypes(goog.array.map(this.list, function(ty) { return ty.clone(); }));
};
ListOfTypes.prototype.display = function() {
  return '(' + goog.array.map(this.list, function(ty) { return ty.display(); }).join(' * ') + ')';
};
Ray.Types.ListOfTypes = ListOfTypes;

/**
 * NArityType, used for rest_args
 * @param elementType
 * @constructor
 */
var NArityType = function(elementType) {
  this.outputType_ = 'n_arity';
  this.elementType = elementType;
};
NArityType.prototype.getAllBaseTypes = function() {
  return this.elementType.getAllBaseTypes();
};
NArityType.prototype.clone = function() {
  return new NArityType(this.elementType.clone());
};
NArityType.prototype.display = function() {
  return '(' + this.elementType.display() + ' ...)';
};
Ray.Types.NArityType = NArityType;

/**
 * Arguments Type
 * @param {?ListOfTypes} listOfTypes, types of each of the positional args, shouldn't be null,
 * but rather empty ListOfTypes
 * @param {?NArityType} nArityType, type of any remaining arguments which would be collected by the rest arg
 * @constructor
 */
var ArgumentsType = function(listOfTypes, nArityType) {
  this.outputType_ = 'args';
  this.positionalArgTypes = listOfTypes || new ListOfTypes([]);
  this.restArgType = nArityType || null;
};
ArgumentsType.prototype.getAllBaseTypes = function() {
  var allBaseTypes = [];
  if(this.positionalArgTypes) {
    allBaseTypes = allBaseTypes.concat(this.positionalArgTypes.getAllBaseTypes());
  }

  if(this.restArgType) {
    allBaseTypes = allBaseTypes.concat(this.restArgType.getAllBaseTypes());
  }

  return uniques(allBaseTypes);
};
ArgumentsType.prototype.clone = function() {
  return new ArgumentsType(this.positionalArgTypes.clone(), this.restArgType.clone());
};
ArgumentsType.prototype.display = function() {
  return '{' + this.positionalArgTypes.display() + (this.restArgType ? (' ' + this.restArgType.display()) : '') + '}';
};
Ray.Types.ArgumentsType = ArgumentsType;

Ray.Types.getAllArgumentTypes = function(argsType) {
  var types = [];
  if(argsType.positionalArgTypes) {
    types = types.concat(argsType.positionalArgTypes.list);
  }
  if(argsType.restArgType) {
    types.push(argsType.restArgType.elementType)
  }
  return types;
};


/**
 * Function type
 * @param argumentType, the type of the arguments to the function
 * @param returnType, the type of the value returned by the function
 * @constructor
 */
var FunctionType = function(argumentType, returnType) {
  this.outputType_ = 'function';
  this.argumentsType = argumentType;
  this.returnType = returnType;
};
FunctionType.prototype.getAllBaseTypes = function() {
  var allBaseTypes = this.argumentsType.getAllBaseTypes();
  return uniques(allBaseTypes.concat(this.returnType.getAllBaseTypes()));
};
FunctionType.prototype.clone = function() {
  return new FunctionType(this.argumentsType.clone(), this.returnType.clone());
};
FunctionType.prototype.display = function() {
  return '(' + this.argumentsType.display() + ' -> ' + this.returnType.display() + ')';
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
Ray.Types.unknown = function() {
  return new Ray.Types.Unknown();
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
Ray.Types.positionalArgs = function(/* args */) {
  return new Ray.Types.ArgumentsType(new Ray.Types.ListOfTypes(Array.prototype.slice.call(arguments, 0)));
};
Ray.Types.restArg = function(ty) {
  return new Ray.Types.ArgumentsType(new Ray.Types.ListOfTypes([]), new Ray.Types.NArityType(ty));
};
Ray.Types.args = function(ls, n_arity) {
  return new Ray.Types.ArgumentsType(ls, n_arity);
};
Ray.Types.fn = function(args, body) {
  return new Ray.Types.FunctionType(args, body);
};

Ray.Types.areMatchingTypes = function(ty1, ty2) {
  if(ty2.outputType_ === 'unknown' ||
     ty1.outputType_ === 'unknown') {
    return true;
  }
  switch(ty1.outputType_) {
    case 'boolean':
      return ty2.outputType_ === 'boolean';
    case 'num':
      return ty2.outputType_ === 'num';
    case 'str':
      return ty2.outputType_ === 'str';
    case 'char':
      return ty2.outputType_ === 'char';
    case 'list':
      return ty2.outputType_ === 'list' &&
        Ray.Types.areMatchingTypes(ty1.elementType, ty2.elementType);
    case 'list_of_types':
      return ty2.outputType_ === 'list_of_types' &&
        goog.array.every(goog.array.zip(ty1.list, ty2.list), function(pair) {
          return Ray.Types.areMatchingTypes(pair[0], pair[1]);
        });
    case 'n_arity':
      return ty2.outputType_ === 'n_arity' &&
        Ray.Types.areMatchingTypes(ty1.elementType, ty2.elementType);
    case 'args':
      if(ty2.outputType_ === 'args' &&
         Ray.Types.areMatchingTypes(ty1.positionalArgTypes, ty2.positionalArgTypes)) {

          return (ty1.restArgType && ty2.restArgType) ?
            Ray.Types.areMatchingTypes(ty1.restArgType, ty2.restArgType) :
            (!ty1.restArgType && !ty2.restArgType);
      } else {
        return false;
      }
    case 'function':
      return ty2.outputType_ === 'function' &&
        Ray.Types.areMatchingTypes(ty1.argumentsType, ty2.argumentsType) &&
        Ray.Types.areMatchingTypes(ty1.returnType, ty2.returnType);
    default:
      return false;
      break;
  }
};

Ray.Types.areSameType = function(ty1, ty2) {
  switch(ty1.outputType_) {
    case 'unknown':
      return ty2.outputType_ === 'unknown';
    case 'boolean':
      return ty2.outputType_ === 'boolean';
    case 'num':
      return ty2.outputType_ === 'num';
    case 'str':
      return ty2.outputType_ === 'str';
    case 'char':
      return ty2.outputType_ === 'char';
    case 'list':
      return ty2.outputType_ === 'list' &&
             Ray.Types.areSameType(ty1.elementType, ty2.elementType);
    case 'list_of_types':
      return ty2.outputType_ === 'list_of_types' &&
             goog.array.every(goog.array.zip(ty1.list, ty2.list), function(pair) {
               return Ray.Types.areSameType(pair[0], pair[1]);
             });
    case 'n_arity':
      return ty2.outputType_ === 'n_arity' &&
             Ray.Types.areSameType(ty1.elementType, ty2.elementType);
    case 'args':
      if(ty2.outputType_ === 'args' &&
         Ray.Types.areSameType(ty1.positionalArgTypes, ty2.positionalArgTypes)) {

        return (ty1.restArgType && ty2.restArgType) ?
               Ray.Types.areSameType(ty1.restArgType, ty2.restArgType) :
               (!ty1.restArgType && !ty2.restArgType);
      } else {
        return false;
      }
    case 'function':
      return ty2.outputType_ === 'function' &&
             Ray.Types.areSameType(ty1.argumentsType, ty2.argumentsType) &&
             Ray.Types.areSameType(ty1.returnType, ty2.returnType);
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
Ray.Types.principalType_ = function(ty1, ty2) {
  if(ty1.outputType_ === 'unknown') {
    return ty2;
  } else if(ty2.outputType_ === 'unknown') {
    return ty1;
  } else {
    switch(ty1.outputType_) {
      case 'boolean':
      case 'num':
      case 'str':
      case 'char':
        return ty1;

      case 'list':
        return new Ray.Types.List(Ray.Types.principalType_(ty1.elementType, ty2.elementType));

      case 'list_of_types':
        return new Ray.Types.ListOfTypes(goog.array.map(goog.array.zip(ty1.list, ty2.list), function(pair) {
          return Ray.Types.principalType_(pair[0], pair[1]);
        }));

      case 'n_arity':
        return new Ray.Types.NArityType(Ray.Types.principalType_(ty1.elementType, ty2.elementType));

      case 'args':
        var positionalArgTypes = goog.array.map(goog.array.zip(ty1.positionalArgTypes, ty2.positionalArgTypes), function(pair) {
          return Ray.Types.principalType_(pair[0], pair[1]);
        });
        var restArgType = ty1.restArgType ?
                          Ray.Types.principalType_(ty1.restArgType, ty2.restArgType) :
                          null;
        return new Ray.Types.ArgumentsType(positionalArgTypes, restArgType);

      case 'function':
        return new Ray.Types.FunctionType(Ray.Types.principalType_(ty1.argumentsType, ty2.argumentsType),
                                          Ray.Types.principalType_(ty1.returnType, ty2.returnType));

      default:
        throw 'Unknown type for ty1!';
    }
  }
};

Ray.Types.principalType = function(types) {
  return goog.array.reduce(types, function(curr, ty) {
    return Ray.Types.principalType_(curr, ty);
  }, new Ray.Types.Unknown());
};