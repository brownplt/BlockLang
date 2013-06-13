goog.provide('Ray.Test');

goog.require('Ray.Ray');
goog.require('Ray._');
goog.require('Ray.JQuery');
goog.require('Ray.Lib');

var assert = function(bool, message) {
  var tests = $("#tests > dl");
  var test_message = (bool ? "Test passed" : "Test failed") + ": " + message;
  var test_dt = $("<dt>" + test_message + "</li>");
  test_dt.addClass(bool ? "passed" : "failed");
  console.log("Test " + (bool ? "passed" : "failed") + "!");
  tests.append(test_dt);
  tests.append("<dd></dd>");
};

var describe = function(description) {
  var tests = $("#tests > dl");
  tests.append("<p>" + description + "</p>");
};

var display = function(expr, should_evaluate) {
  var tests = $("#tests > dl");
  var result = should_evaluate ? r.eval(expr) : expr;
  tests.append("<p><code>" + _.escape(r.display(result)) + "</code></p>");
}

var display_evaluation = function(expr) {
  var tests = $("#tests > dl");
  var result = r.eval(expr);
  tests.append("<p class=\"in\"><code>" +
                   _.escape(r.display(expr)) +
                   " </code>" +
                   "&rArr; <br></p>" +
                   "<p class=\"out\"><code>    " +
                   _.escape(r.display(result)) +
                   "</code></p>");
};


var assert_true = function(expr, name) {
  var result = r.eval(expr);
  var tests = $("#tests > dl");
  var test_dt = $("<dt>" + name + "</dt>");
  test_dt.addClass(result.b ? "passed" : "failed");
  tests.append(test_dt);
  var test_dd = $("<dd></dd>");
  test_dd.append("<code>" + _.escape(r.display(expr)) + "</code>")
  test_dd.append(" is true");
  tests.append(test_dd);
};

var assert_false = function(expr, name) {
  var result = r.eval(expr);
  var tests = $("#tests > dl");
  var test_dt = $("<dt>" + name + "</dt>");
  test_dt.addClass((!result.b) ? "passed" : "failed");
  tests.append(test_dt);
  var test_dd = $("<dd></dd>");
  test_dd.append("<code>" + _.escape(r.display(expr)) + "</code>")
  test_dd.append(" is false");
  tests.append(test_dd);
};

var assert_equals = function(expr, n, name) {
  var result = r.eval(expr);
  var tests = $("#tests > dl");
  var test_dt = $("<dt>" + name + "</dt>");
  test_dt.addClass(result.n === n ? "passed" : "failed");
  tests.append(test_dt);
  var test_dd = $("<dd></dd>");
  test_dd.append("<code>" + _.escape(r.display(expr)) + "</code>")
  test_dd.append(" is equal to " + String(n));
  tests.append(test_dd);
}

var end_tests = function() {
  var passed = $("#tests > dl > dt.passed").size();
  var failed = $("#tests > dl > dt.failed").size();
  var test_string = String(passed) + "/" + String(passed + failed);
  $("#tests").append("<p>Tests passed: (" + test_string + ")</p>");
  if(failed === 0) {
    $("#tests").append("<H1 class=\"perfect\">All tests passed!</H1>");
  } else {
    $("#tests").append("<p>Almost there!</p>");
  }
};

var print_lib = function(r) {
  $("#lib").prepend("<H2>Current builtins:</H2>");
  var lib_list = $("#lib > dl");
  _.each(r.builtins.dict({}), function(value, name) {
    var lib_dt = $("<dt><code>" + name + "</code></dt>");
    var lib_dd = $("<dd><code>" + _.escape(r.display(value)) + "</code></dd>");
    lib_list.append(lib_dt);
    lib_list.append(lib_dd);
  });
};

var create_testing_environment = function(R, lib) {
  $("#tests").append("<dl></dl>");
  $("#tests").prepend("<H2>Test results:</H2>")
  $("#lib").append("<dl></dl>");
  return lib.initialize(new R());
}

