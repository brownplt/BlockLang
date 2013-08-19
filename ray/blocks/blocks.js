/**
 * @desc Defines blocks from Ray constructs.
 */

goog.provide('Ray.Blocks');

goog.require('Ray.Blocks.UserFun');
goog.require('Ray.Blocks.misc');
goog.require('Ray.Blocks.TypeChecker');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Globals');

goog.require('Blockly');

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');

var Blocks = Ray.Globals.Blocks;
var Priorities = Ray.Globals.Priorities;
var RT = Ray.Runtime;

Ray.Blocks.condTestBodyBlockName = "ray_conditional_cond_test_body";
Ray.Blocks.condElseBlockName = "ray_conditional_cond_else";

var RestArgContainerBlock = function() {
  this.restArgContainer_ = true;
  this.renderAsExpression_ = false;
};

var RestArgBlock = function() {
  this.isRestArg_ = true;
  this.renderAsExpression_ = false;
};

Ray.Blocks.restArgArgBlockName = "ray_rest_arg_arg_";
Ray.Blocks.restArgArgBlock = new RestArgBlock();
Ray.Blocks.restArgArgBlock.init = function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle('arg');
};
Ray.Blocks.restArgArgBlock.externalName_ = Ray.Blocks.restArgArgBlockName;


/**
 * Generates all the standard library blocks, including list blocks, primitive data blocks, and conditionals
 * @returns {Array.<*>}
 */
Ray.Blocks.generateAllBlocks = function() {
  var blocks = [];
  var primitiveDataBlocks = Ray.Blocks.definePrimitiveDataBlocks();
  var listBlocks = Ray.Blocks.defineListBlocks();
  var conditionalBlocks = Ray.Blocks.defineConditionalBlocks();
  var remainingBuiltinBlocks = Ray.Blocks.defineRemainingBuiltinBlocks(blocks);
  return goog.array.concat(primitiveDataBlocks,
                           listBlocks,
                           conditionalBlocks,
                           remainingBuiltinBlocks);
};

// Cons, first, rest, empty
Ray.Blocks.defineListBlocks = function() {
  var listBlocks = [];
  var ListBlock = function(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.value_ = RT.builtins.lookup(name);
    this.outputType_ = type;
    this.name_ = name;
    this.externalName_ = Ray.Blocks.blockName(name);
    this.blockClass_ = Blocks[goog.string.toTitleCase(name)];
    this.renderAsExpression_ = true;
    listBlocks.push(this);
  };

  var consBlock = new ListBlock('cons', new Ray.Types.List(new Ray.Types.Unknown()));
  consBlock.init = function() {
    this.makeTitleRow('cons');
    this.appendValueWithType('car', new Ray.Types.Unknown());
    this.appendValueWithType('cdr', new Ray.Types.List(new Ray.Types.Unknown()));
  };

  var emptyBlock = new ListBlock('empty', new Ray.Types.List(new Ray.Types.Unknown()));
  emptyBlock.init = function() {
    this.makeTitleRow('empty');
  };

  var firstBlock = new ListBlock('first', new Ray.Types.Unknown());
  firstBlock.init = function() {
    this.makeTitleRow('first');
    this.appendValueWithType('x', new Ray.Types.List(new Ray.Types.Unknown()));
  };

  var restBlock = new ListBlock('rest', new Ray.Types.List(new Ray.Types.Unknown()));
  restBlock.init = function() {
    this.makeTitleRow('rest');
    this.appendValueWithType('x', new Ray.Types.List(new Ray.Types.Unknown()));
  };

  var listBlock = new ListBlock('list', new Ray.Types.List(new Ray.Types.Unknown()));
  listBlock.init = function() {
    this.makeTitleRow('list');
  };
  listBlocks.push(Ray.Blocks.makeRestArg(listBlock, 'elements', new Ray.Types.Unknown()));

  return listBlocks;

};

