goog.provide('Ray.Lib');

goog.require('Ray.Ray');
goog.require('Ray.Types');
goog.require('Ray.Globals');

goog.require('goog.array');

var Types = Ray.Types;

var Lib = Ray.Lib;

var stringComparisons = {
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

Lib.addBuiltin = function(name, val) {
  Lib.r.bindBuiltin(name, val);
};

Lib.setPriority = function(name, priority) {
  var value = Lib.r.lookup(name);
  if(value) {
    value.priority_ = priority;
  }
};

Lib.setDisplayName = function(name, display_name) {
  var value = Lib.r.lookup(name);
  if(value) {
    value.display_name_ = display_name;
  }
};

Lib.makePredicate = function(type) {
  Lib.addBuiltin(type + '?', Lib.r.prim(Lib.r.p_spec(['x', Types.unknown()]), function(x) {
    return new Lib.r.Value.Boolean(Lib.r.nodeType(x) === type);
  }, Types.bool()));
};

Lib.makeNumericUnaryOp = function(name, numbers_name) {
  var internal_name = numbers_name || name;
  Lib.addBuiltin(name, Lib.r.prim(Lib.r.p_spec(['x', Types.num()]), function(x) {
    return new r.Value.Num(Lib.r.numbers[internal_name](x.n));
  }, Types.num()));
};

Lib.makeNumericBinop = function(name, numbers_name) {
  var internal_name = numbers_name || name;
  Lib.addBuiltin(name, Lib.r.prim(Lib.r.p_spec(['x', Types.num()],['y', Types.num()]), function(x,y) {
    return new r.Value.Num(Lib.r.numbers[internal_name](x.n, y.n));
  }, Types.num()));
};

Lib.makeNumericComparison = function(name, numbers_name) {
  var r = Lib.r;

  Lib.addBuiltin(name, r.prim(r.p_spec(['x', Types.num()], ['y', Types.num()]), function(x,y) {
    var result = Lib.r.numbers[numbers_name](x.n, y.n);
    return new r.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  Lib.addBuiltin(name, r.prim(r.spec([['x', Types.num()],['y', Types.num()]],{},['ls', Types.num()]), function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = goog.array.reduce(goog.array.range(lefts.length), function(result, i) {
      return result && Lib.r.numbers[numbers_name](lefts[i].n,rights[i].n);
    }, true);
    return new r.Value.Boolean(result);
  }, Types.bool()));
   */
};

Lib.makeStringComparison = function(name, f) {
  var r = Lib.r;
  Lib.addBuiltin(name, r.prim(Lib.r.p_spec(['x', Types.str()], ['y', Types.str()]), function(x,y) {
    var result = f(x.s, y.s);
    return new r.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  var str_cmp_f = function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = goog.array.reduce(goog.array.range(lefts.length), function(result, i) {
      return result && f(lefts[i].s, rights[i].s);
    }, true);
    return new r.Value.Boolean(result);
  };
  var str_cmp_prim = r.prim(r.spec([['x', Types.str()],
                                    ['y', Types.str()]],{},
                                   ['ls', Types.str()]),
                            str_cmp_f, Types.bool());
  Lib.addBuiltin(name, str_cmp_prim);
   */
};


Lib.initialize = function(r) {
  Lib.r = r;

  /**
   * Type tests
   */
  Lib.makePredicate('boolean');
  Lib.makePredicate('pair');
  Lib.makePredicate('number');
  Lib.makePredicate('string');
  Lib.makePredicate('empty');

  /**
   * Pairs and Lists
   */
  Lib.addBuiltin("empty", r.empty());

  Lib.addBuiltin("first", r.prim(r.p_spec(['x', Types.list(Types.unknown())]), function(x) {
    return x.car;
  }, Types.unknown()));
  Lib.addBuiltin("rest", r.prim(r.p_spec(['x', Types.list(Types.unknown())]), function(x) {
    return x.cdr;
  }, Types.list(Types.unknown())));
  Lib.addBuiltin("cons", r.prim(r.p_spec(['car', Types.unknown()], ['cdr', Types.list(Types.unknown())]), function(car, cdr) {
    return new r.Value.Pair(car, cdr);
  }, Types.list(Types.unknown())));

  Lib.addBuiltin('list', r.prim(r.rest_spec('ls', Types.unknown()), function(ls) {
    return goog.array.reduceRight(ls, function(curr, elem) {
      return new r.Value.Pair(elem, curr);
    }, new r.Value.Empty());
  }, Types.list(Types.unknown())));

  Lib.addBuiltin("list?", r.fn(r.p_spec(['x', Types.unknown()]),
                                r.or(r.app(r.name('empty?'), r.positionalArgs(r.name('x'))),
                                     r.and(r.app(r.name('pair?'),
                                                 r.positionalArgs(r.name('x'))),
                                           r.app(r.name('list?'),
                                                 r.positionalArgs(r.app(r.name('cdr'),
                                                                r.positionalArgs(r.name('x'))))))), Types.bool()));

  Lib.addBuiltin("map", r.fn(r.p_spec(['f', Types.fn(Types.positionalArgs(Types.unknown()), Types.unknown())],
                                       ['ls', Types.list(Types.unknown())]),
                              r._if(r.app(r.name('empty?'), r.positionalArgs(r.name('ls'))),
                                    r.empty(),
                                    r.app(r.name('cons'), r.positionalArgs(r.app(r.name('f'),
                                                                         r.positionalArgs(r.app(r.name('car'),
                                                                                        r.positionalArgs(r.name('ls'))))),
                                                                   r.app(r.name('map'),
                                                                         r.positionalArgs(r.name('f'),
                                                                                  r.app(r.name('cdr'),
                                                                                        r.positionalArgs(r.name('ls')))))))), Types.list(Types.unknown())));

  /**
   * Booleans and Equality
   */
  Lib.addBuiltin('not', r.prim(r.p_spec(['x', Types.bool()]), function(x) {
    return new r.Value.Boolean(!x.b);
  }, Types.bool()));

  /**
   * Generic Numerics
   * For the time being I'm going to get rid of variable arity versions, and just stick with
   * the binary ones, but I'll keep the varargs around in case I want to switch back later.

   Lib.addBuiltin("+", r.prim(r.rest_spec('ls', Types.num()), function(ls) {
      var sum = goog.array.reduce(ls, function(a, b) { return r.numbers.add(a, b.n); }, 0);
      return new r.Value.Num(sum);
    }, Types.num()));
   Lib.addBuiltin("*", r.prim(r.rest_spec('ls', Types.num()), function(ls) {
      var sum = goog.array.reduce(ls, function(a, b) { return r.numbers.multiply(a, b.n); }, 1);
      return new r.Value.Num(sum);
    }, Types.num()));
   Lib.addBuiltin('-', r.prim(r.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return r.num(r.numbers.subtract(0, x.n));
      } else {
        var result = goog.array.reduce(ls, function(a, b) { return r.numbers.subtract(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }, Types.num()));
   Lib.addBuiltin('/', r.prim(r.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return new r.Value.Num(r.numbers.divide(1, x.n));
      } else {
        var result = goog.array.reduce(ls, function(a, b) { return r.numbers.divide(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }, Types.num()));

   */

  Lib.addBuiltin('+', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.add(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.setPriority('+', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Lib.addBuiltin('*', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.multiply(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.setPriority('*', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Lib.setDisplayName('*', '&times;');
  Lib.addBuiltin('-', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.subtract(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.setPriority('-', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);
  Lib.addBuiltin('/', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.divide(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.setPriority('/', Ray.Globals.Priorities.BASIC_NUMBER_OPERATION);

  /**
   * Numeric comparisons and other binary operations
   */
  Lib.makeNumericComparison('>', 'greaterThan');
  Lib.makeNumericComparison('<', 'lessThan');
  Lib.makeNumericComparison('>=', 'greaterThanOrEqual');
  Lib.makeNumericComparison('<=', 'lessThanOrEqual');
  Lib.makeNumericComparison('=', 'equals');
  Lib.makeNumericBinop('quotient');
  Lib.makeNumericBinop('remainder');
  Lib.makeNumericBinop('modulo');

  Lib.makeNumericUnaryOp('abs');
  Lib.makeNumericUnaryOp('sqrt');
  Lib.makeNumericUnaryOp('exp');
  Lib.makeNumericUnaryOp('log');
  Lib.makeNumericUnaryOp('magnitude');
  Lib.makeNumericUnaryOp('numerator');
  Lib.makeNumericUnaryOp('sgn');
  Lib.makeNumericUnaryOp('sqr');
  Lib.makeNumericUnaryOp('ceiling');
  Lib.makeNumericUnaryOp('floor');
  Lib.makeNumericUnaryOp('round');

  /**
   * Strings
   */
  Lib.addBuiltin('make-string', r.prim(r.p_spec(['k', Types.num()], ['c', Types.char()]), function(k, c) {
    var str = "";
    for(var i = 0; i < k.n; i++) {
      str += c.c;
    }
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.addBuiltin('string', r.prim(r.rest_spec('ls', Types.char()), function(ls) {
    var str = "";
    goog.array.forEach(ls, function(c) { str += c.c; });
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.addBuiltin('string-length', r.prim(r.p_spec(['x', Types.str()]), function(s) {
    return new r.Value.Num(s.s.length);
  }, Types.num()));

  Lib.addBuiltin('string-ref', r.prim(r.p_spec(['str', Types.str()], ['k', Types.num()]), function(str, k) {
    var c = str.s.charAt(k.n);
    if(!c) {
      throw new r.Error("Invalid index passed to string-ref!");
    }
    return new r.Value.Char(c);
  }, Types.char()));

  Lib.addBuiltin('string-append', r.prim(r.rest_spec('ls', Types.str()), function(ls) {
    var str = goog.array.reduce(ls, function(str, s) { return str + s.s; }, "");
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.addBuiltin('substring', r.prim(r.p_spec(['str', Types.str()], ['start', Types.num()], ['end', Types.num()]), function(str, start, end) {
    if(start.n >= 0 && start.n <= str.s.length &&
      end.n >= start.n &&  end.n <= str.s.length) {
      return new r.Value.Str(str.s.substring(start.n, end.n));
    } else {
      throw new r.Error("Invalid indices passed to substring");
    }
  }, Types.str()));

  Lib.makeStringComparison('string=?', stringComparisons.EQ);
  Lib.makeStringComparison('string<?', stringComparisons.LT);
  Lib.makeStringComparison('string>?', stringComparisons.GT);
  Lib.makeStringComparison('string<=?', stringComparisons.LE);
  Lib.makeStringComparison('string>=?', stringComparisons.GE);

  return r;
};
