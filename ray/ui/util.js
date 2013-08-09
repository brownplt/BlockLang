
goog.provide('Ray.UI.Util');

goog.require('goog.dom');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.CustomButtonRenderer');

Ray.UI.Util.FUN_DEF_DOM_PREFIX = "blockly_function_definition_";

Ray.UI.Util.funDefDomId = function(id) {
  return Ray.UI.Util.FUN_DEF_DOM_PREFIX + String(id);
};

Ray.UI.Util.EvaluateButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.FlatButtonRenderer, 'evaluate-button');


