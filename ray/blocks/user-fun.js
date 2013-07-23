goog.provide('Ray.Blocks.UserFun');

goog.require('Ray.Blocks.misc');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Inference');
goog.require('Ray.Globals');

goog.require('Blockly');

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');

var ArgumentBlock = function(name, type, funId, argIx) {
  this.helpUrl = Ray.Blocks.HELP_URL;
  this.value_ = null;
  this.name_ = name;
  this.funId_ = funId;
  this.argIx_ = argIx;
  this.externalName_ = Ray.Blocks.argBlockName(name);
  this.outputType_ = type;
  this.arguments_ = true;
  this.renderAsExpression_ = true;
  this.blockClass_ = Blocks.Argument;
  this.priority_ = Priorities.ARGUMENT;
  this.preInit_ = function() {
    this.setOutputType(this.outputType_);
    this.Blockly.Ray_.Shared.addArgToDB(this);
  };
  this.postDispose_ = function() {
    this.Blockly.Ray_.Shared.removeArgFromDB(this);
  };
  this.init = function() {
    this.makeTitleRow(this.name_);
  };
};

Ray.Blocks.UserFun.generateArgBlocks = function(args, funId) {
  var argBlocks = [];
  var ix = 0;
  goog.array.forEach(args, function(arg) {
    argBlocks.push(new ArgumentBlock(arg.getName(), arg.getType(), funId, ix++));
  });
  return argBlocks;
};

var UserFunctionBlock = function(name, value, funId) {
  this.name_ = name;
  this.externalName_ = Ray.Blocks.userFunctionBlockName(String(funId));
  this.funId_ = funId;
  this.value_ = value;
  this.outputType_ = value.bodyType;
  this.blockClass_ = Blocks.App;
  this.renderAsExpression_ = true;
  this.priority_ = value.priority_ || null;
  this.isUserFunction_ = true;
};

Ray.Blocks.UserFun.generateAppBlock = function(name, value, funId) {
  var argSpec = value.argSpec;
  // Ignoring rest and keyword arguments
  var arity = argSpec.positionalArgs.length;

  block = new UserFunctionBlock(name, value, funId);
  block.preInit_ = function() {
    this.setOutputType(this.outputType_);
    this.Blockly.Ray_.Shared.addAppToDB(this);
  };
  block.postDispose_ = function() {
    this.Blockly.Ray_.Shared.removeAppFromDB(this);
  };
  block.init = function() {
    this.makeTitleRow(name);
    for(var i = 0; i < arity; i++) {
      this.appendValueWithType(argSpec.positionalArgs[i],
                               argSpec.argsType.positionalArgTypes.list[i]);
    }
  };

  return block;
};