// if, or, and, cond
Ray.Blocks.defineConditionalBlocks = function() {
  var conditionalBlocks = [];
  function ConditionalBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.form_ = name;
    this.name_ = name;
    this.externalName_ = Ray.Blocks.conditionalBlockName(name);
    this.outputType_ = type;
    this.blockClass_ = Blocks[goog.string.toTitleCase(name)];
    this.renderAsExpression_ = true;
    conditionalBlocks.push(this);
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

  // And
  var andBlock = new ConditionalBlock('and', new Ray.Types.Boolean());
  andBlock.inputTypes_ = [new Ray.Types.Boolean()];
  andBlock.init = function() {
    this.makeTitleRow('and');
  };
  conditionalBlocks.push(Ray.Blocks.makeRestArg(andBlock, 'and', new Ray.Types.Boolean()));

  // Or
  var orBlock = new ConditionalBlock('or', new Ray.Types.Boolean());
  orBlock.inputTypes_ = [new Ray.Types.Boolean()];
  orBlock.init = function() {
    this.makeTitleRow('or');
  };
  conditionalBlocks.push(Ray.Blocks.makeRestArg(orBlock, 'or', new Ray.Types.Boolean()));

  // Cond
  var condBlock = new ConditionalBlock('cond', new Ray.Types.Unknown());
  condBlock.inputTypes_ = [new Ray.Types.Unknown(), new Ray.Types.Boolean()];
  condBlock.mutatorBlockTypes_ = { 'TEST_BODY': 1, 'ELSE': 2 };
  condBlock.init = function() {
    this.makeTitleRow('cond');
    this.appendValueInput('CONDITION')
      .appendTitle('when')
      .setType(new Ray.Types.Boolean());
    this.appendValueWithType('BODY', new Ray.Types.Unknown());
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
    var containerBlock = new this.Blockly.Block(workspace, this.condCondBlockProto);
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for(var x = 0; x < this.testClauseCount_; x++) {
      var conditionConnection = this.getInput('CONDITION' + String(x)).connection;
      var bodyConnection = this.getInput('BODY' + String(x)).connection;
      var testBodyBlock = new this.Blockly.Block(workspace, this.testBodyBlockProto);
      testBodyBlock.initSvg();
      testBodyBlock.conditionConnection_ = conditionConnection.targetConnection;
      testBodyBlock.bodyConnection_ = bodyConnection.targetConnection;
      connection.connect(testBodyBlock.previousConnection);
      connection = testBodyBlock.nextConnection;
    }

    if(this.elseClause_) {
      var elseConnection = this.getInput('ELSE').connection;
      var elseBlock = new this.Blockly.Block(workspace, this.elseBlockProto);
      elseBlock.initSvg();
      elseBlock.elseConnection_ = elseConnection.targetConnection;
      connection.connect(elseBlock.previousConnection);

    }
    return containerBlock;

  };
  condBlock.compose = function(containerBlock) {
    if(this.elseClause_) {
      this.elseClause_ = false;
      this.removeInput('ELSE');
    }

    for(var x = this.testClauseCount_ - 1; x >= 0; x--) {
      this.testClauseCount_--;
      this.removeInput('CONDITION' + String(x));
      this.removeInput('BODY' + String(x));
    }

    var clauseBlock = containerBlock.getInputTargetBlock('STACK');
    while(clauseBlock) {
      switch(clauseBlock.mutatorBlockType_) {
        case condBlock.mutatorBlockTypes_.TEST_BODY:
          var conditionInput = this.appendValueInput('CONDITION' + String(this.testClauseCount_))
            .appendTitle('when')
            .setType(new Ray.Types.Boolean());
          if(clauseBlock.conditionConnection_) {
            conditionInput.connection.connect(clauseBlock.conditionConnection_);
          }

          var bodyInput = this.appendValueInput('BODY' + String(this.testClauseCount_))
            .setType(new Ray.Types.Unknown());
          if(clauseBlock.bodyConnection_) {
            bodyInput.connection.connect(clauseBlock.bodyConnection_);
          }
          this.testClauseCount_++;
          break;
        case condBlock.mutatorBlockTypes_.ELSE:
          this.elseClause_ = true;
          var elseInput = this.appendValueInput('ELSE')
            .appendTitle('otherwise')
            .setType(new Ray.Types.Unknown());
          if(clauseBlock.elseConnection_) {
            elseInput.connection.connect(clauseBlock.elseConnection_);
          }
          break;
        default:
          throw "Unknown block type inside ray_conditional_cond_cond!";
          break;
      }
      clauseBlock = clauseBlock.nextConnection &&
        clauseBlock.nextConnection.targetBlock();
    }
    Ray.Blocks.TypeChecker.typecheckBlock(this);
  };

  var condCondBlock = new RestArgContainerBlock();
  condCondBlock.init = function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('cond');
      this.appendDummyInput()
        .appendTitle('test/body');
      this.appendStatementInput('STACK');
      this.contextMenu = false;
  };
  condBlock.condCondBlockProto = condCondBlock;
  conditionalBlocks.push(condBlock);


  var condTestBodyBlock = new RestArgBlock();
  condTestBodyBlock.mutatorBlockType_ = condBlock.mutatorBlockTypes_.TEST_BODY;
  condTestBodyBlock.externalName_ = Ray.Blocks.condTestBodyBlockName;
  condTestBodyBlock.init = function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('test/body');
  };
  condBlock.testBodyBlockProto = condTestBodyBlock;
  conditionalBlocks.push(condTestBodyBlock);

  var condElseBlock = new RestArgBlock();
  condElseBlock.mutatorBlockType_ = condBlock.mutatorBlockTypes_.ELSE;
  condElseBlock.externalName_ = Ray.Blocks.condElseBlockName;
  condElseBlock.init = function() {
      this.setColour(Ray.Blocks.getColour('forms'));
      this.appendDummyInput()
        .appendTitle('otherwise');
      this.nextConnection.dispose();
      this.nextConnection = null;
  };
  condBlock.elseBlockProto = condElseBlock;
  conditionalBlocks.push(condElseBlock);

  return conditionalBlocks;
};

