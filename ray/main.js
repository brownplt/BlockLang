goog.require('Ray.Test');
goog.require('Ray.Ray');
goog.require('Ray.Lib');
goog.require('Ray.Blocks');

function run_test() {
  return Ray.Test();
};

function create_ray() {
  var R = Ray.Ray();
  var lib = Ray.Lib();
  window.r = lib.initialize(new R());
  window.$ = Ray.JQuery;
  return window.r;

};

function create_ray_toolbox(r) {
  r.toolbox = Ray.Blocks.define_missing_blocks(r, {});
  return r.toolbox;
}
