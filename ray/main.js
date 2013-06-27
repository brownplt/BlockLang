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

Ray.Main.MAIN_BLOCKLY_ID = "blockly_main";
Ray.Main.FUNCTION_DEFINITION_BLOCKLY_ID = "blockly_function_definition";
Ray.Main.function_definition_blockly = function() {
  return goog.dom.getElement(Ray.Main.FUNCTION_DEFINITION_BLOCKLY_ID);
};
Ray.Main.main_blockly = function() {
  return goog.dom.getElement(Ray.Main.MAIN_BLOCKLY_ID);
}
Ray.Main.initialize_main_blockly_dom = function() {
  goog.dom.appendChild(document.body,
                  goog.dom.createDom('div', Ray.UI.VISIBLE_CONTAINER_CLASS,
                                     goog.dom.createDom('iframe', {
                                       id: Ray.Main.MAIN_BLOCKLY_ID,
                                       src: "Javascript:''"})));
};
Ray.Main.initialize_function_definition_blockly_dom = function() {
  goog.dom.appendChild(document.body,
                       goog.dom.createDom('div', Ray.UI.HIDDEN_CONTAINER_CLASS,
                                          goog.dom.createDom('iframe', {
                                            id: Ray.Main.FUNCTION_DEFINITION_BLOCKLY_ID,
                                            src: "Javascript:''"})));
};

Ray.Main.run_test = function() {
  return Ray.Test();
};

Ray.Main.create_ray = function() {
  var R = Ray.Ray();
  var lib = Ray.Lib();
  var r = lib.initialize(new R());
  window.$ = Ray.JQuery;
  return r;
};

Ray.Main.load_main_blockly = function(iframe) {
  goog.dom.setProperties(iframe, {src: 'main_blockly.html'});
};

/**
 *
 * @param {HTMLIFrameElement} iframe
 * @param {?Object=} arg_blocks
 * @param {?string=} func_name
 * @param {?Array.<string>=} initial_blocks
 */
Ray.Main.load_func_def_blockly = function(iframe, arg_blocks, func_name, initial_blocks) {
  var func_def = {
    args: arg_blocks,
    func_name: func_name,
    initial_blocks: initial_blocks
  };
  window.__function_definition_info__ = func_def;
  goog.dom.setProperties(iframe, {src: 'func_def_blockly.html'});
};

Ray.Main.block_to_workspace_xml = function(block_name, block) {
  var block_instance = new Ray.Main.Block(block_name, block, false);
  var xml = goog.dom.createDom('xml');
  var element = Blockly.Xml.blockToDom_(block_instance);
  element.setAttribute('x', 0);
  element.setAttribute('y', 0);
  xml.appendChild(element);
  return xml;
};

Ray.Main.create_ray_blocks = function(r) {
  var blocks = Ray.Blocks.generate_all_blocks(r, {});
  return blocks;
};

Ray.Main.atomic_type_to_type_instance = function(type_name) {
  var type = Ray.Types.get_atomic_type(type_name);
  return new type();
};

Ray.Main.make_function_argument_blocks = function(r, function_spec) {
  return Ray.Blocks.define_arg_blocks(r, {}, function_spec.args);
};

Ray.Main.make_function_application_block = function(r, function_spec) {
  var p_args = function_spec.args;
  var return_type_name = function_spec.return_type;
  var return_type = Ray.Types.get_atomic_type(return_type_name);
  var return_type_instance = new return_type();
  var arg_types = goog.array.map(function_spec.args, function(a) { return a.getType(); });
  var arg_names = goog.array.map(function_spec.args, function(a)  {return a.getName(); });
  var arguments_type = new Ray.Types.ArgumentType(
    new Ray.Types.ListOfTypes(goog.array.map(arg_types,
                                             Ray.Main.atomic_type_to_type_instance)));
  var arg_spec = new r.Value.ArgumentSpec(arg_names, {}, null, arguments_type);
  var f_value = new r.Value.Closure(arg_spec,
                                    null,
                                    null,
                                    return_type_instance);
  return Ray.Blocks.generate_block(r, function_spec.name, f_value, {}, true);
};

Ray.Main.get_function_body_expression = function(Blockly) {
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  if(topBlocks.length > 1) {
    throw 'Only one expression can be present at the top-level in a function definition workspace';
  } else {
    return topBlocks[0];
  }
};

Ray.Main.get_function_block_name = function(name) {
  return Ray.Blocks.block_name(name);
};
Ray.Main.get_function_block = function(name, blocks) {
  return blocks[Ray.Blocks.block_name(name)];
};

Ray.Main.setup_language = function(Blockly, blocks) {
  Blockly.Language = goog.object.clone(blocks);
};

Ray.Main.setup_toolbox = function(Blockly, blocks) {
  Blockly.__toolbox__ = Ray.Blocks.generate_toolbox(blocks);
};

Ray.Main.Block = function(block_name, block, editable) {
  this.outputConnection = null;
  this.nextConnection = null;
  this.previousConnection = null;
  this.inputList = [];
  this.inputsInline = false;
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