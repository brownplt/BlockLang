goog.provide('Ray.Generator');

goog.require('Ray.Blocks');

Ray.Generator = function(Blockly) {

  var Generator = {};

  Blockly.Ray = Blockly.Generator.get('Ray');
  Blockly.Ray.init = function() {
    console.log("Initializing Blockly.Ray");
  };
  Blockly.Ray.finish = function(code) {
    return code;
  };
  Blockly.Ray.scrub_ = function(block, code) {
    return code;
  };
  Blockly.Ray.ORDER_MEMBER = 1;
  Blockly.Ray.ORDER_FUNCTION_CALL = 2;
  Blockly.Ray.ORDER_COMMA = 17;

  Generator.getArgument = function(block, arg) {
    return Blockly.Ray.valueToCode(block, arg, Blockly.Ray.ORDER_COMMA) || Generator.throwError();
  };

  Generator.generatedCode = function(code) {
    return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
  };

  Generator.make_generators = function(blocks) {
    var block_names = _.keys(blocks);
    var omitted_block_names = _.filter(block_names, function(block_name) {
      return block_name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    });
    var generators = {};
    _.each(_.omit(blocks, omitted_block_names), function(block, block_name) {
      var generator;
      if(block.__value__) {
        generator = Generator.value_generator(block);
      } else if(block.__datatype__) {
        generator = Generator.datatype_generator(block);
      } else if (block.__form__) {
        generator = Generator.form_generator(block);
      } else if (block.__arguments__) {
        generator = Generator.argument_generator(block);
      } else {
        return;
        //return Ray.Generator.throwError();
      }
      generators[block_name] = generator;
    });
    return generators;
  };

  Generator.install_generators = function(generators) {
    _.each(generators, function(generator, block_name) {
      Blockly.Ray[block_name] = generator;
    });
  };

  Generator.form_generator = function(block) {
    var getArgument = Generator.getArgument;
    var generatedCode = Generator.generatedCode;
    switch(block.__form__) {
    case('and'):
      return function() {
        var args = [];
        for(var i = 0; i < this.rest_arg_count_; i++) {
          args.push(getArgument(this, 'REST_ARG' + String(i)));
        }
        return generatedCode('r.and(' + args.join(', ') + ')');
      };
      break;
    case('or'):
      return function() {
        return generatedCode('r.or(' + args.join(', ') + ')');
      };
      break;
    case('if'):
      return function() {
        var pred = getArgument(this, 'PRED');
        var t_expr = getArgument(this, 'T_EXPR');
        var f_expr = getArgument(this, 'F_EXPR');
        return generatedCode('r._if(' + [pred, t_expr, f_expr].join(', ') + ')');
      };
      break;
    case('cond'):
      return function() {
        var args = [];
        for(var i = 0; i <= this.test_clause_count_; i++) {
          var test = getArgument(this, 'CONDITION' + String(i));
          var body = getArgument(this, 'BODY' + String(i));
          args.push('[' + test + ', ' + body + ']');
        }
        var test_clauses = '[' + args.join(', ') + ']';
        if(this.else_clause_) {
          var else_clause = getArgument(this, 'ELSE');
          return generatedCode('r.cond(' + test_clauses + ', ' + else_clause + ')');
        } else {
          return generatedCode('r.cond(' + test_clauses + ')');
        }
      };
      break;
    default:
      return Ray.Generator.throwError();
  }
};

  Generator.value_generator = function(block) {
    var getArgument = Generator.getArgument;
    var generatedCode = Generator.generatedCode;
    return function()  {
      // Has an arg_spec obj we can extract information from
      var arg_spec = block.__value__.arg_spec;
      var args = [];
      for(var i = 0; i < arg_spec.p_args.length; i++) {
        args.push(getArgument(this, arg_spec.p_args[i]));
      }
      if(arg_spec.rest_arg && this.rest_arg_count_) {
        for(var i = 0; i < this.rest_arg_count_; i++) {
          args.push(getArgument(this, 'REST_ARG' + String(i)));
        }
      }
      // Ignoring keyword arguments for the time being
      return generatedCode(Ray.Generator.ray_apply.call(null, block.__name__, args));
    };
  };

  Generator.datatype_generator = function(block) {
    var generatedCode = Generator.generatedCode;
    switch(block.__datatype__) {
      case('boolean'):
        return function() {
          var b = this.getTitleValue('B');
          return generatedCode('r.bool(' + b.toLowerCase() + ')');
        };
        break;
      case('num'):
        return function() {
          var n = this.getTitleValue('N');
          return generatedCode('r.num(' + n + ')');
        };
        break;
      case('str'):
        return function() {
          var s = this.getTitleValue('S');
          return generatedCode('r.str("' + s +  '")');
        };
        break;
      case('char'):
        return function() {
          var c = this.getTitleValue('C');
          return generatedCode('r.char(\'' + c + '\')');
        };
        break;
      default:
        return Ray.Generator.throwError();
    }
  };

  Generator.argument_generator = function(block) {
    var generatedCode = Generator.generatedCode;
    var arg_name = block.__name__;
    return function() {
      return generatedCode('r.name("' + arg_name + '")');
    };
  };

  return Generator;
};

Ray.Generator.ray_apply = function(name, args) {
  var ray_name = 'r.name("' + name + '")';
  var ray_args = 'r.p_args(' + args.join(', ') + ')';
  return 'r.app(' + [ray_name, ray_args].join(', ') + ')';
};

Ray.Generator.Error = { message: "Unable to generate code for provided block! " };
Ray.Generator.throwError = function() {
  throw new Error();
};

