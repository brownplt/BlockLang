/**
 * @desc Defines blocks from Ray constructs.
 *
 * The standard usage pattern for Ray.Blocks is to first
 * call Ray.Blocks.generate_all_blocks with an instance of Ray.Ray
 * to get an object of block name & block key-value pairs and set Blockly.Language to that object
 *
 * With the set of blocks generated, we can then call Ray.Blocks.generate_toolbox,
 * passing in the new Blockly.Language. This will return an xml string that can be passed in to
 * Blockly.inject as the value of the toolbox argument.
 *
 * NOTE: You must call Ray.Main.attach_blockly on a set of Blocks before they can be used!!
 * Otherwise, when they try to refer to this.Blockly, they will error!!
 *
 */

goog.provide('Ray.Blocks');
goog.require('Ray._');

//Ray.Blocks.BLOCK_COLOUR = 173;
Ray.Blocks.REST_ARG_PREFIX = "ray_rest_arg_";
Ray.Blocks.BLOCK_PREFIX = "ray_";
Ray.Blocks.PRIMITIVE_DATA_PREFIX = "ray_data_create_";
Ray.Blocks.CONDITIONAL_PREFIX = "ray_conditional_";
Ray.Blocks.ARG_PREFIX = "ray_function_arg_";
Ray.Blocks.FUNCTION_DEF_PREFIX = "ray_function_def_";
Ray.Blocks.HELP_URL = "#";


Ray.Blocks.block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.BLOCK_PREFIX + _.escape(name);
};
Ray.Blocks.rest_arg_block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.REST_ARG_PREFIX + _.escape(name);
};
Ray.Blocks.primitive_data_block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.PRIMITIVE_DATA_PREFIX + _.escape(name);
};
Ray.Blocks.conditional_block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.CONDITIONAL_PREFIX + _.escape(name);
};
Ray.Blocks.arg_block_name = function(name) {
  window._ = Ray._;
  return Ray.Blocks.ARG_PREFIX + _.escape(name);
};
Ray.Blocks.function_def_block_name = function(name) {
  return Ray.Blocks.FUNCTION_DEF_PREFIX + _.escape(name);
};
Ray.Blocks.BaseTypes = ['boolean',
                        'num',
                        'str',
                        'char',
                        'bottom'];


