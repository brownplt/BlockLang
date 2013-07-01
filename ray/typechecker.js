/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:01 PM
 */

goog.provide('Ray.TypeChecker');

goog.require('Ray.Globals');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray._');
goog.require('Ray.Env');

var R = Ray.Runtime;
var _ = Ray._;

var Expressions = Ray.Globals.Expressions;
var Values = Ray.Globals.Values;

var typecheck_list = function(list, ty_env) {
  switch(R.expr_type(list)) {
    case Expressions.Empty:
      return new Ray.Types.List(new Ray.Types.Bottom());
    case Expressions.Pair:
      var head = list.car;
      var head_type = typecheck_expr(head, ty_env);
      var next = list.cdr;
      while(R.expr_type(next) === Expressions.Pair) {
        if(!Ray.Types.is_match(head_type, next.car)) {
          return false;
        }
        next = next.cdr;
      }
      if(R.expr_type(next) === Expressions.Empty) {
        return new Ray.Types.List(head_type);
      } else {
        return false;
      }
    default:
      throw 'Not a list!';
  }
};

var typecheck_function_arguments = function(f_type, args, ty_env) {
  var args_type = f_type.argument_type;
  var list_of_types = args_type.p_arg_types.list;

  var p_args = args.p_args;
  if(p_args.length < list_of_types.length) {
    return false;
  }
  for(var i = 0; i < p_args.length; i++) {
    var p_arg_type = typecheck_expr(p_args[i], ty_env);
    if(!Ray.Types.is_match(p_arg_type, list_of_types[i])) {
      return false;
    }
  }
  if(!args_type.rest_arg_type) {
    return f_type.return_type;
  }
  var rest_arg_types = goog.array.map(p_args.slice(i), function(arg_type) {
    return typecheck_expr(arg_type, ty_env);
  });
  var rest_arg_element_type = args_type.rest_arg_type.base_type;
  var rest_args_good = goog.array.every(rest_arg_types, function(arg_type) {
    return arg_type && Ray.Types.is_match(arg_type, rest_arg_element_type);
  });
  return rest_args_good && f_type.return_type;
};

/**
 * What is the type of expr in ty_env, (and does it typecheck)?
 * @param {Ray.Expr} expr
 * @param {Ray.Env} ty_env
 * returns type of expr in ty_env or false if expr fails typechecking
 */
var typecheck_expr = function(expr, ty_env) {
  switch(R.expr_type(expr)) {

    case Expressions.Pair:
      return typecheck_list(expr, ty_env);

    case Expressions.Empty:
      return typecheck_list(expr, ty_env);

    case Expressions.Num:
      return new Ray.Types.Num();

    case Expressions.Char:
      return new Ray.Types.Char();

    case Expressions.Boolean:
      return new Ray.Types.Boolean();

    case Expressions.Str:
      return new Ray.Types.Str();

    case Expressions.Primitive:
      var arg_spec = expr.arg_spec;
      var args_type = arg_spec.arguments_type;
      return new Ray.Types.FunctionType(args_type, expr.body_type);

    case Expressions.Lambda:
      var arg_spec = expr.arg_spec;
      var p_args = arg_spec.p_args;
      var args_type = arg_spec.arguments_type;
      var p_arg_types = args_type.p_arg_types.list;
      var env = ty_env;
      for(var i = 0; i < p_arg_types.length; i++) {
        env = env.extend(p_args[i], p_arg_types[i]);
      }
      var body_ty = typecheck_expr(expr.body, env);
      return body_ty &&
             Ray.Types.is_match(body_ty, expr.body_type) &&
             new Ray.Types.FunctionType(args_type, body_ty);

    case Expressions.Name:
      return ty_env.lookup(expr.name) || typecheck_value(R.lookup(expr.name)) || false;

    case Expressions.Cond:
      var test_clauses = expr.test_clauses;
      var q_types = goog.array.map(test_clauses, function(clause) {
        var q = clause[0];
        return typecheck_expr(q, ty_env);
      });
      var bool = new Ray.Types.Boolean();
      var question_types_good = goog.array.every(q_types, function(q_type) {
        return q_type && Ray.Types.is_match(bool, q_type);
      });
      if(!question_types_good) {
        return false;
      }
      var answer_types = goog.array.map(test_clauses, function(clause) {
        var a = clause[1];
        return typecheck_expr(a, ty_env);
      });

      if(expr.else_clause) {
        answer_types.push(typecheck_expr(expr.else_clause, ty_env));
      }
      // There has to be at least one answer,
      // after adding the else clause answer
      var first_answer_type = answer_types[0];
      // Do all the answers have the same type?
      var a_types_good = goog.array.every(answer_types.slice(1), function(answer_type) {
        return answer_type && Ray.Types.is_match(first_answer_type, answer_type);
      });

      return a_types_good && first_answer_type;

    case Expressions.If:
      var pred_type = typecheck_expr(expr.pred, ty_env);
      if(!pred_type) {
        return false;
      }
      var then_type = typecheck_expr(expr.t_expr, ty_env);
      var else_type = typecheck_expr(expr.f_expr, ty_env);
      return Ray.Types.is_match(then_type, else_type) && then_type;

    case Expressions.And:
      var arg_types = goog.array.map(expr.args, function(arg) {
        return typecheck_expr(arg, ty_env);
      });
      var bool = new Ray.Types.Boolean();
      return goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.is_match(bool, arg_type);
      }) && bool;

    case Expressions.Or:
      var arg_types = goog.array.map(expr.args, function(arg) {
        return typecheck_expr(arg, ty_env);
      });
      var bool = new Ray.Types.Boolean();
      return goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.is_match(bool, arg_type);
      }) && bool;

    case Expressions.App:
      var f_type = typecheck_expr(expr.f, ty_env);
      return f_type && typecheck_function_arguments(f_type, expr.args, ty_env);

    case Expressions.Arguments:
      throw 'Should typecheck arguments in App!';
    case Expressions.ArgumentSpec:
      throw 'Should typecheck argument specification in primitive or lambda!';
    default:
      throw 'Unknown variant of expression!';
  }
};

var typecheck_value = function(value, ty_env) {
  switch(R.value_type(value)) {

    case Values.Pair:
      return typecheck_list(value, ty_env);

    case Values.Empty:
      return typecheck_list(value, ty_env);

    case Values.Num:
      return new Ray.Types.Num();

    case Values.Char:
      return new Ray.Types.Char();

    case Values.Str:
      return new Ray.Types.Str();

    case Values.Boolean:
      return new Ray.Types.Boolean();

    case Values.Primitive:
      var arg_spec = value.arg_spec;
      var args_type = arg_spec.arguments_type;
      return new Ray.Types.FunctionType(args_type, value.body_type);

    case Values.Closure:
      var arg_spec = value.arg_spec;
      var args_type = arg_spec.arguments_type;
      return new Ray.Types.FunctionType(args_type, value.body_type);

    case Values.ArgumentSpec:
      throw 'Should typecheck arguments in App!';
    case Values.Arguments:
      throw 'Should typecheck argument specifications in primitive or closure!';
    default:
      throw 'Unknown variant of value!';
  }
};

Ray.TypeChecker.typecheck = function(expr) {
  return typecheck_expr(expr, Ray.Env.empty_env());
};