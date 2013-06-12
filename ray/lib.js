goog.provide('Ray.Lib');

goog.require('Ray._');
goog.require('Ray.Ray');

Ray.Lib = function() {

  var _ = Ray._;

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

  var Lib = {};

  Lib.add_builtin = function(name, val) {
    Lib.r.builtins_bind(name, val);
  };

  Lib.make_predicate = function(type) {
    Lib.add_builtin(type + '?', Lib.r.prim(Lib.r.p_spec('x'), function(x) {
      return new Lib.r.Value.Boolean(Lib.r.type(x) === type);
    }));
  };

  Lib.make_numeric_binop = function(name, result_type, numbers_name) {
    var internal_name = numbers_name || name;
    Lib.add_builtin(name, Lib.r.prim(Lib.r.p_spec('x','y'), function(x,y) {
      return new result_type(Lib.r.numbers[internal_name](x.n, y.n));
    }));
  };

  Lib.make_numeric_comparison = function(name, numbers_name) {
    var r = Lib.r;
    Lib.add_builtin(name, r.prim(r.spec(['x','y'],{},'ls'), function(x, y, ls) {
      var args = [x, y].concat(ls);
      var lefts = args.slice(0, -1);
      var rights = args.slice(1);
      var result = _.reduce(_.range(lefts.length), function(result, i) {
        return result && Lib.r.numbers[numbers_name](lefts[i].n,rights[i].n);
      }, true);
      return new r.Value.Boolean(result);
    }));
  };

  Lib.make_string_comparison = function(name, f) {
    var r = Lib.r;
    Lib.add_builtin(name, r.prim(r.spec(['x','y'],{},'ls'), function(x, y, ls) {
      var args = [x, y].concat(ls);
      var lefts = args.slice(0, -1);
      var rights = args.slice(1);
      var result = _.reduce(_.range(lefts.length), function(result, i) {
        return result && f(lefts[i].s, rights[i].s);
      }, true);
      return new r.Value.Boolean(result);
    }))
  };

  Lib.initialize = function(r) {
    var _r = r.make_helper();
    var self = this;
    _.each(_r, function(v,k) {
      r[k] = v;
    });
    Lib.r = r;

    /**
     * Type tests
     */
    Lib.make_predicate('boolean');
    Lib.make_predicate('pair');
    Lib.make_predicate('number');
    Lib.make_predicate('string');
    Lib.make_predicate('null');

    /**
     * Pairs and Lists
     */
    Lib.add_builtin("null", r._null());

    Lib.add_builtin("car", r.prim(r.p_spec('x'), function(x) {
      return x.car;
    }));
    Lib.add_builtin("cdr", r.prim(r.p_spec('x'), function(x) {
      return x.cdr;
    }));
    Lib.add_builtin("cons", r.prim(r.p_spec('car', 'cdr'), function(car, cdr) {
      return new r.Value.Pair(car, cdr);
    }));
    Lib.add_builtin('list', r.prim(r.rest_spec('ls'), function(ls) {
      return _.reduceRight(ls, function(curr, elem) {
        return new r.Value.Pair(elem, curr);
      }, new r.Value.Null());
    }));

    Lib.add_builtin("list?", r.fn(r.p_spec('x'),
      r.or(r.app(r.name('null?'), r.p_args(r.name('x'))),
           r.and(r.app(r.name('pair?'),
                       r.p_args(r.name('x'))),
                 r.app(r.name('list?'),
                       r.p_args(r.app(r.name('cdr'),
                                      r.p_args(r.name('x')))))))));

    Lib.add_builtin("map", r.fn(r.p_spec('f','ls'),
      r._if(r.app(r.name('null?'), r.p_args(r.name('ls'))),
	    r._null(),
	    r.app(r.name('cons'), r.p_args(r.app(r.name('f'),
						 r.p_args(r.app(r.name('car'),
								r.p_args(r.name('ls'))))),
					   r.app(r.name('map'),
						 r.p_args(r.name('f'),
							  r.app(r.name('cdr'),
								r.p_args(r.name('ls'))))))))));

    /**
     * Booleans and Equality
     */
    Lib.add_builtin('not', r.prim(r.p_spec('x'), function(x) {
      return new r.Value.Boolean(!x.b);
    }));

    /**
     * Generic Numerics
     */
    Lib.add_builtin("+", r.prim(r.rest_spec('ls'), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.add(a, b.n); }, 0);
      return new r.Value.Num(sum);
    }));
    Lib.add_builtin("*", r.prim(r.rest_spec('ls'), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.multiply(a, b.n); }, 1);
      return new r.Value.Num(sum);
    }));
    Lib.add_builtin('-', r.prim(r.spec(['x'],{},'ls'), function(x,ls) {
      if(ls.length === 0) {
        return r.num(r.numbers.subtract(0, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.subtract(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }));
    Lib.add_builtin('/', r.prim(r.spec(['x'],{},'ls'), function(x,ls) {
      if(ls.length === 0) {
        return new r.Value.Num(r.numbers.divide(1, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.divide(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }));

    Lib.make_numeric_comparison('>', 'greaterThan');
    Lib.make_numeric_comparison('<', 'lessThan');
    Lib.make_numeric_comparison('>=', 'greaterThanOrEqual');
    Lib.make_numeric_comparison('<=', 'lessThanOrEqual');
    Lib.make_numeric_comparison('=', 'equals');
    Lib.make_numeric_binop('quotient', r.Value.Num)
    Lib.make_numeric_binop('remainder', r.Value.Num);
    Lib.make_numeric_binop('modulo', r.Value.Num);

    /**
     * Strings
     */
    Lib.add_builtin('make-string', r.prim(r.p_spec('k', 'c'), function(k, c) {
      var str = "";
      _.times(k.n, function() { str += c.c; });
      return new r.Value.Str(str);
    }));

    Lib.add_builtin('string', r.prim(r.rest_spec('ls'), function(ls) {
      var str = "";
      _.each(ls, function(c) { str += c.c; });
      return new r.Value.Str(str);
    }));

    Lib.add_builtin('string-length', r.prim(r.p_spec('x'), function(s) {
      return new r.Value.Num(s.s.length);
    }));

    Lib.add_builtin('string-ref', r.prim(r.p_spec('str', 'k'), function(str, k) {
      var c = str.s.charAt(k.n);
      if(!c) {
        throw new r.Error("Invalid index passed to string-ref!");
      }
      return new r.Value.Char(c);
    }));

    Lib.add_builtin('string-append', r.prim(r.rest_spec('ls'), function(ls) {
      var str = _.reduce(ls, function(str, s) { return str + s.s; }, "");
      return new r.Value.Str(str);
    }));

    Lib.add_builtin('substring', r.prim(r.p_spec('str', 'start', 'end'), function(str, start, end) {
      if(start.n >= 0 && start.n <= str.s.length &&
         end.n >= start.n &&  end.n <= str.s.length) {
        return new r.Value.Str(str.s.substring(start.n, end.n));
      } else {
        throw new r.Error("Invalid indices passed to substring");
      }
    }));

    Lib.make_string_comparison('string=?', string_comparisons.EQ);
    Lib.make_string_comparison('string<?', string_comparisons.LT);
    Lib.make_string_comparison('string>?', string_comparisons.GT);
    Lib.make_string_comparison('string<=?', string_comparisons.LE);
    Lib.make_string_comparison('string>=?', string_comparisons.GE);


    return r;
  };

  return Lib;

};
