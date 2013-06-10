goog.provide('ray.lib');

goog.require('ray.underscore');
goog.require('ray.ray');

ray.lib = function() {

  var _ = ray.underscore;

  var lib = {};

  lib.add_builtin = function(name, val) {
    lib.r.builtins_bind(name, val);
  };

  lib.make_predicate = function(type) {
    lib.add_builtin(type + '?', lib.r.prim(lib.r.p_spec('x'), function(x) {
      return new lib.r.Value.Boolean(lib.r.type(x) === type);
    }));
  };

  lib.make_numeric_binop = function(name, result_type, numbers_name) {
    var internal_name = numbers_name || name;
    lib.add_builtin(name, lib.r.prim(lib.r.p_spec('x','y'), function(x,y) {
      return new result_type(lib.r.numbers[internal_name](x.n, y.n));
    }));
  };

  lib.make_numeric_comparison = function(name, numbers_name) {
    var r = lib.r;
    lib.add_builtin(name, r.prim(r.spec(['x'],{},'ls'), function(x, ls) {
      var args = [x].concat(ls);
      var lefts = args.slice(0, -1);
      var rights = args.slice(1);
      var result = _.reduce(_.range(lefts.length), function(result, i) {
        return result && lib.r.numbers[numbers_name](lefts[i].n,rights[i].n);
      }, true);
      return new r.Value.Boolean(result);
    }));
  };

  lib.initialize = function(r) {
    var _r = r.make_helper();
    var self = this;
    _.each(_r, function(v,k) {
      r[k] = v;
    });
    lib.r = r;

    /**
     * Type tests
     */
    lib.make_predicate('boolean');
    lib.make_predicate('pair');
    lib.make_predicate('number');
    lib.make_predicate('string');
    lib.make_predicate('null');

    /**
     * Pairs and Lists
     */
    lib.add_builtin("car", r.prim(r.p_spec('x'), function(x) {
      return x.car;
    }));
    lib.add_builtin("cdr", r.prim(r.p_spec('x'), function(x) {
      return x.cdr;
    }));
    lib.add_builtin("cons", r.prim(r.p_spec('car', 'cdr'), function(car, cdr) {
      return new r.Value.Pair(car, cdr);
    }));

    lib.add_builtin("list?", r.fn(r.p_spec('x'),
      r.or(r.app(r.name('null?'), r.p_args(r.name('x'))),
           r.and(r.app(r.name('pair?'),
                       r.p_args(r.name('x'))),
                 r.app(r.name('list?'),
                       r.p_args(r.app(r.name('cdr'),
                                      r.p_args(r.name('x')))))))));

    lib.add_builtin("map", r.fn(r.p_spec('f','ls'),
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
    lib.add_builtin('not', r.prim(r.p_spec('x'), function(x) {
      return new r.Value.Boolean(!x.b);
    }));

    /**
     * Generic Numerics
     */
    lib.add_builtin("+", r.prim(r.rest_spec('ls'), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.add(a, b.n); }, 0);
      return new r.Value.Num(sum);
    }));
    lib.add_builtin("*", r.prim(r.rest_spec('ls'), function(ls) {
      var sum = _.reduce(ls, function(a, b) { return r.numbers.multiply(a, b.n); }, 1);
      return new r.Value.Num(sum);
    }));
    lib.add_builtin('-', r.prim(r.spec(['x'],{},'ls'), function(x,ls) {
      if(ls.length === 0) {
        return r.num(r.numbers.subtract(0, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.subtract(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }));
    lib.add_builtin('/', r.prim(r.spec(['x'],{},'ls'), function(x,ls) {
      if(ls.length === 0) {
        return new r.Value.Num(r.numbers.divide(1, x.n));
      } else {
        var result = _.reduce(ls, function(a, b) { return r.numbers.divide(a, b.n); }, x.n);
        return new r.Value.Num(result);
      }
    }));

    lib.make_numeric_comparison('>', 'greaterThan');
    lib.make_numeric_comparison('<', 'lessThan');
    lib.make_numeric_comparison('>=', 'greaterThanOrEqual');
    lib.make_numeric_comparison('<=', 'lessThanOrEqual');
    lib.make_numeric_comparison('=', 'equals');
    lib.make_numeric_binop('quotient', r.Value.Num)
    lib.make_numeric_binop('remainder', r.Value.Num);
    lib.make_numeric_binop('modulo', r.Value.Num);

    /**
     * Strings
     */
    lib.add_builtin('make-string', r.prim(r.p_spec('k', 'c'), function(k, c) {
      var str = "";
      _.times(k.n, function() { str += c.c; });
      return new r.Value.Str(str);
    }));

    lib.add_builtin('string', r.prim(r.rest_spec('ls'), function(ls) {
      var str = "";
      _.each(ls, function(c) { str += c.c; });
      return new r.Value.Str(str);
    }));

    lib.add_builtin('string-length', r.prim(r.p_spec('x'), function(s) {
      return new r.Value.Num(s.s.length);
    }));

    lib.add_builtin('string-ref', r.prim(r.p_spec('str', 'k'), function(str, k) {
      var c = str.s.charAt(k.n);
      if(!c) {
        throw new r.Error("Invalid index passed to string-ref!");
      }
      return new r.Value.Char(c);
    }));

    lib.add_builtin('string-append', r.prim(r.rest_spec('ls'), function(ls) {
      var str = _.reduce(ls, function(str, s) { return str + s.s; }, "");
      return new r.Value.Str(str);
    }));

    lib.add_builtin('substring', r.prim(r.p_spec('str', 'start', 'end'), function(str, start, end) {
      if(start.n >= 0 && start.n <= str.s.length &&
         end.n >= start.n &&  end.n <= str.s.length) {
        return new r.Value.Str(str.s.substring(start.n, end.n));
      } else {
        throw new r.Error("Invalid indices passed to substring");
      }
    }));


    return r;
  };

  return lib;

};
