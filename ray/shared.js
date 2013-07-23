goog.provide('Ray.Shared');

goog.require('Ray.Main');
goog.require('Ray.Blocks');
goog.require('Ray.Blocks.TypeChecker');
goog.require('Ray.Types');

goog.require('Blockly');

Ray.Shared.setRayInstance = function(r) {
  Ray.Shared.Ray = r;
};

Ray.Shared.saveBlockXml = function(block) {
  var blockXml = Blockly.Xml.blockToDom_(block);
  var xy = block.getRelativeToSurfaceXY();
  blockXml.setAttribute('x', Blockly.RTL ? -xy.x : xy.x);
  blockXml.setAttribute('y', xy.y);
  Ray.Shared.savedBlockXml_ = blockXml;
};

Ray.Shared.loadBlockXml = function(Blockly, workspace) {
  var blockXml = Ray.Shared.savedBlockXml_;
  var block = Blockly.Xml.domToBlock_(workspace, blockXml);
  var blockX = parseInt(blockXml.getAttribute('x'), 10);
  var blockY = parseInt(blockXml.getAttribute('y'), 10);
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

Ray.Shared.lookupFunDefBlockly = function(id) {
  return goog.array.find(Ray.Shared.FunDefBlocklys, function(Blockly) {
    return Blockly.funId === id;
  });
};

Ray.Shared.setBlocks = function(blocks) {
  Ray.Shared.savedBlocks_ = blocks;
  Ray.Shared.blockDirectory_ = Ray.Blocks.generateBlockDirectory(blocks);
};

/**
 *
 * @param {?boolean=} opt_includeArguments
 * @returns {*}
 */
Ray.Shared.getToolbox = function(opt_includeArguments) {
  return Ray.Blocks.generateToolbox(Ray.Shared.blockDirectory_, opt_includeArguments);
};

Ray.Shared.addToSavedBlocks = function(block) {
  if(goog.array.find(Ray.Shared.savedBlocks_, function(savedBlock) {
    return savedBlock.externalName_ === block.externalName_;
  })) {
    throw 'Would overwrite pre-existing block!';
  }
  Ray.Shared.savedBlocks_.push(block);
  Ray.Blocks.addToBlockDirectory(Ray.Shared.blockDirectory_, block.externalName_, block);
};

/**
 * A single key can have multiple words separated by underscores, in which case they are used in turn during the lookup
 * @param key
 * @param blockDir
 * @returns {*}
 */
Ray.Shared.lookupInBlockDirectory = function(key, blockDir) {
  var keys = key.split('_');
  var currCategory = blockDir;
  for(var i = 0; i < keys.length; i++) {
    currCategory = currCategory[keys[i]];
    if(!currCategory) {
      return null;
    }
  }
  return currCategory;
};

Ray.Shared.lookupInSharedBlockDirectory_ = function(key) {
  var categoryBlocks = Ray.Shared.lookupInBlockDirectory(key, Ray.Shared.blockDirectory_);
  if(!categoryBlocks) {
    throw 'Unknown category!';
  } else {
    return categoryBlocks;
  }
};

Ray.Shared.flyoutCategory = function(key, blocks, gaps, margin, workspace, Blockly) {
  var allBlocks = [];
  if(Blockly.funDef) {
    var funDefBlocks = Blockly.funArgBlockProtos;
    var funDefDir = Ray.Blocks.generateBlockDirectory(funDefBlocks);
    var funDefCategory = Ray.Shared.lookupInBlockDirectory(key, funDefDir);
    if(funDefCategory) {
      allBlocks = allBlocks.concat(funDefCategory);
    }
  }

  var categoryBlocks = Ray.Shared.lookupInSharedBlockDirectory_(key);
  if(categoryBlocks) {
    allBlocks = allBlocks.concat(categoryBlocks);
  }

  if(allBlocks.length === 0) {
    throw 'Nothing in category!';
  }

  goog.array.stableSort(allBlocks, function(blockName1, blockName2) {
    var block1 = Ray.Shared.getBlockPrototype(Blockly, blockName1);
    var block2 = Ray.Shared.getBlockPrototype(Blockly, blockName2);
    return Ray.Shared.precedesOtherBlock_(block1, block2);
  });

  goog.array.forEach(allBlocks, function(blockName) {
    var block = new Blockly.Block(workspace, blockName);
    block.initSvg();
    blocks.push(block);
    gaps.push(margin * 2);
  });
};

Ray.Shared.precedesOtherBlock_ = function(block1, block2) {
  var priority1 = block1.priority_;
  var priority2 = block2.priority_;
  var isNum1 = goog.isNumber(priority1);
  var isNum2 = goog.isNumber(priority2);
  if(isNum1 && isNum2) {
    return block1.priority_ - block2.priority_;
  } else if(isNum1) {
    return -1;
  } else if(isNum2) {
    return 1;
  } else {
    return 0;
  }
};

Ray.Shared.funBlockInstanceDB = {};


Ray.Shared.addArgToDB = function(block) {
  var funId = block.funId_;
  if(!goog.isDef(Ray.Shared.funBlockInstanceDB[funId])) {
    Ray.Shared.funBlockInstanceDB[funId] = {'app': [], 'args': []};
  }
  var instanceDB = Ray.Shared.funBlockInstanceDB[funId];
  instanceDB.args.push(block);
};

Ray.Shared.addAppToDB = function(block) {
  var funId = block.funId_;
  if(!goog.isDef(Ray.Shared.funBlockInstanceDB[funId])) {
    Ray.Shared.funBlockInstanceDB[funId] = {'app': [], 'args': []};
  }
  var instanceDB = Ray.Shared.funBlockInstanceDB[funId];
  instanceDB.app.push(block);
};

Ray.Shared.getInstanceDBForFunId = function(funId) {
  return Ray.Shared.funBlockInstanceDB[funId] || null;
};

Ray.Shared.removeArgFromDB = function(block) {
  var funId = block.funId_;
  var instanceDB = Ray.Shared.funBlockInstanceDB[funId];
  goog.array.remove(instanceDB.args, block);
};

Ray.Shared.removeAppFromDB = function(block) {
  var funId = block.funId_;
  var instanceDB = Ray.Shared.funBlockInstanceDB[funId];
  goog.array.remove(instanceDB.app, block);
};

Ray.Shared.applyFunDefChanges = function(funId, funSpec) {
  var funDefBlockly = Ray.Shared.lookupFunDefBlockly(funId);
  var funAppBlockProto = funDefBlockly.funAppBlockProto;
  var oldFunSpec = funDefBlockly.funSpec;
  if(oldFunSpec.name !== funSpec.name) {
    funAppBlockProto.name_ = funSpec.name;
    Ray.Shared.updateFunAppBlockNames(funId, funSpec.name);
    console.log('Names changed!');
  }

  var R = Ray.Shared.Ray;
  var argSpec = Ray.Main.createFunArgSpec(R, funSpec, true);
  // Creating placeholder closure!
  var value = new R.Value.Closure(argSpec, null, null, funSpec.returnType);

  // I should change the value only once in one place!!
  funDefBlockly.mainWorkspace.signature_.close();
  // If I change arguments as well, I don't want to change value again
  if(!Ray.Shared.areSameTypes(oldFunSpec.returnType, funSpec.returnType)) {
    funAppBlockProto.outputType_ = funSpec.returnType;
    funAppBlockProto.value_ = value;
    Ray.Shared.updateFunAppBlockOutputType(funId, value);
    console.log('Return type changed');
  }

  funDefBlockly.funSpec = funSpec;
  funDefBlockly.mainWorkspace.signature_.open();

};

Ray.Shared.getFunAppBlocksFromDB = function(funId) {
  return Ray.Shared.getInstanceDBForFunId(funId)['app'];
};

Ray.Shared.updateFunAppBlockNames = function(funId, newName) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.changeBlockTitle(newName);
  });
};

Ray.Shared.updateFunAppBlockOutputType = function(funId, value) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.value_ = value;
    block.outputConnection.clearInferredType();
    block.setOutputType(value.bodyType);
    block.updateColour();
  });
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
  if(prototypeName === 'example') {
    return Ray.Blocks.exampleBlock();
  }
  var prototype = null;
  if(Blockly.funDef) {
    var proto = goog.array.find(Blockly.funArgBlockProtos, function(block) {
      return block.externalName_ === prototypeName;
    });
    if(proto) {
      prototype = proto;
    }
  }

  if(!prototype) {
    prototype = goog.array.find(Ray.Shared.savedBlocks_, function(blockProto) {
      return blockProto.externalName_ === prototypeName;
    }) || null;
  }

  return prototype;
};