define(["jquery", "../underscore", "ray", "lib"], function($, _, R, lib) {

  var global = this;

  var assert = function(bool, message) {
    var tests = $("#tests");
    var test_message = (bool ? "Test passed" : "Test failed") + ": " + message;
    var test_li = $("<li>" + test_message + "</li>");
    test_li.attr("id", bool ? "passed" : "failed");
    console.log("Test " + (bool ? "passed" : "failed") + "!");
    tests.append(test_li);
  };

  global.assert = assert;

  _.each(R, function(v, k) {
    global[k] = v;
  });

  return function() {
    $("body").append("<ul id=\"tests\"></ul>");
    var tests = $("#tests");
    var r = lib.initialize(new R());

    var yes_pair = r.app(r.name('pair?'), 
                         r.p_args(r.pair(r.num(1),r.num(2))));
    assert(r.eval(yes_pair).get() === true, "yes_pair");

    var no_pair = r.app(r.name('pair?'), 
                        r.p_args(r.num(3)));
    assert(r.eval(no_pair).get() === false, "no_pair");

    var yes_list = r.app(r.name('list?'), 
                         r.p_args(r.pair(r.num(0), r.pair(r._null, r._null))));
    assert(r.eval(yes_list).get() === true, "yes_list");

    var no_list = r.app(r.name('list?'), 
                        r.p_args(r.pair(r.pair(r.num(4), r.num(8)), r.num(7))));
    assert(r.eval(no_list).get() === false, "no_list");                                

    var add_0_arg = r.app(r.name('+'), r.args());
    assert(r.eval(add_0_arg).get() === 0, "0 argument addition");
    var add_3_arg = r.app(r.name('+'), r.args(_.map([1, 2, 3], r.num)));
    assert(r.eval(add_3_arg).get() === 6, "3 argument addition");

    r.bind("nested",
	   r.app(
	     r.app(
	       r.fn(
           r.p_spec('x'),
		       r.fn(
             r.p_spec('y'),
		         r.app(r.name('+'),
			       r.p_args(r.name('x'),r.name('y'))))),
	       r.p_args(r.num(4))),
	     r.p_args(r.num(5))));
    var nested = r.name("nested");
    assert(r.eval(nested).get() === 9, "nested lambdas");

    r.bind("nested2",
	   r.app(
       r.app(
	       r.fn(
           r.p_spec('x'),
		       r.fn(
             r.p_spec('y'),
		         r.app(r.name('+'),
			           r.p_args(r.name('x'),r.name('x'))))),
	       r.p_args(r.num(4))),
	     r.p_args(r.num(5))));
    var nested2 = r.name("nested2");
    assert(r.eval(nested2).get() === 8, "closed over x");

    var if_test1 = r._if(r.app(r.name(">"), r.p_args(r.num(4),r.num(3))), r.num(8), r.num(9));
    assert(r.eval(if_test1).get() === 8, "if_test1");

    var if_test2 = r._if(r.app(r.name(">"), r.p_args(r.num(3),r.num(4))), r.num(8), r.num(9));
    assert(r.eval(if_test2).get() === 9, "if_test2");

    global.r = r;

  };

});
