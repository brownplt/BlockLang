
goog.provide('Ray.UI.Util');

goog.require('goog.dom');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.CustomButtonRenderer');

Ray.UI.Util.FUN_DEF_DOM_PREFIX = "blockly_function_definition_";

Ray.UI.Util.funDefDomId = function(id) {
  return Ray.UI.Util.FUN_DEF_DOM_PREFIX + String(id);
};



// Strings needed for header buttons in the UI

Ray.UI.Util.GO_BUTTON_MAIN_WORKSPACE_TEXT = "Run program in main workspace";
Ray.UI.Util.GO_BUTTON_FUN_TAB_TEXT = "Run function tests";

Ray.UI.Util.HALT_BUTTON_TEXT = "Computing... click to stop";
Ray.UI.Util.HALT_BUTTON_TOOLTIP = "Click to interrupt the current computation";
Ray.UI.Util.HALT_BUTTON_CLASS = 'halt-button';

Ray.UI.Util.CREATE_FUN_BUTTON_TEXT = "Create a new function";

Ray.UI.Util.DIRECTORY_PREFIX = "ray/ui/";

Ray.UI.Util.MAIN_BLOCKLY_ID = "blockly_main";
Ray.UI.Util.FUN_DEF_BLOCKLY_ID = "blockly_function_definition";
Ray.UI.Util.funDefBlockly = function() {
  return goog.dom.getElement(Ray.UI.Util.FUN_DEF_BLOCKLY_ID);
};
Ray.UI.Util.mainBlockly = function () {
  return goog.dom.getElement(Ray.UI.Util.MAIN_BLOCKLY_ID);
};