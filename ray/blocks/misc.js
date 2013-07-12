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

Ray.Blocks.block_name = function(name) {
  return Ray.Blocks.BLOCK_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.rest_arg_block_name = function(name) {
  return Ray.Blocks.REST_ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.primitive_data_block_name = function(name) {
  return Ray.Blocks.PRIMITIVE_DATA_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.conditional_block_name = function(name) {
  return Ray.Blocks.CONDITIONAL_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.arg_block_name = function(name) {
  return Ray.Blocks.ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.user_function_block_name = function(name) {
  return Ray.Blocks.FUNCTION_DEF_PREFIX + goog.string.htmlEscape(name);
};

Ray.Blocks.TypeColourTable = {};
var base_types = goog.object.getKeys(Ray.Types.atomic_types);
var hue_distance = 270 / base_types.length;
var current_hue = 0;
goog.array.forEach(base_types, function(ty) {
  Ray.Blocks.TypeColourTable[ty] = current_hue;
  current_hue += hue_distance;
});

Ray.Blocks.DEFAULT_BLOCK_COLOR = { R: 187, G: 187, B: 187 };
Ray.Blocks.UNKNOWN_BLOCK_COLOR = {  R: 102, G: 102, B: 102 };
Ray.Blocks.LIGHTEN_FACTOR = 0.4;

Ray.Blocks.get_colour = function(type) {
  if(!type) {
    return Ray.Blocks.DEFAULT_BLOCK_COLOR;
  }
  var key = type.__type__;
  var c = Ray.Blocks.TypeColourTable[key];
  if(goog.isDef(c)) {
    var rgb = goog.color.hsvToRgb(c, Blockly.HSV_SATURATION, Blockly.HSV_VALUE * 256);
    return { R: rgb[0], G: rgb[1], B: rgb[2] };

  } else if(key === 'list') {
    var orig_c = Ray.Blocks.get_colour(type.element_type);
    if(orig_c.R) {
      var new_c = goog.color.lighten([orig_c.R, orig_c.G, orig_c.B], Ray.Blocks.LIGHTEN_FACTOR);
      return { R: new_c[0], G: new_c[1], B: new_c[2] };
    } else {
      throw 'Element type color wasn\'t an R G B object';
    }

  } else if(Ray.Types.is_unknown(type)) {
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
Ray.Blocks.get_output_type = function(block) {
  return block.__type__;
};

/**
 * Get a list of input types for a block specification, for use in determining drawers
 * @param block
 */
Ray.Blocks.get_input_types = function(block) {
  var input_types = [];
  if(block.__value__) {
    // If the block's value isn't a primitive or closure, then it shouldn't have any inputs
    var value = block.__value__;
    if(!value.arg_spec) {
      return input_types;
    } else {
      input_types = input_types.concat(Ray.Types.get_arguments_types(value.arg_spec.arguments_type));
    }
  } else if(block.__input_types__) {
    input_types = input_types.concat(goog.array.clone(block.__input_types__));
  }
  return input_types;
};

Ray.Blocks.get_drawers = function(block) {
  var drawers = [];

  var output_type = Ray.Blocks.get_output_type(block);
  var output_type_set = output_type.get_all_base_types();

  var input_type_list = goog.array.flatten(goog.array.map(Ray.Blocks.get_input_types(block), function(type) {
    return type.get_all_base_types();
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
  if(block.__user_function__) {
    drawers.push('functions');
  }

  if(block.__form__) {
    drawers.push('forms');
  }

  if(block.__arguments__) {
    drawers.push('arguments');
  }

  if(drawers.length === 0) {
    throw 'This block will not be in any drawers!';
  }
  return drawers;
};

/**
 * Generates an xml string representing the toolbox of blocks that will be available on a Blockly page.
 * @param {Object} block_dir the block directory for which we will generate the toolbox
 * @param {?boolean=} opt_include_arguments Should we include arguments blocks in this block directory?
 */
Ray.Blocks.generate_toolbox = function(block_dir, opt_include_arguments) {
  var include_arguments = goog.isDef(opt_include_arguments) ? opt_include_arguments : true;
  var toolbox_categories = goog.object.getKeys(block_dir);
  toolbox_categories.sort();
  var toolbox = goog.dom.createDom('xml', {id: 'toolbox'});
  goog.array.forEach(toolbox_categories, function(category) {
    // Don't display arguments if false is passed in as opt_include_arguments
    if(category === 'arguments' && !include_arguments) {
      return;
    }
    // Otherwise, display category, even if it is empty!
    var cat = goog.dom.createDom('category');
    goog.dom.xml.setAttributes(cat, {name: category});

    if(!goog.isArray(block_dir[category])) {
      goog.array.forEach(goog.object.getKeys(block_dir[category]), function(subcategory) {
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

Ray.Blocks.add_to_block_directory = function(block_dir, block_name, block) {
  var drawers = Ray.Blocks.get_drawers(block);
  goog.array.forEach(drawers, function(drawer) {
    var end_index = drawer.search(/(input|output)/);
    if(end_index < 0) {
      block_dir[drawer].push(block_name);
    } else {
      var in_or_out = drawer.substring(end_index);
      var type = drawer.substring(0, end_index - 1);
      block_dir[type][in_or_out].push(block_name);
    }
  });
  block_dir['all'].push(block_name);
  return block_dir;
};

Ray.Blocks.empty_block_directory = function() {
  var block_dir  = {};
  var base_types = goog.array.map(Ray.Types.get_base_types(), function(ty) {
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

Ray.Blocks.generate_block_directory = function(blocks) {
  var block_dir = Ray.Blocks.empty_block_directory();

  var block_names = goog.array.filter(goog.object.getKeys(blocks), function(name) {
    var is_cond_cond = name.indexOf(Ray.Blocks.CONDITIONAL_PREFIX + 'cond_') === 0;
    var is_rest_arg = name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    return !(is_cond_cond || is_rest_arg);
  });
  goog.array.forEach(block_names, function(block_name) {
    var block = blocks[block_name];
    Ray.Blocks.add_to_block_directory(block_dir, block_name, block);
  });
  return block_dir;

};
