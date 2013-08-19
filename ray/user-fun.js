
goog.provide('Ray.UserFun');

goog.require('Ray.Blocks');
goog.require('Ray.Blocks.UserFun');
goog.require('Ray.Evaluation');
goog.require('Ray.Runtime');


Ray.UserFun.makeFunArgBlocks = function(args, funId) {
  return Ray.Blocks.UserFun.generateArgBlocks(args, funId);
};

Ray.UserFun.makeFunAppBlock = function(name, returnType, argSpec, funId) {
  // Leave body and envs empty here
  var value = new Ray.Runtime.Value.Closure(argSpec,
                                            null, null,
                                            returnType);
  return Ray.Blocks.UserFun.generateAppBlock(name, value, funId);
};

Ray.UserFun.makeFunAppAndArgBlocks = function(funSpec) {
  var argSpec = Ray.Evaluation.createFunArgSpec(funSpec, true);
  var argBlocks = Ray.UserFun.makeFunArgBlocks(funSpec.args, funSpec.funId);
  var appBlock = Ray.UserFun.makeFunAppBlock(funSpec.name, funSpec.returnType, argSpec, funSpec.funId);
  return { 'args': argBlocks, 'app': appBlock };
};