// Ray.Blocks.TypeColourTable is defined the first time get_colour is called!
Ray.Blocks.get_colour = function(types) {
  if(!Ray.Blocks.TypeColourTable) {
    Ray.Blocks.TypeColourTable = {};
    var base_types = Ray.Blocks.BaseTypes.concat(['forms']);
    var hue_distance = 270 / base_types.length;
    var current_hue = 0;
    _.each(base_types, function(ty) {
       Ray.Blocks.TypeColourTable[ty] = current_hue;
      current_hue += hue_distance;
    });
  };

  var c = Ray.Blocks.TypeColourTable[types[0]];
  if(_.isNull(c)) {
    throw new Ray.Error("Unknown type, no colour found!!");
  } else {
    return c;
  }
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
Ray.Blocks.cond_test_body_block_name = "ray_conditional_cond_test_body";
Ray.Blocks.cond_else_block_name = "ray_conditional_cond_else";

Ray.Blocks.get_drawers = function(block) {
  var drawers = [];
  if(block.__value__) {
    var value = block.__value__;
    var output_types = (value.R.node_type(value) === 'primitive' ? value.f_type : value.body_type).get_all_base_types();
    var input_types = value.arg_spec.arguments_type.get_all_base_types();
    _.each(input_types, function(type) {
      drawers.push(type + '_input');
    });
    _.each(output_types, function(type) {
      drawers.push(type + '_output');
    });
  } else if(block.__form__) {
    drawers.push('forms');
  } else if(block.__datatype__) {
    drawers.push(block.__datatype__ + '_output');
  } else if(block.__arguments__) {
    drawers.push('arguments');
  } else if(block.__function_definition__) {
    drawers.push('functions');
  } else{
    throw new Ray.Error("Unknown sort of block!!");
  }
  return drawers;
};

/**
 * Generates all the blocks for a given instance of Ray.
 * Right now, this just sequentially generates all the primitive data blocks,
 * and then all the blocks for builtin procedures.
 * @param r
 * @returns {{}}
 */
Ray.Blocks.generate_all_blocks = function(r) {
  var obj = {};
  Ray.Blocks.define_primitive_data_blocks(r, obj);
  Ray.Blocks.define_builtin_blocks(r, obj);
  Ray.Blocks.define_conditional_blocks(r, obj);
  return obj;
};

Ray.Blocks.define_function_def_block = function(r, obj, name, desc, return_type) {
  var fun_def_block = {
    helpUrl: Ray.Blocks.HELP_URL,
    __value__: null,
    __datatype__: null,
    __form__: null,
    __name__: name,
    __arguments__: null,
    __function_definition__: true,
    __return_type__: return_type,
    __desc__: desc
  };

  fun_def_block.init = function() {
    this.setColour(Ray.Blocks.get_colour([this.__return_type__]));
    this.appendDummyInput()
      .appendTitle(this.__name__)
      .setAlign(this.Blockly.ALIGN_CENTRE);
    this.appendValueInput('BODY');
    this.setInputsInline(true);
    this.setNextStatement(false);
    this.setPreviousStatement(false);
    this.setTooltip(this.__desc__);
    this.setOutput(false);
  };

  obj[Ray.Blocks.function_def_block_name(name)] = fun_def_block;
  return obj;
};

Ray.Blocks.define_arg_blocks = function(r, obj, args) {
  function ArgumentBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = null;
    this.__form__ = null;
    this.__name__ = name;
    this.__arg_type__ = type;
    this.__arguments__ = true;
    this.init = function() {
      this.setColour(Ray.Blocks.get_colour([this.__arg_type__]));
      this.appendDummyInput()
        .appendTitle(this.__name__);
      this.setOutput(true);
      this.setNextStatement(false);
      this.setPreviousStatement(false);
    };
  }

  _.each(args, function(arg) {
    var arg_block = new ArgumentBlock(arg.name, arg.type);
    obj[Ray.Blocks.arg_block_name(arg.name)] = arg_block;
  });
  return obj;
};

