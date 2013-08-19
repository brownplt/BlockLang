goog.provide('Ray.Test');

goog.require('Ray.Runtime');
goog.require('Ray.JQuery');
goog.require('Ray.Lib');
goog.require('Ray.Types');
goog.require('Ray.Typechecker');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.functions');
goog.require('goog.string');

var RT = Ray.Runtime;
var $ = Ray.JQuery;

var typecheck = Ray.Typechecker.typecheck;

var testClass = function(bool) {
  return bool ? 'passed' : 'failed';
};

var assert = function(expr, verify, statement, test_name) {
  if(!typecheck(expr)) {
    throw 'Failed to typecheck!';
  }
  var result = RT.eval(expr);
  var bool = verify(result);
  var tests = $("#tests > dl");
  var test_dt = $("<dt>" + test_name + "</dt>");
  test_dt.addClass(testClass(bool));
  tests.append(test_dt);
  console.log("Test " + testClass(bool) + "!");
  var test_dd = $("<dd></dd>");
  test_dd.append("<code>" + goog.string.htmlEscape(RT.display(expr)) + "</code>");
  test_dd.append(' ' + statement);
  tests.append(test_dd);
};

var describe = function(description) {
  var tests = $("#tests > dl");
  tests.append("<p>" + description + "</p>");
};

var display = function(expr, should_evaluate) {
  var tests = $("#tests > dl");
  var result = should_evaluate ? RT.eval(expr) : expr;
  tests.append("<p><code>" + goog.string.htmlEscape(RT.display(result)) + "</code></p>");
}

var displayEvaluation = function(expr) {
  var tests = $("#tests > dl");
  var result = RT.eval(expr);
  tests.append("<p class=\"in\"><code>" +
                   goog.string.htmlEscape(RT.display(expr)) +
                   " </code>" +
                   "&rArr; <br></p>" +
                   "<p class=\"out\"><code>    " +
                   goog.string.htmlEscape(RT.display(result)) +
                   "</code></p>");
};

var assertTrue = function(expr, name) {
  assert(expr, function(result) { return result.b; }, 'is true', name);
};

var assertFalse = function(expr, name) {
  assert(expr, function(result) { return !result.b; }, 'is false', name);
};

var assertEquals = function(expr, n, name) {
  var verify = function(result) {
    return result.n === n;
  };
  var statement = 'is equal to ' + String(n);
  assert(expr, verify, statement, name);
};

