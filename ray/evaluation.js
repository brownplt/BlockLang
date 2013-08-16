
goog.provide('Ray.Evaluation');

goog.require('Ray.Blocks');
goog.require('Ray.Generator');
goog.require('Ray.Ray');
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
  var expr = Ray.Generator.generate(block, Ray.Shared.Ray);
  return expr;
};

Ray.Evaluation.evaluateCode = function(expr) {
  var result = Ray.Shared.Ray.eval(expr);
  return result;
};

Ray.Evaluation.formatResult = function(result) {
  var text = Ray.Shared.Ray.display(result);
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
  if(topBlocks.length > 1) {
    throw 'Only one expression can be present at the top-level in a function definition workspace';
  } else {
    return topBlocks[0];
  }
};

Ray.Evaluation.compileAndRun = function(evaluateButton) {
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Evaluation.bindFunDefBlockly);
  goog.array.forEach(Ray.Shared.FunDefBlocklys, Ray.Evaluation.runTests);

  var originalContent = evaluateButton.getContent();
  var originalTooltip = evaluateButton.getTooltip();
  evaluateButton.setContent('Computing... click to stop');
  evaluateButton.setTooltip('Click to interrupt the current computation');
  goog.dom.classes.add(evaluateButton.getContentElement(), 'halt-button');
  var result = null;

  try {
    result = Ray.Evaluation.evaluateBlockAndFormat(Ray.Evaluation.getMainExpressionBlock());
  } catch(e) {
    result = e;
  }

  evaluateButton.setContent(originalContent);
  evaluateButton.getTooltip(originalTooltip);
  goog.dom.classes.remove(evaluateButton.getContentElement(), 'halt-button');
  return result;
};

/**
 *
 * @param r
 * @param funSpec
 * @param opt_asValue
 */
Ray.Evaluation.createFunArgSpec = function(r, funSpec, opt_asValue) {
  var asValue = goog.isDef(opt_asValue) ? opt_asValue : false;
  var argTypes = goog.array.map(funSpec.args, function(a) { return a.getType(); });
  var argNames = goog.array.map(funSpec.args, function(a)  {return a.getName(); });

  var argsType = new Ray.Types.ArgumentsType(
    new Ray.Types.ListOfTypes(argTypes), null);

  return asValue ?
         new r.Value.ArgumentSpec(argNames, {}, null, argsType) :
         new r.Expr.ArgumentSpec(argNames, {}, null, argsType);
};



Ray.Evaluation.bindFunDefBlockly = function(Blockly) {
  var r = Ray.Shared.Ray;
  var bodyBlock = Ray.Evaluation.getFunBodyBlock(Blockly);
  var body = Ray.Evaluation.blockToCode(bodyBlock);
  var argSpec = Ray.Evaluation.createFunArgSpec(r, Blockly.funSpec, false);
  var fn = r.Expr.Lambda(argSpec, body,Blockly.funSpec.returnType);
  r.bindTopLevel(Blockly.funSpec.name, fn);
};

Ray.Evaluation.runTests = function(Blockly) {
  var testBlocks = Ray.Evaluation.getTests(Blockly);
  var testResults = goog.array.map(testBlocks, Ray.Evaluation.runTest);
  return testResults;
};

/**
 * Returns true if the test passes, false if anything goes wrong
 * @param exampleBlock
 */
Ray.Evaluation.runTest = function(exampleBlock) {
  var exprBlock = exampleBlock.getInputTargetBlock(Ray.Blocks.EXAMPLE_BLOCK_EXPR_INPUT);
  if(!exprBlock || Ray.Evaluation.hasHoles(exprBlock)) {
    return false;
  }
  var expr = Ray.Evaluation.blockToCode(exprBlock);
  var exprValue = Ray.Shared.Ray.eval(expr);
  var resultBlock = exampleBlock.getInputTargetBlock(Ray.Blocks.EXAMPLE_BLOCK_RESULT_INPUT);
  if(!resultBlock || Ray.Evaluation.hasHoles(resultBlock)) {
    return false;
  }
  var result = Ray.Evaluation.blockToCode(resultBlock);
  var resultValue = Ray.Shared.Ray.eval(result);
  var testPassed = Ray.Shared.Ray.equals(exprValue, resultValue);
  console.log("Test " + (testPassed ? "passed" : "failed") + "!");
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
