/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('ray.ray');

goog.require('ray.kernel');
goog.require('ray.ray_numbers');

ray.ray = function() {
  return ray.ray_numbers(ray.kernel());
};
