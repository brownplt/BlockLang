goog.provide('Ray.Blocks');

goog.require('Ray._');
goog.require('Blockly');


Ray.Blocks.BLOCK_COLOUR = 173;
Ray.Blocks.REST_ARG_PREFIX = "ray_rest_arg_";
Ray.Blocks.BLOCK_PREFIX = "ray_";
Ray.Blocks.HELP_URL = "#";

Ray.Blocks.block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.BLOCK_PREFIX + _.escape(name);
};

Ray.Blocks.rest_arg_block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.REST_ARG_PREFIX + _.escape(name);
};

Ray.Blocks.rest_arg_arg_block_name = "ray_rest_arg_arg_";
Ray.Blocks.rest_arg_arg_block = {
  init: function() {
    this.setColour(Ray.Blocks.BLOCK_COLOUR);
    this.appendDummyInput()
        .appendTitle('arg');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  }
};


/**
 * Looks through the builtins in a Ray, finds those for which
 * there aren't blocks in obj, and creates blocks for them.
 *
 * If you want to change a pre-existing block, you cannot do so here.
 *
 * @param ray, has to have builtins already installed
 * @param obj, the object into which we install the missing blocks
 */
Ray.Blocks.define_builtin_blocks = function(r, obj) {
  window._ = Ray._;
  var builtins = r.builtins.dict({});
  _.each(builtins, function(value, name) {
    var block_name = Ray.Blocks.block_name(name);
    if(!_.has(obj, block_name)) {
      Ray.Blocks.generate_block(r, name, value, obj);
    }
  });
  obj[Ray.Blocks.rest_arg_arg_block_name] = Ray.Blocks.rest_arg_arg_block;
  return obj;
};

/**
 * Create the block corresponding to a use of value
 * (Note, that this is function application, and not definition)
 * value is either:
 *   a Pair,
 *   a Null,
 *   a Boolean,
 *   a Str,
 *   a Char,
 *   a Primitive, (At the moment we only are considering this and
 *   a Closure,    this)
 *   an ArgumentSpec, <-- Should never be passed in directly
 *   an Arguments. <-- Should never be passed in directly, not really a Value either.
 * @param name, the name of the block, will be used in looking it up, and as title on block.
 * @param value, the value from which we are creating the block
 */
Ray.Blocks.generate_block = function(r, name, value, obj) {
  var block_name = Ray.Blocks.block_name(name);
  var block = {};
  switch(value.R.type(value)) {
    case 'pair':
    case 'null':
    case 'boolean':
    case 'str':
    case 'char':
      throw new r.Error("Not yet implemented!");
      block = null;
      break;
    case 'primitive':
    case 'closure':
      var arg_spec = value.arg_spec;
      // Ignoring rest and keyword arguments
      var arity = arg_spec.p_args.length;
      var rest_arg = arg_spec.rest_arg || null;

      var block = {};
      block.__name__ = name;
      block.helpUrl = Ray.Blocks.HELP_URL;
      block.init = function() {
        this.setInputsInline(true);
        this.setColour(Ray.Blocks.BLOCK_COLOUR);
        this.setPreviousStatement(false);
        this.setNextStatement(false);
        this.setOutput(true);

        this.appendDummyInput()
            .setAlign('Blockly.ALIGN_CENTRE')
            .appendTitle(name);

        for(var i = 0; i < arity; i++) {
          this.appendValueInput(arg_spec.p_args[i])
              .appendTitle(arg_spec.p_args[i]);
        }

        if(rest_arg) {
          this.appendDummyInput('NO_REST_ARGS')
              .appendTitle('...');
          this.setMutator(new Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
          this.rest_arg_count_ = 0;
        }
      };

      if(rest_arg) {
        Ray.Blocks.add_rest_arg(block, obj, rest_arg);
      }
      break;
    default:
      throw new Ray.Error("Unknown value, can't create block!");
      block = null;
      break;
  }
  if(block) {
    obj[block_name] = block;
  };
  return block;
};

/**
 * Generates an xml string representing the toolbox of blocks that will be available on a Blockly page.
 * @param obj, the object from which we want to get the block names we will use to generate the xml
 */
Ray.Blocks.generate_toolbox = function(obj) {
  var block_names = _.reject(_.keys(obj), function(name) {
    return name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
  });
  var toolbox = "<xml>";
  _.each(block_names, function(block_name) {
    toolbox += "<block type=\"" + _.escape(block_name) + "\"></block>";
  });
  toolbox += "</xml>";
  return toolbox;
};

Ray.Blocks.add_rest_arg = function(block, obj, rest_arg) {
  // Create the block which will hold the arguments as I add or subtract them.
  // The arguments themselves will be shared by any blocks with rest args.
  var rest_arg_container = {};
  rest_arg_container.helpUrl = Ray.Blocks.HELP_URL;
  rest_arg_container.init = function() {
    this.setColour(Ray.Blocks.BLOCK_COLOUR);
    this.appendDummyInput()
        .appendTitle(rest_arg);
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  };

  var container_block_name = Ray.Blocks.rest_arg_block_name(block.__name__);
  obj[container_block_name] = rest_arg_container;

  block.decompose = function(workspace) {
    var container_block = new Blockly.Block(workspace,
                                            container_block_name);
    container_block.initSvg();
    if(container_block.getInput('STACK')) {
      var connection = container_block.getInput('STACK').connection;
      for(var x = 0; x < this.rest_arg_count_; x++) {
        var arg_block = new Blockly.Block(workspace, Ray.Blocks.rest_arg_arg_block_name);
        arg_block.initSvg();
        connection.connect(arg_block.previousConnection);
        connection = arg_block.nextConnection;
      }
    }
    return container_block;
  };
  block.compose = function(container_block) {
    if(this.rest_arg_count_ == 0) {
      this.removeInput('NO_REST_ARGS');
    } else {
      for(var i = this.rest_arg_count_ - 1; i >= 0; i--) {
        this.removeInput('REST_ARG' + String(i));
      }
    }
    this.rest_arg_count_ = 0;
    var arg_block = container_block.getInputTargetBlock('STACK');
    while(arg_block) {
      var arg = this.appendValueInput('REST_ARG' + String(this.rest_arg_count_));
      // This should never be set!
      if(arg_block.value_connection_) {
        arg.connection.connect(arg_block.value_connection_);
      }
      this.rest_arg_count_++;
      arg_block = arg_block.nextConnection &&
          arg_block.nextConnection.targetBlock();
    }
    if(this.rest_arg_count_ === 0) {
      this.appendDummyInput('NO_REST_ARGS')
          .appendTitle("...");

    }

  };
  block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('rest_args', String(this.rest_arg_count_));
    return container;
  }
  block.domToMutation = function(container) {
    for(var x = 0; x < this.rest_arg_count_; x++) {
      this.removeInput('REST_ARG' + String(x));
    }
    this.rest_arg_count_ = window.parseInt(container.getAttribute('rest_args'), 10);
    for(var x = 0; x < this.rest_arg_count_; x++) {
      this.appendValueInput('REST_ARG' + String(x));
    }
    if(this.rest_arg_count_ === 0
        && (!this.getInput('NO_REST_ARGS'))) {
      this.appendDummyInput('NO_REST_ARGS')
          .appendTitle('...');
    }
  };
};