/**
 * Defines the blocks that allow you to enter primitive data.
 * Currently, this is limited to: booleans, numbers, characters, and strings.
 */
Ray.Blocks.definePrimitiveDataBlocks = function() {
  var primitiveDataBlocks = [];
  function PrimitiveDataBlock(typeName, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.datatype_ = typeName;
    this.outputType_ = type;
    this.externalName_ = Ray.Blocks.primitiveDataBlockName(typeName);
    this.blockClass_ = Blocks[goog.string.toTitleCase(typeName)];
    this.renderAsExpression_ = true;
    this.priority_ = Priorities.PRIMITIVE_DATA_VALUE;
    primitiveDataBlocks.push(this);
  }

  // Boolean
  var booleanBlock = new PrimitiveDataBlock('boolean', new Ray.Types.Boolean());
  booleanBlock.init = function() {
    var dropdown = new this.Blockly.FieldDropdown([['true', 'TRUE'],['false', 'FALSE']]);
    this.appendDummyInput()
      .appendTitle(dropdown, 'B');
  };

  // Number
  var numberBlock = new PrimitiveDataBlock('num', new Ray.Types.Num());
  numberBlock.init = function() {
    var textfield = new this.Blockly.FieldTextInput('0', this.Blockly.FieldTextInput.numberValidator);
    this.appendDummyInput()
      .appendTitle(textfield, 'N');
  };

  //String
  var stringBlock = new PrimitiveDataBlock('str', new Ray.Types.Str());
  stringBlock.init = function() {
    var textfield = new this.Blockly.FieldTextInput('Hello, World!');
    this.appendDummyInput()
      .appendTitle('"')
      .appendTitle(textfield, 'S')
      .appendTitle('"');
  };

  //Chars
  var charBlock = new PrimitiveDataBlock('char', new Ray.Types.Char());
  charBlock.init = function() {
    var charValidator = function(text) {
      return text.length === 1 ? text : null;
    };
    var textfield = new this.Blockly.FieldTextInput('a', charValidator);
    this.appendDummyInput()
      .appendTitle('char')
      .appendTitle(textfield, 'C');
  };

  return primitiveDataBlocks;
};

/**
 * Looks through the builtins in a Ray, finds those for which
 * there isn't a block in obj, and creates a block for them.
 *
 * If you want to change a pre-existing block, you cannot do so here.
 *
 * @param blocks the array into which we install the missing blocks
 */
Ray.Blocks.defineRemainingBuiltinBlocks = function(blocks) {
  var builtins = RT.builtins.dict({});
  goog.object.forEach(builtins, function(value, name) {
    var blockName = Ray.Blocks.blockName(name);
    if(!Ray.Blocks.containsBlockWithName(blocks, blockName)) {
      var generatedBlocks = Ray.Blocks.generateBlock(name, value);
      blocks = blocks.concat(generatedBlocks);
    }
  });
  blocks.push(Ray.Blocks.restArgArgBlock);
  return blocks;
};

