goog.provide('Ray.Main');

/**
 * Ray Imports
 */
goog.require('Ray.Blocks');
goog.require('Ray.Generator');
goog.require('Ray.Lib');
goog.require('Ray.Ray');
goog.require('Ray.Test');
goog.require('Ray.Types');
goog.require('Ray.UI');

goog.require('Blockly.Xml');

/**
 * Closure Library Imports
 */
goog.require('goog.dom');
goog.require('goog.object');

Ray.Main.DIRECTORY_PREFIX = "ray/ui/";

Ray.Main.MAIN_BLOCKLY_ID = "blockly_main";
Ray.Main.FUN_DEF_BLOCKLY_ID = "blockly_function_definition";
Ray.Main.funDefBlockly = function() {
  return goog.dom.getElement(Ray.Main.FUN_DEF_BLOCKLY_ID);
};
Ray.Main.mainBlockly = function () {
  return goog.dom.getElement(Ray.Main.MAIN_BLOCKLY_ID);
};
Ray.Main.initializeMainBlocklyDom = function() {
  goog.dom.appendChild(document.body,
                  goog.dom.createDom('div', Ray.UI.VISIBLE_CONTAINER_CLASS,
                                     goog.dom.createDom('iframe', {
                                       id: Ray.Main.MAIN_BLOCKLY_ID,
                                       src: "Javascript:''"})));
};
Ray.Main.initializeFunctionDefinitionBlocklyDom = function() {
  goog.dom.appendChild(document.body,
                       goog.dom.createDom('div', Ray.UI.HIDDEN_CONTAINER_CLASS,
                                          goog.dom.createDom('iframe', {
                                            id: Ray.Main.FUN_DEF_BLOCKLY_ID,
                                            src: "Javascript:''"})));
};

Ray.Main.runTest = function() {
  return Ray.Test();
};

Ray.Main.createRay = function() {
  var R = Ray.R;
  var lib = Ray.Lib;
  var r = lib.initialize(R);
  window.$ = Ray.JQuery;
  return r;
};

Ray.Main.loadMainBlockly = function(iframe) {
  goog.dom.setProperties(iframe, {src: Ray.Main.DIRECTORY_PREFIX + 'main_blockly.html'});
};

/**
 *
 * @param {HTMLIFrameElement} iframe
 * @param {?Object=} argBlocks
 * @param {?string=} funName
 * @param {?Array.<string>=} initialBlocks
 * @param {Ray.Types} returnType
 */
Ray.Main.loadFunDefBlockly = function(iframe, argBlocks, funName, funSpec, initialBlocks, returnType) {
  var funDef = {
    args: argBlocks,
    funName: funName,
    funSpec: funSpec,
    initialBlocks: initialBlocks,
    returnType: returnType
  };
  window.funDefInfo_ = funDef;
  goog.dom.setProperties(iframe, {src: Ray.Main.DIRECTORY_PREFIX + 'fun_def_blockly.html'});
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

Ray.Main.createRayBlocks = function(r) {
  var blocks = Ray.Blocks.generateAllBlocks(r, {});
  return blocks;
};

Ray.Main.atomicTypeToTypeInstance = function(typeName) {
  var type = Ray.Types.getAtomicType(typeName);
  return new type();
};

Ray.Main.makeFunArgBlocks = function(r, blockDir, funParts) {
  return Ray.Blocks.defineArgBlocks(r, blockDir, funParts.args);
};

Ray.Main.makeFunAppBlock = function(r, blockDir, funParts) {
  var return_type_instance = funParts.returnType;
  var argSpec = funParts.argSpec;
  var f_value = new r.Value.Closure(argSpec,
                                    null,
                                    null,
                                    return_type_instance);
  return Ray.Blocks.generateBlock(r, funParts.name, f_value, blockDir, true);
};

/**
 *
 * @param r
 * @param funSpec
 * @param opt_asValue
 */
Ray.Main.funSpecToParts = function(r, funSpec, opt_asValue) {
  var asValue = goog.isDef(opt_asValue) ? opt_asValue : false;
  var returnTypeName = funSpec.returnType;
  var returnType = Ray.Types.getAtomicType(returnTypeName);
  var returnTypeInstance = new returnType();
  var argTypeNames = goog.array.map(funSpec.args, function(a) { return a.getType(); });
  var argTypes = goog.array.map(argTypeNames, Ray.Main.atomicTypeToTypeInstance);

  var argNames = goog.array.map(funSpec.args, function(a)  {return a.getName(); });
  var argTypesAndNames = goog.array.zip(argTypes, argNames);
  var finalArgs = goog.array.map(argTypesAndNames, function(arg_type_and_name) {
    return {
      type_: arg_type_and_name[0],
      name_: arg_type_and_name[1]
    };
  });

  var argsType = new Ray.Types.ArgumentsType(
    new Ray.Types.ListOfTypes(argTypes));
  var argSpec = asValue ?
    new r.Value.ArgumentSpec(argNames, {}, null, argsType) :
    new r.Expr.ArgumentSpec(argNames, {}, null, argsType);
  return {
    args: finalArgs,
    argSpec: argSpec,
    returnType: returnTypeInstance,
    name: funSpec.name
  };
};


Ray.Main.makeFunAppAndArgBlocks = function(r, funSpec) {
  var blockDir = {};
  var funParts = Ray.Main.funSpecToParts(r, funSpec, true);
  var argBlocks = Ray.Main.makeFunArgBlocks(r, blockDir, funParts);
  var appBlocks = Ray.Main.makeFunAppBlock(r, {}, funParts);
  var funBlockName = Ray.Main.getFunBlockName(funSpec.name);
  return [argBlocks, appBlocks, funBlockName];
};

Ray.Main.getFunBodyBlock = function(Blockly) {
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  if(topBlocks.length > 1) {
    throw 'Only one expression can be present at the top-level in a function definition workspace';
  } else {
    return topBlocks[0];
  }
};

Ray.Main.blockToCode = function(block) {
  var expr = Ray.Generator.generate(block, Ray.Shared.Ray);
  return expr;
};

Ray.Main.evaluateCode = function(expr) {
  var result = Ray.Shared.Ray.eval(expr);
  return result;
};

Ray.Main.formatResult = function(result) {
  var text = Ray.Shared.Ray.display(result);
  return text;
};

Ray.Main.evaluateBlockAndFormat = function(block) {
  var code = Ray.Main.blockToCode(block);
  var result = Ray.Main.evaluateCode(code);
  return Ray.Main.formatResult(result);
};

Ray.Main.getMainExpressionBlock = function() {
  var Blockly = Ray.Shared.MainBlockly;
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  if(topBlocks.length > 1) {
    throw 'Only one expression can be present at the top-level in a function definition workspace';
  } else {
    return topBlocks[0];
  }
};

Ray.Main.go = function() {
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Main.bindFunDefBlockly);
  return Ray.Main.evaluateBlockAndFormat(Ray.Main.getMainExpressionBlock());
};

Ray.Main.bindFunDefBlockly = function(Blockly) {
  var r = Ray.Shared.Ray;
  var body_block = Ray.Main.getFunBodyBlock(Blockly);
  var body = Ray.Main.blockToCode(body_block);
  var function_parts = Ray.Main.funSpecToParts(r, Blockly.FunSpec, false);
  var fn = r.Expr.Lambda(function_parts.argSpec, body, function_parts.returnType);
  r.bindTopLevel(Blockly.FunName, fn);
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