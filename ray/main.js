goog.provide('Ray.Main');

goog.require('Ray.Test');
goog.require('Ray.Ray');
goog.require('Ray.Lib');
goog.require('Ray.Blocks');
goog.require('Ray.Generator');
goog.require('goog.dom');

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
 * @param toolbox
 * @param language
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

Ray.Main.inject_blockly = function(Blockly, elem, toolbox, language) {
  Blockly.Language = language;
}

Ray.Main.create_ray_blocks = function(r) {
  var blocks = Ray.Blocks.generate_all_blocks(r, {});
  return blocks;
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