Ray.Blocks.containsBlockWithName = function(blocks, name) {
  return goog.array.some(blocks, function(block) {
    return block.externalName_ === name;
  });
};

var BuiltinBlock = function(name, value) {
  this.name_ = name;
  this.externalName_ = Ray.Blocks.blockName(name);
  this.value_ = value;
  this.outputType_ = value.bodyType;
  this.blockClass_ = Blocks.App;
  this.renderAsExpression_ = true;
  this.priority_ = value.priority_ || null;
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
 * @param name the name of the block, will be used in looking it up, and as title on block.
 * @param value the value from which we are creating the block
 */
Ray.Blocks.generateBlock = function(name, value) {
  var generatedBlocks = [];
  var block = null;
  switch(RT.nodeType(value)) {
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
      var blockTitle = goog.isDef(value.display_name_) ?
                        goog.string.unescapeEntities(value.display_name_) :
                        name;

      block = new BuiltinBlock(name, value);
      block.init = function() {
        this.makeTitleRow(blockTitle);
        for(var i = 0; i < arity; i++) {
          this.appendValueWithType(argSpec.positionalArgs[i],
                                   argSpec.argsType.positionalArgTypes.list[i]);
        }
      };

      if(restArg) {
        generatedBlocks.push(Ray.Blocks.makeRestArg(block, restArg, argSpec.argsType.restArgType.elementType));
      }
      break;
    default:
      throw new Ray.Error("Unknown value, can't create block!");
      block = null;
      break;
  }
  if(block) {
    generatedBlocks.push(block);
  }
  return generatedBlocks;
};

Ray.Blocks.makeRestArg = function(block, restArg, type) {
  // Create the block which will hold the arguments as I add or subtract them.
  // The arguments themselves will be shared by any blocks with rest args.
  var restArgContainer = new RestArgContainerBlock();
  restArgContainer.externalName_ = Ray.Blocks.restArgBlockName(block.name_);
  restArgContainer.colourType_ = Ray.Blocks.DEFAULT_BLOCK_COLOR;
  restArgContainer.init = function() {
    this.appendDummyInput()
      .appendTitle(restArg);
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  };

  block.decompose = function(workspace) {
    var containerBlock = new this.Blockly.Block(workspace,
                                                restArgContainer);
    containerBlock.initSvg();
    if(containerBlock.getInput('STACK')) {
      var connection = containerBlock.getInput('STACK').connection;
      for(var x = 0; x < this.restArgCount_; x++) {
        var argBlock = new this.Blockly.Block(workspace, Ray.Blocks.restArgArgBlock);
        argBlock.initSvg();
        connection.connect(argBlock.previousConnection);
        connection = argBlock.nextConnection;
      }
    }
    return containerBlock;
  };
  block.compose = function(containerBlock) {
    var newRestArgCount = 0;
    var argBlock = containerBlock.getInputTargetBlock('STACK');
    while(argBlock) {
      newRestArgCount++;
      argBlock = argBlock.nextConnection &&
                 argBlock.nextConnection.targetBlock();
      }

    var oldRestArgCount = this.restArgCount_;
    // By determining the difference between the old and new counts, we can avoid disconnecting blocks in slots that aren't removed
    if(newRestArgCount < oldRestArgCount) {
      while(this.restArgCount_ > newRestArgCount) {
        this.restArgCount_--;
        this.removeInput('REST_ARG' + String(this.restArgCount_));
      }
    } else if(newRestArgCount > oldRestArgCount) {
      while(this.restArgCount_ < newRestArgCount) {
        this.appendValueWithType('REST_ARG' + String(this.restArgCount_), type);
        this.restArgCount_++;
      }
    }

    Ray.Blocks.TypeChecker.typecheckBlock(this);
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
      this.appendValueWithType('REST_ARG' + String(x), type);
    }
  };

  block.originalInit_ = block.init;
  block.init = function() {
    this.originalInit_();
    this.appendValueWithType('REST_ARG0', type);
    this.appendValueWithType('REST_ARG1', type);
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.restArgArgBlockName]));
    this.restArgCount_ = 2;
  };
  return restArgContainer;
};