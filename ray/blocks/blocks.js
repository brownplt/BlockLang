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

Ray.Blocks.restArgArgBlockName = "ray_rest_arg_arg_";
Ray.Blocks.restArgArgBlock = {
  init: function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle('arg');
  },
  isRestArg_: true,
  renderAsExpression_: false
};
Ray.Blocks.condTestBodyBlockName = "ray_conditional_cond_test_body";
Ray.Blocks.condElseBlockName = "ray_conditional_cond_else";

/**
 * Generates all the blocks for a given instance of Ray.
 * Right now, this just sequentially generates all the primitive data blocks,
 * and then all the blocks for builtin procedures.
 * @param r
 * @returns {{}}
 */
Ray.Blocks.generateAllBlocks = function(r) {
  var obj = {};
  Ray.Blocks.definePrimitiveDataBlocks(r, obj);
  Ray.Blocks.defineListBlocks(r, obj);
  Ray.Blocks.defineBuiltinBlocks(r, obj);
  Ray.Blocks.defineConditionalBlocks(r, obj);
  return obj;
};

// Cons, first, rest, empty
Ray.Blocks.defineListBlocks = function(r, obj) {
  var ListBlock = function(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.value_ = r.builtins.lookup(name);
    this.outputType_ = type;
    this.name_ = name;
    this.blockClass_ = Blocks[goog.string.toTitleCase(name)];
    this.renderAsExpression_ = true;
  };

  var consBlock = new ListBlock('cons', new Ray.Types.List(new Ray.Types.Unknown()));
  consBlock.init = function() {
    this.makeTitleRow('cons');
    this.appendValueInput('car')
      .setType(new Ray.Types.Unknown());
    this.appendValueInput('cdr')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.blockName('cons')] = consBlock;

  var emptyBlock = new ListBlock('empty', new Ray.Types.List(new Ray.Types.Unknown()));
  emptyBlock.init = function() {
    this.makeTitleRow('empty');
  };
  obj[Ray.Blocks.blockName('empty')] = emptyBlock;

  var firstBlock = new ListBlock('first', new Ray.Types.Unknown());
  firstBlock.init = function() {
    this.makeTitleRow('first');
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.blockName('first')] = firstBlock;

  var restBlock = new ListBlock('rest', new Ray.Types.List(new Ray.Types.Unknown()));
  restBlock.init = function() {
    this.makeTitleRow('rest');
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.blockName('rest')] = restBlock;

};

Ray.Blocks.defineArgBlocks = function(r, obj, args) {
  function ArgumentBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.value_ = null;
    this.name_ = name;
    this.outputType_ = type;
    this.arguments_ = true;
    this.renderAsExpression_ = true;
    this.blockClass_ = Blocks.Argument;
    this.priority_ = Priorities.ARGUMENT;
    this.init = function() {
      this.makeTitleRow(this.name_);
    };
  }

  goog.array.forEach(args, function(arg) {
    var arg_block = new ArgumentBlock(arg.name_, arg.type_);
    obj[Ray.Blocks.argBlockName(arg.name_)] = arg_block;
  });
  return obj;
};

