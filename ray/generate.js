goog.provide('Ray.Generator');

goog.require('Ray.Blocks');
goog.require('Ray.Runtime');
goog.require('Ray.Globals');
goog.require('Ray.Numbers');

var Values = Ray.Globals.Values;

var RT = Ray.Runtime;

Ray.Generator.getArgument = function(block, name) {
  var arg = block.getInputTargetBlock(name);
  if(!arg) {
    throw 'Missing argument!';
  } else {
    return Ray.Generator.generate(arg);
  }
};

Ray.Generator.fromForm = function(block) {
  var args = [];
  var i;

  switch(block.form_) {
    case('and'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(Ray.Generator.getArgument(block, 'REST_ARG' + String(i)));
      }
      return RT.and.apply(null, args);
      break;
    case('or'):
      for(i = 0; i < block.restArgCount_; i++) {
        args.push(Ray.Generator.getArgument(block, 'REST_ARG' + String(i)));
      }
      return RT.or.apply(null, args);
      break;
    case('if'):
      var pred = Ray.Generator.getArgument(block, 'PRED');
      var thenExpr = Ray.Generator.getArgument(block, 'THEN_EXPR');
      var elseExpr = Ray.Generator.getArgument(block, 'ELSE_EXPR');
      return RT._if(pred, thenExpr, elseExpr);
      break;
    case('cond'):
      for(i = 0; i <= block.testClauseCount_; i++) {
        var test = Ray.Generator.getArgument(block, 'CONDITION' + String(i));
        var body = Ray.Generator.getArgument(block, 'BODY' + String(i));
        args.push([test,body]);
      }
      if(this.elseClause_) {
        var elseClause = Ray.Generator.getArgument(block, 'ELSE');
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

Ray.Generator.fromValue = function(block) {
  var value = block.value_;
  if(RT.valueType(value) === Values.Empty) {
    return RT.empty();
  } else if(RT.valueType(value) === Values.Primitive || RT.valueType(value) === Values.Closure) {
    // Has an argSpec obj we can extract information from
    var argSpec = value.argSpec;
    var args = [];
    for(var i = 0; i < argSpec.positionalArgs.length; i++) {
      args.push(Ray.Generator.getArgument(block, argSpec.positionalArgs[i]));
    }
    if(argSpec.restArg && block.restArgCount_) {
      for(var i = 0; i < block.restArgCount_; i++) {
        args.push(Ray.Generator.getArgument(block, 'REST_ARG' + String(i)));
      }
    }
    // Ignoring keyword arguments for the time being
    return RT.app(RT.name(block.name_), RT.positionalArgs.apply(null, args));
  } else {
    throw 'Unknown value type for block';
  }

};

/**
 * Generate the code for the application of a user function.
 * The only complication here is changing the positional argument names to P_ARGi
 * since I kept them generic to better handle changing argument names during function creation
 * @param block
  * @returns {*}
 */
Ray.Generator.fromUserFunction = function(block) {
  var argSpec = block.value_.argSpec;
  var args = [];
  for(var i = 0; i < argSpec.positionalArgs.length; i++) {
    args.push(Ray.Generator.getArgument(block, 'P_ARG' + String(i)));
  }
  if(argSpec.restArg && block.restArgCount_) {
    for(var i = 0; i < block.restArgCount_; i++) {
      args.push(Ray.Generator.getArgument(block, 'REST_ARG' + String(i)));
    }
  }

  return RT.app(RT.name(block.name_), RT.positionalArgs.apply(null, args));
};

Ray.Generator.fromDatatype = function(block) {
  switch(block.blockClass_) {
    case(Ray.Globals.Blocks.Boolean):
      var b = block.getTitleValue('B');
      return RT.bool(b === 'TRUE');
      break;
    case(Ray.Globals.Blocks.Num):
      var n = block.getTitleValue('N');
      return RT.num(Ray.Numbers.fromString(n));
      break;
    case(Ray.Globals.Blocks.Str):
      var s = block.getTitleValue('S');
      return RT.str(s);
      break;
    case(Ray.Globals.Blocks.Char):
      var c = block.getTitleValue('C');
      return RT.char(c);
      break;
    default:
      throw 'Unknown datatype!';
      break;
  }
};

Ray.Generator.fromArgument = function(block) {
  return RT.name(block.name_);
};

Ray.Generator.generate = function(block) {
  if(block.isUserFunction_) {
    //throw 'Handle user functions!';
    return Ray.Generator.fromUserFunction(block);
  } else if(block.value_) {
    return Ray.Generator.fromValue(block);
  } else if(block.form_) {
    return Ray.Generator.fromForm(block);
  } else if(block.datatype_) {
    return Ray.Generator.fromDatatype(block);
  } else if(block.arguments_) {
    return Ray.Generator.fromArgument(block);
  } else {
    throw "Unknown type of block! Can't generate!";
  }
};


