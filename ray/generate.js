goog.provide('Ray.Generator');

goog.require('Ray.Blocks');

var getArg = function(block, name, r) {
  var arg = block.getInputTargetBlock(name);
  if(!arg) {
    throw 'Missing argument!';
  } else {
    return gen(arg, r);
  }
};

var genForm = function(block, r) {
  var args = [];
  var i;

  switch(block.form_) {
    case('and'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(getArg(block, 'REST_ARG' + String(i), r));
      }
      return r.and.apply(null, args);
      break;
    case('or'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(getArg(block, 'REST_ARG' + String(i), r));
      }
      return r.or.apply(null, args);
      break;
    case('if'):
      var pred = getArg(block, 'PRED', r);
      var thenExpr = getArg(block, 'THEN_EXPR', r);
      var elseExpr = getArg(block, 'ELSE_EXPR', r);
      return r._if(pred, thenExpr, elseExpr);
      break;
    case('cond'):
      for(i = 0; i <= block.testClauseCount_; i++) {
        var test = getArg(block, 'CONDITION' + String(i), r);
        var body = getArg(block, 'BODY' + String(i), r);
        args.push([test,body]);
      }
      if(this.elseClause_) {
        var elseClause = getArg(block, 'ELSE', r);
        return r.cond(args, elseClause);
      } else {
        return r.cond(args);
      }
      break;
    default:
      throw 'Unknown form!';
      break;
  }
};

var genValue = function(block, r) {
  // Has an argSpec obj we can extract information from
  var argSpec = block.value_.argSpec;
  var args = [];
  for(var i = 0; i < argSpec.positionalArgs.length; i++) {
    args.push(getArg(block, argSpec.positionalArgs[i], r));
  }
  if(argSpec.restArg && block.restArgCount_) {
    for(var i = 0; i < block.restArgCount_; i++) {
      args.push(getArg(block, 'REST_ARG' + String(i), r));
    }
  }
  // Ignoring keyword arguments for the time being
  return r.app(r.name(block.name_), r.positionalArgs.apply(null, args));

};

/**
 * Generate the code for the application of a user function.
 * The only complication here is changing the positional argument names to P_ARGi
 * since I kept them generic to better handle changing argument names during function creation
 * @param block
 * @param r
 * @returns {*}
 */
var genUserFunctionApplication = function(block, r) {
  var argSpec = block.value_.argSpec;
  var args = [];
  for(var i = 0; i < argSpec.positionalArgs.length; i++) {
    args.push(getArg(block, 'P_ARG' + String(i), r));
  }
  if(argSpec.restArg && block.restArgCount_) {
    for(var i = 0; i < block.restArgCount_; i++) {
      args.push(getArg(block, 'REST_ARG' + String(i), r));
    }
  }

  return r.app(r.name(block.name_), r.positionalArgs.apply(null, args));
};

var genDatatype = function(block, r) {
  switch(block.datatype_) {
    case('boolean'):
      var b = block.getTitleValue('B');
      return r.bool(b === 'TRUE');
      break;
    case('num'):
      var n = block.getTitleValue('N');
      return r.num(r.numbers.fromString(n));
      break;
    case('str'):
      var s = block.getTitleValue('S');
      return r.str(s);
      break;
    case('char'):
      var c = block.getTitleValue('C');
      return r.char(c);
      break;
    default:
      throw 'Unknown datatype!';
      break;
  }
};

var genArgument = function(block, r) {
  return r.name(block.name_);
};

var gen = function(block, r) {
  if(block.isUserFunction_) {
    //throw 'Handle user functions!';
    return genUserFunctionApplication(block, r);
  } else if(block.value_) {
    return genValue(block, r);
  } else if(block.form_) {
    return genForm(block, r);
  } else if(block.datatype_) {
    return genDatatype(block, r);
  } else if(block.arguments_) {
    return genArgument(block, r);
  } else {
    throw "Unknown type of block! Can't generate!";
  }
};

Ray.Generator.generate = gen;

