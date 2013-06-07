define(["jquery", "../underscore", "ray"], function($, _, R) {

  var lib = {};

  lib.make_predicate = function(r,type) {
    return r.prim(r.p_spec('x'), function(x) {
      return new r.Value.Boolean(r.type(x) === type);
    });
  };

  lib.initialize = function(r) {
    var _r = r.make_helper();
    var self = this;
    _.each(_r, function(v,k) {
      r[k] = v;
    });

    r.bind("+", r.prim(r.rest_spec('ls'), function(ls) {
	    var sum = _.reduce(ls, function(a, b) { return r.numbers.add(a, b.n); }, 0);
      return r.num(sum);
	  }));
    r.bind("boolean?", lib.make_predicate(r, 'boolean'));
    r.bind("pair?", lib.make_predicate(r, 'pair'));
    r.bind("car", r.prim(r.p_spec('x'), function(x) { 
      return x.car;
    }));
    r.bind("cdr", r.prim(r.p_spec('x'), function(x) { 
      return x.cdr;
    }));
    r.bind("null?", lib.make_predicate(r, 'null'));
    r.bind("list?", r.fn(r.p_spec('x'),
      r.or(r.app(r.name('null?'), r.p_args(r.name('x'))),
           r.and(r.app(r.name('pair?'), 
                       r.p_args(r.name('x'))),
                 r.app(r.name('list?'), 
                       r.p_args(r.app(r.name('cdr'), 
                                      r.p_args(r.name('x')))))
                )
          )));

    r.bind(">", r.prim(r.p_spec('x','y'), function(x,y) { return r.bool(r.numbers.greaterThan(x.get(),y.get())); }));
    return r;
  };

  return lib;

});
