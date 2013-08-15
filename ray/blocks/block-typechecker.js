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

var Blocks = Ray.Globals.Blocks;

Ray.Blocks.TypeChecker.cons = function(block, type, typeEnv) {
  var carType = Ray.Blocks.TypeChecker.expr_(block, 'car', type.elementType, typeEnv);
  var cdrType = Ray.Blocks.TypeChecker.expr_(block, 'cdr', type, typeEnv);
  var principalType = Ray.Types.principalType_(new Ray.Types.List(carType), cdrType);
  return principalType;
};

Ray.Blocks.TypeChecker.empty = function(block, type, typeEnv) {
  return type;
};

Ray.Blocks.TypeChecker.first = function(block, type, typeEnv) {
  var xType = Ray.Blocks.TypeChecker.expr_(block, 'x', new Ray.Types.List(type), typeEnv);
  return !!xType ? xType.elementType : xType;
};

Ray.Blocks.TypeChecker.rest = function(block, type, typeEnv) {
  var xType = Ray.Blocks.TypeChecker.expr_(block, 'x', type, typeEnv);
  return xType;
};

Ray.Blocks.TypeChecker.list = function(block, type, typeEnv) {
  var elementTypes = [];
  for(var i = 0; i < block.restArgCount_; i++) {
    if(block)
    elementTypes.push(Ray.Blocks.TypeChecker.expr_(block, 'REST_ARG' + String(i), type.elementType, typeEnv, true));
  }
  var principalType = Ray.Types.principalType(elementTypes);
  return new Ray.Types.List(principalType);
}


Ray.Blocks.TypeChecker.functionArguments = function(block, funType, args, typeEnv) {
  var isUserFunction = !!block.isUserFunction_;
  var argsType = funType.argumentsType;
  var listOfTypes = argsType.positionalArgTypes.list;

  var positionalArgs = args.positionalArgs;
  if(positionalArgs.length < listOfTypes.length) {
    return false;
  }
  var positionalArgTypes = goog.array.map(goog.array.range(positionalArgs.length), function(i) {
    return Ray.Blocks.TypeChecker.expr_(block, isUserFunction ? ('P_ARG' + String(i)) : positionalArgs[i], listOfTypes[i], typeEnv);
  });

  if(!goog.array.every(positionalArgTypes, function(p_arg_type) { return !!p_arg_type; })) {
    return false;
  }

  if(!argsType.restArgType) {
    return funType.returnType;
  }
  var restArgElementType = argsType.restArgType.elementType;
  var restArgTypes = goog.array.map(goog.array.range(block.restArgCount_), function(i) {
    return Ray.Blocks.TypeChecker.expr_(block, 'REST_ARG' + String(i), restArgElementType, typeEnv);
  });

  if(!goog.array.every(restArgTypes, function(restArgType) { return !!restArgType; })) {
    return false;
  }

  return funType.returnType;
};

