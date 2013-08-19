goog.provide('Ray.Generator');

goog.require('Ray.Blocks');

var getArg = function(block, name) {
  var arg = block.getInputTargetBlock(name);
  if(!arg) {
    throw 'Missing argument!';
  } else {
    return gen(arg);
  }
};

var genForm = function(block) {
  var args = [];
  var i;

  switch(block.form_) {
    case('and'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(getArg(block, 'REST_ARG' + String(i)));
      }
      return RT.and.apply(null, args);
      break;
    case('or'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(getArg(block, 'REST_ARG' + String(i)));
      }
      return RT.or.apply(null, args);
      break;
    case('if'):
      var pred = getArg(block, 'PRED');
      var thenExpr = getArg(block, 'THEN_EXPR');
      var elseExpr = getArg(block, 'ELSE_EXPR');
      return RT._if(pred, thenExpr, elseExpr);
      break;
    case('cond'):
      for(i = 0; i <= block.testClauseCount_; i++) {
        var test = getArg(block, 'CONDITION' + String(i));
        var body = getArg(block, 'BODY' + String(i));
        args.push([test,body]);
      }
      if(this.elseClause_) {
        var elseClause = getArg(block, 'ELSE');
        return RT.cond(args, elseClause);
      } else {
        return RT.cond(args);
      }
      break;
    default:
      throw 'Unknown form!';
      break;
  }
};

var genValue = function(block) {
  // Has an argSpec obj we can extract information from
  var argSpec = block.value_.argSpec;
  var args = [];
  for(var i = 0; i < argSpec.positionalArgs.length; i++) {
    args.push(getArg(block, argSpec.positionalArgs[i]));
  }
  if(argSpec.restArg && block.restArgCount_) {
    for(var i = 0; i < block.restArgCount_; i++) {
      args.push(getArg(block, 'REST_ARG' + String(i)));
    }
  }
  // Ignoring keyword arguments for the time being
  return RT.app(RT.name(block.name_), RT.positionalArgs.apply(null, args));

};

/**
 * Generate the code for the application of a user function.
 * The only complication here is changing the positional argument names to P_ARGi
 * since I kept them generic to better handle changing argument names during function creation
 * @param block
 * @param r
 * @returns {*}
 */
var genUserFunctionApplication = function(block) {
  var argSpec = block.value_.argSpec;
  var args = [];
  for(var i = 0; i < argSpec.positionalArgs.length; i++) {
    args.push(getArg(block, 'P_ARG' + String(i)));
  }
  if(argSpec.restArg && block.restArgCount_) {
    for(var i = 0; i < block.restArgCount_; i++) {
      args.push(getArg(block, 'REST_ARG' + String(i)));
    }
  }

  return RT.app(RT.name(block.name_), RT.positionalArgs.apply(null, args));
};

var genDatatype = function(block) {
  switch(block.datatype_) {
    case('boolean'):
      var b = block.getTitleValue('B');
      return RT.bool(b === 'TRUE');
      break;
    case('num'):
      var n = block.getTitleValue('N');
      return RT.num(RT.numbers.fromString(n));
      break;
    case('str'):
      var s = block.getTitleValue('S');
      return RT.str(s);
      break;
    case('char'):
      var c = block.getTitleValue('C');
      return RT.char(c);
      break;
    default:
      throw 'Unknown datatype!';
      break;
  }
};

var genArgument = function(block) {
  return RT.name(block.name_);
};

var gen = function(block) {
  if(block.isUserFunction_) {
    //throw 'Handle user functions!';
    return genUserFunctionApplication(block);
  } else if(block.value_) {
    return genValue(block);
  } else if(block.form_) {
    return genForm(block);
  } else if(block.datatype_) {
    return genDatatype(block);
  } else if(block.arguments_) {
    return genArgument(block);
  } else {
    throw "Unknown type of block! Can't generate!";
  }
};

Ray.Generator.generate = gen;

