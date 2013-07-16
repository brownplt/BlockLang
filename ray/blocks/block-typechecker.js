/**
 * User: spencergordon
 * Date: 6/30/13
 * Time: 12:01 PM
 */

goog.provide('Ray.Blocks.TypeChecker');

goog.require('Ray.Globals');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Env');

var R = Ray.Runtime;

var Blocks = Ray.Globals.Blocks;

var typecheckCons = function(block, type, typeEnv) {
  var car_type = typecheckBlockExpr_(block, 'car', type.elementType, typeEnv);
  var cdr_type = typecheckBlockExpr_(block, 'cdr', type, typeEnv);
  var principal_type = Ray.Types.principalType_(new Ray.Types.List(car_type), cdr_type);
  return principal_type;
};

var typecheckEmpty = function(block, type, typeEnv) {
  return type;
};

var typecheckFirst = function(block, type, typeEnv) {
  var x_type = typecheckBlockExpr_(block, 'x', new Ray.Types.List(type), typeEnv);
  return !!x_type ? x_type.elementType : x_type;
};

var typecheckRest = function(block, type, typeEnv) {
  var x_type = typecheckBlockExpr_(block, 'x', type, typeEnv);
  return x_type;
};



var typecheckFunctionArguments = function(block, funType, args, typeEnv) {
  var args_type = funType.argumentsType;
  var list_of_types = args_type.positionalArgTypes.list;

  var positionalArgs = args.positionalArgs;
  if(positionalArgs.length < list_of_types.length) {
    return false;
  }
  var positionalArgTypes = goog.array.map(goog.array.range(positionalArgs.length), function(i) {
    return typecheckBlockExpr_(block, positionalArgs[i], list_of_types[i], typeEnv);
  });

  if(!goog.array.every(positionalArgTypes, function(p_arg_type) { return !!p_arg_type; })) {
    return false;
  }

  if(!args_type.restArgType) {
    return funType.returnType;
  }
  var rest_arg_element_type = args_type.restArgType.elementType;
  var rest_arg_types = goog.array.map(goog.array.range(block.restArgCount_), function(i) {
    return typecheckBlockExpr_(block, 'REST_ARG' + String(i), rest_arg_element_type, typeEnv);
  });

  if(!goog.array.every(rest_arg_types, function(restArgType) { return !!restArgType; })) {
    return false;
  }

  return funType.returnType;
};

var typecheckBlockExpr_ = function(block, inputName, type, typeEnv) {
  var input = block.getInput(inputName);
  if(!input.connection) {
    throw 'Input doesn\'t have a connection';
  }

  var conn = input.connection;
  conn.inferType(type);
  if(conn.targetConnection && conn.targetConnection.sourceBlock_) {
    return typecheckBlockExpr(conn.targetConnection.sourceBlock_, type, typeEnv);
  } else {
    return type;
  }
};

/**
 * What is the type of expr in typeEnv, (and does it typecheck)?
 * @param {Blockly.Block} block
 * @param {*} type
 * @param {Ray.Env} typeEnv
 * returns type of expr in typeEnv or false if expr fails typechecking
 */
