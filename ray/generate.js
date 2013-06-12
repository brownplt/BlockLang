goog.provide('Ray.Generator');

goog.require('Blockly');

Blockly.Ray = Blockly.Generator.get('Ray');
Blockly.Ray.init = function() {
  console.log("Initializing Blockly.Ray");
};
Blockly.Ray.finish = function(code) {
  return code;
};
Blockly.Ray.scrub_ = function(block, code) {
  return code;
}

Blockly.Ray.ORDER_MEMBER = 1;
Blockly.Ray.ORDER_FUNCTION_CALL = 2;
Blockly.Ray.ORDER_COMMA = 17;

Ray.Generator.ray_apply = function(name, args) {
  var ray_name = 'r.name("' + name + '")';
  var ray_args = 'r.p_args(' + args.join(', ') + ')';
  return 'r.app(' + [ray_name, ray_args].join(', ') + ')';
};

Ray.Generator.Error = { message: "Unable to generate code for provided block! " };
Ray.Generator.throwError = function() {
  throw new Error();
};

Ray.Generator.getArgument = function(block, arg) {
  return Blockly.Ray.valueToCode(block, arg, Blockly.Ray.ORDER_COMMA) || Ray.Generator.throwError();
};

Ray.Generator.generatedCode = function(code) {
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Ray.Generator.install_generators = function(blocks) {
  var getArgument = Ray.Generator.getArgument;
  var generatedCode = Ray.Generator.generatedCode;

  var omitted_blocks = _.filter(blocks, function(block, name) {
    return name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
  });

  var generators = {};

  _.each(_.omit(blocks, omitted_blocks), function(block, block_name) {
    var generator = function() {
      // this is the block we are generating code for
      if(block.__value__) {
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
      } else {
        switch(block.__datatype__) {
          case('boolean'):
            var b = this.getTitleValue('B');
            return generatedCode('r.bool(' + b.toLowerCase() + ')');
            break;
          case('number'):
            var n = this.getTitleValue('N');
            return generatedCode('r.num(' + n + ')');
            break;
          case('string'):
            var s = this.getTitleValue('S');
            return generatedCode('r.str("' + s +  '")');
            break;
          case('char'):
            var c = this.getTitleValue('C');
            return generatedCode('r.char(\'' + c + '\')');
            break;
          default:
            throwError();
        }
      }
    };
    generators[block_name] = generator;

  });

  _.each(generators, function(generator, block_name) {
    Blockly.Ray[block_name] = generator;
  });

  return generators;
};