Ray.Blocks.define_conditional_blocks = function(r, obj) {
  function ConditionalBlock(name) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = null;
    this.__form__ = name;
    this.__name__ = name;
  }

  // If
  var if_block = new ConditionalBlock('if');
  if_block.init = function() {
    this.setColour(Ray.Blocks.get_colour(['forms']));
    this.appendValueInput('PRED')
        .appendTitle("if");
    this.appendValueInput('T_EXPR')
        .appendTitle('then');
    this.appendValueInput('F_EXPR')
        .appendTitle('else');
    this.setOutput(true);
    this.setInputsInline(true);
  };

  obj[Ray.Blocks.conditional_block_name('if')] = if_block;

  // And
  var and_block = new ConditionalBlock('and');
  and_block.init = function() {
    this.setInputsInline(true);
    this.setColour(Ray.Blocks.get_colour(['forms']));
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setOutput(true);

    this.appendDummyInput()
        .setAlign(this.Blockly.ALIGN_CENTRE)
        .appendTitle('and');

    this.appendDummyInput('NO_REST_ARGS')
        .appendTitle('...');
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 0;
  };

  Ray.Blocks.add_rest_arg(and_block, obj, 'and');
  obj[Ray.Blocks.conditional_block_name('and')] = and_block;

  // Or
  var or_block = new ConditionalBlock('or');
  or_block.init = function() {
    this.setInputsInline(true);
    this.setColour(Ray.Blocks.get_colour(['forms']));
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setOutput(true);

    this.appendDummyInput()
        .setAlign(this.Blockly.ALIGN_CENTRE)
        .appendTitle('or');

    this.appendDummyInput('NO_REST_ARGS')
        .appendTitle('...');
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 0;
  };

  Ray.Blocks.add_rest_arg(or_block, obj, 'or');
  obj[Ray.Blocks.conditional_block_name('or')] = or_block;

  // Cond
  var cond_block = new ConditionalBlock('cond');
  cond_block.init = function() {
    this.setInputsInline(true);
    this.setColour(Ray.Blocks.get_colour(['forms']));
    this.setPreviousStatement(false);
    this.setNextStatement(false);

    this.appendDummyInput()
        .setAlign(this.Blockly.ALIGN_CENTRE)
        .appendTitle('cond');

    this.appendValueInput('CONDITION0')
        .appendTitle('when');
    this.appendValueInput('BODY0');


    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.cond_test_body_block_name, Ray.Blocks.cond_else_block_name]));
    this.test_clause_count_ = 0;
    this.else_clause_ = false;

    this.setOutput(true);
  };
  cond_block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('test_clauses', String(this.test_clause_count_));
    container.setAttribute('else_clause', String(this.else_clause_ ? 1 : 0));
    return container;
  };
  cond_block.domToMutation = function(container) {
    for(var i = 1; i <= this.test_clause_count_; i++) {
      this.removeInput('CONDITION' + String(i));
      this.removeInput('BODY' + String(i));
    }

    if(this.else_clause_) {
      this.removeInput('ELSE');
    }
    this.test_clause_count_ = window.parseInt(container.getAttribute('test_clauses'));
    for(var i = 1; i <= this.test_clause_count_; i++) {
      this.addValueInput('CONDITION' + String(i))
          .addTitle('when');
    }

    this.else_clause_ = Boolean(window.parseInt(container.getAttribute('else_clause')));
    if(this.else_clause_) {
      this.addValueInput('ELSE')
          .addTitle('otherwise');
    }
  };
  cond_block.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace, Ray.Blocks.conditional_block_name('cond_cond'));
    container_block.initSvg();
    var connection = container_block.getInput('STACK').connection;
    for(var x = 1; x <= this.test_clause_count_; x++) {
      var test_body_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_test_body_block_name);
      test_body_block.initSvg();
      connection.connect(test_body_block.previousConnection);
      connection = test_body_block.nextConnection;
    }

    if(this.else_clause_) {
      var else_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_else_block_name);
      else_block.initSvg();
      connection.connect(else_block.previousConnection);
    }
    return container_block;

  };
  cond_block.compose = function(container_block) {
    if(this.else_clause_) {
      this.removeInput('ELSE');
    }
    this.else_clause_ = false;

    for(var x = this.test_clause_count_; x > 0; x--) {
      this.removeInput('CONDITION' + String(x));
      this.removeInput('BODY' + String(x));
    }
    this.test_clause_count_ = 0;

    var clause_block = container_block.getInputTargetBlock('STACK');
    while(clause_block) {
      switch(clause_block.__type__) {
        case Ray.Blocks.cond_test_body_block_name:
          this.test_clause_count_++;
          this.appendValueInput('CONDITION' + String(this.test_clause_count_))
              .appendTitle('when');
          this.appendValueInput('BODY' + String(this.test_clause_count_));
          break;
        case Ray.Blocks.cond_else_block_name:
          this.else_clause_ = true;
          this.appendValueInput('ELSE')
              .appendTitle('otherwise');
          break;
        default:
          throw "Unknown block type inside ray_conditional_cond_cond!";
          break;
      }
      clause_block = clause_block.nextConnection &&
          clause_block.nextConnection.targetBlock();
    }
  };

  obj[Ray.Blocks.conditional_block_name('cond')] = cond_block;

  var cond_cond_block = {
    init: function() {
      this.setColour(Ray.Blocks.get_colour(['forms']));
      this.appendDummyInput()
          .appendTitle('cond');
      this.appendStatementInput('STACK');
      this.contextMenu = false;
    }
  };

  obj[Ray.Blocks.conditional_block_name('cond_cond')] = cond_cond_block;

  var cond_test_body_block = {
    __type__: Ray.Blocks.cond_test_body_block_name,
    init: function() {
      this.setColour(Ray.Blocks.get_colour(['forms']));
      this.appendDummyInput()
          .appendTitle('test/body');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.contextMenu = false;
    }
  };

  obj[Ray.Blocks.cond_test_body_block_name] = cond_test_body_block;

  var cond_else_block = {
    __type__: Ray.Blocks.cond_else_block_name,
    init: function() {
      this.setColour(Ray.Blocks.get_colour(['forms']));
      this.appendDummyInput()
          .appendTitle('otherwise');
      this.setPreviousStatement(true);
      this.setNextStatement(false);
      this.contextMenu = false;
    }
  };

  obj[Ray.Blocks.cond_else_block_name] = cond_else_block;

  return obj;
};

