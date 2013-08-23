/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:01 PM
 */

goog.provide('Ray.Typechecker');

goog.require('Ray.Globals');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Env');

var R = Ray.Runtime;

var Expressions = Ray.Globals.Expressions;
var Values = Ray.Globals.Values;

var typecheckList = function(list, type, typeEnv) {
  switch(R.exprType(list)) {
    case Expressions.Empty:
      var list_ty = new Ray.Types.List(new Ray.Types.Unknown());
      return Ray.Types.areMatchingTypes(type, list_ty) && list_ty;
    case Expressions.Pair:
      if(type.outputType_ !== 'list') {
        return false;
      } else {
        var elem_type = type.elementType;
      }
      var head = list.car;
      var head_type = typecheckExpr(head, elem_type, typeEnv);
      if(!head_type) {
        return false;
      }
      var next = list.cdr;
      while(R.exprType(next) === Expressions.Pair) {
        if(!Ray.Types.areMatchingTypes(head_type, next.car)) {
          return false;
        }
        next = next.cdr;
      }
      if(R.exprType(next) === Expressions.Empty) {
        return new Ray.Types.List(head_type);
      } else {
        return false;
      }
    default:
      throw 'Not a list!';
  }
};

var typecheckFunctionArguments = function(funType, args, typeEnv) {
  var args_type = funType.argumentsType;
  var list_of_types = args_type.positionalArgTypes.list;

  var positionalArgs = args.positionalArgs;
  if(positionalArgs.length < list_of_types.length) {
    return false;
  }
  for(var i = 0; i < positionalArgs.length; i++) {
    var p_arg_type = typecheckExpr(positionalArgs[i], typeEnv);
    if(!Ray.Types.areMatchingTypes(p_arg_type, list_of_types[i])) {
      return false;
    }
  }
  if(!args_type.restArgType) {
    return funType.returnType;
  }
  var rest_arg_types = goog.array.map(positionalArgs.slice(i), function(arg_type) {
    return typecheckExpr(arg_type, typeEnv);
  });
  var rest_arg_element_type = args_type.restArgType.elementType;
  var rest_args_good = goog.array.every(rest_arg_types, function(arg_type) {
    return arg_type && Ray.Types.areMatchingTypes(arg_type, rest_arg_element_type);
  });
  return rest_args_good && funType.returnType;
};

/**
 * What is the type of expr in ty_env, (and does it typecheck)?
 * @param {Ray.Expr} expr
 * @param {*} type
 * @param {Ray.Env} typeEnv
 * returns type of expr in ty_env or false if expr fails typechecking
 */
