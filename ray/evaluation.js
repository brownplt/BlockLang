
goog.provide('Ray.Evaluation');

goog.require('Ray.Runtime');
goog.require('Ray.Blocks');
goog.require('Ray.Generator');
goog.require('Ray.Shared');
goog.require('Ray.Types');

goog.require('goog.array');


Ray.Evaluation.getTests = function(Blockly) {
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  return goog.array.filter(topBlocks, Ray.Evaluation.isExampleBlock);
};

Ray.Evaluation.getFunBodyBlock = function(Blockly) {
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  var bodyBlocks = goog.array.filter(topBlocks, function(block) {
  return !Ray.Evaluation.isExampleBlock(block);
  });
  if(bodyBlocks.length > 1) {
    throw 'Only one expression can be present at the top-level in a function definition workspace';
  } else {
    return bodyBlocks[0];
  }
};

Ray.Evaluation.blockToCode = function(block) {
  var expr = Ray.Generator.generate(block);
  return expr;
};

Ray.Evaluation.evaluateCode = function(expr) {
  var result = Ray.Runtime.eval(expr);
  return result;
};

Ray.Evaluation.formatResult = function(result) {
  var text = Ray.Runtime.display(result);
  return text;
};

Ray.Evaluation.evaluateBlockAndFormat = function(block) {
  var code = Ray.Evaluation.blockToCode(block);
  var result = Ray.Evaluation.evaluateCode(code);
  return Ray.Evaluation.formatResult(result);
};

Ray.Evaluation.getMainExpressionBlock = function() {
  var Blockly = Ray.Shared.MainBlockly;
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  if(topBlocks.length > 1 || topBlocks.length === 0) {
    throw 'Expecting exactly one expression at the top-level';
  } else {
    return topBlocks[0];
  }
};

Ray.Evaluation.hasSingleMainExpressionBlock = function() {
  var Blockly = Ray.Shared.MainBlockly;
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  return topBlocks.length === 1;
};

Ray.Evaluation.checkAllAndEval = function(runButton) {
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Evaluation.bindFunDefBlockly);
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Evaluation.runTests);

  runButton.enterHaltMode();
  var result = null;

  try {
    result = Ray.Evaluation.evaluateBlockAndFormat(Ray.Evaluation.getMainExpressionBlock());
  } catch(e) {
    result = e;
  }

  runButton.exitHaltMode();
  return result;
};

Ray.Evaluation.checkFunTab = function(runButton, Blockly) {
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Evaluation.bindFunDefBlockly);
  runButton.enterHaltMode();
  Ray.Evaluation.runTests(Blockly);
  runButton.exitHaltMode();
};

/**
 * @param funSpec
 * @param opt_asValue
 */
Ray.Evaluation.createFunArgSpec = function(funSpec, opt_asValue) {
  var asValue = goog.isDef(opt_asValue) ? opt_asValue : false;
  var argTypes = goog.array.map(funSpec.args, function(a) { return a.getType(); });
  var argNames = goog.array.map(funSpec.args, function(a)  {return a.getName(); });

  var argsType = new Ray.Types.ArgumentsType(
    new Ray.Types.ListOfTypes(argTypes), null);

  return asValue ?
         new Ray.Runtime.Value.ArgumentSpec(argNames, {}, null, argsType) :
         new Ray.Runtime.Expr.ArgumentSpec(argNames, {}, null, argsType);
};



Ray.Evaluation.bindFunDefBlockly = function(Blockly) {
  var bodyBlock = Ray.Evaluation.getFunBodyBlock(Blockly);
  var body = Ray.Evaluation.blockToCode(bodyBlock);
  var argSpec = Ray.Evaluation.createFunArgSpec(Blockly.funSpec, false);
  var fn = Ray.Runtime.Expr.Lambda(argSpec, body,Blockly.funSpec.returnType);
  Ray.Runtime.bindTopLevel(Blockly.funSpec.name, fn);
};

Ray.Evaluation.runTests = function(Blockly) {
  Blockly.allTestsPassed = null;
  var testBlocks = Ray.Evaluation.getTests(Blockly);
  var testResults = [];
  goog.array.forEach(testBlocks, function(block) {
    var result = Ray.Evaluation.runTest(block);
    if(goog.isNull(Blockly.allTestsPassed)) {
      Blockly.allTestsPassed = result;
    } else {
      Blockly.allTestsPassed = Blockly.allTestsPassed && result;
    }
    testResults.push(result);
  });

  Blockly.funDefTab.animateColorFromTestResults(Blockly.allTestsPassed);
  return testResults;
};

