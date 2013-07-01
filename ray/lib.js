goog.provide('Ray.Lib');

goog.require('Ray._');
goog.require('Ray.Ray');
goog.require('Ray.Types');

var _ = Ray._;
var Types = Ray.Types;

var Lib = Ray.Lib;

var string_comparisons = {
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

Lib.add_builtin = function(name, val) {
  Lib.r.builtins_bind(name, val);
};

Lib.make_predicate = function(type) {
  Lib.add_builtin(type + '?', Lib.r.prim(Lib.r.p_spec(['x', Types.bottom()]), function(x) {
    return new Lib.r.Value.Boolean(Lib.r.node_type(x) === type);
  }, Types.bool()));
};

Lib.make_numeric_unary_op = function(name, numbers_name) {
  var internal_name = numbers_name || name;
  Lib.add_builtin(name, Lib.r.prim(Lib.r.p_spec(['x', Types.num()]), function(x) {
    return new r.Value.Num(Lib.r.numbers[internal_name](x.n));
  }, Types.num()));
};

Lib.make_numeric_binop = function(name, numbers_name) {
  var internal_name = numbers_name || name;
  Lib.add_builtin(name, Lib.r.prim(Lib.r.p_spec(['x', Types.num()],['y', Types.num()]), function(x,y) {
    return new r.Value.Num(Lib.r.numbers[internal_name](x.n, y.n));
  }, Types.num()));
};

Lib.make_numeric_comparison = function(name, numbers_name) {
  var r = Lib.r;

  Lib.add_builtin(name, r.prim(r.p_spec(['x', Types.num()], ['y', Types.num()]), function(x,y) {
    var result = Lib.r.numbers[numbers_name](x.n, y.n);
    return new r.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  Lib.add_builtin(name, r.prim(r.spec([['x', Types.num()],['y', Types.num()]],{},['ls', Types.num()]), function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = _.reduce(_.range(lefts.length), function(result, i) {
      return result && Lib.r.numbers[numbers_name](lefts[i].n,rights[i].n);
    }, true);
    return new r.Value.Boolean(result);
  }, Types.bool()));
   */
};

Lib.make_string_comparison = function(name, f) {
  var r = Lib.r;
  Lib.add_builtin(name, r.prim(Lib.r.p_spec(['x', Types.num()], ['y', Types.num()]), function(x,y) {
    var result = f(x.s, y.s);
    return new r.Value.Boolean(result);
  }, Types.bool()));
  /**
   * Unused variable arity version
  var str_cmp_f = function(x, y, ls) {
    var args = [x, y].concat(ls);
    var lefts = args.slice(0, -1);
    var rights = args.slice(1);
    var result = _.reduce(_.range(lefts.length), function(result, i) {
      return result && f(lefts[i].s, rights[i].s);
    }, true);
    return new r.Value.Boolean(result);
  };
  var str_cmp_prim = r.prim(r.spec([['x', Types.str()],
                                    ['y', Types.str()]],{},
                                   ['ls', Types.str()]),
                            str_cmp_f, Types.bool());
  Lib.add_builtin(name, str_cmp_prim);
   */
};


Lib.initialize = function(r) {
  Lib.r = r;

  /**
   * Type tests
   */
  Lib.make_predicate('boolean');
  Lib.make_predicate('pair');
  Lib.make_predicate('number');
  Lib.make_predicate('string');
  Lib.make_predicate('empty');

  /**
   * Pairs and Lists
   */
  Lib.add_builtin("empty", r.empty());

  Lib.add_builtin("car", r.prim(r.p_spec(['x', Types.list(Types.bottom())]), function(x) {
    return x.car;
  }, Types.bottom()));
  Lib.add_builtin("cdr", r.prim(r.p_spec(['x', Types.list(Types.bottom())]), function(x) {
    return x.cdr;
  }, Types.list(Types.bottom())));
  Lib.add_builtin("cons", r.prim(r.p_spec(['car', Types.bottom()], ['cdr', Types.list(Types.bottom())]), function(car, cdr) {
    return new r.Value.Pair(car, cdr);
  }, Types.list(Types.bottom())));

  Lib.add_builtin('list', r.prim(r.rest_spec('ls', Types.bottom()), function(ls) {
    return _.reduceRight(ls, function(curr, elem) {
      return new r.Value.Pair(elem, curr);
    }, new r.Value.Empty());
  }, Types.list(Types.bottom())));

  Lib.add_builtin("list?", r.fn(r.p_spec(['x', Types.bottom()]),
                                r.or(r.app(r.name('empty?'), r.p_args(r.name('x'))),
                                     r.and(r.app(r.name('pair?'),
                                                 r.p_args(r.name('x'))),
                                           r.app(r.name('list?'),
                                                 r.p_args(r.app(r.name('cdr'),
                                                                r.p_args(r.name('x'))))))), Types.bool()));

  Lib.add_builtin("map", r.fn(r.p_spec(['f', Types.fn(Types.p_args(Types.bottom()), Types.bottom())],
                                       ['ls', Types.list(Types.bottom())]),
                              r._if(r.app(r.name('empty?'), r.p_args(r.name('ls'))),
                                    r.empty(),
                                    r.app(r.name('cons'), r.p_args(r.app(r.name('f'),
                                                                         r.p_args(r.app(r.name('car'),
                                                                                        r.p_args(r.name('ls'))))),
                                                                   r.app(r.name('map'),
                                                                         r.p_args(r.name('f'),
                                                                                  r.app(r.name('cdr'),
                                                                                        r.p_args(r.name('ls')))))))), Types.list(Types.bottom())));

  /**
   * Booleans and Equality
   */
  Lib.add_builtin('not', r.prim(r.p_spec(['x', Types.bool()]), function(x) {
    return new r.Value.Boolean(!x.b);
  }, Types.bool()));

  /**
   * Generic Numerics
   * For the time being I'm going to get rid of variable arity versions, and just stick with
   * the binary ones, but I'll keep the varargs around in case I want to switch back later.

   Lib.add_builtin("+", r.prim(r.rest_spec('ls', Types.num()), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.add(a, b.n); }, 0);
      return new r.Value.Num(sum);
    }, Types.num()));
   Lib.add_builtin("*", r.prim(r.rest_spec('ls', Types.num()), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.multiply(a, b.n); }, 1);
      return new r.Value.Num(sum);
    }, Types.num()));
   Lib.add_builtin('-', r.prim(r.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return r.num(r.numbers.subtract(0, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.subtract(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }, Types.num()));
   Lib.add_builtin('/', r.prim(r.spec([['x', Types.num()]],{},['ls', Types.num()]), function(x,ls) {
      if(ls.length === 0) {
        return new r.Value.Num(r.numbers.divide(1, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.divide(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }, Types.num()));

   */

  Lib.add_builtin('+', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.add(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.add_builtin('*', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.multiply(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.add_builtin('-', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.subtract(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));
  Lib.add_builtin('/', r.prim(r.p_spec(['x', Types.num()],
                                       ['y', Types.num()]),
                              function(x, y) {
                                var z = r.numbers.divide(x.n, y.n);
                                return new r.Value.Num(z);
                              }, Types.num()));

  /**
   * Numeric comparisons and other binary operations
   */
  Lib.make_numeric_comparison('>', 'greaterThan');
  Lib.make_numeric_comparison('<', 'lessThan');
  Lib.make_numeric_comparison('>=', 'greaterThanOrEqual');
  Lib.make_numeric_comparison('<=', 'lessThanOrEqual');
  Lib.make_numeric_comparison('=', 'equals');
  Lib.make_numeric_binop('quotient');
  Lib.make_numeric_binop('remainder');
  Lib.make_numeric_binop('modulo');

  Lib.make_numeric_unary_op('abs');
  Lib.make_numeric_unary_op('sqrt');
  Lib.make_numeric_unary_op('exp');
  Lib.make_numeric_unary_op('log');
  Lib.make_numeric_unary_op('magnitude');
  Lib.make_numeric_unary_op('numerator');
  Lib.make_numeric_unary_op('sgn');
  Lib.make_numeric_unary_op('sqr');
  Lib.make_numeric_unary_op('ceiling');
  Lib.make_numeric_unary_op('floor');
  Lib.make_numeric_unary_op('round');

  /**
   * Strings
   */
  Lib.add_builtin('make-string', r.prim(r.p_spec(['k', Types.num()], ['c', Types.char()]), function(k, c) {
    var str = "";
    _.times(k.n, function() { str += c.c; });
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.add_builtin('string', r.prim(r.rest_spec('ls', Types.char()), function(ls) {
    var str = "";
    _.each(ls, function(c) { str += c.c; });
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.add_builtin('string-length', r.prim(r.p_spec(['x', Types.str()]), function(s) {
    return new r.Value.Num(s.s.length);
  }, Types.num()));

  Lib.add_builtin('string-ref', r.prim(r.p_spec(['str', Types.str()], ['k', Types.num()]), function(str, k) {
    var c = str.s.charAt(k.n);
    if(!c) {
      throw new r.Error("Invalid index passed to string-ref!");
    }
    return new r.Value.Char(c);
  }, Types.char()));

  Lib.add_builtin('string-append', r.prim(r.rest_spec('ls', Types.str()), function(ls) {
    var str = _.reduce(ls, function(str, s) { return str + s.s; }, "");
    return new r.Value.Str(str);
  }, Types.str()));

  Lib.add_builtin('substring', r.prim(r.p_spec(['str', Types.str()], ['start', Types.num()], ['end', Types.num()]), function(str, start, end) {
    if(start.n >= 0 && start.n <= str.s.length &&
      end.n >= start.n &&  end.n <= str.s.length) {
      return new r.Value.Str(str.s.substring(start.n, end.n));
    } else {
      throw new r.Error("Invalid indices passed to substring");
    }
  }, Types.str()));

  Lib.make_string_comparison('string=?', string_comparisons.EQ);
  Lib.make_string_comparison('string<?', string_comparisons.LT);
  Lib.make_string_comparison('string>?', string_comparisons.GT);
  Lib.make_string_comparison('string<=?', string_comparisons.LE);
  Lib.make_string_comparison('string>=?', string_comparisons.GE);

  return r;
};