Ray.Blocks.defineConditionalBlocks = function(r, obj) {
  function ConditionalBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.value_ = null;
    this.form_ = name;
    this.name_ = name;
    this.outputType_ = type;
    this.blockClass_ = Blocks[goog.string.toTitleCase(name)];
    this.renderAsExpression_ = true;
  }

  // If
  var ifBlock = new ConditionalBlock('if', new Ray.Types.Unknown());
  ifBlock.__expr__ = Expressions.If;
  ifBlock.inputTypes_ = [new Ray.Types.Unknown(), new Ray.Types.Boolean()];
  ifBlock.init = function() {
    this.appendValueInput('PRED')
      .appendTitle("if")
      .setType(new Ray.Types.Boolean());

    this.appendValueInput('THEN_EXPR')
      .appendTitle('then')
      .setType(new Ray.Types.Unknown());

    this.appendValueInput('ELSE_EXPR')
      .appendTitle('else')
      .setType(new Ray.Types.Unknown());

  };

  obj[Ray.Blocks.conditionalBlockName('if')] = ifBlock;

  // And
  var andBlock = new ConditionalBlock('and', new Ray.Types.Boolean());
  andBlock.inputTypes_ = [new Ray.Types.Boolean()];
  andBlock.init = function() {
    this.makeTitleRow('and');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.restArgArgBlockName]));
    this.restArgCount_ = 2;
  };

  Ray.Blocks.addRestArg(andBlock, obj, 'and', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditionalBlockName('and')] = andBlock;

  // Or
  var orBlock = new ConditionalBlock('or', new Ray.Types.Boolean());
  orBlock.inputTypes_ = [new Ray.Types.Boolean()];
  orBlock.init = function() {
    this.makeTitleRow('or');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.restArgArgBlockName]));
    this.restArgCount_ = 2;
  };

  Ray.Blocks.addRestArg(orBlock, obj, 'or', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditionalBlockName('or')] = orBlock;

  // Cond
  var condBlock = new ConditionalBlock('cond', new Ray.Types.Unknown());
  condBlock.inputTypes_ = [new Ray.Types.Unknown(), new Ray.Types.Boolean()];
  condBlock.init = function() {
    this.makeTitleRow('cond');
    this.appendValueInput('CONDITION')
      .appendTitle('when')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('BODY')
      .setType(new Ray.Types.Unknown());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.condTestBodyBlockName, Ray.Blocks.condElseBlockName]));
    this.testClauseCount_ = 0;
    this.elseClause_ = false;
  };

  condBlock.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('testClauses', String(this.testClauseCount_));
    container.setAttribute('elseClause', String(this.elseClause_ ? 1 : 0));
    return container;
  };
  condBlock.domToMutation = function(container) {
    for(var i = 0; i < this.testClauseCount_; i++) {
      this.removeInput('CONDITION' + String(i));
      this.removeInput('BODY' + String(i));
    }

    if(this.elseClause_) {
      this.removeInput('ELSE');
    }
    this.testClauseCount_ = window.parseInt(container.getAttribute('testClauses'));
    for(var i = 0; i < this.testClauseCount_; i++) {
      this.appendValueInput('CONDITION' + String(i))
        .appendTitle('when')
        .setType(new Ray.Types.Boolean());
      this.appendValueInput('BODY' + String(i))
        .setType(new Ray.Types.Unknown());
    }

    this.elseClause_ = Boolean(window.parseInt(container.getAttribute('elseClause')));
    if(this.elseClause_) {
      this.appendValueInput('ELSE')
        .appendTitle('otherwise')
        .setType(new Ray.Types.Unknown());
    }
  };
  condBlock.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace, Ray.Blocks.conditionalBlockName('cond_cond'));
    container_block.initSvg();
    var connection = container_block.getInput('STACK').connection;
    for(var x = 0; x < this.testClauseCount_; x++) {
      var conditionConnection = this.getInput('CONDITION' + String(x)).connection;
      var bodyConnection = this.getInput('BODY' + String(x)).connection;
      var test_body_block = new this.Blockly.Block(workspace, Ray.Blocks.condTestBodyBlockName);
      test_body_block.initSvg();
      test_body_block.conditionConnection_ = conditionConnection.targetConnection;
      test_body_block.bodyConnection_ = bodyConnection.targetConnection;
      connection.connect(test_body_block.previousConnection);
      connection = test_body_block.nextConnection;
    }

    if(this.elseClause_) {
      var elseConnection = this.getInput('ELSE').connection;
      var else_block = new this.Blockly.Block(workspace, Ray.Blocks.condElseBlockName);
      else_block.initSvg();
      else_block.elseConnection_ = elseConnection.targetConnection;
      connection.connect(else_block.previousConnection);

    }
    return container_block;

  };
  condBlock.compose = function(container_block) {
    if(this.elseClause_) {
      this.elseClause_ = false;
      this.removeInput('ELSE');
    }

    for(var x = this.testClauseCount_ - 1; x >= 0; x--) {
      this.testClauseCount_--;
      this.removeInput('CONDITION' + String(x));
      this.removeInput('BODY' + String(x));
    }

    var clause_block = container_block.getInputTargetBlock('STACK');
    while(clause_block) {
      switch(clause_block.outputType_) {
        case Ray.Blocks.condTestBodyBlockName:
          var condition_input = this.appendValueInput('CONDITION' + String(this.testClauseCount_))
            .appendTitle('when')
            .setType(new Ray.Types.Boolean());
          if(clause_block.conditionConnection_) {
            condition_input.connection.connect(clause_block.conditionConnection_);
          }

          var body_input = this.appendValueInput('BODY' + String(this.testClauseCount_))
            .setType(new Ray.Types.Unknown());
          if(clause_block.bodyConnection_) {
            body_input.connection.connect(clause_block.bodyConnection_);
          }
          this.testClauseCount_++;
          break;
        case Ray.Blocks.condElseBlockName:
          this.elseClause_ = true;
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

    Ray.Blocks.TypeChecker.typecheckBlock(this);

  };
  obj[Ray.Blocks.conditionalBlockName('cond')] = condBlock;

  var condCondBlock = {
    restArgContainer_: true,
    renderAsExpression_: false,
    init: function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('cond');
      this.appendDummyInput()
        .appendTitle('test/body');
      this.appendStatementInput('STACK');
      this.contextMenu = false;
    }
  };
  obj[Ray.Blocks.conditionalBlockName('cond_cond')] = condCondBlock;

  var condTestBodyBlock = {
    outputType_: Ray.Blocks.condTestBodyBlockName,
    renderAsExpression_: false,
    isRestArg_: true,
    init: function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('test/body');
    }
  };
  obj[Ray.Blocks.condTestBodyBlockName] = condTestBodyBlock;

  var condElseBlock = {
    outputType_: Ray.Blocks.condElseBlockName,
    renderAsExpression_: false,
    isRestArg_: true,
    init: function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('otherwise');
      this.nextConnection.dispose();
      this.nextConnection = null;
    }
  };
  obj[Ray.Blocks.condElseBlockName] = condElseBlock;

  return obj;
};

