goog.provide('Ray.Generator');

goog.require('Ray.Blocks');

var get_arg = function(block, name, r) {
  var arg = block.getInputTargetBlock(name);
  if(!arg) {
    throw 'Missing argument!';
  } else {
    return gen(arg, r);
  }
};

var gen_form = function(block, r) {
  var args = [];
  var i;

  switch(block.__form__) {
    case('and'):
      for(i = 0; i < block.rest_arg_count_; i++) {
        args.push(get_arg(block, 'REST_ARG' + String(i), r));
      }
      return r.and.apply(null, args);
      break;
    case('or'):
      for(i = 0; i < block.rest_arg_count_; i++) {
        args.push(get_arg(block, 'REST_ARG' + String(i), r));
      }
      return r.or.apply(null, args);
      break;
    case('if'):
      var pred = get_arg(block, 'PRED', r);
      var t_expr = get_arg(block, 'T_EXPR', r);
      var f_expr = get_arg(block, 'F_EXPR', r);
      return r._if.apply(pred, t_expr, f_expr);
      break;
    case('cond'):
      for(i = 0; i <= block.test_clause_count_; i++) {
        var test = get_arg(block, 'CONDITION' + String(i), r);
        var body = get_arg(block, 'BODY' + String(i), r);
        args.push([test,body]);
      }
      if(this.else_clause_) {
        var else_clause = get_arg(block, 'ELSE', r);
        return r.cond(args, else_clause);
      } else {
        return r.cond(args);
      }
      break;
    default:
      throw 'Unknown form!';
      break;
  }
};

var gen_value = function(block, r) {
  // Has an arg_spec obj we can extract information from
  var arg_spec = block.__value__.arg_spec;
  var args = [];
  for(var i = 0; i < arg_spec.p_args.length; i++) {
    args.push(get_arg(block, arg_spec.p_args[i], r));
  }
  if(arg_spec.rest_arg && block.rest_arg_count_) {
    for(var i = 0; i < block.rest_arg_count_; i++) {
      args.push(get_arg(block, 'REST_ARG' + String(i), r));
    }
  }
  // Ignoring keyword arguments for the time being
  return r.app(r.name(block.__name__), r.p_args.apply(null, args));

};

var gen_datatype = function(block, r) {
  switch(block.__datatype__) {
    case('boolean'):
      var b = block.getTitleValue('B');
      return r.bool(b === 'TRUE');
      break;
    case('num'):
      var n = this.getTitleValue('N');
      return r.num(n);
      break;
    case('str'):
      var s = this.getTitleValue('S');
      return r.str(s);
      break;
    case('char'):
      var c = this.getTitleValue('C');
      return r.char(c);
      break;
    default:
      throw 'Unknown datatype!';
      break;
  }
};

var gen_argument = function(block, r) {
  return r.name(block.__name__);
};

var gen = function(block, r) {
  if(block.__value__) {
    return gen_value(block, r);
  } else if(block.__form__) {
    return gen_form(block, r);
  } else if(block.__datatype__) {
    return gen_datatype(block, r);
  } else if(block.__arguments__) {
    return gen_argument(block, r);
  } else {
    throw "Unknown type of block! Can't generate!";
  }
};

Ray.Generator.generate = gen;