/**
 * Defines the blocks that allow you to enter primitive data.
 * Currently, this is limited to: booleans, numbers, characters, and strings.
 * @param r
 * @param obj
 */
Ray.Blocks.define_primitive_data_blocks = function(r, obj) {
  function PrimitiveDataBlock(type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = type;
  }

  // Boolean
  var boolean_block = new PrimitiveDataBlock('boolean');
  boolean_block.init = function() {
    this.setColour(Ray.Blocks.get_colour([this.__datatype__]));
    var dropdown = new this.Blockly.FieldDropdown([['#t', 'TRUE'],['#f', 'FALSE']]);
    this.appendDummyInput()
        .appendTitle(dropdown, 'B');
    this.setOutput(true);
  };

  obj[Ray.Blocks.primitive_data_block_name('boolean')] = boolean_block;

  // Number
  var number_block = new PrimitiveDataBlock('num');
  number_block.init = function() {
    this.setColour(Ray.Blocks.get_colour([this.__datatype__]));
    var textfield = new this.Blockly.FieldTextInput('0', this.Blockly.FieldTextInput.numberValidator);
    this.appendDummyInput()
        .appendTitle(textfield, 'N');
    this.setOutput(true);
  };

  obj[Ray.Blocks.primitive_data_block_name('num')] = number_block;

  //String
  var string_block = new PrimitiveDataBlock('str');
  string_block.init = function() {
    this.setColour(Ray.Blocks.get_colour([this.__datatype__]));
    var textfield = new this.Blockly.FieldTextInput('Hello, World!');
    this.appendDummyInput()
        .appendTitle('"')
        .appendTitle(textfield, 'S')
        .appendTitle('"');
    this.setOutput(true);
  };

  obj[Ray.Blocks.primitive_data_block_name('str')] = string_block;

  //Chars
  var char_block = new PrimitiveDataBlock('char');
  char_block.init = function() {
    this.setColour(Ray.Blocks.get_colour([this.__datatype__]));
    var char_validator = function(text) {
      return text.length === 1 ? text : null;
    };
    var textfield = new this.Blockly.FieldTextInput('a', char_validator);
    this.appendDummyInput()
        .appendTitle('#\\')
        .appendTitle(textfield, 'C')
    this.setOutput(true);
  }

  obj[Ray.Blocks.primitive_data_block_name('char')] = char_block;
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
 *   a Number,
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
  switch(value.R.node_type(value)) {
    case 'pair':
    case 'number':
    case 'empty':
    case 'boolean':
    case 'str':
    case 'char':
      return;
      //throw new r.Error("Not yet implemented!");
      //block = null;
      break;
    case 'primitive':
    case 'closure':
      var output_types = (value.R.node_type(value) === 'primitive' ? value.f_type : value.body_type).get_all_base_types();
      var input_types = value.arg_spec.arguments_type.get_all_base_types();
      var block_colour = Ray.Blocks.get_colour(output_types);
      var arg_spec = value.arg_spec;
      // Ignoring rest and keyword arguments
      var arity = arg_spec.p_args.length;
      var rest_arg = arg_spec.rest_arg || null;

      var block = {};
      block.__name__ = name;
      block.__value__ = value;
      block.helpUrl = Ray.Blocks.HELP_URL;
      block.init = function() {
        this.setInputsInline(true);
        this.setColour(block_colour);
        this.setPreviousStatement(false);
        this.setNextStatement(false);
        this.setOutput(true);

        this.appendDummyInput()
            .setAlign(this.Blockly.ALIGN_CENTRE)
            .appendTitle(name);

        for(var i = 0; i < arity; i++) {
          this.appendValueInput(arg_spec.p_args[i])
              .appendTitle(arg_spec.p_args[i]);
        }

        if(rest_arg) {
          this.appendDummyInput('NO_REST_ARGS')
              .appendTitle('...');
          this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
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
 * @param blocks, the object from which we want to get the block names we will use to generate the xml
 */
Ray.Blocks.generate_toolbox = function(blocks) {
  var toolbox_obj = Ray.Blocks.generate_toolbox_obj(blocks);
  var toolbox_categories = _.keys(toolbox_obj);
  toolbox_categories.sort();
  var toolbox = "<xml id=\"toolbox\">\n";
  _.each(toolbox_categories, function(category) {
    // Don't display empty categories
    if(goog.isArray(toolbox_obj[category]) && !(toolbox_obj[category].length)) {
      return;
    }
    toolbox += "  <category name=\"" + category + "\">\n";

    if(!_.isArray(toolbox_obj[category])) {
      _.each(_.keys(toolbox_obj[category]), function(subcategory) {
        var block_names = toolbox_obj[category][subcategory];
        var subcategory_name;
        if(subcategory === 'input') {
          subcategory_name = 'consumes ' + category;
        } else if(subcategory === 'output') {
          subcategory_name = 'produces ' + category;
        } else {
          subcategory_name = subcategory;
        }

        toolbox += "    <category name=\"" + subcategory_name + "\">\n";
        _.each(block_names, function(block_name) {
          toolbox += "      <block type=\"" + _.escape(block_name) + "\"></block>\n";
        });
        toolbox += "    </category>\n";
      })
    } else {
      var block_names = toolbox_obj[category];
      _.each(block_names, function(block_name) {
        toolbox += "    <block type=\"" + _.escape(block_name) + "\"></block>\n";
      });
    }
    toolbox += "  </category>\n";
  });
  toolbox += "</xml>";
  return toolbox;
};

Ray.Blocks.generate_toolbox_obj = function(blocks) {
  var toolbox_obj  = {};
  _.each(['num', 'str', 'char', 'boolean', 'bottom'], function(ty) {
    toolbox_obj[ty] = {};
    toolbox_obj[ty]['input'] = [];
    toolbox_obj[ty]['output'] = [];
  });

  toolbox_obj['forms'] = [];
  toolbox_obj['arguments'] = [];
  toolbox_obj['functions'] = [];
  toolbox_obj['all'] = [];


  var block_names = _.reject(_.keys(blocks), function(name) {
    var is_cond_cond = name.indexOf(Ray.Blocks.CONDITIONAL_PREFIX + 'cond_') === 0;
    var is_rest_arg = name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    return is_cond_cond || is_rest_arg;
  });
  _.each(block_names, function(block_name) {
    var block = blocks[block_name];
    var drawers = Ray.Blocks.get_drawers(block);
    _.each(drawers, function(drawer) {
      var end_index = drawer.search(/(input|output)/);
      if(end_index < 0) {
        toolbox_obj[drawer].push(block_name);
      } else {
        var in_or_out = drawer.substring(end_index);
        var type = drawer.substring(0, end_index - 1);
        toolbox_obj[type][in_or_out].push(block_name);
      }
    });
    toolbox_obj['all'].push(block_name);
  });
  return toolbox_obj;

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
    var container_block = new this.Blockly.Block(workspace,
                                            container_block_name);
    container_block.initSvg();
    if(container_block.getInput('STACK')) {
      var connection = container_block.getInput('STACK').connection;
      for(var x = 0; x < this.rest_arg_count_; x++) {
        var arg_block = new this.Blockly.Block(workspace, Ray.Blocks.rest_arg_arg_block_name);
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
  };
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