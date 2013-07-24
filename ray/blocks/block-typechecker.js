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
  var carType = typecheckBlockExpr_(block, 'car', type.elementType, typeEnv);
  var cdrType = typecheckBlockExpr_(block, 'cdr', type, typeEnv);
  var principalType = Ray.Types.principalType_(new Ray.Types.List(carType), cdrType);
  return principalType;
};

var typecheckEmpty = function(block, type, typeEnv) {
  return type;
};

var typecheckFirst = function(block, type, typeEnv) {
  var xType = typecheckBlockExpr_(block, 'x', new Ray.Types.List(type), typeEnv);
  return !!xType ? xType.elementType : xType;
};

var typecheckRest = function(block, type, typeEnv) {
  var xType = typecheckBlockExpr_(block, 'x', type, typeEnv);
  return xType;
};



var typecheckFunctionArguments = function(block, funType, args, typeEnv) {
  var isUserFunction = !!block.isUserFunction_;
  var argsType = funType.argumentsType;
  var listOfTypes = argsType.positionalArgTypes.list;

  var positionalArgs = args.positionalArgs;
  if(positionalArgs.length < listOfTypes.length) {
    return false;
  }
  var positionalArgTypes = goog.array.map(goog.array.range(positionalArgs.length), function(i) {
    return typecheckBlockExpr_(block, isUserFunction ? ('P_ARG' + String(i)) : positionalArgs[i], listOfTypes[i], typeEnv);
  });

  if(!goog.array.every(positionalArgTypes, function(p_arg_type) { return !!p_arg_type; })) {
    return false;
  }

  if(!argsType.restArgType) {
    return funType.returnType;
  }
  var restArgElementType = argsType.restArgType.elementType;
  var restArgTypes = goog.array.map(goog.array.range(block.restArgCount_), function(i) {
    return typecheckBlockExpr_(block, 'REST_ARG' + String(i), restArgElementType, typeEnv);
  });

  if(!goog.array.every(restArgTypes, function(restArgType) { return !!restArgType; })) {
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

  var outputType;
  switch(block.blockClass_) {
    case Blocks.Empty:
      outputType = typecheckEmpty(block, type, typeEnv);
      break;
    case Blocks.First:
      outputType = typecheckFirst(block, type, typeEnv);
      break;
    case Blocks.Rest:
      outputType = typecheckRest(block, type, typeEnv);
      break;
    case Blocks.Cons:
      outputType = typecheckCons(block, type, typeEnv);
      break;
    case Blocks.Num:
      var num =  new Ray.Types.Num();
      outputType = Ray.Types.areMatchingTypes(type, num) && num;
      break;
    case Blocks.Char:
      var ch = new Ray.Types.Char();
      outputType = Ray.Types.areMatchingTypes(type, ch) && ch;
      break;
    case Blocks.Boolean:
      var bool = new Ray.Types.Boolean();
      outputType = Ray.Types.areMatchingTypes(type, bool) && bool;
      break;
    case Blocks.Str:
      var str = new Ray.Types.Str();
      outputType = Ray.Types.areMatchingTypes(type, str) && str;
      break;

    case Blocks.Cond:
      var testClauseCount = block.testClauseCount_;
      var questionTypes = [typecheckBlockExpr_(block, 'CONDITION', new Ray.Types.Boolean(), typeEnv)];
      goog.array.forEach(goog.array.range(testClauseCount), function(i) {
        questionTypes.push(typecheckBlockExpr_(block, 'CONDITION' + String(i), new Ray.Types.Boolean(), typeEnv));
      });
      var bool = new Ray.Types.Boolean();
      var questionTypesGood = goog.array.every(questionTypes, function(questionType) {
        return questionType && Ray.Types.areMatchingTypes(bool, questionType);
      });
      if(!questionTypesGood) {
        return false;
      }
      var answerTypes = [typecheckBlockExpr_(block, 'BODY', type, typeEnv)];
      goog.array.forEach(goog.array.range(testClauseCount), function(i) {
        answerTypes.push(typecheckBlockExpr_(block, 'BODY' + String(i), type, typeEnv));
      });
      if(block.elseClause_) {
        answerTypes.push(typecheckBlockExpr_(block, 'ELSE', type, typeEnv));
      }
      outputType = Ray.Types.principalType(answerTypes);
      break;

    case Blocks.If:
      var predicateType = typecheckBlockExpr_(block, 'PRED', new Ray.Types.Boolean(), typeEnv);
      if(!predicateType) {
        return false;
      }
      var thenType = typecheckBlockExpr_(block, 'THEN_EXPR', type, typeEnv);
      var elseType = typecheckBlockExpr_(block, 'ELSE_EXPR', type, typeEnv);
      outputType = Ray.Types.principalType_(thenType, elseType);
      break;

    case Blocks.And:
    case Blocks.Or:
      var argCount = block.restArgCount_;
      var bool = new Ray.Types.Boolean();
      var argTypes = goog.array.map(goog.array.range(argCount), function(i) {
        return typecheckBlockExpr_(block, 'REST_ARG' + String(i), bool, typeEnv);
      });
      outputType = goog.array.every(argTypes, function(arg_type) {
        return Ray.Types.areMatchingTypes(bool, arg_type);
      }) && bool;
      break;

    case Blocks.App:
      var funName = block.name_;
      var fun;
      if(block.isUserFunction_) {
        fun = block.value_;
      } else {
        fun = r.lookup(funName); // Why am I looking it up when I can just typecheck against the block itself?
        // To make sure I'm looking at an up-to-date version? (Figure this out!)
      }

      if(!fun) {
        throw 'No function found for application block, can\'t typecheck!';
      }

      var funType = new Ray.Types.FunctionType(fun.argSpec.argsType, fun.bodyType);
      outputType = typecheckFunctionArguments(block, funType, fun.argSpec, typeEnv);
      break;

    case Blocks.Argument:
      outputType = block.getOutputType();
      break;

    default:
      // Don't actually typecheck when we don't have a block with a known class
      // We can get the current type for the block, if somehow something more specific has been inferred.
      outputType = block.getOutputType(true);
      break;
  }

  if(!outputType) {
    throw 'Failed to typecheck';
  } else {
    block.outputConnection.inferType(outputType);
    return outputType;
  }

};

var typecheckStatement = function(block, typeEnv) {
  switch(block.blockClass_) {
    case Blocks.Example:
      var unknown = new Ray.Types.Unknown();
      var expr = typecheckBlockExpr_(block, 'EXPR', unknown, typeEnv);
      var result = typecheckBlockExpr_(block, 'RESULT', unknown, typeEnv);
      var principalType = Ray.Types.principalType_(expr, result);
      typecheckBlockExpr_(block, 'EXPR', principalType, typeEnv);
      typecheckBlockExpr_(block, 'RESULT', principalType, typeEnv);
      return true;
      break;
    default:
      throw 'Unknown value for block.blockClass_!';
      break;
  }
};

Ray.Blocks.TypeChecker.typecheckBlock = function(block) {
  if(!block.outputConnection) {
    return typecheckStatement(block, Ray.Env.emptyEnv());
  } else {
    var originalOutputType = block.getOutputType(true);
    var outputType = typecheckBlockExpr(block, block.getOutputType(true), Ray.Env.emptyEnv());
    if(!outputType || !originalOutputType) {
      throw 'Failed to Typecheck';
    }

    if(!Ray.Types.areSameType(originalOutputType, outputType)) {
      return typecheckBlockExpr(block, block.getOutputType(), Ray.Env.emptyEnv());
    } else {
      return outputType;
    }
  }
};