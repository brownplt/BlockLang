define(["jquery", "underscore", "rack"], function($, _, R) { 

  var global = this;

  var assert = function(bool, message) { 
    var tests = $("#tests");
    var test_message = (bool ? "Test passed" : "Test failed") + ": " + message;
    var test_li = $("<li>" + test_message + "</li>");
    test_li.attr("id", bool ? "passed" : "failed");
    tests.append(test_li);
  };

  global.assert = assert;

  _.each(R, function(v, k) { 
    global[k] = v;
  });

  /**
   * @desc Helper object to make constructing all this stuff easier
   */
  var make_r = function(r) { 
    var _r = { 
      app: function(f, args) { 
	return new r.App(f, args);
      },
      prim: function(arg_spec, f) { 
	return new r.Primitive(arg_spec, f);
      },
      args: function(p_args, kw_args) { 
	return new r.Arguments(p_args, kw_args);
      },
      name: function(name_arg) { 
	return new r.Name(name_arg);
      },
      spec: function(dict) { 
	return new r.ArgumentSpec(dict);
      },
      fn: function(arg_spec, body) { 
	return new r.Function(arg_spec, body);
      }, 
      int: function(i) { 
	return new r.Int(i);
      }
    };
    return _r;
  };

  return function() { 
    $("body").append("<ul id=\"tests\"></ul>");
    var tests = $("#tests");
    var r = new R();
    var _r = make_r(r);
    var self = this;
    _.each(_r, function(v,k) { 
      r[k] = v;
    });

    r.bind("+", r.prim(
	     r.spec({'rest_arg': 'ls'}),
	     function(ls) { 
	       var sum = _.reduce(ls, function(a, b) { return a + b; }, 0);
	       return r.int(sum);
	     })
	  );

    assert(_.keys(r.names).length === 1, "should only be 1 binding");
    r.bind("nested", 
	   r.app(
	     r.app(
	       r.fn(r.spec({'p_args': ['x']}),
		  r.fn(r.spec({'p_args': ['y']}),
		     r.app(r.name('+'), 
			 r.args([r.name('x'),r.name('y')])))),
	       r.args([r.int(4)])), 
	     r.args([r.int(5)])));

    assert(_.keys(r.names).length === 2, "should only be 2 bindings");

    var add_3_arg = r.app(r.name('+'), r.args([r.int(1), r.int(2), r.int(3)]));
    assert(r.eval(add_3_arg).get() === 6, "3 argument addition");
    var nested = r.name("nested");
    assert(r.eval(nested).get() === 9, "nested lambdas");

    global.r = r;
    
  };

});
