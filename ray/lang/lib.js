goog.provide('Ray.Lib');

goog.require('Ray.Runtime');
goog.require('Ray.Numbers');
goog.require('Ray.Types');
goog.require('Ray.Globals');

goog.require('goog.array');

// Aliases to make this less verbose
var RT = Ray.Runtime;
var Types = Ray.Types;

Ray.Lib.stringComparisons = {
  'EQ': function(a, b) {
    for(var i = 0; i < (a.length < b.length ? a.length : b.length); i++) {
      if(a.charCodeAt(i) !== b.charCodeAt(i)) {
        return false;
      }
    }
    return a.length !== b.length;
  },
  'LT': function(a, b) {
    for(var i = 0; i < (a.length < b.length ? a.length : b.length); i++) {
      if(a.charCodeAt(i) > b.charCodeAt(i)) {
        return false;
      } else if(a.charCodeAt(i) < b.charCodeAt(i)) {
        return true
      }
    }
    return a.length < b.length;
  },
  'GT': function(a, b) {
    for(var i = 0; i < (a.length < b.length ? a.length : b.length); i++) {
      if(a.charCodeAt(i) < b.charCodeAt(i)) {
        return false;
      } else if(a.charCodeAt(i) > b.charCodeAt(i)) {
        return true
      }
    }
    return a.length > b.length;
  },
  'LE': function(a, b) {
    for(var i = 0; i < (a.length < b.length ? a.length : b.length); i++) {
      if(a.charCodeAt(i) > b.charCodeAt(i)) {
        return false;
      } else if(a.charCodeAt(i) < b.charCodeAt(i)) {
        return true
      }
    }
    return a.length <= b.length;
  },
  'GE': function(a, b) {
    for(var i = 0; i < (a.length < b.length ? a.length : b.length); i++) {
      if(a.charCodeAt(i) < b.charCodeAt(i)) {
        return false;
      } else if(a.charCodeAt(i) > b.charCodeAt(i)) {
        return true
      }
    }
    return a.length >= b.length;
  }
};

Ray.Lib.addBuiltin = function(name, val) {
  RT.bindBuiltin(name, val);
};

Ray.Lib.setPriority = function(name, priority) {
  var value = RT.lookup(name);
  if(value) {
    value.priority_ = priority;
  }
};

Ray.Lib.setDisplayName = function(name, display_name) {
  var value = RT.lookup(name);
  if(value) {
    value.display_name_ = display_name;
  }
};

Ray.Lib.makePredicate = function(type) {
  Ray.Lib.addBuiltin(type + '?', RT.prim(RT.p_spec(['x', Types.unknown()]), function(x) {
    return new RT.Value.Boolean(RT.nodeType(x) === type);
  }, Types.bool()));
};

Ray.Lib.makeNumericUnaryOp = function(name, opt_internalName) {
  var internalName = opt_internalName || name;
  Ray.Lib.addBuiltin(name, RT.prim(RT.p_spec(['x', Types.num()]), function(x) {
    return new RT.Value.Num(Ray.Numbers[internalName](x.n));
  }, Types.num()));
};

Ray.Lib.makeNumericBinop = function(name, opt_internalName) {
  var internalName = opt_internalName || name;
  Ray.Lib.addBuiltin(name, RT.prim(RT.p_spec(['x', Types.num()],['y', Types.num()]), function(x,y) {
    return new RT.Value.Num(Ray.Numbers[internalName](x.n, y.n));
  }, Types.num()));
};