Ray.Test = function() {
  window.$ = Ray.JQuery;
  window._ = Ray._
  var R = Ray.Ray();
  var lib = Ray.Lib();
  var r = create_testing_environment(R, lib);
  window.r = r;
  print_lib(r);

  var gt_1 = r.app(r.name('>'), r.p_args(r.num(3), r.num(0)));
  assert_true(gt_1, "gt_1");
  var gt_2 = r.app(r.name('>'), r.p_args(r.num(3), r.num(3)));
  assert_false(gt_2, "gt_2");
  var gt_3 = r.app(r.name('>'), r.p_args(r.num(3), r.num(5)));
  assert_false(gt_2, "gt_3");
  
  var lt_1 = r.app(r.name('<'), r.p_args(r.num(1), r.num(2)));
  assert_true(lt_1, "lt_1");
  var lt_2 = r.app(r.name('<'), r.p_args(r.num(2), r.num(2)));
  assert_false(lt_2, "lt_2");
  var lt_3 = r.app(r.name('<'), r.p_args(r.num(3), r.num(2), r.num(3)));
  assert_false(lt_3, "lt_3");
  
  var ge_1 = r.app(r.name('>='), r.p_args(r.num(3), r.num(0)));
  assert_true(ge_1, "ge_1");
  var ge_2 = r.app(r.name('>='), r.p_args(r.num(3), r.num(3), r.num(3), r.num(1)));
  assert_true(ge_2, "ge_2");
  var ge_3 = r.app(r.name('>='), r.p_args(r.num(3), r.num(5)));
  assert_false(ge_3, "ge_3");
  var ge_4 = r.app(r.name('>='), r.p_args(r.num(3), r.num(0), r.num(-5), r.num(8)));
  assert_false(ge_4, "ge_4");
  
  var le_1 = r.app(r.name('<='), r.p_args(r.num(1), r.num(2), r.num(5), r.num(131234234)));
  assert_true(le_1, "le_1");
  var le_2 = r.app(r.name('<='), r.p_args(r.num(2), r.num(2)));
  assert_true(le_2, "le_2");
  var le_3 = r.app(r.name('<='), r.p_args(r.num(3), r.num(2), r.num(5)));
  assert_false(le_3, "le_3");

  var or_1 = r.or(r.bool(true), r.bool(false));
  assert_true(or_1, "or_1");
  var or_2 = r.or(r.bool(false), r.bool(true));
  assert_true(or_2, "or_2");
  var or_3 = r.or();
  assert_false(or_3, "or_3");
  var or_4 = r.or(r.num(4));
  assert_equals(or_4, 4, "or_4");
  var or_5 = r.or(r.bool(false), r.num(3));

  assert_equals(or_5, 3, "or_5");
  var and_1 = r.and(r.bool(true), r.bool(false));
  assert_false(and_1, "and_1");
  var and_2 = r.and(r.bool(false), r.bool(true));
  assert_false(and_2, "and_2");
  var and_3 = r.and();
  assert_true(and_3, "and_3");
  var and_4 = r.and(r.num(4));
  assert_equals(and_4, 4, "and_4");
  var and_5 = r.and(r.bool(true), r.num(3));
  assert_equals(and_5, 3, "and_5");

  var yes_bool = r.app(r.name('boolean?'), r.p_args(r.app(r.name('boolean?'), r.p_args(r.num(5)))));
  assert_true(yes_bool, "yes_bool");
  var no_bool = r.app(r.name('boolean?'), r.p_args(r.num(5)));
  assert_false(no_bool, "no_bool");

  var yes_pair = r.app(r.name('pair?'),
                       r.p_args(r.pair(r.num(1),r.num(2))));
  assert_true(yes_pair, "yes_pair");

  var no_pair = r.app(r.name('pair?'),
                      r.p_args(r.num(3)));
  assert_false(no_pair, "no_pair");

  var no_list1 = r.app(r.name('list?'),
                       r.p_args(r.pair(r.pair(r.num(4), r.num(8)), r.num(7))));
  assert_false(no_list1, "no_list1");

  var no_list2 = r.app(r.name('list?'),
                       r.p_args(r.num(3)));
  assert_false(no_list2, "no_list2");

  var yes_list1 = r.app(r.name('list?'),
                        r.p_args(r.pair(r.num(0), r.pair(r._null(), r._null()))));
  assert_true(yes_list1, "yes_list1");

  var yes_list2 = r.app(r.name('list?'),
                        r.p_args(r._null()));
  assert_true(yes_list2, "yes_list2");

  var add_0_arg = r.app(r.name('+'), r.p_args());
  assert_equals(add_0_arg, 0, "0 argument addition");

  var add_3_arg = r.app(r.name('+'), r.args(_.map([1, 2, 3], r.num), {}));
  assert_equals(add_3_arg, 6, "3 argument addition");

  var nested =
         r.app(
             r.app(
                 r.fn(
                     r.p_spec('x'),
                     r.fn(
                         r.p_spec('y'),
                         r.app(r.name('+'),
                               r.p_args(r.name('x'),r.name('y'))))),
                 r.p_args(r.num(4))),
             r.p_args(r.num(5)));
  assert_equals(nested, 9, "nested lambdas");
  var nested2 =
         r.app(
             r.app(
                 r.fn(
                     r.p_spec('x'),
                     r.fn(
                         r.p_spec('y'),
                         r.app(r.name('+'),
                               r.p_args(r.name('x'),r.name('x'))))),
                 r.p_args(r.num(4))),
             r.p_args(r.num(5)));
  assert_equals(nested2, 8, "closed over x");

  var if_test1 = r._if(r.app(r.name(">"), r.p_args(r.num(4),r.num(3))), r.num(8), r.num(9));
  assert_equals(if_test1, 8, "if_test1");

  var if_test2 = r._if(r.app(r.name(">"), r.p_args(r.num(3),r.num(4))), r.num(8), r.num(9));
  assert_equals(if_test2, 9, "if_test2");

  var cond_test1 = r.cond([[r.app(r.name('='), r.p_args(r.num(3), r.num(5))), r.num(6)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(4))), r.num(5)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(3))), r.num(3)]]);
  assert_equals(cond_test1, 3, "cond_test1");

  var cond_test2 = r.cond([[r.app(r.name('='), r.p_args(r.num(3), r.num(3))), r.num(6)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(4))), r.num(5)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(3))), r.num(3)]]);
  assert_equals(cond_test2, 6, "cond_test2");

  var cond_test3 = r.cond([[r.app(r.name('='), r.p_args(r.num(3), r.num(5))), r.num(6)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(4))), r.num(5)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(3))), r.num(3)]],
                          r.bool(false));
  assert_equals(cond_test3, 3, "cond_test3");

  var cond_test4 = r.cond([[r.app(r.name('='), r.p_args(r.num(3), r.num(5))), r.num(6)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(4))), r.num(5)],
                           [r.app(r.name('='), r.p_args(r.num(3), r.num(2))), r.num(3)]],
                          r.bool(false));
  assert_false(cond_test4, "cond_test4");

  var cond_test5 = r.cond([], r.num(8));
  assert_equals(cond_test5, 8, "cond_test5");
  var cond_test6 = r.cond([], r.bool(true));
  assert_true(cond_test6, "cond_test6");
  var cond_test7 = r.cond([], r.bool(false));
  assert_false(cond_test7, "cond_test7");



  describe("First, I bind <code>double</code> at the top level to:");
  var double = r.fn(r.p_spec('x'), r.app(r.name('*'), r.p_args(r.name('x'), r.num(2))));
  display(double, false);
  r.top_level_bind('double', double);
  describe("The binding is available everywhere.");
  display_evaluation(r.app(r.name('double'), r.p_args(r.num(5))));

  describe("Since top level bindings are visible everywhere, we can make recursive bindings.");
  describe("Here, I bind <code>last</code>:");
  var last = r.fn(r.p_spec('x'), r._if(r.app(r.name('null?'),
                                             r.p_args(r.app(r.name('cdr'),
                                                            r.p_args(r.name('x'))))),
                                       r.app(r.name('car'),
                                             r.p_args(r.name('x'))),
                                       r.app(r.name('last'),
                                             r.p_args(r.app(r.name('cdr'),
                                                            r.p_args(r.name('x')))))));
  display(last, false);
  r.top_level_bind('last', last);
  describe('It works as expected.');
  var last_of_5 = r.app(r.name('last'), r.p_args(r.app(r.name('list'), r.p_args(r.num(1), r.num(2), r.num(3), r.num(4), r.num(5)))));
  display_evaluation(last_of_5);

  describe("We can use any function defined at the top level in any other definition at the top level");
  describe("Let's define <code>double-last</code> as");
  var double_last = r.fn(r.p_spec('x'), r.app(r.name('double'), r.p_args(r.app(r.name('last'), r.p_args(r.name('x'))))));
  r.top_level_bind('double-last', double_last);
  display(double_last, false);
  describe("No surprises here.");
  var double_last_of_5 = r.app(r.name('double-last'), r.p_args(r.app(r.name('list'), r.p_args(r.num(1), r.num(2), r.num(3), r.num(4), r.num(5)))));
  display_evaluation(double_last_of_5);
  describe("If we now change a binding at the top level, this will be reflected in any other definitions that rely upon it");
  describe("I will now change the definition of <code>double</code> to a function of one argument that always just returns the string <code>\"double\"</code>");
  var double_str = r.fn(r.p_spec('x'), r.str("double"));
  r.top_level_bind('double', double_str);
  display_evaluation(r.app(r.name('double'), r.p_args(r.num(5))));
  display_evaluation(double_last_of_5);

  end_tests();

};

