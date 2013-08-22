goog.provide('Ray.Blocks.misc');

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

Ray.Blocks.INPUT_CATEGORY_NAME = 'input';
Ray.Blocks.OUTPUT_CATEGORY_NAME = 'output';
Ray.Blocks.USER_FUN_CATEGORY_NAME = 'functions';
Ray.Blocks.CONTROL_CATEGORY_NAME = 'control';
Ray.Blocks.ARGUMENT_CATEGORY_NAME = 'arguments';
Ray.Blocks.LIST_CATEGORY_NAME = 'list';
Ray.Blocks.ALL_CATEGORY_NAME = 'all';

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
    drawers.push([type, Ray.Blocks.INPUT_CATEGORY_NAME]);
  });
  goog.array.forEach(outputTypes, function(type) {
    drawers.push([type, Ray.Blocks.OUTPUT_CATEGORY_NAME]);
  });
  if(block.isUserFunction_) {
    drawers.push([Ray.Blocks.USER_FUN_CATEGORY_NAME]);
  }

  if(block.form_) {
    drawers.push([Ray.Blocks.CONTROL_CATEGORY_NAME]);
  }

  if(block.arguments_) {
    drawers.push([Ray.Blocks.ARGUMENT_CATEGORY_NAME]);
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
  var includeArguments = goog.isDef(opt_includeArguments) ? opt_includeArguments : true;
  var toolboxCategories = goog.object.getKeys(blockDirectory);
  toolboxCategories.sort();
  var toolbox = goog.dom.createDom('xml', {id: 'toolbox'});
  goog.array.forEach(toolboxCategories, function(category) {
    // Disabling these categories at the moment
    if(category === Ray.Blocks.ARGUMENT_CATEGORY_NAME || category === Ray.Blocks.ALL_CATEGORY_NAME) {
      return;
    }
    // Don't display arguments if false is passed in as opt_includeArguments
    if(category === Ray.Blocks.ARGUMENT_CATEGORY_NAME && !includeArguments) {
      return;
    }
    // Otherwise, display category, even if it is empty!
    var cat = goog.dom.createDom('category');
    goog.dom.xml.setAttributes(cat, {name: category});

    if(!goog.isArray(blockDirectory[category])) {
      goog.array.forEach(goog.object.getKeys(blockDirectory[category]), function(subcategory) {
        var attributes = {};
        attributes.name = (subcategory === Ray.Blocks.INPUT_CATEGORY_NAME ? 'consumes' : 'produces');
        attributes.key = subcategory;
        attributes.custom = category + '_' + attributes.key;
        var subcat = goog.dom.createDom('category');
        goog.dom.xml.setAttributes(subcat, attributes);
        goog.dom.appendChild(cat, subcat);
      });
    } else {
      goog.dom.xml.setAttributes(cat, {custom: category});
    }

    goog.dom.appendChild(toolbox, cat);
  });
  return goog.dom.xml.serialize(toolbox);
};

Ray.Blocks.addToBlockDirectory = function(blockDirectory, blockName, block) {
  var drawers = Ray.Blocks.getDrawers(block);
  /* This is not nearly as complicated as it looks. Basically, I just walk down the tree structure of the block directory,
   * making sure that things exist at each point, and creating them if they do not.
   * I also make sure that one subcategory doesn't contain blocks and subcategories at the same time
   */
  goog.array.forEach(drawers, function(drawer) {
    var currentCategory = blockDirectory;
    var key;
    // For all but the last key, I want to find another object, and not an array,
    // since that would mean I was inconsistent about whether the level has subcategories or blocks.
    for(var i = 0; i < drawer.length - 1; i++) {
      key = drawer[i];
      if(!currentCategory[key]) {
        currentCategory[key] = {};
      } else if(goog.isArray(currentCategory[key])) {
        throw 'drawer has subcategory where blockDir has list of blocks';
      }
      currentCategory = currentCategory[key];
    }

    key = drawer[drawer.length - 1];
    if(!currentCategory[key]) {
      currentCategory[key] = [];
    } else if(!goog.isArray(currentCategory[key])) {
      throw 'drawer has list of blocks where blockDir has subcategory';
    }
    var finalArray = currentCategory[key];
    finalArray.push(blockName);
  });

  blockDirectory[Ray.Blocks.ALL_CATEGORY_NAME].push(blockName);
  return blockDirectory;
};

Ray.Blocks.emptyBlockDirectory = function() {
  var blockDirectory  = {};
  var baseTypes = goog.array.map(Ray.Types.getBaseTypes(), function(ty) {
    return ty.key();
  });
  goog.array.forEach(baseTypes, function(ty)   {
    blockDirectory[ty] = {};
    blockDirectory[ty][Ray.Blocks.INPUT_CATEGORY_NAME] = [];
    blockDirectory[ty][Ray.Blocks.OUTPUT_CATEGORY_NAME] = [];
  });

  blockDirectory[Ray.Blocks.CONTROL_CATEGORY_NAME] = [];
  blockDirectory[Ray.Blocks.USER_FUN_CATEGORY_NAME] = [];
  blockDirectory[Ray.Blocks.ARGUMENT_CATEGORY_NAME] = [];
  // Not including all, as per Emmanuel's email, since it would allow students not to use type-based reasoning
  // I'm just leaving it out of the displayed toolbox, but still putting blocks in drawers
  blockDirectory[Ray.Blocks.ALL_CATEGORY_NAME] = [];
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
  exampleBlock.renderAsExpression_ = true;
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