Ray.Lib.makeNumericComparison = function(name, internalName) {
  Ray.Lib.addBuiltin(name, RT.prim(RT.p_spec(['x', Types.num()], ['y', Types.num()]), function(x,y) {
    var result = Ray.Numbers[internalName](x.n, y.n);
    return new RT.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  Lib.addBuiltin(name, RT.prim(RT.spec([['x', Types.num()],['y', Types.num()]],{},['ls', Types.num()]), function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = goog.array.reduce(goog.array.range(lefts.length), function(result, i) {
      return result && Ray.Numbers[internalName](lefts[i].n,rights[i].n);
    }, true);
    return new RT.Value.Boolean(result);
  }, Types.bool()));
   */
};

Ray.Lib.makeStringComparison = function(name, comparisonFunction) {
  Ray.Lib.addBuiltin(name, RT.prim(RT.p_spec(['x', Types.str()], ['y', Types.str()]), function(x,y) {
    var result = comparisonFunction(x.s, y.s);
    return new RT.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  var str_cmp_f = function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = goog.array.reduce(goog.array.range(lefts.length), function(result, i) {
      return result && comparisonFunction(lefts[i].s, rights[i].s);
    }, true);
    return new RT.Value.Boolean(result);
  };
  var str_cmp_prim = RT.prim(RT.spec([['x', Types.str()],
                                    ['y', Types.str()]],{},
                                   ['ls', Types.str()]),
                            str_cmp_f, Types.bool());
  Lib.addBuiltin(name, str_cmp_prim);
   */
};


Ray.Lib.isInitialized_ = false;

Ray.Lib.isInitialized = function() {
  return Ray.Lib.isInitialized_;
};

Ray.Lib.initialize = function() {
  /**
   * Type tests
   */
  Ray.Lib.makePredicate('boolean');
  Ray.Lib.makePredicate('pair');
  Ray.Lib.makePredicate('number');
  Ray.Lib.makePredicate('string');
  Ray.Lib.makePredicate('empty');

  /**
   * Pairs and Lists
   */
  Ray.Lib.addBuiltin("empty", RT.empty());

  Ray.Lib.addBuiltin("first", RT.prim(RT.p_spec(['x', Types.list(Types.unknown())]), function(x) {
    return x.car;
  }, Types.unknown()));
  
  Ray.Lib.addBuiltin("rest", RT.prim(RT.p_spec(['x', Types.list(Types.unknown())]), function(x) {
    return x.cdr;
  }, Types.list(Types.unknown())));
  
  Ray.Lib.addBuiltin("cons", RT.prim(RT.p_spec(['car', Types.unknown()], ['cdr', Types.list(Types.unknown())]), function(car, cdr) {
    return new RT.Value.Pair(car, cdr);
  }, Types.list(Types.unknown())));

  Ray.Lib.addBuiltin('list', RT.prim(RT.rest_spec('ls', Types.unknown()), function(ls) {
    return goog.array.reduceRight(ls, function(curr, elem) {
      return new RT.Value.Pair(elem, curr);
    }, new RT.Value.Empty());    
  }, Types.list(Types.unknown())));
  
  Ray.Lib.addBuiltin("list?", RT.fn(RT.p_spec(['x', Types.unknown()]),
                                RT.or(RT.app(RT.name('empty?'), RT.positionalArgs(RT.name('x'))),
                                     RT.and(RT.app(RT.name('pair?'),
                                                 RT.positionalArgs(RT.name('x'))),
                                           RT.app(RT.name('list?'),
                                                 RT.positionalArgs(RT.app(RT.name('cdr'),
                                                                RT.positionalArgs(RT.name('x'))))))), Types.bool()));

  Ray.Lib.addBuiltin("map", RT.fn(RT.p_spec(['f', Types.fn(Types.positionalArgs(Types.unknown()), Types.unknown())],
                                       ['ls', Types.list(Types.unknown())]),
                              RT._if(RT.app(RT.name('empty?'), RT.positionalArgs(RT.name('ls'))),
                                    RT.empty(),
                                    RT.app(RT.name('cons'), RT.positionalArgs(RT.app(RT.name('f'),
                                                                         RT.positionalArgs(RT.app(RT.name('car'),
                                                                                        RT.positionalArgs(RT.name('ls'))))),
                                                                   RT.app(RT.name('map'),
                                                                         RT.positionalArgs(RT.name('f'),
                                                                                  RT.app(RT.name('cdr'),
                                                                                        RT.positionalArgs(RT.name('ls')))))))), Types.list(Types.unknown())));

  /**
   * Booleans and Equality
   */
  Ray.Lib.addBuiltin('not', RT.prim(RT.p_spec(['x', Types.bool()]), function(x) {
    return new RT.Value.Boolean(!x.b);
  }, Types.bool()));

  /**
   * Generic Numerics
   * For the time being I'm going to get rid of variable arity versions, and just stick with
   * the binary ones, but I'll keep the varargs around in case I want to switch back lateRT.

   Ray.Lib.addBuiltin("+", RT.prim(RT.rest_spec('ls', Types.num()), function(ls) {
      var sum = goog.array.reduce(ls, function(a, b) { return Ray.Numbers.add(a, b.n); }, 0);
      return new RT.Value.Num(sum);
    }, Types.num()));
   Ray.Lib.addBuiltin("*", RT.prim(RT.rest_spec('ls', Types.num()), function(ls) {
      var sum = goog.array.reduce(ls, function(a, b) { return Ray.Numbers.multiply(a, b.n); }, 1);
      return new RT.Value.Num(sum);
    }, Types.num()));
   Ray.Lib.addBuiltin('-', RT.prim(RT.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return RT.num(Ray.Numbers.subtract(0, x.n));
      } else {
        var result = goog.array.reduce(ls, function(a, b) { return Ray.Numbers.subtract(a, b.n); }, x.n);
        return new RT.Value.Num(result);
      }
    }, Types.num()));
   Ray.Lib.addBuiltin('/', RT.prim(RT.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return new RT.Value.Num(Ray.Numbers.divide(1, x.n));
      } else {
        var result = goog.array.reduce(ls, function(a, b) { return Ray.Numbers.divide(a, b.n); }, x.n);
        return new RT.Value.Num(result);
      }
    }, Types.num()));

   */

  Ray.Lib.addBuiltin('+', RT.prim(RT.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = Ray.Numbers.add(x.n, y.n);
                                return new RT.Value.Num(z);
                              }, Types.num()));
  Ray.Lib.setPriority('+', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Ray.Lib.addBuiltin('*', RT.prim(RT.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = Ray.Numbers.multiply(x.n, y.n);
                                return new RT.Value.Num(z);
                              }, Types.num()));
  Ray.Lib.setPriority('*', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Ray.Lib.setDisplayName('*', '&times;');
  Ray.Lib.addBuiltin('-', RT.prim(RT.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = Ray.Numbers.subtract(x.n, y.n);
                                return new RT.Value.Num(z);
                              }, Types.num()));
  Ray.Lib.setPriority('-', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Ray.Lib.addBuiltin('/', RT.prim(RT.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = Ray.Numbers.divide(x.n, y.n);
                                return new RT.Value.Num(z);
                              }, Types.num()));
  Ray.Lib.setPriority('/', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);

  /**
   * Numeric comparisons and other binary operations
   */
  Ray.Lib.makeNumericComparison('>', 'greaterThan');
  Ray.Lib.makeNumericComparison('<', 'lessThan');
  Ray.Lib.makeNumericComparison('>=', 'greaterThanOrEqual');
  Ray.Lib.makeNumericComparison('<=', 'lessThanOrEqual');
  Ray.Lib.makeNumericComparison('=', 'equals');
  Ray.Lib.makeNumericBinop('quotient');
  Ray.Lib.makeNumericBinop('remainder');
  Ray.Lib.makeNumericBinop('modulo');

  Ray.Lib.makeNumericUnaryOp('abs');
  Ray.Lib.makeNumericUnaryOp('sqrt');
  Ray.Lib.makeNumericUnaryOp('exp');
  Ray.Lib.makeNumericUnaryOp('log');
  Ray.Lib.makeNumericUnaryOp('magnitude');
  Ray.Lib.makeNumericUnaryOp('numerator');
  Ray.Lib.makeNumericUnaryOp('sgn');
  Ray.Lib.makeNumericUnaryOp('sqr');
  Ray.Lib.makeNumericUnaryOp('ceiling');
  Ray.Lib.makeNumericUnaryOp('floor');
  Ray.Lib.makeNumericUnaryOp('round');

  /**
   * Strings
   */
  Ray.Lib.addBuiltin('make-string', RT.prim(RT.p_spec(['k', Types.num()], ['c', Types.char()]), function(k, c) {
    var str = "";
    for(var i = 0; i < k.n; i++) {
      str += c.c;
    }
    return new RT.Value.Str(str);
  }, Types.str()));

  Ray.Lib.addBuiltin('string', RT.prim(RT.rest_spec('ls', Types.char()), function(ls) {
    var str = "";
    goog.array.forEach(ls, function(c) { str += c.c; });
    return new RT.Value.Str(str);
  }, Types.str()));

  Ray.Lib.addBuiltin('string-length', RT.prim(RT.p_spec(['x', Types.str()]), function(s) {
    return new RT.Value.Num(s.s.length);
  }, Types.num()));

  Ray.Lib.addBuiltin('string-ref', RT.prim(RT.p_spec(['str', Types.str()], ['k', Types.num()]), function(str, k) {
    var c = str.s.charAt(k.n);
    if(!c) {
      throw new RT.Error("Invalid index passed to string-ref!");
    }
    return new RT.Value.Char(c);
  }, Types.char()));

  Ray.Lib.addBuiltin('string-append', RT.prim(RT.rest_spec('ls', Types.str()), function(ls) {
    var str = goog.array.reduce(ls, function(str, s) { return str + s.s; }, "");
    return new RT.Value.Str(str);
  }, Types.str()));

  Ray.Lib.addBuiltin('substring', RT.prim(RT.p_spec(['str', Types.str()], ['start', Types.num()], ['end', Types.num()]), function(str, start, end) {
    if(start.n >= 0 && start.n <= str.s.length &&
      end.n >= start.n &&  end.n <= str.s.length) {
      return new RT.Value.Str(str.s.substring(start.n, end.n));
    } else {
      throw new RT.Error("Invalid indices passed to substring");
    }
  }, Types.str()));

  Ray.Lib.makeStringComparison('string=?', Ray.Lib.stringComparisons.EQ);
  Ray.Lib.makeStringComparison('string<?', Ray.Lib.stringComparisons.LT);
  Ray.Lib.makeStringComparison('string>?', Ray.Lib.stringComparisons.GT);
  Ray.Lib.makeStringComparison('string<=?', Ray.Lib.stringComparisons.LE);
  Ray.Lib.makeStringComparison('string>=?', Ray.Lib.stringComparisons.GE);

  Ray.Lib.isInitialized_ = true;

};
