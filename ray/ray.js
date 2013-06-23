/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('Ray.Ray');

goog.require('Ray.Kernel');
goog.require('Ray.RayNumbers');

Ray.Ray = function() {
  var ray_w_numbers = Ray.RayNumbers(Ray.Kernel());
  return ray_w_numbers;
};
