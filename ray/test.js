goog.provide('ray.test');

goog.require('ray.ray');
goog.require('ray.underscore');
goog.require('ray.jquery');
goog.require('ray.lib');

var assert = function(bool, message) {
    var tests = $("#tests");
    var test_message = (bool ? "Test passed" : "Test failed") + ": " + message;
    var test_li = $("<li>" + test_message + "</li>");
    test_li.addClass(bool ? "passed" : "failed");
    console.log("Test " + (bool ? "passed" : "failed") + "!");
    tests.append(test_li);
};

var end_tests = function() {
    var passed = $("#tests > li.passed").size();
    var failed = $("#tests > li.failed").size();
    var test_string = String(passed) + "/" + String(passed + failed);
    $("body").append("<p>Tests passed: (" + test_string + ")</p>");
    if(failed === 0) {
        $("body").append("<H1 class=\"perfect\">All tests passed!</H1>");
    } else {
        $("body").append("<p>Almost there!</p>");
    }
};

ray.test = function() {

    var $ = ray.jquery;
    var _ = ray.underscore;
    var R = ray.ray();
    var lib = ray.lib();

    var global = this;

    _.each(R, function(v, k) {
        global[k] = v;
    });

    window.$ = $;

    $("body").append("<ul id=\"tests\"></ul>");
    var tests = $("#tests");
    var r = lib.initialize(new R());

    var gt_1 = r.app(r.name('>'), r.p_args(r.num(3), r.num(0)));
    assert(r.eval(gt_1).b === true, "gt_1");
    var gt_2 = r.app(r.name('>'), r.p_args(r.num(3), r.num(3)));
    assert(r.eval(gt_2).b === false, "gt_2");
    var gt_3 = r.app(r.name('>'), r.p_args(r.num(3), r.num(5)));
    assert(r.eval(gt_2).b === false, "gt_3");



    var or_1 = r.or(r.bool(true), r.bool(false));
    assert(r.eval(or_1).b === true, "or_1");
    var or_2 = r.or(r.bool(false), r.bool(true));
    assert(r.eval(or_2).b === true, "or_2");
    var or_3 = r.or();
    assert(r.eval(or_3).b === false, "or_3");   
    var or_4 = r.or(r.num(4));
    assert(r.eval(or_4).n === 4, "or_4");
    var or_5 = r.or(r.bool(false), r.num(3));
    assert(r.eval(or_5).n === 3, "or_5");
    var and_1 = r.and(r.bool(true), r.bool(false));
    assert(r.eval(and_1).b === false, "and_1");
    var and_2 = r.and(r.bool(false), r.bool(true));
    assert(r.eval(and_2).b === false, "and_2");
    var and_3 = r.and();
    assert(r.eval(and_3).b === true, "and_3");
    var and_4 = r.and(r.num(4));
    assert(r.eval(and_4).n === 4, "and_4");
    var and_5 = r.and(r.bool(true), r.num(3));
    assert(r.eval(and_5).n === 3, "and_5");

    var yes_pair = r.app(r.name('pair?'), 
                         r.p_args(r.pair(r.num(1),r.num(2))));
    assert(r.eval(yes_pair).b === true, "yes_pair");

    var no_pair = r.app(r.name('pair?'), 
                        r.p_args(r.num(3)));
    assert(r.eval(no_pair).b === false, "no_pair");

    var no_list1 = r.app(r.name('list?'),
                         r.p_args(r.pair(r.pair(r.num(4), r.num(8)), r.num(7))));
    assert(r.eval(no_list1).b === false, "no_list1");

    var no_list2 = r.app(r.name('list?'),
                         r.p_args(r.num(3)));
    assert(r.eval(no_list2).b === false, "no_list2");

    var yes_list1 = r.app(r.name('list?'),
                          r.p_args(r.pair(r.num(0), r.pair(r._null(), r._null()))));
    assert(r.eval(yes_list1).b === true, "yes_list1");

    var yes_list2 = r.app(r.name('list?'),
                          r.p_args(r._null()));
    assert(r.eval(yes_list2).b === true, "yes_list2");

    var add_0_arg = r.app(r.name('+'), r.p_args());
    assert(r.eval(add_0_arg).n === 0, "0 argument addition");

    var add_3_arg = r.app(r.name('+'), r.args(_.map([1, 2, 3], r.num), {}));
    assert(r.eval(add_3_arg).n === 6, "3 argument addition");

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
    assert(r.eval(nested).n === 9, "nested lambdas");

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
    assert(r.eval(nested2).n === 8, "closed over x");

    var if_test1 = r._if(r.app(r.name(">"), r.p_args(r.num(4),r.num(3))), r.num(8), r.num(9));
    assert(r.eval(if_test1).n === 8, "if_test1");

    var if_test2 = r._if(r.app(r.name(">"), r.p_args(r.num(3),r.num(4))), r.num(8), r.num(9));
    assert(r.eval(if_test2).n === 9, "if_test2");

    end_tests();

    global.r = r;

};

