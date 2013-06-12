/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('Ray.Ray');

goog.require('Ray.Kernel');
goog.require('Ray.RayNumbers');

Ray.Ray = function() {
  return Ray.RayNumbers(Ray.Kernel());
};