var typecheckBlockExpr = function(block, type, typeEnv) {
  /* We don't have to worry about type, because if the block typechecks,
   * whatever we get back will be at least as specific as type
   */    

  var output_type;
  switch(block.blockClass_) {
    case Blocks.Empty:
      output_type = typecheckEmpty(block, type, typeEnv);
      break;
    case Blocks.First:
      output_type = typecheckFirst(block, type, typeEnv);
      break;
    case Blocks.Rest:
      output_type = typecheckRest(block, type, typeEnv);
      break;
    case Blocks.Cons:
      output_type = typecheckCons(block, type, typeEnv);
      break;
    case Blocks.Num:
      var num =  new Ray.Types.Num();
      output_type = Ray.Types.areMatchingTypes(type, num) && num;
      break;
    case Blocks.Char:
      var ch = new Ray.Types.Char();
      output_type = Ray.Types.areMatchingTypes(type, ch) && ch;
      break;
    case Blocks.Boolean:
      var bool = new Ray.Types.Boolean();
      output_type = Ray.Types.areMatchingTypes(type, bool) && bool;
      break;
    case Blocks.Str:
      var str = new Ray.Types.Str();
      output_type = Ray.Types.areMatchingTypes(type, str) && str;
      break;

    case Blocks.Cond:
      var test_clause_count = block.testClauseCount_;
      var q_types = [typecheckBlockExpr_(block, 'CONDITION', new Ray.Types.Boolean(), typeEnv)];
      goog.array.forEach(goog.array.range(test_clause_count), function(i) {
        q_types.push(typecheckBlockExpr_(block, 'CONDITION' + String(i), new Ray.Types.Boolean(), typeEnv));
      });
      var bool = new Ray.Types.Boolean();
      var question_types_good = goog.array.every(q_types, function(q_type) {
        return q_type && Ray.Types.areMatchingTypes(bool, q_type);
      });
      if(!question_types_good) {
        return false;
      }
      var answer_types = [typecheckBlockExpr_(block, 'BODY', type, typeEnv)];
      goog.array.forEach(goog.array.range(test_clause_count), function(i) {
        answer_types.push(typecheckBlockExpr_(block, 'BODY' + String(i), type, typeEnv));
      });
      if(block.elseClause_) {
        answer_types.push(typecheckBlockExpr_(block, 'ELSE', type, typeEnv));
      }
      output_type = Ray.Types.principalType(answer_types);
      break;

    case Blocks.If:
      var pred_type = typecheckBlockExpr_(block, 'PRED', new Ray.Types.Boolean(), typeEnv);
      if(!pred_type) {
        return false;
      }
      var then_type = typecheckBlockExpr_(block, 'THEN_EXPR', type, typeEnv);
      var else_type = typecheckBlockExpr_(block, 'ELSE_EXPR', type, typeEnv);
      output_type = Ray.Types.principalType_(then_type, else_type);
      break;

    case Blocks.And:
    case Blocks.Or:
      var arg_count = block.restArgCount_;
      var bool = new Ray.Types.Boolean();
      var arg_types = goog.array.map(goog.array.range(arg_count), function(i) {
        return typecheckBlockExpr_(arg, 'REST_ARG' + String(i), bool, typeEnv);
      });
      output_type = goog.array.every(arg_types, function(arg_type) {
        return Ray.Types.areMatchingTypes(bool, arg_type);
      }) && bool;
      break;

    case Blocks.App:
      var func_name = block.name_;
      var f;
      if(block.isUserFunction_) {
        f = block.value_;
      } else {
        f = r.lookup(func_name); // Why am I looking it up when I can just typecheck against the block itself?
        // To make sure I'm looking at an up-to-date version? (Figure this out!)
      }

      if(!f) {
        throw 'No function found for application block, can\'t typecheck!';
      }

      var f_type = new Ray.Types.FunctionType(f.argSpec.argsType, f.bodyType);
      output_type = typecheckFunctionArguments(block, f_type, f.argSpec, typeEnv);
      break;

    case Blocks.Argument:
      output_type = block.outputType_;
      break;
    default:
      // Don't actually typecheck when we don't have a block with a known class
      output_type = block.outputType_;
      break;
  }

  if(!output_type) {
    throw 'Failed to typecheck';
  } else {
    block.outputConnection.inferType(output_type);
    return output_type;
  }

};

Ray.Blocks.TypeChecker.typecheckBlock = function(block) {
  var orig_output_type = block.getOutputType(true);
  var output_type = typecheckBlockExpr(block, block.getOutputType(true), Ray.Env.emptyEnv());
  if(!output_type || !orig_output_type) {
    throw 'Failed to Typecheck';
  }

  if(!Ray.Types.areSameType(orig_output_type, output_type)) {
    return typecheckBlockExpr(block, block.getOutputType(), Ray.Env.emptyEnv());
  } else {
    return output_type;
  }

};