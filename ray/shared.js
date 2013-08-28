goog.provide('Ray.Shared');

goog.require('Ray.Evaluation');
goog.require('Ray.Blocks');
goog.require('Ray.Blocks.TypeChecker');
goog.require('Ray.Types');
goog.require('Ray.UserFun');

goog.require('goog.dom.xml');

goog.require('Blockly');

Ray.Shared.serialize = function() {
  console.log('Serializing!');
  var xml = goog.dom.createDom('xml');
  var mainWorkspaceXml = Blockly.Xml.workspaceToDom(Ray.Shared.MainBlockly.mainWorkspace);
  goog.dom.xml.setAttributes(mainWorkspaceXml, {'kind' : 'main'});
  goog.dom.appendChild(xml, mainWorkspaceXml);
  goog.array.forEach(Ray.Shared.FunDefBlocklys, function(Blockly) {
    var userFunXml = goog.dom.createDom('user_function');

    var funSpecXml = Ray.UserFun.funSpecToXml(Blockly);
    goog.dom.appendChild(userFunXml, funSpecXml);

    var funDefWorkspaceXml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    goog.dom.xml.setAttributes(funDefWorkspaceXml, {'kind' : 'user_function', 'fun_id' : String(Blockly.funId) });
    goog.dom.appendChild(userFunXml, funDefWorkspaceXml);

    goog.dom.appendChild(xml, userFunXml);
  }, this);
  console.log(xml);
  return xml;
};


Ray.Shared.saveBlockXml = function(block) {
  var blockXml = Blockly.Xml.blockToDom_(block);
  var xy = block.getRelativeToSurfaceXY();
  blockXml.setAttribute('x', xy.x);
  blockXml.setAttribute('y', xy.y);
  Ray.Shared.savedBlockXml_ = blockXml;
};

Ray.Shared.loadBlockXml = function(Blockly, workspace) {
  var blockXml = Ray.Shared.savedBlockXml_;
  var block = Blockly.Xml.domToBlock_(workspace, blockXml);
  var blockX = parseInt(blockXml.getAttribute('x'), 10);
  var blockY = parseInt(blockXml.getAttribute('y'), 10);
  if (!isNaN(blockX) && !isNaN(blockY)) {
    block.moveBy(blockX, blockY);
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

Ray.Shared.getSavedBlock = function(externalBlockName) {
  return goog.array.find(Ray.Shared.savedBlocks_, function(savedBlock) {
    return savedBlock.externalName_ === externalBlockName;
  });
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
  if(Ray.Shared.getSavedBlock(block.externalName_)) {
    throw 'Would overwrite pre-existing block!';
  }
  Ray.Shared.savedBlocks_.push(block);
  //Ray.Blocks.addToBlockDirectory(Ray.Shared.blockDirectory_, block.externalName_, block);
};

Ray.Shared.removeFromSavedBlocks = function(funId) {
  var blockIx = goog.array.findIndex(Ray.Shared.savedBlocks_, function(block) {
    return block.funId_ === funId;
  });
  if(blockIx === -1) {
    throw 'Block with funId not found in Ray.Shared.savedBlocks_';
  } else {
    goog.array.removeAt(Ray.Shared.savedBlocks_, blockIx);
  }
};

/**
 * A single key can have multiple words separated by underscores, in which case they are used in turn during the lookup
 * @param key
 * @param blockDir
 * @returns {*}
 */
Ray.Shared.lookupInBlockDirectory = function(path, blockDir) {
  return blockDir.getItems(path);
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

  // Dynamically recreate the block directory
  Ray.Shared.blockDirectory_ = Ray.Blocks.generateBlockDirectory(Ray.Shared.savedBlocks_);
  var categoryBlocks = Ray.Shared.lookupInSharedBlockDirectory_(key);
  if(categoryBlocks) {
    allBlocks = allBlocks.concat(categoryBlocks);
  }

  if(allBlocks.length === 0) {
    //throw 'Nothing in category!';
    return;
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


Ray.Shared.conflictingFunctionName = function(funName) {
  var userFunNames = goog.array.map(Ray.Shared.FunDefBlocklys, function(Blockly) {
    return Blockly.funSpec.name;
  });

  var sameName = function(name) { return funName === name; };
  return goog.array.find(userFunNames, sameName) ||
         goog.array.find(Ray.Runtime.getAllBoundIdentifiers(), sameName);

};

Ray.Shared.funBlockInstanceDB = {};


Ray.Shared.addArgToDB = function(block) {
  var funId = block.funId_;
  if(!goog.isDef(Ray.Shared.funBlockInstanceDB[funId])) {
    Ray.Shared.funBlockInstanceDB[funId] = {'app': [], 'args': {}};
  }
  var instanceDB = Ray.Shared.funBlockInstanceDB[funId];
  if(!goog.isDef(instanceDB.args[String(block.argIx_)])) {
    instanceDB.args[String(block.argIx_)] = [];
  }
  instanceDB.args[String(block.argIx_)].push(block);
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
  goog.array.remove(instanceDB.args[String(block.argIx_)], block);
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

  // Close the signature to destroy all the old function blocks
  funDefBlockly.mainWorkspace.signature_.close();

  // Creating the new function value
  var argSpec = Ray.Evaluation.createFunArgSpec(funSpec, true);
  // Creating placeholder closure!
  var value = new Ray.Runtime.Value.Closure(argSpec, null, null, funSpec.returnType);

  // Update the prototype's associated value
  funAppBlockProto.value_ = value;

  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    // I have to copy value here, since otherwise these blocks would still refer to
    // the wrong value even though the 'prototype' object has the right value.
    block.value_ = value;
  });

  // Change function name
  if(oldFunSpec.name !== funSpec.name) {
    funAppBlockProto.name_ = funSpec.name;
    Ray.Shared.updateFunAppBlockNames(funId, funSpec.name);
    Ray.Shared.updateFunTabName(funDefBlockly, funSpec.name);
    console.log('Names changed!');
  }

  // Consider arguments
  var newArgs = funSpec.args;

  var argsGained = newArgs.length > oldFunSpec.args.length;
  var changedArgCount = argsGained ? oldFunSpec.args.length : newArgs.length;

  // Change preexisting arguments
  for(var argIx = 0; argIx < changedArgCount; argIx++) {
    var newArg = newArgs[argIx];
    var argBlockProto = Ray.Shared.getArgBlockProto(funDefBlockly, argIx);
    argBlockProto.name_ = newArg.getName();
    argBlockProto.outputType_ = newArg.getType();
    Ray.Shared.updateFunArgBlockNameAndType(funId, argIx,
                                            newArg.getName(), newArg.getType());
    Ray.Shared.updateFunAppBlockSlot(funId, argIx, newArg.getType());
  }

  if(argsGained) {
    // Add arguments
    for(var argIx = changedArgCount; argIx < newArgs.length; argIx++) {
      var newArg = newArgs[argIx];
      var argBlockProto = new Ray.Blocks.UserFun.ArgumentBlock(newArg.getName(), newArg.getType(), funId, argIx);
      funDefBlockly.funArgBlockProtos.push(argBlockProto);
      Ray.Shared.addFunAppBlockSlot(funId, argIx, newArg.getType());
      // TODO: Make sure to update the function arg slots
    }
  } else {
    // Remove arguments
    for(var argIx = changedArgCount; argIx < oldFunSpec.args.length; argIx++) {
      Ray.Shared.destroyFunArgGlobally(funDefBlockly, funId, argIx);
      Ray.Shared.removeFunAppBlockSlot(funId, argIx);
      // TODO: Make sure to update the function arg slots
    }
  }


  // If I change arguments as well, I don't want to change value again
  if(!Ray.Shared.areSameTypes(oldFunSpec.returnType, funSpec.returnType)) {
    funAppBlockProto.outputType_ = funSpec.returnType;
    Ray.Shared.updateFunAppBlockOutputType(funId, funSpec.returnType);
  }

  funDefBlockly.funSpec = funSpec;
  funDefBlockly.mainWorkspace.signature_.open();

};

Ray.Shared.updateFunTabName = function(Blockly, newName) {
  Blockly.funDefTab.updateFunName(newName);
};

Ray.Shared.removeFunAppBlockSlot = function (funId, argIx) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.removeInput('P_ARG' + String(argIx));
  });
};

