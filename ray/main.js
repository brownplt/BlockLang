goog.provide('Ray.Main');

/**
 * Ray Imports
 */
goog.require('Ray.Blocks');
goog.require('Ray.Blocks.UserFun');
goog.require('Ray.Evaluation');
goog.require('Ray.Generator');
goog.require('Ray.Lib');
goog.require('Ray.Test');
goog.require('Ray.Types');
goog.require('Ray.UI');

goog.require('Blockly.Xml');

/**
 * Closure Library Imports
 */
goog.require('goog.dom');
goog.require('goog.object');

Ray.Main.runTest = function() {
  return Ray.Test();
};

Ray.Main.initializeLibrary = function() {
  Ray.Lib.initialize();
};

Ray.Main.blockToWorkspaceXml = function(blockName, block) {
  var block_instance = new Ray.Main.Block(blockName, block, false);
  var xml = goog.dom.createDom('xml');
  var element = Blockly.Xml.blockToDom_(block_instance);
  element.setAttribute('x', 0);
  element.setAttribute('y', 0);
  xml.appendChild(element);
  return xml;
};

Ray.Main.blocksToXml = function(blockNames) {
  var toXml = function(blockName) {
    return '<block type="' + blockName+ '"></block>';
  };
  return goog.array.map(blockNames, toXml).join('\n');
};

Ray.Main.createBlocks = function() {
  var blocks = Ray.Blocks.generateAllBlocks();
  return blocks;
};

Ray.Main.atomicTypeToTypeInstance = function(typeName) {
  var type = Ray.Types.getAtomicType(typeName);
  return new type();
};

Ray.Main.getFunBlockName = function(name) {
  return Ray.Blocks.blockName(name);
};
Ray.Main.getFunBlock = function(name, blocks) {
  return blocks[Ray.Blocks.blockName(name)];
};

Ray.Main.setupLanguage = function(Blockly, blocks) {
  Blockly.Language = goog.object.clone(blocks);
};

Ray.Main.setupToolbox = function(Blockly, blocks) {
  Blockly.__toolbox__ = Ray.Blocks.generateToolbox(blocks);
};

Ray.Main.Block = function(block_name, block, editable) {
  this.outputConnection = null;
  this.nextConnection = null;
  this.previousConnection = null;
  this.inputList = [];
  this.inputsInline = true;
  this.rendered = false;
  this.collapsed = false;
  this.disabled = false;
  this.editable = editable;
  this.deletable = editable;
  this.tooltip = '';
  this.contextMenu = true;

  this.parentBlock_ = null;
  this.childBlocks_ = [];

  this.isInFlyout = false;
  this.workspace = null;
  this.type = block_name;
  goog.mixin(this, block);

  // Call an initialization function, if it exists.
  if (goog.isFunction(this.init)) {
    this.init();
  }
};
