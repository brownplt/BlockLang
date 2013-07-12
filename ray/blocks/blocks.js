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
 */

goog.provide('Ray.Blocks');

goog.require('Ray.Blocks.misc');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Inference');
goog.require('Ray.Globals');

goog.require('Blockly');

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');

var Blocks = Ray.Globals.Blocks;
var Priorities = Ray.Globals.Priorities;
var R = Ray.Runtime;

Ray.Blocks.rest_arg_arg_block_name = "ray_rest_arg_arg_";
Ray.Blocks.rest_arg_arg_block = {
  init: function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle('arg');
  },
  __rest_arg__: true,
  __render_as_expression__: false
};
Ray.Blocks.cond_test_body_block_name = "ray_conditional_cond_test_body";
Ray.Blocks.cond_else_block_name = "ray_conditional_cond_else";

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
  Ray.Blocks.define_list_blocks(r, obj);
  Ray.Blocks.define_builtin_blocks(r, obj);
  Ray.Blocks.define_conditional_blocks(r, obj);
  return obj;
};

// Cons, first, rest, empty
Ray.Blocks.define_list_blocks = function(r, obj) {
  var ListBlock = function(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = r.builtins.lookup(name);
    this.__type__ = type;
    this.__list__ = name;
    this.__name__ = name;
    this.__block_class__ = Blocks[goog.string.toTitleCase(name)];
    this.__render_as_expression__ = true;
  };

  var cons_block = new ListBlock('cons', new Ray.Types.List(new Ray.Types.Unknown()));
  cons_block.init = function() {
    this.makeTitleRow('cons');
    this.appendValueInput('car')
      .setType(new Ray.Types.Unknown());
    this.appendValueInput('cdr')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('cons')] = cons_block;

  var empty_block = new ListBlock('empty', new Ray.Types.List(new Ray.Types.Unknown()));
  empty_block.init = function() {
    this.makeTitleRow('empty');
  };
  obj[Ray.Blocks.block_name('empty')] = empty_block;

  var first_block = new ListBlock('first', new Ray.Types.Unknown());
  first_block.init = function() {
    this.makeTitleRow('first');
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('first')] = first_block;

  var rest_block = new ListBlock('rest');
  rest_block.__type__ = new Ray.Types.List(new Ray.Types.Unknown());
  rest_block.init = function() {
    this.makeTitleRow('rest');
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('rest')] = rest_block;

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
    this.setColour(Ray.Blocks.get_colour(this.__return_type__));
    this.makeTitleRow(this.__name__);
    this.appendValueInput('BODY');
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
    this.__type__ = type;
    this.__arguments__ = true;
    this.__render_as_expression__ = true;
    this.__block_class__ = Blocks.Argument;
    this.priority_ = Priorities.ARGUMENT;
    this.init = function() {
      this.makeTitleRow(this.__name__);
      this.setOutputType(this.__type__);
    };
  }

  goog.array.forEach(args, function(arg) {
    var arg_block = new ArgumentBlock(arg.name_, arg.type_);
    obj[Ray.Blocks.arg_block_name(arg.name_)] = arg_block;
  });
  return obj;
};

