goog.provide('Ray.Blocks.misc');

goog.require('Ray.Blocks.CategoryTree');
goog.require('Ray.Blocks.Config');

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
var R = Ray.Runtime;

Ray.Blocks.REST_ARG_PREFIX = "ray_rest_arg_";
Ray.Blocks.BLOCK_PREFIX = "ray_";
Ray.Blocks.PRIMITIVE_DATA_PREFIX = "ray_data_create_";
Ray.Blocks.CONDITIONAL_PREFIX = "ray_conditional_";
Ray.Blocks.ARG_PREFIX = "ray_function_arg_";
Ray.Blocks.FUNCTION_DEF_PREFIX = "ray_user_function_";
Ray.Blocks.HELP_URL = "#";
Ray.Blocks.EXAMPLE_BLOCK_NAME = 'example';
Ray.Blocks.EXAMPLE_BLOCK_EXPR_INPUT = 'EXPR';
Ray.Blocks.EXAMPLE_BLOCK_RESULT_INPUT = 'RESULT';
Ray.Blocks.FUN_BODY_BLOCK_NAME = 'fun_body';
Ray.Blocks.FUN_BODY_BLOCK_INPUT = 'FUN_BODY';

Ray.Blocks.blockName = function(name) {
  return Ray.Blocks.BLOCK_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.restArgBlockName = function(name) {
  return Ray.Blocks.REST_ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.primitiveDataBlockName = function(name) {
  return Ray.Blocks.PRIMITIVE_DATA_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.conditionalBlockName = function(name) {
  return Ray.Blocks.CONDITIONAL_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.argBlockName = function(funId, argIx) {
  return 'ray_function_' + String(funId) + '_arg_' + String(argIx);
};
Ray.Blocks.userFunctionBlockName = function(name) {
  return Ray.Blocks.FUNCTION_DEF_PREFIX + goog.string.htmlEscape(name);
};

Ray.Blocks.TypeColourTable = {};
var baseTypes = goog.object.getKeys(Ray.Types.atomicTypes_);
var hueDistance = 270 / baseTypes.length;
var currentHue = 0;
goog.array.forEach(baseTypes, function(ty) {
  Ray.Blocks.TypeColourTable[ty] = currentHue;
  currentHue += hueDistance;
});

Ray.Blocks.DEFAULT_BLOCK_COLOR = { R: 187, G: 187, B: 187 };
Ray.Blocks.UNKNOWN_BLOCK_COLOR = {  R: 102, G: 102, B: 102 };
Ray.Blocks.PASSING_TEST_BLOCK_COLOR = { R: 0, G: 255, B: 0 };
Ray.Blocks.FAILING_TEST_BLOCK_COLOR = { R: 255, G: 0, B: 0 };
Ray.Blocks.LIGHTEN_FACTOR = 0.4;

Ray.Blocks.getColour = function(type) {
  if(!type) {
    return Ray.Blocks.DEFAULT_BLOCK_COLOR;
  }
  var key = type.outputType_;
  var colour = Ray.Blocks.TypeColourTable[key];
  if(goog.isDef(colour)) {
    var rgb = goog.color.hsvToRgb(colour, Blockly.HSV_SATURATION, Blockly.HSV_VALUE * 256);
    return { R: rgb[0], G: rgb[1], B: rgb[2] };

  } else if(key === 'list') {
    var originalColour = Ray.Blocks.getColour(type.elementType);
    if(originalColour.R) {
      var new_c = goog.color.lighten([originalColour.R, originalColour.G, originalColour.B], Ray.Blocks.LIGHTEN_FACTOR);
      return { R: new_c[0], G: new_c[1], B: new_c[2] };
    } else {
      throw 'Element type color wasn\'t an R G B object';
    }

  } else if(Ray.Types.isUnknown(type)) {
    return Ray.Blocks.UNKNOWN_BLOCK_COLOR;

  } else {
    //throw 'Unknown type!';
    return Ray.Blocks.DEFAULT_BLOCK_COLOR;

  }
};

/**
 * Get output type for a block specification
 * @param block
 * @returns {*}
 */
Ray.Blocks.getOutputType = function(block) {
  return block.outputType_;
};

/**
 * Get a list of input types for a block specification, for use in determining drawers
 * @param block
 */
Ray.Blocks.getInputTypes = function(block) {
  var inputTypes = [];
  if(block.value_) {
    // If the block's value isn't a primitive or closure, then it shouldn't have any inputs
    var value = block.value_;
    if(!value.argSpec) {
      return inputTypes;
    } else {
      inputTypes = inputTypes.concat(Ray.Types.getAllArgumentTypes(value.argSpec.argsType));
    }
  } else if(block.inputTypes_) {
    inputTypes = inputTypes.concat(goog.array.clone(block.inputTypes_));
  }
  return inputTypes;
};

Ray.Blocks.getDrawers = function(block) {
  var drawers = [];

  var outputType = Ray.Blocks.getOutputType(block);
  var outputTypes = outputType.getAllBaseTypes();

  var inputTypeList = goog.array.flatten(goog.array.map(Ray.Blocks.getInputTypes(block), function(type) {
    return type.getAllBaseTypes();
  }));
  var inputTypeSet = [];
  goog.array.forEach(inputTypeList, function(type) {
    if(!goog.array.contains(inputTypeSet, type)) {
      inputTypeSet.push(type);
    }
  });

  goog.array.forEach(inputTypeSet, function(type) {
    drawers.push([type, Ray.Blocks.Config.INPUT_CATEGORY_NAME]);
  });
  goog.array.forEach(outputTypes, function(type) {
    drawers.push([type, Ray.Blocks.Config.OUTPUT_CATEGORY_NAME]);
  });
  if(block.isUserFunction_) {
    drawers.push([Ray.Blocks.Config.USER_FUN_CATEGORY_NAME]);
  }

  if(block.form_) {
    drawers.push([Ray.Blocks.Config.CONTROL_CATEGORY_NAME]);
  }

  if(block.arguments_) {
    drawers.push([Ray.Blocks.Config.ARGUMENT_CATEGORY_NAME]);
  }

  if(drawers.length === 0) {
    throw 'This block will not be in any drawers!';
  }
  return drawers;
};

/**
 * Generates an xml string representing the toolbox category tree of blocks that will be available on a Blockly page.
 * @param {Object} blockDirectory the block directory for which we will generate the toolbox
 * @param {?boolean=} opt_includeArguments Should we include arguments blocks in this block directory?
 */
Ray.Blocks.generateToolbox = function(blockDirectory, opt_includeArguments) {
  // I need to figure out how to get rid of arguments, and how to get rid of ALL
  blockDirectory.removeCategory('all');
  var includeArguments = !!opt_includeArguments;
  if(!includeArguments) {
    blockDirectory.removeCategory('arguments');
  }
  return blockDirectory;
};

Ray.Blocks.addToBlockDirectory = function(blockDirectory, blockName, block) {
  var drawers = Ray.Blocks.getDrawers(block);
  /* This is not nearly as complicated as it looks. Basically, I just walk down the tree structure of the block directory,
   * making sure that things exist at each point, and creating them if they do not.
   * I also make sure that one subcategory doesn't contain blocks and subcategories at the same time
   */
  goog.array.forEach(drawers, function(drawer) {
    blockDirectory.addItemAt(drawer, blockName);
  });
  blockDirectory.addItemAt([Ray.Blocks.Config.ALL_CATEGORY_NAME], blockName);

  return blockDirectory;
};

Ray.Blocks.emptyBlockDirectory = function() {
  var blockDirectory  = new Ray.Blocks.CategoryTree();
  var baseTypes = goog.array.map(Ray.Types.getBaseTypes(), function(ty) {
    return ty.key();
  });
  goog.array.forEach(baseTypes, function(ty)   {
    blockDirectory.addItemAt([ty, Ray.Blocks.Config.INPUT_CATEGORY_NAME], undefined);
    blockDirectory.addItemAt([ty, Ray.Blocks.Config.OUTPUT_CATEGORY_NAME], undefined);
  });

  blockDirectory.addItemAt([Ray.Blocks.Config.CONTROL_CATEGORY_NAME], undefined);
  blockDirectory.addItemAt([Ray.Blocks.Config.USER_FUN_CATEGORY_NAME], undefined);
  blockDirectory.addItemAt([Ray.Blocks.Config.ARGUMENT_CATEGORY_NAME], undefined);
  // Not including all, as per Emmanuel's email, since it would allow students not to use type-based reasoning
  // I'm just leaving it out of the displayed toolbox, but still putting blocks in drawers
  blockDirectory.addItemAt([Ray.Blocks.Config.ALL_CATEGORY_NAME], undefined);
  return blockDirectory;
};

Ray.Blocks.generateBlockDirectory = function(blocks) {
  var blockDirectory = Ray.Blocks.emptyBlockDirectory();

  var blockMap = {};
  goog.array.forEach(blocks, function(block) {
    blockMap[block.externalName_] = block;
  });

  var blockNames = goog.array.filter(goog.object.getKeys(blockMap), function(name) {
    var isCondCond = name.indexOf(Ray.Blocks.CONDITIONAL_PREFIX + 'cond_') === 0;
    var isRestArg = name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    return !(isCondCond || isRestArg);
  });
  goog.array.forEach(blockNames, function(blockName) {
    var block = blockMap[blockName];
    Ray.Blocks.addToBlockDirectory(blockDirectory, blockName, block);
  });
  return blockDirectory;

};

Ray.Blocks.typeNameBlock = function(type) {
  var typeBlock = {};
  typeBlock.colourType_ = type;
  typeBlock.preInit_ = function() {
    if(this.outputConnection) {
      this.outputConnection.dispose();
      this.outputConnection = null;
    }
  };
  typeBlock.init = function() {
    this.appendDummyInput()
      .appendTitle(type.key());
  };
  return typeBlock;
};

Ray.Blocks.exampleBlock = function() {
  var exampleBlock = {};
  exampleBlock.name_ = Ray.Blocks.EXAMPLE_BLOCK_NAME;
  exampleBlock.externalName_ = Ray.Blocks.EXAMPLE_BLOCK_NAME;
  exampleBlock.renderAsExpression_ = false;
  exampleBlock.type = Ray.Blocks.EXAMPLE_BLOCK_NAME;
  exampleBlock.blockClass_ = Ray.Globals.Blocks.Example;
  exampleBlock.preInit_ = function() {
    if(this.outputConnection) {
      this.outputConnection.dispose();
      this.outputConnection = null;
    }
  };

  exampleBlock.updateColourFromTestResult = function(testPassed) {
    this.setColour(testPassed ?
                      Ray.Blocks.PASSING_TEST_BLOCK_COLOR :
                      Ray.Blocks.FAILING_TEST_BLOCK_COLOR);
  };

  exampleBlock.getExpr = function() {
    return this.getInputTargetBlock(Ray.Blocks.EXAMPLE_BLOCK_EXPR_INPUT);
  };

  exampleBlock.getResult = function() {
    return this.getInputTargetBlock(Ray.Blocks.EXAMPLE_BLOCK_RESULT_INPUT);
  };

  exampleBlock.init = function() {
    this.appendDummyInput()
      .appendTitle('example:');
    this.appendValueWithType(Ray.Blocks.EXAMPLE_BLOCK_EXPR_INPUT, new Ray.Types.Unknown());
    this.appendDummyInput()
      .appendTitle('evaluates to');
    this.appendValueWithType(Ray.Blocks.EXAMPLE_BLOCK_RESULT_INPUT, new Ray.Types.Unknown());
  };
  return exampleBlock;
};

Ray.Blocks.FunBodyBlock = function() {
  var funBodyBlock = {};
  funBodyBlock.name_ = Ray.Blocks.FUN_BODY_BLOCK_NAME;
  funBodyBlock.externalName_ = Ray.Blocks.FUN_BODY_BLOCK_NAME;
  funBodyBlock.renderAsExpression_ = false;
  funBodyBlock.type_ = Ray.Blocks.FUN_BODY_BLOCK_TYPE;
  funBodyBlock.blockClass_ = Ray.Globals.Blocks.FunBody;
  funBodyBlock.preInit_ = function() {
    if(this.outputConnection) {
      this.outputConnection.dispose();
      this.outputConnection = null;
    }
  };

  funBodyBlock.getBody = function() {
    return this.getInputTargetBlock(Ray.Blocks.FUN_BODY_BLOCK_INPUT);
  };

  funBodyBlock.init = function() {
    this.appendDummyInput()
      .appendTitle("Function body:");
    this.appendValueWithType(Ray.Blocks.FUN_BODY_BLOCK_INPUT, new Ray.Types.Unknown());
  };

  return funBodyBlock;
};