/**
 * Returns true if the test passes, false if anything goes wrong
 * @param exampleBlock
 */
Ray.Evaluation.runTest = function(exampleBlock) {
  var exprBlock = exampleBlock.getExpr();
  if(!exprBlock || Ray.Evaluation.hasHoles(exprBlock)) {
    return false;
  }
  var expr = Ray.Evaluation.blockToCode(exprBlock);
  var exprValue = Ray.Runtime.eval(expr);
  var resultBlock = exampleBlock.getResult();
  if(!resultBlock || Ray.Evaluation.hasHoles(resultBlock)) {
    return false;
  }
  var result = Ray.Evaluation.blockToCode(resultBlock);
  var resultValue = Ray.Runtime.eval(result);
  var testPassed = Ray.Runtime.equals(exprValue, resultValue);
  console.log("Test " + (testPassed ? "passed" : "failed") + "!");
  exampleBlock.updateColourFromTestResult(testPassed);

  var resetColourAndClearListener = function(e) {
    console.log(e);
    this.colourHue_ = undefined;
    this.updateColour();
    this.handler.removeAll();
  };

  var allBlockEvents = [exampleBlock.Blockly.Block.EventType.SUBBLOCK_ADDED,
                        exampleBlock.Blockly.Block.EventType.SUBBLOCK_REMOVED,
                        exampleBlock.Blockly.Block.EventType.PARENT_BLOCK_CHANGED,
                        exampleBlock.Blockly.Block.EventType.BLOCK_DISPOSED];

  exampleBlock.handler.listen(Ray.Evaluation.getFunBodyBlock(exampleBlock.Blockly), allBlockEvents, resetColourAndClearListener);
  exampleBlock.handler.listen(exampleBlock, [exampleBlock.Blockly.Block.EventType.SUBBLOCK_ADDED,
                                             exampleBlock.Blockly.Block.EventType.SUBBLOCK_REMOVED], resetColourAndClearListener);
  // TODO (Have the colour cleared away if the function definition changes)
  return testPassed;
};

Ray.Evaluation.isExampleBlock = function(block) {
  return block.name_ === Ray.Blocks.EXAMPLE_BLOCK_NAME;
};

Ray.Evaluation.hasFunBodyBlock = function(Blockly) {
  var workspace = Blockly.mainWorkspace;
  var topBlocks = workspace.getTopBlocks(false);
  var potentialBodyBlocks = goog.array.filter(topBlocks, function(block) {
    return !Ray.Evaluation.isExampleBlock(block);
  });
  if(potentialBodyBlocks.length > 1 || potentialBodyBlocks.length === 0) {
    // Too many or too few blocks
    return false;
  }

  var bodyBlock = potentialBodyBlocks.shift();
  return Ray.Types.areMatchingTypes(Blockly.funSpec.returnType, bodyBlock.getOutputType());
};

Ray.Evaluation.hasHoles = function(block) {
  var uncheckedConnections = block.getConnections_(true);
  if(block.outputConnection) {
    goog.array.remove(uncheckedConnections, block.outputConnection);
  }
  while(uncheckedConnections.length > 0) {
    var conn = uncheckedConnections.shift();
    if(!conn.isConnected()) {
      return true;
    }
    var connectedBlock = conn.getConnectedBlock();
    var allSubConnections = connectedBlock.getConnections_(true);
    goog.array.remove(allSubConnections, connectedBlock.outputConnection);
    uncheckedConnections = uncheckedConnections.concat(allSubConnections);
  }
  return false;
};

/**
 * We will treat a function definition as finished if there is a single body block, of the right type, with no holes in it.
 * @param Blockly
 */
Ray.Evaluation.isIncompleteFunctionDefinition = function(Blockly) {
  if(!Ray.Evaluation.hasFunBodyBlock(Blockly)) {
    return 'There must be exactly one non-example block (of the correct type) for the function body.';
  } else if(Ray.Evaluation.hasHoles(Ray.Evaluation.getFunBodyBlock(Blockly))) {
    return 'The function body is not fully filled in yet.';
  } else {
    return false;
  }
};