var typecheckExpr = function(expr, type, typeEnv) {
  switch(R.exprType(expr)) {

    case Expressions.Pair:
      return typecheckList(expr, type, typeEnv);

    case Expressions.Empty:
      return typecheckList(expr, type, typeEnv);

    case Expressions.Num:
      var num =  new Ray.Types.Num();
      return Ray.Types.areMatchingTypes(type, num) && num;

    case Expressions.Char:
      var ch = new Ray.Types.Char();
      return Ray.Types.areMatchingTypes(type, ch) && ch;

    case Expressions.Boolean:
      var bool = new Ray.Types.Boolean();
      return Ray.Types.areMatchingTypes(type, bool) && bool;

    case Expressions.Str:
      var str = new Ray.Types.Str();
      return Ray.Types.areMatchingTypes(type, str) && str;

    case Expressions.Primitive:
      var argSpec = expr.argSpec;
      var args_type = argSpec.argsType;
      return new Ray.Types.FunctionType(args_type, expr.bodyType);

    case Expressions.Lambda:
      var argSpec = expr.argSpec;
      var positionalArgs = argSpec.positionalArgs;
      var args_type = argSpec.argsType;
      var positionalArgTypes = args_type.positionalArgTypes.list;
      var env = typeEnv;
      for(var i = 0; i < positionalArgTypes.length; i++) {
        env = env.extend(positionalArgs[i], positionalArgTypes[i]);
      }
      var body_ty = typecheckExpr(expr.body, expr.bodyType, env);
      return body_ty &&
             Ray.Types.areMatchingTypes(body_ty, expr.bodyType) &&
             new Ray.Types.FunctionType(args_type, body_ty);

    case Expressions.Name:
      return typeEnv.lookup(expr.name) || typecheckValue(R.lookup(expr.name)) || false;

    case Expressions.Cond:
      var testClauses = expr.testClauses;
      var q_types = goog.array.map(testClauses, function(clause) {
        var q = clause[0];
        return typecheckExpr(q, new Ray.Types.Boolean(), typeEnv);
      });
      var bool = new Ray.Types.Boolean();
      var question_types_good = goog.array.every(q_types, function(q_type) {
        return q_type && Ray.Types.areMatchingTypes(bool, q_type);
      });
      if(!question_types_good) {
        return false;
      }
      var answer_types = goog.array.map(testClauses, function(clause) {
        var a = clause[1];
        return typecheckExpr(a, typeEnv);
      });

      if(expr.elseClause) {
        answer_types.push(typecheckExpr(expr.elseClause, typeEnv));
      }
      // There has to be at least one answer,
      // after adding the else clause answer
      var first_answer_type = answer_types[0];
      // Do all the answers have the same type?
      var a_types_good = goog.array.every(answer_types.slice(1), function(answer_type) {
        return answer_type && Ray.Types.areMatchingTypes(first_answer_type, answer_type);
      });

      return Ray.Types.match(first_answer_type, type) && a_types_good && first_answer_type;

    case Expressions.If:
      var pred_type = typecheckExpr(expr.pred, new Ray.Types.Boolean(), typeEnv);
      if(!pred_type) {
        return false;
      }
      var then_type = typecheckExpr(expr.thenExpr, type, typeEnv);
      var else_type = typecheckExpr(expr.elseExpr, type, typeEnv);
      return Ray.Types.areMatchingTypes(then_type, else_type) && then_type;

    case Expressions.And:
      var arg_types = goog.array.map(expr.args, function(arg) {
        return typecheckExpr(arg, typeEnv);
      });
      var bool = new Ray.Types.Boolean();
      return goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.areMatchingTypes(bool, arg_type);
      }) && bool;

    case Expressions.Or:
      var arg_types = goog.array.map(expr.args, function(arg) {
        return typecheckExpr(arg, typeEnv);
      });
      var bool = new Ray.Types.Boolean();
      return goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.areMatchingTypes(bool, arg_type);
      }) && bool;

    case Expressions.App:
      var f_type = typecheckExpr(expr.f, type, typeEnv);
      return f_type && typecheckFunctionArguments(f_type, expr.args, typeEnv);

    case Expressions.Arguments:
      throw 'Should typecheck arguments in App!';
    case Expressions.ArgumentSpec:
      throw 'Should typecheck argument specification in primitive or lambda!';
    default:
      throw 'Unknown variant of expression!';
  }
};

var typecheckValue = function(value, type, typeEnv) {
  switch(R.valueType(value)) {

    case Values.Pair:
      return typecheckList(value, type, typeEnv);

    case Values.Empty:
      return typecheckList(value, type, typeEnv);

    case Values.Num:
      var num = new Ray.Types.Num();
      return Ray.Types.areMatchingTypes(type, num) && num;

    case Values.Char:
      var ch = new Ray.Types.Char();
      return Ray.Types.areMatchingTypes(type, ch) && ch;

    case Values.Str:
      var str = new Ray.Types.Str();
      return Ray.Types.areMatchingTypes(type, str) && str;

    case Values.Boolean:
      var bool = new Ray.Types.Boolean();
      return Ray.Types.areMatchingTypes(type, bool) && bool;

    case Values.Primitive:
    case Values.Closure:
      var argSpec = value.argSpec;
      var args_type = argSpec.argsType;
      var func_type = new Ray.Types.FunctionType(args_type, value.bodyType);
      return Ray.Types.areMatchingTypes(type, func_type) && func_type;

    case Values.ArgumentSpec:
      throw 'Should typecheck arguments in App!';
    case Values.Arguments:
      throw 'Should typecheck argument specifications in primitive or closure!';
    default:
      throw 'Unknown variant of value!';
  }
};

Ray.Typechecker.typecheck = function(expr) {
  return typecheckExpr(expr, Ray.Env.emptyEnv());
};