var endTests = function() {
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

var printLib = function() {
  $("#lib").prepend("<H2>Current builtins:</H2>");
  var lib_list = $("#lib > dl");
  goog.object.forEach(RT.builtins.dict({}), function(value, name) {
    var lib_dt = $("<dt><code>" + name + "</code></dt>");
    var lib_dd = $("<dd><code>" + goog.string.htmlEscape(r.display(value)) + "</code></dd>");
    lib_list.append(lib_dt);
    lib_list.append(lib_dd);
  });
};

var createTestingEnvironment = function() {
  $("#tests").append("<dl></dl>");
  $("#tests").prepend("<H2>Test results:</H2>")
  $("#lib").append("<dl></dl>");
};

Ray.Test = function() {
  if(!Ray.Lib.isInitialized()) {
    Ray.Lib.initialize();
  }

  createTestingEnvironment();
  printLib();

  var gt_1 = RT.app(RT.name('>'), RT.positionalArgs(RT.num(3), RT.num(0)));
  assertTrue(gt_1, "gt_1");
  var gt_2 = RT.app(RT.name('>'), RT.positionalArgs(RT.num(3), RT.num(3)));
  assertFalse(gt_2, "gt_2");
  var gt_3 = RT.app(RT.name('>'), RT.positionalArgs(RT.num(3), RT.num(5)));
  assertFalse(gt_2, "gt_3");
  
  var lt_1 = RT.app(RT.name('<'), RT.positionalArgs(RT.num(1), RT.num(2)));
  assertTrue(lt_1, "lt_1");
  var lt_2 = RT.app(RT.name('<'), RT.positionalArgs(RT.num(2), RT.num(2)));
  assertFalse(lt_2, "lt_2");
  var lt_3 = RT.app(RT.name('<'), RT.positionalArgs(RT.num(3), RT.num(2)));
  assertFalse(lt_3, "lt_3");
  
  var ge_1 = RT.app(RT.name('>='), RT.positionalArgs(RT.num(3), RT.num(0)));
  assertTrue(ge_1, "ge_1");
  var ge_2 = RT.app(RT.name('>='), RT.positionalArgs(RT.num(3), RT.num(3)));
  assertTrue(ge_2, "ge_2");
  var ge_3 = RT.app(RT.name('>='), RT.positionalArgs(RT.num(3), RT.num(5)));
  assertFalse(ge_3, "ge_3");
  /*var ge_4 = RT.app(RT.name('>='), RT.positionalArgs(RT.num(3), RT.num(0), RT.num(-5), RT.num(8)));
  assertFalse(ge_4, "ge_4");*/
  
  var le_1 = RT.app(RT.name('<='), RT.positionalArgs(RT.num(1), RT.num(2)));
  assertTrue(le_1, "le_1");
  var le_2 = RT.app(RT.name('<='), RT.positionalArgs(RT.num(2), RT.num(2)));
  assertTrue(le_2, "le_2");
  var le_3 = RT.app(RT.name('<='), RT.positionalArgs(RT.num(3), RT.num(2)));
  assertFalse(le_3, "le_3");

  var or_1 = RT.or(RT.bool(true), RT.bool(false));
  assertTrue(or_1, "or_1");
  var or_2 = RT.or(RT.bool(false), RT.bool(true));
  assertTrue(or_2, "or_2");
  var or_3 = RT.or();
  assertFalse(or_3, "or_3");
  /*var or_4 = RT.or(RT.num(4));
  assertEquals(or_4, 4, "or_4");
  var or_5 = RT.or(RT.bool(false), RT.num(3));
  assertEquals(or_5, 3, "or_5");*/

  var and_1 = RT.and(RT.bool(true), RT.bool(false));
  assertFalse(and_1, "and_1");
  var and_2 = RT.and(RT.bool(false), RT.bool(true));
  assertFalse(and_2, "and_2");
  var and_3 = RT.and();
  assertTrue(and_3, "and_3");
  /*var and_4 = RT.and(RT.num(4));
  assertEquals(and_4, 4, "and_4");
  var and_5 = RT.and(RT.bool(true), RT.num(3));
  assertEquals(and_5, 3, "and_5");*/

  var yes_bool = RT.app(RT.name('boolean?'), RT.positionalArgs(RT.app(RT.name('boolean?'), RT.positionalArgs(RT.num(5)))));
  assertTrue(yes_bool, "yes_bool");
  var no_bool = RT.app(RT.name('boolean?'), RT.positionalArgs(RT.num(5)));
  assertFalse(no_bool, "no_bool");

  var yes_pair = RT.app(RT.name('pair?'),
                       RT.positionalArgs(RT.pair(RT.num(1),RT.num(2))));
  assertTrue(yes_pair, "yes_pair");

  var no_pair = RT.app(RT.name('pair?'),
                      RT.positionalArgs(RT.num(3)));
  assertFalse(no_pair, "no_pair");

  var no_list1 = RT.app(RT.name('list?'),
                       RT.positionalArgs(RT.pair(RT.pair(RT.num(4), RT.num(8)), RT.num(7))));
  assertFalse(no_list1, "no_list1");

  var no_list2 = RT.app(RT.name('list?'),
                       RT.positionalArgs(RT.num(3)));
  assertFalse(no_list2, "no_list2");

  var yes_list1 = RT.app(RT.name('list?'),
                        RT.positionalArgs(RT.pair(RT.num(0), RT.pair(RT.empty(), RT.empty()))));
  assertTrue(yes_list1, "yes_list1");

  var yes_list2 = RT.app(RT.name('list?'),
                        RT.positionalArgs(RT.empty()));
  assertTrue(yes_list2, "yes_list2");

  /*var add_0_arg = RT.app(RT.name('+'), RT.positionalArgs());
  assertEquals(add_0_arg, 0, "0 argument addition");

  var add_3_arg = RT.app(RT.name('+'), RT.args(goog.array.map([1, 2, 3], RT.num), {}));
  assertEquals(add_3_arg, 6, "3 argument addition");*/

  var nested =
         RT.app(
             RT.app(
                 RT.fn(
                     RT.p_spec(['x', Ray.Types.num()]),
                     RT.fn(
                         RT.p_spec(['y', Ray.Types.num()]),
                         RT.app(RT.name('+'),
                               RT.positionalArgs(RT.name('x'),RT.name('y'))),
                         Ray.Types.num()),
                     Ray.Types.fn(Ray.Types.positionalArgs(Ray.Types.num()), Ray.Types.num())),
                 RT.positionalArgs(RT.num(4))),
             RT.positionalArgs(RT.num(5)));
  assertEquals(nested, 9, "nested lambdas");
  var nested2 =
         RT.app(
             RT.app(
                 RT.fn(
                     RT.p_spec(['x', Ray.Types.num()]),
                     RT.fn(
                         RT.p_spec(['y', Ray.Types.num()]),
                         RT.app(RT.name('+'),
                               RT.positionalArgs(RT.name('x'),RT.name('x'))),
                         Ray.Types.num()),
                     Ray.Types.fn(Ray.Types.positionalArgs(Ray.Types.num()), Ray.Types.num())),
                 RT.positionalArgs(RT.num(4))),
             RT.positionalArgs(RT.num(5)));
  assertEquals(nested2, 8, "closed over x");

  var if_test1 = RT._if(RT.app(RT.name(">"), RT.positionalArgs(RT.num(4),RT.num(3))), RT.num(8), RT.num(9));
  assertEquals(if_test1, 8, "if_test1");

  var if_test2 = RT._if(RT.app(RT.name(">"), RT.positionalArgs(RT.num(3),RT.num(4))), RT.num(8), RT.num(9));
  assertEquals(if_test2, 9, "if_test2");

  var cond_test1 = RT.cond([[RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(5))),
                            RT.num(6)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(4))),
                            RT.num(5)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(3))),
                            RT.num(3)]]);
  assertEquals(cond_test1, 3, "cond_test1");

  var cond_test2 = RT.cond([[RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(3))), RT.num(6)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(4))), RT.num(5)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(3))), RT.num(3)]]);
  assertEquals(cond_test2, 6, "cond_test2");

  var cond_test3 = RT.cond([[RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(5))),
                            RT.num(6)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(4))),
                            RT.num(5)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(3))),
                            RT.num(3)]],
                          RT.num(7));
  assertEquals(cond_test3, 3, "cond_test3");

  var cond_test4 = RT.cond([[RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(5))),
                            RT.num(6)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(4))),
                            RT.num(5)],
                           [RT.app(RT.name('='), RT.positionalArgs(RT.num(3), RT.num(2))),
                            RT.num(3)]],
                          RT.num(8));
  assertEquals(cond_test4, 8, "cond_test4");

  var cond_test5 = RT.cond([], RT.num(8));
  assertEquals(cond_test5, 8, "cond_test5");
  var cond_test6 = RT.cond([], RT.bool(true));
  assertTrue(cond_test6, "cond_test6");
  var cond_test7 = RT.cond([], RT.bool(false));
  assertFalse(cond_test7, "cond_test7");



  describe("First, I bind <code>double</code> at the top level to:");
  var double = RT.fn(RT.p_spec(['x', Ray.Types.num()]),
                    RT.app(RT.name('*'), RT.positionalArgs(RT.name('x'), RT.num(2))), Ray.Types.num());
  display(double, false);
  RT.bindTopLevel('double', double);
  describe("The binding is available everywhere.");
  displayEvaluation(RT.app(RT.name('double'), RT.positionalArgs(RT.num(5))));

  describe("Since top level bindings are visible everywhere, we can make recursive bindings.");
  describe("Here, I bind <code>last</code>:");
  var last = RT.fn(RT.p_spec(['x', Ray.Types.list(Ray.Types.num())]), RT._if(RT.app(RT.name('empty?'),
                                             RT.positionalArgs(RT.app(RT.name('cdr'),
                                                            RT.positionalArgs(RT.name('x'))))),
                                       RT.app(RT.name('car'),
                                             RT.positionalArgs(RT.name('x'))),
                                       RT.app(RT.name('last'),
                                             RT.positionalArgs(RT.app(RT.name('cdr'),
                                                            RT.positionalArgs(RT.name('x')))))),
                  Ray.Types.num());
  display(last, false);
  RT.bindTopLevel('last', last);
  describe('It works as expected.');
  var last_of_5 = RT.app(RT.name('last'), RT.positionalArgs(RT.app(RT.name('list'), RT.positionalArgs(RT.num(1), RT.num(2), RT.num(3), RT.num(4), RT.num(5)))));
  displayEvaluation(last_of_5);

  describe("We can use any function defined at the top level in any other definition at the top level");
  describe("Let's define <code>double-last</code> as");
  var double_last = RT.fn(RT.p_spec(['x', Ray.Types.list(Ray.Types.num())]),
                         RT.app(RT.name('double'), RT.positionalArgs(RT.app(RT.name('last'), RT.positionalArgs(RT.name('x'))))),
                         Ray.Types.num());
  RT.bindTopLevel('double-last', double_last);
  display(double_last, false);
  describe("No surprises here.");
  var double_last_of_5 = RT.app(RT.name('double-last'), RT.positionalArgs(RT.app(RT.name('list'), RT.positionalArgs(RT.num(1), RT.num(2), RT.num(3), RT.num(4), RT.num(5)))));
  displayEvaluation(double_last_of_5);

  describe("If we now change a binding at the top level, this will be reflected in any other definitions that rely upon it");
  describe("I will now change the definition of <code>double</code> to a function of one argument that always just returns the string <code>\"double\"</code>");
  var double_str = RT.fn(RT.p_spec(['x', Ray.Types.num()]), RT.str("double"), Ray.Types.str());
  RT.bindTopLevel('double', double_str);
  displayEvaluation(RT.app(RT.name('double'), RT.positionalArgs(RT.num(5))));
  displayEvaluation(double_last_of_5);

  endTests();

};

