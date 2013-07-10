/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:01 PM
 */

goog.provide('Ray.Blocks.TypeChecker');

goog.require('Ray.Globals');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray._');
goog.require('Ray.Env');

var R = Ray.Runtime;
var _ = Ray._;

var Blocks = Ray.Globals.Blocks;

var typecheck_cons = function(block, ty, ty_env) {
  var car_type = typecheck_block_expr_(block, 'car', ty.element_type, ty_env);
  var cdr_type = typecheck_block_expr_(block, 'cdr', ty, ty_env);
  var principal_type = Ray.Types.principal_type_(new Ray.Types.List(car_type), cdr_type);
  return principal_type;
};

var typecheck_empty = function(block, ty, ty_env) {
  return ty;
};

var typecheck_first = function(block, ty, ty_env) {
  var x_type = typecheck_block_expr_(block, 'x', new Ray.Types.List(ty), ty_env);
  return !!x_type ? x_type.element_type : x_type;
};

var typecheck_rest = function(block, ty, ty_env) {
  var x_type = typecheck_block_expr_(block, 'x', ty, ty_env);
  return x_type;
};



var typecheck_function_arguments = function(block, f_type, args, ty_env) {
  var args_type = f_type.argument_type;
  var list_of_types = args_type.p_arg_types.list;

  var p_args = args.p_args;
  if(p_args.length < list_of_types.length) {
    return false;
  }
  var p_arg_types = goog.array.map(goog.array.range(p_args.length), function(i) {
    return typecheck_block_expr_(block, p_args[i], list_of_types[i], ty_env);
  });

  if(!goog.array.every(p_arg_types, function(p_arg_type) { return !!p_arg_type; })) {
    return false;
  }

  if(!args_type.rest_arg_type) {
    return f_type.return_type;
  }
  var rest_arg_element_type = args_type.rest_arg_type.base_type;
  var rest_arg_types = goog.array.map(goog.array.range(block.rest_arg_count_), function(i) {
    return typecheck_block_expr_(block, 'REST_ARG' + String(i), rest_arg_element_type, ty_env);
  });

  if(!goog.array.every(rest_arg_types, function(rest_arg_type) { return !!rest_arg_type; })) {
    return false;
  }

  return f_type.return_type;
};

var typecheck_block_expr_ = function(block, input_name, ty, ty_env) {
  var input = block.getInput(input_name);
  if(!input.connection) {
    throw 'Input doesn\'t have a connection';
  }

  var conn = input.connection;
  conn.inferType(ty);
  if(conn.targetConnection && conn.targetConnection.sourceBlock_) {
    return typecheck_block_expr(conn.targetConnection.sourceBlock_, ty, ty_env);
  } else {
    return ty;
  }
};

/**
 * What is the type of expr in ty_env, (and does it typecheck)?
 * @param {Blockly.Block} block
 * @param {*} ty
 * @param {Ray.Env} ty_env
 * returns type of expr in ty_env or false if expr fails typechecking
 */
var typecheck_block_expr = function(block, ty, ty_env) {
  /* We don't have to worry about ty, because if the block typechecks, 
   * whatever we get back will be at least as specific as ty
   */    

  var output_type;
  switch(block.__block_class__) {
    case Blocks.Empty:
      output_type = typecheck_empty(block, ty, ty_env);
      break;
    case Blocks.First:
      output_type = typecheck_first(block, ty, ty_env);
      break;
    case Blocks.Rest:
      output_type = typecheck_rest(block, ty, ty_env);
      break;
    case Blocks.Cons:
      output_type = typecheck_cons(block, ty, ty_env);
      break;
    case Blocks.Num:
      var num =  new Ray.Types.Num();
      output_type = Ray.Types.is_match(ty, num) && num;
      break;
    case Blocks.Char:
      var ch = new Ray.Types.Char();
      output_type = Ray.Types.is_match(ty, ch) && ch;
      break;
    case Blocks.Boolean:
      var bool = new Ray.Types.Boolean();
      output_type = Ray.Types.is_match(ty, bool) && bool;
      break;
    case Blocks.Str:
      var str = new Ray.Types.Str();
      output_type = Ray.Types.is_match(ty, str) && str;
      break;

    case Blocks.Cond:
      var test_clause_count = block.test_clause_count_;
      var q_types = [typecheck_block_expr_(block, 'CONDITION', new Ray.Types.Boolean(), ty_env)];
      goog.array.forEach(goog.array.range(test_clause_count), function(i) {
        q_types.push(typecheck_block_expr_(block, 'CONDITION' + String(i), new Ray.Types.Boolean(), ty_env));
      });
      var bool = new Ray.Types.Boolean();
      var question_types_good = goog.array.every(q_types, function(q_type) {
        return q_type && Ray.Types.is_match(bool, q_type);
      });
      if(!question_types_good) {
        return false;
      }
      var answer_types = [typecheck_block_expr_(block, 'BODY', ty, ty_env)];
      goog.array.forEach(goog.array.range(test_clause_count), function(i) {
        answer_types.push(typecheck_block_expr_(block, 'BODY' + String(i), ty, ty_env));
      });
      if(block.else_clause_) {
        answer_types.push(typecheck_block_expr_(block, 'ELSE', ty, ty_env));
      }
      output_type = Ray.Types.principal_type(answer_types);
      break;

    case Blocks.If:
      var pred_type = typecheck_block_expr_(block, 'PRED', new Ray.Types.Boolean(), ty_env);
      if(!pred_type) {
        return false;
      }
      var then_type = typecheck_block_expr_(block, 'T_EXPR', ty, ty_env);
      var else_type = typecheck_block_expr_(block, 'F_EXPR', ty, ty_env);
      output_type = Ray.Types.principal_type_(then_type, else_type);
      break;

    case Blocks.And:
    case Blocks.Or:
      var arg_count = block.rest_arg_count_;
      var bool = new Ray.Types.Boolean();
      var arg_types = goog.array.map(goog.array.range(arg_count), function(i) {
        return typecheck_block_expr_(arg, 'REST_ARG' + String(i), bool, ty_env);
      });
      output_type = goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.is_match(bool, arg_type);
      }) && bool;
      break;

    case Blocks.App:
      var func_name = block.__name__;
      var f = r.lookup(func_name);
      if(!f) {
        return false;
      }

      var f_type = new Ray.Types.FunctionType(f.arg_spec.arguments_type, f.body_type);
      output_type = typecheck_function_arguments(block, f_type, f.arg_spec, ty_env);
      break;
  }

  if(!output_type) {
    throw 'Failed to typecheck';
  } else {
    block.outputConnection.inferType(output_type);
    return output_type;
  }

};

Ray.Blocks.TypeChecker.typecheck_block = function(block) {
  var orig_output_type = block.getOutputType(true);
  var output_type = typecheck_block_expr(block, block.getOutputType(true), Ray.Env.empty_env());
  if(!output_type || !orig_output_type) {
    throw 'Failed to Typecheck';
  }

  if(!Ray.Types.is_same(orig_output_type, output_type)) {
    return typecheck_block_expr(block, block.getOutputType(), Ray.Env.empty_env());
  } else {
    return output_type;
  }

};