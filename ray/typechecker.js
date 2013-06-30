/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:01 PM
 */

goog.provide('Ray.TypeChecker');

goog.require('Ray.Enums');
goog.require('Ray.Kernel');
goog.require('Ray.Types');
goog.require('Ray._');

var _ = Ray._;

var Expressions = Ray.Enums.Expressions;

var typecheck_pair = function(pair) {
  var car_type = pair.car;

}

/**
 * What is the type of expr in ty_env, (and does it typecheck)?
 * @param {Ray.Expr} expr
 * @param {Ray.Env} ty_env
 * @returns {?Ray.Types} type of expr in ty_env or false if expr fails typechecking
 */
var typecheck = function(expr, ty_env) {
  switch(expr.R.expr_type(expr)) {
    case(Expressions.Pair):
      var car = expr.car;
      var cdr = expr.cdr;
      // TODO, FILL IN HERE
      return Ray.Types.is_match();
      break;
    case(Expressions.Empty):
      return new Ray.Types.List(new Ray.Types.Bottom());
    case(Expressions.Num):
      return new Ray.Types.Num();
    case(Expressions.Char):
      return new Ray.Types.Char();
    case(Expressions.Boolean):
      return new Ray.Types.Boolean();
    case(Expressions.Str):
      return new Ray.Types.Str();
    case(Expressions.Primitive):
      return true;
    case(Expressions.Lambda):
      var arg_spec = expr.arg_spec;
      var p_args = arg_spec.p_args;
      var args_type = arg_spec.args_type;
      var p_arg_types = args_type.p_arg_types.list;
      var env = ty_env;
      for(var i = 0; i < p_arg_types.length; i++) {
        env = env.extend(p_args[i], p_arg_types[i]);
      }
      var body = expr.body;
      var body_ty = typecheck(expr.body, env);
      return body_ty &&
             Ray.Types.is_match(body_ty, expr.body_type) &&
             new Ray.Types.FunctionType(args_type, body_ty);
    case(Expressions.Name):
      return ty_env.lookup(expr.name) || false;
    case(Expressions.Cond):
      var test_clauses = expr.test_clauses;
      var q_types = goog.array.map(test_clauses, function(clause) {
        var q = clause[0];
        return typecheck(q, ty_env);
      });
      var bool = new Ray.Types.Boolean();
      var q_types_good = goog.array.every(q_types, function(q_type) {
        return q_type && Ray.Types.is_match(bool, q_type);
      });
      if(!q_types_good) {
        return false;
      }
      var a_types = goog.array.map(test_clauses, function(clause) {
        var a = clause[1];
        return typecheck(a, ty_env);
      });
      var a_types_good = goog.array.reduce(a_types, function(result, a_type) {
        return result && Ray.Types.is_match(result, a_type);
      });
      if(!a_types_good) {
        return false;
      }
      return goog.array.every
      break;
    case(Expressions.If):
      break;
    case(Expressions.And):
      break;
    case(Expressions.Or):
      break;
    case(Expressions.App):
      break;
    case(Expressions.Arguments):
      break;
    case(Expressions.ArgumentSpec):
      break;

  }



  }

};