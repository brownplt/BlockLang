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

Ray.Main.load_blockly = function(iframe, blocks, initial_blocks) {
  window.__blocks__ = blocks;
  window.__initial_blocks__ = initial_blocks || null;
  goog.dom.setProperties(iframe, {src: 'ui/loader.html'});
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

Ray.Main.add_function_creation_blocks = function(r,  blocks, function_spec) {
  var p_args = function_spec.args;
  var return_type_name = function_spec.return_type;
  var return_type = Ray.Types.get_atomic_type(return_type_name);
  var return_type_instance = new return_type();
  var arg_types = goog.array.map(function_spec.args, function(a) { return a.type; });
  var arg_names = goog.array.map(function_spec.args, function(a)  {return a.name; });
  var arguments_type = new Ray.Types.ArgumentType(
    new Ray.Types.ListOfTypes(goog.array.map(arg_types,
                                           Ray.Main.atomic_type_to_type_instance)));
  var arg_spec = new r.Value.ArgumentSpec(arg_names, {}, null, arguments_type);
  var f_value = new r.Value.Closure(arg_spec,
                                    null,
                                    null,
                                    return_type_instance);
  var blocks_clone = goog.object.clone(blocks);
  Ray.Blocks.define_arg_blocks(r, blocks_clone, function_spec.args);
  Ray.Blocks.define_function_def_block(r, blocks_clone,
                                       function_spec.name,
                                       function_spec.desc,
                                       function_spec.return_type);
  Ray.Blocks.generate_block(r, function_spec.name, f_value, blocks_clone);
  return blocks_clone;
};

Ray.Main.get_function_definition_block_name = function(name) {
  return Ray.Blocks.function_def_block_name(name);
};
Ray.Main.get_function_definition_block = function(name, blocks) {
  return blocks[Ray.Blocks.function_def_block_name(name)];
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