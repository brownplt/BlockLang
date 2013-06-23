goog.provide('Ray.Main');

/**
 * Ray Imports
 */
goog.require('Ray.Blocks');
goog.require('Ray.Generator');
goog.require('Ray.Lib');
goog.require('Ray.Ray');
goog.require('Ray.Test');
goog.require('Ray.UI');

/**
 * Closure Library Imports
 */
goog.require('goog.dom');

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

/**
 *
 * @param iframe
 * @param blocks
 */
Ray.Main.load_blockly = function(iframe, blocks) {
  Ray.Main.iframe = iframe;
  Ray.Main.blockly_deps_loaded = function() {
    var blockly = iframe.contentWindow.Blockly;
    Ray.Main.setup_language(blockly, blocks);
    Ray.Main.setup_toolbox(blockly, blocks);
    Ray.Main.setup_generators(blockly, blocks);
    blockly.inject(iframe.contentDocument.body,
                   {path: '../../blockly/', toolbox: blockly.__toolbox__});
  };
  goog.dom.setProperties(iframe, {src: 'ui/loader.html'});
};

Ray.Main.create_ray_blocks = function(r) {
  var blocks = Ray.Blocks.generate_all_blocks(r, {});
  return blocks;
};

Ray.Main.add_arg_blocks = function(r, args, blocks) {
  var blocks_clone = goog.object.clone(blocks);
  var blocks_w_args = Ray.Blocks.define_arg_blocks(r, blocks_clone, args);
  return blocks_w_args;
};

Ray.Main.setup_language = function(Blockly, blocks) {
  Blockly.Language = blocks;
};

Ray.Main.setup_toolbox = function(Blockly, blocks) {
  Blockly.__toolbox__ = Ray.Blocks.generate_toolbox(blocks);
};

Ray.Main.setup_generators = function(Blockly, blocks) {
  var generator = Ray.Generator(Blockly);
  generator.install_generators(generator.make_generators(blocks));
};