Ray.Blocks.TypeChecker.expr_ = function(block, inputName, type, typeEnv, opt_ignoreMissingInputs) {
  var ignoreMissingInputs = !!opt_ignoreMissingInputs;
  var input = block.getInput(inputName);
  if(!input) {
    if(ignoreMissingInputs) {
      return new Ray.Types.Unknown();
    } else {
      throw 'Missing input';
    }
  }
  if(!input.connection) {
    throw 'Input doesn\'t have a connection';
  }

  var conn = input.connection;
  conn.inferType(type);
  if(conn.targetConnection && conn.targetConnection.sourceBlock_) {
    return Ray.Blocks.TypeChecker.expr(conn.targetConnection.sourceBlock_, type, typeEnv);
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
Ray.Blocks.TypeChecker.expr = function(block, type, typeEnv) {
  /* We don't have to worry about type, because if the block typechecks,
   * whatever we get back will be at least as specific as type
   */    

  var outputType;
  switch(block.blockClass_) {
    case Blocks.Empty:
      outputType = Ray.Blocks.TypeChecker.empty(block, type, typeEnv);
      break;
    case Blocks.First:
      outputType = Ray.Blocks.TypeChecker.first(block, type, typeEnv);
      break;
    case Blocks.Rest:
      outputType = Ray.Blocks.TypeChecker.rest(block, type, typeEnv);
      break;
    case Blocks.Cons:
      outputType = Ray.Blocks.TypeChecker.cons(block, type, typeEnv);
      break;
    case Blocks.List:
      outputType = Ray.Blocks.TypeChecker.list(block, type, typeEnv);
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
      var questionTypes = [Ray.Blocks.TypeChecker.expr_(block, 'CONDITION', new Ray.Types.Boolean(), typeEnv)];
      goog.array.forEach(goog.array.range(testClauseCount), function(i) {
        questionTypes.push(Ray.Blocks.TypeChecker.expr_(block, 'CONDITION' + String(i), new Ray.Types.Boolean(), typeEnv));
      });
      var bool = new Ray.Types.Boolean();
      var questionTypesGood = goog.array.every(questionTypes, function(questionType) {
        return questionType && Ray.Types.areMatchingTypes(bool, questionType);
      });
      if(!questionTypesGood) {
        return false;
      }
      var answerTypes = [Ray.Blocks.TypeChecker.expr_(block, 'BODY', type, typeEnv)];
      goog.array.forEach(goog.array.range(testClauseCount), function(i) {
        answerTypes.push(Ray.Blocks.TypeChecker.expr_(block, 'BODY' + String(i), type, typeEnv));
      });
      if(block.elseClause_) {
        answerTypes.push(Ray.Blocks.TypeChecker.expr_(block, 'ELSE', type, typeEnv));
      }
      outputType = Ray.Types.principalType(answerTypes);
      break;

    case Blocks.If:
      var predicateType = Ray.Blocks.TypeChecker.expr_(block, 'PRED', new Ray.Types.Boolean(), typeEnv);
      if(!predicateType) {
        return false;
      }
      var thenType = Ray.Blocks.TypeChecker.expr_(block, 'THEN_EXPR', type, typeEnv);
      var elseType = Ray.Blocks.TypeChecker.expr_(block, 'ELSE_EXPR', type, typeEnv);
      outputType = Ray.Types.principalType_(thenType, elseType);
      break;

    case Blocks.And:
    case Blocks.Or:
      var argCount = block.restArgCount_;
      var bool = new Ray.Types.Boolean();
      var argTypes = goog.array.map(goog.array.range(argCount), function(i) {
        return Ray.Blocks.TypeChecker.expr_(block, 'REST_ARG' + String(i), bool, typeEnv);
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
      outputType = Ray.Blocks.TypeChecker.functionArguments(block, funType, fun.argSpec, typeEnv);
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

Ray.Blocks.TypeChecker.statement = function(block, typeEnv) {
  switch(block.blockClass_) {
    case Blocks.Example:
      var unknown = new Ray.Types.Unknown();
      var expr = Ray.Blocks.TypeChecker.expr_(block, 'EXPR', unknown, typeEnv);
      var result = Ray.Blocks.TypeChecker.expr_(block, 'RESULT', unknown, typeEnv);
      var principalType = Ray.Types.principalType_(expr, result);
      Ray.Blocks.TypeChecker.expr_(block, 'EXPR', principalType, typeEnv);
      Ray.Blocks.TypeChecker.expr_(block, 'RESULT', principalType, typeEnv);
      return true;
      break;
    default:
      throw 'Unknown value for block.blockClass_!';
      break;
  }
};

Ray.Blocks.TypeChecker.typecheckBlock = function(block) {
  if(!block.outputConnection) {
    return Ray.Blocks.TypeChecker.statement(block, Ray.Env.emptyEnv());
  } else {
    var originalOutputType = block.getOutputType(true);
    var outputType = Ray.Blocks.TypeChecker.expr(block, block.getOutputType(true), Ray.Env.emptyEnv());
    if(!outputType || !originalOutputType) {
      throw 'Failed to Typecheck';
    }

    if(!Ray.Types.areSameType(originalOutputType, outputType)) {
      return Ray.Blocks.TypeChecker.expr(block, block.getOutputType(), Ray.Env.emptyEnv());
    } else {
      return outputType;
    }
  }
};