/**
 * Defines the blocks that allow you to enter primitive data.
 * Currently, this is limited to: booleans, numbers, characters, and strings.
 * @param r
 * @param obj
 */
Ray.Blocks.definePrimitiveDataBlocks = function(r, obj) {
  function PrimitiveDataBlock(type_name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.value_ = null;
    this.datatype_ = type_name;
    this.outputType_ = type;
    this.blockClass_ = Blocks[goog.string.toTitleCase(type_name)];
    this.renderAsExpression_ = true;
    this.priority_ = Priorities.PRIMITIVE_DATA_VALUE;
  }

  // Boolean
  var booleanBlock = new PrimitiveDataBlock('boolean', new Ray.Types.Boolean());
  booleanBlock.init = function() {
    var dropdown = new this.Blockly.FieldDropdown([['true', 'TRUE'],['false', 'FALSE']]);
    this.appendDummyInput()
      .appendTitle(dropdown, 'B');
  };

  obj[Ray.Blocks.primitiveDataBlockName('boolean')] = booleanBlock;

  // Number
  var numberBlock = new PrimitiveDataBlock('num', new Ray.Types.Num());
  numberBlock.init = function() {
    var textfield = new this.Blockly.FieldTextInput('0', this.Blockly.FieldTextInput.numberValidator);
    this.appendDummyInput()
      .appendTitle(textfield, 'N');
  };

  obj[Ray.Blocks.primitiveDataBlockName('num')] = numberBlock;

  //String
  var stringBlock = new PrimitiveDataBlock('str', new Ray.Types.Str());
  stringBlock.init = function() {
    var textfield = new this.Blockly.FieldTextInput('Hello, World!');
    this.appendDummyInput()
      .appendTitle('"')
      .appendTitle(textfield, 'S')
      .appendTitle('"');
  };

  obj[Ray.Blocks.primitiveDataBlockName('str')] = stringBlock;

  //Chars
  var charBlock = new PrimitiveDataBlock('char', new Ray.Types.Char());
  charBlock.init = function() {
    var char_validator = function(text) {
      return text.length === 1 ? text : null;
    };
    var textfield = new this.Blockly.FieldTextInput('a', char_validator);
    this.appendDummyInput()
      .appendTitle('char')
      .appendTitle(textfield, 'C');
  };

  obj[Ray.Blocks.primitiveDataBlockName('char')] = charBlock;
};


/**
 * Looks through the builtins in a Ray, finds those for which
 * there aren't blocks in obj, and creates blocks for them.
 *
 * If you want to change a pre-existing block, you cannot do so here.
 *
 * @param r has to have builtins already installed
 * @param obj the object into which we install the missing blocks
 */
Ray.Blocks.defineBuiltinBlocks = function(r, obj) {
  var builtins = r.builtins.dict({});
  goog.object.forEach(builtins, function(value, name) {
    var block_name = Ray.Blocks.blockName(name);
    if(!goog.object.containsKey(obj, block_name)) {
      Ray.Blocks.generateBlock(r, name, value, obj);
    }
  });
  obj[Ray.Blocks.restArgArgBlockName] = Ray.Blocks.restArgArgBlock;
  return obj;
};

