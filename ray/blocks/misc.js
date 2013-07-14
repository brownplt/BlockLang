goog.provide('Ray.Blocks.misc');

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
var R = Ray.Runtime;

//Ray.Blocks.BLOCK_COLOUR = 173;
Ray.Blocks.REST_ARG_PREFIX = "ray_rest_arg_";
Ray.Blocks.BLOCK_PREFIX = "ray_";
Ray.Blocks.PRIMITIVE_DATA_PREFIX = "ray_data_create_";
Ray.Blocks.CONDITIONAL_PREFIX = "ray_conditional_";
Ray.Blocks.ARG_PREFIX = "ray_function_arg_";
Ray.Blocks.FUNCTION_DEF_PREFIX = "ray_user_function_";
Ray.Blocks.HELP_URL = "#";

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
Ray.Blocks.argBlockName = function(name) {
  return Ray.Blocks.ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.userFunctionBlockName = function(name) {
  return Ray.Blocks.FUNCTION_DEF_PREFIX + goog.string.htmlEscape(name);
};

Ray.Blocks.TypeColourTable = {};
var base_types = goog.object.getKeys(Ray.Types.atomicTypes_);
var hue_distance = 270 / base_types.length;
var current_hue = 0;
goog.array.forEach(base_types, function(ty) {
  Ray.Blocks.TypeColourTable[ty] = current_hue;
  current_hue += hue_distance;
});

Ray.Blocks.DEFAULT_BLOCK_COLOR = { R: 187, G: 187, B: 187 };
Ray.Blocks.UNKNOWN_BLOCK_COLOR = {  R: 102, G: 102, B: 102 };
Ray.Blocks.LIGHTEN_FACTOR = 0.4;

Ray.Blocks.getColour = function(type) {
  if(!type) {
    return Ray.Blocks.DEFAULT_BLOCK_COLOR;
  }
  var key = type.outputType_;
  var c = Ray.Blocks.TypeColourTable[key];
  if(goog.isDef(c)) {
    var rgb = goog.color.hsvToRgb(c, Blockly.HSV_SATURATION, Blockly.HSV_VALUE * 256);
    return { R: rgb[0], G: rgb[1], B: rgb[2] };

  } else if(key === 'list') {
    var orig_c = Ray.Blocks.getColour(type.elementType);
    if(orig_c.R) {
      var new_c = goog.color.lighten([orig_c.R, orig_c.G, orig_c.B], Ray.Blocks.LIGHTEN_FACTOR);
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
  var input_types = [];
  if(block.value_) {
    // If the block's value isn't a primitive or closure, then it shouldn't have any inputs
    var value = block.value_;
    if(!value.argSpec) {
      return input_types;
    } else {
      input_types = input_types.concat(Ray.Types.getAllArgumentTypes(value.argSpec.argsType));
    }
  } else if(block.inputTypes_) {
    input_types = input_types.concat(goog.array.clone(block.inputTypes_));
  }
  return input_types;
};

Ray.Blocks.getDrawers = function(block) {
  var drawers = [];

  var output_type = Ray.Blocks.getOutputType(block);
  var output_type_set = output_type.getAllBaseTypes();

  var input_type_list = goog.array.flatten(goog.array.map(Ray.Blocks.getInputTypes(block), function(type) {
    return type.getAllBaseTypes();
  }));
  var input_type_set = [];
  goog.array.forEach(input_type_list, function(type) {
    if(!goog.array.contains(input_type_set, type)) {
      input_type_set.push(type);
    }
  });

  goog.array.forEach(input_type_set, function(type) {
    drawers.push(type + '_input');
  });
  goog.array.forEach(output_type_set, function(type) {
    drawers.push(type + '_output');
  });
  if(block.isUserFunction_) {
    drawers.push('functions');
  }

  if(block.form_) {
    drawers.push('forms');
  }

  if(block.arguments_) {
    drawers.push('arguments');
  }

  if(drawers.length === 0) {
    throw 'This block will not be in any drawers!';
  }
  return drawers;
};

/**
 * Generates an xml string representing the toolbox of blocks that will be available on a Blockly page.
 * @param {Object} blockDir the block directory for which we will generate the toolbox
 * @param {?boolean=} opt_includeArguments Should we include arguments blocks in this block directory?
 */
Ray.Blocks.generateToolbox = function(blockDir, opt_includeArguments) {
  var include_arguments = goog.isDef(opt_includeArguments) ? opt_includeArguments : true;
  var toolbox_categories = goog.object.getKeys(blockDir);
  toolbox_categories.sort();
  var toolbox = goog.dom.createDom('xml', {id: 'toolbox'});
  goog.array.forEach(toolbox_categories, function(category) {
    // Don't display arguments if false is passed in as opt_includeArguments
    if(category === 'arguments' && !include_arguments) {
      return;
    }
    // Otherwise, display category, even if it is empty!
    var cat = goog.dom.createDom('category');
    goog.dom.xml.setAttributes(cat, {name: category});

    if(!goog.isArray(blockDir[category])) {
      goog.array.forEach(goog.object.getKeys(blockDir[category]), function(subcategory) {
        var attributes = {};
        attributes.name = (subcategory === 'input' ? 'consumes' : 'produces');
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

Ray.Blocks.addToBlockDir = function(blockDir, blockName, block) {
  var drawers = Ray.Blocks.getDrawers(block);
  goog.array.forEach(drawers, function(drawer) {
    var end_index = drawer.search(/(input|output)/);
    if(end_index < 0) {
      blockDir[drawer].push(blockName);
    } else {
      var in_or_out = drawer.substring(end_index);
      var type = drawer.substring(0, end_index - 1);
      blockDir[type][in_or_out].push(blockName);
    }
  });
  blockDir['all'].push(blockName);
  return blockDir;
};

Ray.Blocks.emptyBlockDir = function() {
  var block_dir  = {};
  var base_types = goog.array.map(Ray.Types.getBaseTypes(), function(ty) {
    return ty.key();
  });
  goog.array.forEach(base_types, function(ty)   {
    block_dir[ty] = {};
    block_dir[ty]['input'] = [];
    block_dir[ty]['output'] = [];
  });

  block_dir['forms'] = [];
  block_dir['arguments'] = [];
  block_dir['functions'] = [];
  block_dir['all'] = [];
  return block_dir;
};

Ray.Blocks.generateBlockDir = function(blocks) {
  var block_dir = Ray.Blocks.emptyBlockDir();

  var block_names = goog.array.filter(goog.object.getKeys(blocks), function(name) {
    var is_cond_cond = name.indexOf(Ray.Blocks.CONDITIONAL_PREFIX + 'cond_') === 0;
    var is_rest_arg = name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    return !(is_cond_cond || is_rest_arg);
  });
  goog.array.forEach(block_names, function(block_name) {
    var block = blocks[block_name];
    Ray.Blocks.addToBlockDir(block_dir, block_name, block);
  });
  return block_dir;

};