Ray.Blocks.define_conditional_blocks = function(r, obj) {
  function ConditionalBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = null;
    this.__form__ = name;
    this.__name__ = name;
    this.__type__ = type;
    this.__block_class__ = Blocks[goog.string.toTitleCase(name)];
    this.__render_as_expression__ = true;
  }

  // If
  var if_block = new ConditionalBlock('if', new Ray.Types.Unknown());
  if_block.__expr__ = Expressions.If;
  if_block.__input_types__ = [new Ray.Types.Unknown(), new Ray.Types.Boolean()];
  if_block.init = function() {
    this.appendValueInput('PRED')
      .appendTitle("if")
      .setType(new Ray.Types.Boolean());

    this.appendValueInput('T_EXPR')
      .appendTitle('then')
      .setType(new Ray.Types.Unknown());

    this.appendValueInput('F_EXPR')
      .appendTitle('else')
      .setType(new Ray.Types.Unknown());

  };

  obj[Ray.Blocks.conditional_block_name('if')] = if_block;

  // And
  var and_block = new ConditionalBlock('and', new Ray.Types.Boolean());
  and_block.__input_types__ = [new Ray.Types.Boolean()];
  and_block.init = function() {
    this.makeTitleRow('and');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 2;
  };

  Ray.Blocks.add_rest_arg(and_block, obj, 'and', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditional_block_name('and')] = and_block;

  // Or
  var or_block = new ConditionalBlock('or', new Ray.Types.Boolean());
  or_block.__input_types__ = [new Ray.Types.Boolean()];
  or_block.init = function() {
    this.makeTitleRow('or');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 2;
  };

  Ray.Blocks.add_rest_arg(or_block, obj, 'or', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditional_block_name('or')] = or_block;

  // Cond
  var cond_block = new ConditionalBlock('cond', new Ray.Types.Unknown());
  cond_block.__input_types__ = [new Ray.Types.Unknown(), new Ray.Types.Boolean()];
  cond_block.init = function() {
    this.makeTitleRow('cond');
    this.appendValueInput('CONDITION')
      .appendTitle('when')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('BODY')
      .setType(new Ray.Types.Unknown());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.cond_test_body_block_name, Ray.Blocks.cond_else_block_name]));
    this.test_clause_count_ = 0;
    this.else_clause_ = false;
  };

  cond_block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('test_clauses', String(this.test_clause_count_));
    container.setAttribute('else_clause', String(this.else_clause_ ? 1 : 0));
    return container;
  };
  cond_block.domToMutation = function(container) {
    for(var i = 0; i < this.test_clause_count_; i++) {
      this.removeInput('CONDITION' + String(i));
      this.removeInput('BODY' + String(i));
    }

    if(this.else_clause_) {
      this.removeInput('ELSE');
    }
    this.test_clause_count_ = window.parseInt(container.getAttribute('test_clauses'));
    for(var i = 0; i < this.test_clause_count_; i++) {
      this.appendValueInput('CONDITION' + String(i))
        .appendTitle('when')
        .setType(new Ray.Types.Boolean());
      this.appendValueInput('BODY' + String(i))
        .setType(new Ray.Types.Unknown());
    }

    this.else_clause_ = Boolean(window.parseInt(container.getAttribute('else_clause')));
    if(this.else_clause_) {
      this.appendValueInput('ELSE')
        .appendTitle('otherwise')
        .setType(new Ray.Types.Unknown());
    }
  };
  cond_block.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace, Ray.Blocks.conditional_block_name('cond_cond'));
    container_block.initSvg();
    var connection = container_block.getInput('STACK').connection;
    for(var x = 0; x < this.test_clause_count_; x++) {
      var conditionConnection = this.getInput('CONDITION' + String(x)).connection;
      var bodyConnection = this.getInput('BODY' + String(x)).connection;
      var test_body_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_test_body_block_name);
      test_body_block.initSvg();
      test_body_block.conditionConnection_ = conditionConnection.targetConnection;
      test_body_block.bodyConnection_ = bodyConnection.targetConnection;
      connection.connect(test_body_block.previousConnection);
      connection = test_body_block.nextConnection;
    }

    if(this.else_clause_) {
      var elseConnection = this.getInput('ELSE').connection;
      var else_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_else_block_name);
      else_block.initSvg();
      else_block.elseConnection_ = elseConnection.targetConnection;
      connection.connect(else_block.previousConnection);

    }
    return container_block;

  };
  cond_block.compose = function(container_block) {
    if(this.else_clause_) {
      this.else_clause_ = false;
      this.removeInput('ELSE');
    }

    for(var x = this.test_clause_count_ - 1; x >= 0; x--) {
      this.test_clause_count_--;
      this.removeInput('CONDITION' + String(x));
      this.removeInput('BODY' + String(x));
    }

    var clause_block = container_block.getInputTargetBlock('STACK');
    while(clause_block) {
      switch(clause_block.__type__) {
        case Ray.Blocks.cond_test_body_block_name:
          var condition_input = this.appendValueInput('CONDITION' + String(this.test_clause_count_))
            .appendTitle('when')
            .setType(new Ray.Types.Boolean());
          if(clause_block.conditionConnection_) {
            condition_input.connection.connect(clause_block.conditionConnection_);
          }

          var body_input = this.appendValueInput('BODY' + String(this.test_clause_count_))
            .setType(new Ray.Types.Unknown());
          if(clause_block.bodyConnection_) {
            body_input.connection.connect(clause_block.bodyConnection_);
          }
          this.test_clause_count_++;
          break;
        case Ray.Blocks.cond_else_block_name:
          this.else_clause_ = true;
          var else_input = this.appendValueInput('ELSE')
            .appendTitle('otherwise')
            .setType(new Ray.Types.Unknown());
          if(clause_block.elseConnection_) {
            else_input.connection.connect(clause_block.elseConnection_);
          }
          break;
        default:
          throw "Unknown block type inside ray_conditional_cond_cond!";
          break;
      }
      clause_block = clause_block.nextConnection &&
        clause_block.nextConnection.targetBlock();
    }

    Ray.Blocks.TypeChecker.typecheck_block(this);

  };
  obj[Ray.Blocks.conditional_block_name('cond')] = cond_block;

  var cond_cond_block = {
    __rest_arg_container__: true,
    __render_as_expression__: false,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('cond');
      this.appendDummyInput()
        .appendTitle('test/body');
      this.appendStatementInput('STACK');
      this.contextMenu = false;
    }
  };
  obj[Ray.Blocks.conditional_block_name('cond_cond')] = cond_cond_block;

  var cond_test_body_block = {
    __type__: Ray.Blocks.cond_test_body_block_name,
    __render_as_expression__: false,
    __rest_arg__: true,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('test/body');
    }
  };
  obj[Ray.Blocks.cond_test_body_block_name] = cond_test_body_block;

  var cond_else_block = {
    __type__: Ray.Blocks.cond_else_block_name,
    __render_as_expression__: false,
    __rest_arg__: true,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('otherwise');
      this.nextConnection.dispose();
      this.nextConnection = null;
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
  function PrimitiveDataBlock(type_name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = type_name;
    this.__type__ = type;
    this.__block_class__ = Blocks[goog.string.toTitleCase(type_name)];
    this.__render_as_expression__ = true;
    this.priority_ = Priorities.PRIMITIVE_DATA_VALUE;
  }

  // Boolean
  var boolean_block = new PrimitiveDataBlock('boolean', new Ray.Types.Boolean());
  boolean_block.init = function() {
    var dropdown = new this.Blockly.FieldDropdown([['true', 'TRUE'],['false', 'FALSE']]);
    this.appendDummyInput()
      .appendTitle(dropdown, 'B');
  };

  obj[Ray.Blocks.primitive_data_block_name('boolean')] = boolean_block;

  // Number
  var number_block = new PrimitiveDataBlock('num', new Ray.Types.Num());
  number_block.init = function() {
    var textfield = new this.Blockly.FieldTextInput('0', this.Blockly.FieldTextInput.numberValidator);
    this.appendDummyInput()
      .appendTitle(textfield, 'N');
  };

  obj[Ray.Blocks.primitive_data_block_name('num')] = number_block;

  //String
  var string_block = new PrimitiveDataBlock('str', new Ray.Types.Str());
  string_block.init = function() {
    var textfield = new this.Blockly.FieldTextInput('Hello, World!');
    this.appendDummyInput()
      .appendTitle('"')
      .appendTitle(textfield, 'S')
      .appendTitle('"');
  };

  obj[Ray.Blocks.primitive_data_block_name('str')] = string_block;

  //Chars
  var char_block = new PrimitiveDataBlock('char', new Ray.Types.Char());
  char_block.init = function() {
    var char_validator = function(text) {
      return text.length === 1 ? text : null;
    };
    var textfield = new this.Blockly.FieldTextInput('a', char_validator);
    this.appendDummyInput()
      .appendTitle('char')
      .appendTitle(textfield, 'C');
  };

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
  var builtins = r.builtins.dict({});
  goog.object.forEach(builtins, function(value, name) {
    var block_name = Ray.Blocks.block_name(name);
    if(!goog.object.containsKey(obj, block_name)) {
      Ray.Blocks.generate_block(r, name, value, obj);
    }
  });
  obj[Ray.Blocks.rest_arg_arg_block_name] = Ray.Blocks.rest_arg_arg_block;
  return obj;
};