function FunctionBlock(name, value, is_user_function) {
  this.name_ = name;
  this.value_ = value;
  this.outputType_ = value.bodyType;
  this.blockClass_ = Blocks.App;
  this.renderAsExpression_ = true;
  this.priority_ = value.priority_ || null;
  if(is_user_function) {
    this.isUserFunction_ = true;
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
 * @param {?boolean=} opt_userFunction
 */
Ray.Blocks.generateBlock = function(r, name, value, obj, opt_userFunction) {
  var is_user_function = !!opt_userFunction;
  var block_name = is_user_function ? Ray.Blocks.userFunctionBlockName(name) : Ray.Blocks.blockName(name);
  var block = null;
  switch(R.nodeType(value)) {
    case 'pair':
    case 'number':
    case 'empty':
    case 'boolean':
    case 'str':
    case 'char':
      break;
    case 'primitive':
    case 'closure':
      var argSpec = value.argSpec;
      // Ignoring rest and keyword arguments
      var arity = argSpec.positionalArgs.length;
      var restArg = argSpec.restArg || null;
      var block_title = goog.isDef(value.display_name_) ?
                        goog.string.unescapeEntities(value.display_name_) :
                        name;

      block = new FunctionBlock(name, value, is_user_function);
      block.init = function() {
        this.makeTitleRow(block_title);
        for(var i = 0; i < arity; i++) {
          this.appendValueInput(argSpec.positionalArgs[i])
            .setType(argSpec.argsType.positionalArgTypes.list[i])
        }
        if(restArg) {
          this.appendValueInput('REST_ARG0')
            .setType(argSpec.argsType.restArgType.elementType);
          this.appendValueInput('REST_ARG1')
            .setType(argSpec.argsType.restArgType.elementType);
          this.setMutator(new this.Blockly.Mutator([Ray.Blocks.restArgArgBlockName]));
          this.restArgCount_ = 2;
        }
      };

      if(restArg) {
        Ray.Blocks.addRestArg(block, obj, restArg, argSpec.argsType.restArgType.elementType);
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

Ray.Blocks.addRestArg = function(block, obj, restArg, type) {
  // Create the block which will hold the arguments as I add or subtract them.
  // The arguments themselves will be shared by any blocks with rest args.
  var rest_arg_container = {};
  rest_arg_container.restArgContainer_ = true;
  rest_arg_container.renderAsExpression_ =  false;
  rest_arg_container.helpUrl = Ray.Blocks.HELP_URL;
  rest_arg_container.init = function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle(restArg);
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  };

  var container_block_name = Ray.Blocks.restArgBlockName(block.name_);
  obj[container_block_name] = rest_arg_container;

  block.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace,
                                                 container_block_name);
    container_block.initSvg();
    if(container_block.getInput('STACK')) {
      var connection = container_block.getInput('STACK').connection;
      for(var x = 0; x < this.restArgCount_; x++) {
        var arg_block = new this.Blockly.Block(workspace, Ray.Blocks.restArgArgBlockName);
        arg_block.initSvg();
        connection.connect(arg_block.previousConnection);
        connection = arg_block.nextConnection;
      }
    }
    return container_block;
  };
  block.compose = function(container_block) {
    for(var i = this.restArgCount_ - 1; i >= 0; i--) {
      this.removeInput('REST_ARG' + String(i));
    }
    this.restArgCount_ = 0;
    var arg_block = container_block.getInputTargetBlock('STACK');
    while(arg_block) {
      var arg = this.appendValueInput('REST_ARG' + String(this.restArgCount_))
        .setType(type);
      // This should never be set!
      if(arg_block.value_connection_) {
        arg.connection.connect(arg_block.value_connection_);
      }
      this.restArgCount_++;
      arg_block = arg_block.nextConnection &&
        arg_block.nextConnection.targetBlock();
    }

  };
  block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('rest_args', String(this.restArgCount_));
    return container;
  };
  block.domToMutation = function(container) {
    for(var x = 0; x < this.restArgCount_; x++) {
      this.removeInput('REST_ARG' + String(x));
    }
    this.restArgCount_ = window.parseInt(container.getAttribute('rest_args'), 10);
    for(var x = 0; x < this.restArgCount_; x++) {
      this.appendValueInput('REST_ARG' + String(x))
        .setType(type);
    }
  };
};