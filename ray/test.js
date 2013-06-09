goog.provide('ray.test');

goog.require('ray.ray');
goog.require('ray.underscore');
goog.require('ray.jquery');
goog.require('ray.lib');

var assert = function(bool, message) {
  var tests = $("#tests > dl");
  var test_message = (bool ? "Test passed" : "Test failed") + ": " + message;
  var test_dt = $("<dt>" + test_message + "</li>");
  test_dt.addClass(bool ? "passed" : "failed");
  console.log("Test " + (bool ? "passed" : "failed") + "!");
  tests.append(test_dt);
  tests.append("<dd></dd>");
};

var assert_true = function(expr, name) {
  var result = r.eval(expr);
  var tests = $("#tests > dl");
  var test_dt = $("<dt>" + name + "</dt>");
  test_dt.addClass(result.b ? "passed" : "failed");
  tests.append(test_dt);
  var test_dd = $("<dd></dd>");
  test_dd.append("<pre>" + _.escape(r.display(expr)) + "</pre>")
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
  test_dd.append("<pre>" + _.escape(r.display(expr)) + "</pre>")
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
  test_dd.append("<pre>" + _.escape(r.display(expr)) + "</pre>")
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
  $("#lib").prepend("<p>Current builtins:</p>");
  var lib_list = $("#lib > dl");
  _.each(r.builtins, function(value, name) {
    var lib_dt = $("<dt><pre>" + name + "</pre></dt>");
    var lib_dd = $("<dd><pre>" + _.escape(r.display(value)) + "</pre></dd>");
    lib_list.append(lib_dt);
    lib_list.append(lib_dd);
  });
};

var create_testing_environment = function(R, lib) {
  $("#tests").append("<dl></dl>");
  $("#tests").prepend("Test results:")
  $("#lib").append("<dl></dl>");
  return lib.initialize(new R());
}

ray.test = function() {
  window.$ = ray.jquery;
  window._ = ray.underscore;
  var R = ray.ray();
  var lib = ray.lib();
  var r = create_testing_environment(R, lib);
  window.r = r;
  print_lib(r);

  var gt_1 = r.app(r.name('>'), r.p_args(r.num(3), r.num(0)));
  assert_true(gt_1, "gt_1");
  var gt_2 = r.app(r.name('>'), r.p_args(r.num(3), r.num(3)));
  assert_false(gt_2, "gt_2");
  var gt_3 = r.app(r.name('>'), r.p_args(r.num(3), r.num(5)));
  assert_false(gt_2, "gt_3");

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

  end_tests();

};

