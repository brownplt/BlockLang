goog.provide('Ray.Shared');

goog.require('Ray.Blocks');
goog.require('Ray.Blocks.TypeChecker');
goog.require('Ray.Types');

goog.require('Blockly');

Ray.Shared.setRayInstance = function(r) {
  Ray.Shared.Ray = r;
};

Ray.Shared.saveBlockXml = function(block) {
  var block_xml = Blockly.Xml.blockToDom_(block);
  var xy = block.getRelativeToSurfaceXY();
  block_xml.setAttribute('x', Blockly.RTL ? -xy.x : xy.x);
  block_xml.setAttribute('y', xy.y);
  Ray.Shared.savedBlockXml_ = block_xml;
};

Ray.Shared.loadBlockXml = function(Blockly, workspace) {
  var block_xml = Ray.Shared.savedBlockXml_;
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
Ray.Shared.attachToBlockly = function(Blockly) {
  Blockly.Ray_ = Ray;
  Blockly.id_ = Ray.Shared.counter++;
};

Ray.Shared.setMainBlockly = function(Blockly) {
  Ray.Shared.MainBlockly = Blockly;
};

Ray.Shared.FunDefBlocklys = [];
Ray.Shared.registerFunDefBlockly = function(Blockly) {
  Ray.Shared.FunDefBlocklys.push(Blockly);
};

Ray.Shared.setBlocks = function(blocks) {
  Ray.Shared.savedBlocks_ = blocks;
  Ray.Shared.blockDir_ = Ray.Blocks.generateBlockDir(blocks);
};

/**
 *
 * @param {?boolean=} opt_includeArguments
 * @returns {*}
 */
Ray.Shared.getToolbox = function(opt_includeArguments) {
  return Ray.Blocks.generateToolbox(Ray.Shared.blockDir_, opt_includeArguments);
};

Ray.Shared.addToSavedBlocks = function(blockName, block) {
  if(Ray.Shared.savedBlocks_[blockName]) {
    throw 'Would overwrite pre-existing block!';
  }
  Ray.Shared.savedBlocks_[blockName] = block;
  Ray.Blocks.addToBlockDir(Ray.Shared.blockDir_, blockName, block);
};

/**
 * A single key can have multiple words separated by underscores, in which case they are used in turn during the lookup
 * @param key
 * @param blockDir
 * @returns {*}
 */
Ray.Shared.lookupInBlockDir_ = function(key, blockDir) {
  var keys = key.split('_');
  var curr_category = blockDir;
  for(var i = 0; i < keys.length; i++) {
    curr_category = curr_category[keys[i]];
    if(!curr_category) {
      return null;
    }
  }
  return curr_category;
};

Ray.Shared.lookupInSharedBlockDir_ = function(key) {
  var category_blocks = Ray.Shared.lookupInBlockDir_(key, Ray.Shared.blockDir_);
  if(!category_blocks) {
    throw 'Unknown category!';
  } else {
    return category_blocks;
  }
};

Ray.Shared.flyoutCategory = function(key, blocks, gaps, margin, workspace, Blockly) {
  var allBlocks = [];
  var funDefBlocks = Blockly.FunDefBlocks;
  if(funDefBlocks) {
    var funDefDir = Ray.Blocks.generateBlockDir(funDefBlocks);
    var funDefCategory = Ray.Shared.lookupInBlockDir_(key, funDefDir);
    if(funDefCategory) {
      allBlocks = allBlocks.concat(funDefCategory);
    }
  }

  var categoryBlocks = Ray.Shared.lookupInSharedBlockDir_(key);
  if(categoryBlocks) {
    allBlocks = allBlocks.concat(categoryBlocks);
  }

  if(allBlocks.length === 0) {
    throw 'Nothing in category!';
  }

  goog.array.stableSort(allBlocks, function(block_name1, block_name2) {
    var block1 = Ray.Shared.getBlockPrototype(Blockly, block_name1);
    var block2 = Ray.Shared.getBlockPrototype(Blockly, block_name2);
    return Ray.Shared.precedesOtherBlock_(block1, block2);
  });

  goog.array.forEach(allBlocks, function(block_name) {
    var block = new Blockly.Block(workspace, block_name);
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2);
  });
};

Ray.Shared.precedesOtherBlock_ = function(block1, block2) {
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

Ray.Shared.getTypeColour = function(type) {
  return Ray.Blocks.getColour(type);
};

Ray.Shared.areMatchingTypes = function(ty1, ty2) {
  return Ray.Types.areMatchingTypes(ty1, ty2);
};

Ray.Shared.areSameTypes = function(ty1, ty2) {
  return Ray.Types.areSameType(ty1, ty2);
};

Ray.Shared.principalType = function(types) {
  return Ray.Types.principalType(types);
};

Ray.Shared.principalType_ = function(ty1, ty2) {
  return Ray.Types.principalType_(ty1, ty2);
};

Ray.Shared.typecheckBlock = function(block) {
  return Ray.Blocks.TypeChecker.typecheckBlock(block);
};

Ray.Shared.getBlockPrototype = function(Blockly, prototypeName) {
  var prototype = null;
  if(Blockly.FunDefBlocks && Blockly.FunDefBlocks[prototypeName]) {
    prototype = Blockly.FunDefBlocks[prototypeName];
  } else if(Ray.Shared.savedBlocks_[prototypeName]) {
    prototype = Ray.Shared.savedBlocks_[prototypeName];
  }
  return prototype;
};