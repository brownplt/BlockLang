goog.provide('Ray.Shared');

goog.require('Ray.Blocks');
goog.require('Ray.Blocks.TypeChecker');
goog.require('Ray.Types');

goog.require('Blockly');

Ray.Shared.set_ray_instance = function(r) {
  Ray.Shared.Ray = r;
};

Ray.Shared.save_block_xml = function(block) {
  var block_xml = Blockly.Xml.blockToDom_(block);
  var xy = block.getRelativeToSurfaceXY();
  block_xml.setAttribute('x', Blockly.RTL ? -xy.x : xy.x);
  block_xml.setAttribute('y', xy.y);
  Ray.Shared.saved_block_xml_ = block_xml;
};

Ray.Shared.load_block_xml = function(Blockly, workspace) {
  var block_xml = Ray.Shared.saved_block_xml_;
  var block = Blockly.Xml.domToBlock_(workspace, block_xml);
  var blockX = parseInt(block_xml.getAttribute('x'), 10);
  var blockY = parseInt(block_xml.getAttribute('y'), 10);
  if (!isNaN(blockX) && !isNaN(blockY)) {
    block.moveBy(Blockly.RTL ? -blockX : blockX, blockY);
  }
  block.Blockly = Blockly;
  return block;
};

Ray.Shared.counter = 0;
Ray.Shared.attach_to_blockly = function(Blockly) {
  Blockly.Ray_ = Ray;
  Blockly.id_ = Ray.Shared.counter++;
};

Ray.Shared.set_main_blockly = function(Blockly) {
  Ray.Shared.MainBlockly = Blockly;
};

Ray.Shared.FuncDefBlocklys = []
Ray.Shared.register_func_def_blockly = function(Blockly) {
  Ray.Shared.FuncDefBlocklys.push(Blockly);
};

Ray.Shared.set_blocks = function(blocks) {
  Ray.Shared.saved_blocks_ = blocks;
  Ray.Shared.block_dir_ = Ray.Blocks.generate_block_directory(blocks);
};

/**
 *
 * @param {?boolean=} opt_include_arguments
 * @returns {*}
 */
Ray.Shared.get_toolbox = function(opt_include_arguments) {
  return Ray.Blocks.generate_toolbox(Ray.Shared.block_dir_, opt_include_arguments);
};

Ray.Shared.add_to_saved_blocks = function(block_name, block) {
  if(Ray.Shared.saved_blocks_[block_name]) {
    throw 'Would overwrite pre-existing block!';
  }
  Ray.Shared.saved_blocks_[block_name] = block;
  Ray.Blocks.add_to_block_directory(Ray.Shared.block_dir_, block_name, block);
};

/**
 * A single key can have multiple words separated by underscores, in which case they are used in turn during the lookup
 * @param key
 * @param block_dir
 * @returns {*}
 */
Ray.Shared.lookup_in_block_dir_ = function(key, block_dir) {
  var keys = key.split('_');
  var curr_category = block_dir;
  for(var i = 0; i < keys.length; i++) {
    curr_category = curr_category[keys[i]];
    if(!curr_category) {
      return null;
    }
  }
  return curr_category;
};

Ray.Shared.lookup_in_shared_block_dir_ = function(key) {
  var category_blocks = Ray.Shared.lookup_in_block_dir_(key, Ray.Shared.block_dir_);
  if(!category_blocks) {
    throw 'Unknown category!';
  } else {
    return category_blocks;
  }
};

Ray.Shared.flyoutCategory = function(key, blocks, gaps, margin, workspace, Blockly) {
  var all_category_blocks = [];
  var func_def_blocks = Blockly.FunctionDefinitionBlocks;
  if(func_def_blocks) {
    var func_def_dir = Ray.Blocks.generate_block_directory(func_def_blocks);
    var func_def_category_blocks = Ray.Shared.lookup_in_block_dir_(key, func_def_dir);
    if(func_def_category_blocks) {
      all_category_blocks = all_category_blocks.concat(func_def_category_blocks);
    }
  }

  var category_blocks = Ray.Shared.lookup_in_shared_block_dir_(key);
  if(category_blocks) {
    all_category_blocks = all_category_blocks.concat(category_blocks);
  }

  if(all_category_blocks.length === 0) {
    throw 'Nothing in category!';
  }

  goog.array.stableSort(all_category_blocks, function(block_name1, block_name2) {
    var block1 = Ray.Shared.get_block_prototype(Blockly, block_name1);
    var block2 = Ray.Shared.get_block_prototype(Blockly, block_name2);
    return Ray.Shared.precedes_other_block(block1, block2);
  });

  goog.array.forEach(all_category_blocks, function(block_name) {
    var block = new Blockly.Block(workspace, block_name);
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2);
  });
};

Ray.Shared.precedes_other_block = function(block1, block2) {
  var priority1 = block1.priority_;
  var priority2 = block2.priority_;
  var is_num1 = goog.isNumber(priority1);
  var is_num2 = goog.isNumber(priority2);
  if(is_num1 && is_num2) {
    return block1.priority_ - block2.priority_;
  } else if(is_num1) {
    return -1;
  } else if(is_num2) {
    return 1;
  } else {
    return 0;
  }
};

Ray.Shared.get_type_colour = function(type) {
  return Ray.Blocks.get_colour(type);
};

Ray.Shared.types_match = function(ty1, ty2) {
  return Ray.Types.is_match(ty1, ty2);
};

Ray.Shared.are_same_types = function(ty1, ty2) {
  return Ray.Types.is_same(ty1, ty2);
};

Ray.Shared.principal_type = function(types) {
  return Ray.Types.principal_type(types);
};

Ray.Shared.principal_type_ = function(ty1, ty2) {
  return Ray.Types.principal_type_(ty1, ty2);
};

Ray.Shared.typecheck_block = function(block) {
  return Ray.Blocks.TypeChecker.typecheck_block(block);
};

Ray.Shared.get_block_prototype = function(Blockly, prototypeName) {
  var prototype = null;
  if(Blockly.FunctionDefinitionBlocks && Blockly.FunctionDefinitionBlocks[prototypeName]) {
    prototype = Blockly.FunctionDefinitionBlocks[prototypeName];
  } else if(Ray.Shared.saved_blocks_[prototypeName]) {
    prototype = Ray.Shared.saved_blocks_[prototypeName];
  }
  return prototype;
};