goog.require('ray.test');
goog.require('ray.ray');
goog.require('ray.lib');

function run_test() {
  return ray.test();
};

function create_ray() {
  var R = ray.ray();
  var lib = ray.lib();
  window.r = lib.initialize(new R());
  window.$ = ray.jquery;
  return window.r;

};