function FunctionBlock(name, value, is_user_function) {
  this.__name__ = name;
  this.__value__ = value;
  this.__type__ = value.body_type;
  this.__block_class__ = Blocks.App;
  this.__render_as_expression__ = true;
  this.priority_ = value.priority_ || null;
  if(is_user_function) {
    this.__user_function__ = true;
  }
  this.helpUrl = Ray.Blocks.HELP_URL;
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
 * @param r
 * @param name the name of the block, will be used in looking it up, and as title on block.
 * @param value the value from which we are creating the block
 * @param obj
 * @param {?boolean=} opt_user_function
 */
Ray.Blocks.generate_block = function(r, name, value, obj, opt_user_function) {
  var is_user_function = !!opt_user_function;
  var block_name = is_user_function ? Ray.Blocks.user_function_block_name(name) : Ray.Blocks.block_name(name);
  var block = null;
  switch(R.node_type(value)) {
    case 'pair':
    case 'number':
    case 'empty':
    case 'boolean':
    case 'str':
    case 'char':
      break;
    case 'primitive':
    case 'closure':
      var arg_spec = value.arg_spec;
      // Ignoring rest and keyword arguments
      var arity = arg_spec.p_args.length;
      var rest_arg = arg_spec.rest_arg || null;

      block = new FunctionBlock(name, value, is_user_function);
      block.init = function() {
        this.makeTitleRow(name);
        for(var i = 0; i < arity; i++) {
          this.appendValueInput(arg_spec.p_args[i])
            .setType(arg_spec.arguments_type.p_arg_types.list[i])
        }
        if(rest_arg) {
          this.appendValueInput('REST_ARG0')
            .setType(arg_spec.arguments_type.rest_arg_type.base_type);
          this.appendValueInput('REST_ARG1')
            .setType(arg_spec.arguments_type.rest_arg_type.base_type);
          this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
          this.rest_arg_count_ = 2;
        }
      };

      if(rest_arg) {
        Ray.Blocks.add_rest_arg(block, obj, rest_arg, arg_spec.arguments_type.rest_arg_type.base_type);
      }
      break;
    default:
      throw new Ray.Error("Unknown value, can't create block!");
      block = null;
      break;
  }
  if(block) {
    obj[block_name] = block;
  }
  return block;
};

Ray.Blocks.add_rest_arg = function(block, obj, rest_arg, type) {
  // Create the block which will hold the arguments as I add or subtract them.
  // The arguments themselves will be shared by any blocks with rest args.
  var rest_arg_container = {};
  rest_arg_container.__rest_arg_container__ = true;
  rest_arg_container.__render_as_expression__ =  false;
  rest_arg_container.helpUrl = Ray.Blocks.HELP_URL;
  rest_arg_container.init = function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
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
    for(var i = this.rest_arg_count_ - 1; i >= 0; i--) {
      this.removeInput('REST_ARG' + String(i));
    }
    this.rest_arg_count_ = 0;
    var arg_block = container_block.getInputTargetBlock('STACK');
    while(arg_block) {
      var arg = this.appendValueInput('REST_ARG' + String(this.rest_arg_count_))
        .setType(type);
      // This should never be set!
      if(arg_block.value_connection_) {
        arg.connection.connect(arg_block.value_connection_);
      }
      this.rest_arg_count_++;
      arg_block = arg_block.nextConnection &&
        arg_block.nextConnection.targetBlock();
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
      this.appendValueInput('REST_ARG' + String(x))
        .setType(type);
    }
  };
};