Ray.Shared.addFunAppBlockSlot = function(funId, argIx, type) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.appendValueWithType('P_ARG' + String(argIx), type);
  });
};

Ray.Shared.destroyFunArgGlobally = function(Blockly, funId, argIx) {
  var funArgBlocks = Ray.Shared.getFunArgBlocksFromDB(funId, argIx);
  goog.array.forEach(funArgBlocks, function(block) {
    block.dispose();
  });
  if(!goog.array.removeAt(Blockly.funArgBlockProtos, argIx)) {
    throw 'Invalid argIx!';
  }
};

Ray.Shared.destroyFunGlobally = function(Blockly, funId) {
  var argIx = Blockly.funSpec.length;
  while(--argIx >= 0) {
    Ray.Shared.destroyFunArgGlobally(funId, argIx);
  }

  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.dispose();
  });

  Blockly.funArgBlockProtos = null;
  Blockly.funAppBlockProto = null;
  Blockly.funSpec = null;
  Blockly.mainWorkspace.dispose();

  Ray.Shared.removeFromSavedBlocks(funId);
  Ray.Shared.unregisterFunDefBlockly(Blockly);
};

Ray.Shared.unregisterFunDefBlockly = function(Blockly) {
  if(!goog.array.remove(Ray.Shared.FunDefBlocklys, Blockly)) {
    throw 'Unable to unregister FunDefBlockly!';
  }
};

Ray.Shared.getArgBlockProto = function(Blockly, argIx) {
  return goog.array.find(Blockly.funArgBlockProtos, function(argBlockProto) {
    return argBlockProto.argIx_ === argIx;
  });
};

Ray.Shared.getFunAppBlocksFromDB = function(funId) {
  return Ray.Shared.getInstanceDBForFunId(funId).app;
};

Ray.Shared.getFunArgBlocksFromDB = function(funId, argIx) {
  return Ray.Shared.getInstanceDBForFunId(funId).args[String(argIx)];
};

Ray.Shared.updateFunAppBlockSlot = function(funId, argIx, type) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    var slot = block.getInput('P_ARG' + String(argIx));
    slot.setType(type);
    block.updateColour();
  });
};

Ray.Shared.updateFunAppBlockNames = function(funId, newName) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.changeBlockTitle(newName);
  });
};

Ray.Shared.updateFunAppBlockOutputType = function(funId, bodyType) {
  goog.array.forEach(Ray.Shared.getFunAppBlocksFromDB(funId), function(block) {
    block.outputConnection.clearInferredType();
    block.setOutputType(bodyType);
    block.updateColour();
  });
};

Ray.Shared.updateFunArgBlockNameAndType = function(funId, argIx, name, type) {
  goog.array.forEach(Ray.Shared.getFunArgBlocksFromDB(funId, argIx), function(block) {
    block.name_ = name;
    block.changeBlockTitle(name);
    block.outputConnection.clearInferredType();
    block.setOutputType(type);
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