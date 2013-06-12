goog.provide('Ray.Main');

goog.require('Ray.Test');
goog.require('Ray.Ray');
goog.require('Ray.Lib');
goog.require('Ray.Blocks');
goog.require('Ray.Generator');

Ray.Main.run_test = function() {
  return Ray.Test();
};

Ray.Main.create_ray = function() {
  var R = Ray.Ray();
  var lib = Ray.Lib();
  window.r = lib.initialize(new R());
  window.$ = Ray.JQuery;
  return window.r;

}

Ray.Main.create_ray_toolbox = function(r) {
  r.toolbox = Ray.Blocks.define_missing_blocks(r, {});
  return r.toolbox;
}

Ray.Main.install_generators = function(blocks) {
  Ray.Generator.install_generators(blocks);
}