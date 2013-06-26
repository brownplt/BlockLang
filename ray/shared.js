goog.provide('Ray.Shared');

goog.require('Ray.Blocks');

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

Ray.Shared.attach_to_blockly = function(Blockly) {
  Blockly.Ray_ = Ray;
};

Ray.Shared.set_blocks = function(blocks) {
  Ray.Shared.saved_blocks_ = blocks;
  Ray.Shared.toolbox_obj_ = Ray.Blocks.generate_toolbox_obj(blocks);
  Ray.Shared.toolbox_ = Ray.Blocks.generate_toolbox(Ray.Shared.toolbox_obj_);
};

Ray.Shared.get_blocks = function(blocks) {
  Ray.Shared
}

Ray.Shared.get_toolbox = function() {
  return Ray.Shared.toolbox_;
};

/**
 * A single key can have multiple words separated by underscores, in which case they are used in turn during the lookup
 * @param key
 * @returns {*}
 */
Ray.Shared.get_blocks_in_category_from_toolbox_obj_ = function(key, toolbox_obj) {
  var keys = key.split('_');
  var curr_category = toolbox_obj;
  for(var i = 0; i < keys.length; i++) {
    curr_category = curr_category[keys[i]];
    if(!curr_category) {
      return null;
    }
  }
  return curr_category;
};

Ray.Shared.get_blocks_in_category = function(key) {
  var category_blocks = Ray.Shared.get_blocks_in_category_from_toolbox_obj_(key, Ray.Shared.toolbox_obj_);
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
    var func_def_toolbox = Ray.Blocks.generate_toolbox_obj(func_def_blocks);
    var func_def_category_blocks = Ray.Shared.get_blocks_in_category_from_toolbox_obj_(key, func_def_toolbox);
    if(func_def_category_blocks) {
      all_category_blocks = all_category_blocks.concat(func_def_category_blocks);
    }
  }

  var category_blocks = Ray.Shared.get_blocks_in_category(key);
  if(category_blocks) {
    all_category_blocks = all_category_blocks.concat(category_blocks);
  }

  if(all_category_blocks.length === 0) {
    throw 'Nothing in category!';
  }

  goog.array.forEach(all_category_blocks, function(block_name) {
    var block = new Blockly.Block(workspace, block_name);
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2);
  });

}
