
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

Ray.UI.Util.RUN_BUTTON_MAIN_WORKSPACE_TEXT = "Check all and run program in main workspace";
Ray.UI.Util.RUN_BUTTON_MAIN_WORKSPACE_TOOLTIP = "Make sure all tests pass and run the program in the main workspace";
Ray.UI.Util.RUN_BUTTON_MAIN_WORKSPACE_DISABLED_TOOLTIP = "There must be exactly one block in the main workspace at the top level";
Ray.UI.Util.RUN_BUTTON_FUN_TAB_TEXT = "Run function tests";
Ray.UI.Util.RUN_BUTTON_FUN_TAB_TOOLTIP = "Run all of the tests for this function";
Ray.UI.Util.RUN_BUTTON_FUN_TAB_DISABLED_TOOLTIP = "Hover over the error icon in the current tab to find out what's wrong";

Ray.UI.Util.HALT_BUTTON_TEXT = "Computing... click to stop";
Ray.UI.Util.HALT_BUTTON_TOOLTIP = "Click to interrupt the current computation";
Ray.UI.Util.HALT_BUTTON_CLASS = 'halt-button';

Ray.UI.Util.CREATE_FUN_BUTTON_TEXT = "Create a new function";
Ray.UI.Util.CREATE_FUN_BUTTON_TOOLTIP = "Define a new function to use in your program";

Ray.UI.Util.DIRECTORY_PREFIX = "ray/blockly/";

Ray.UI.Util.MAIN_BLOCKLY_FILENAME = 'main_blockly.html';
Ray.UI.Util.FUN_DEF_BLOCKLY_FILENAME = 'fun_def_blockly.html';

Ray.UI.Util.READ_ONLY_BLOCKLY_FILENAME = 'read_only_blockly.html';

Ray.UI.Util.MAIN_BLOCKLY_ID = "blockly_main";
Ray.UI.Util.FUN_DEF_BLOCKLY_ID = "blockly_function_definition";
Ray.UI.Util.funDefBlockly = function() {
  return goog.dom.getElement(Ray.UI.Util.FUN_DEF_BLOCKLY_ID);
};
Ray.UI.Util.mainBlockly = function () {
  return goog.dom.getElement(Ray.UI.Util.MAIN_BLOCKLY_ID);
};

Ray.UI.Util.isMainWorkspaceOpen = function() {
  return Ray.UI.Util.isMainWorkspaceTab(Ray.UI.tabBar.getSelectedTab());
};

Ray.UI.Util.isMainWorkspaceTab = function(tab) {
  return Ray.UI.mainBlocklyTabId === tab.workspaceId_;
};

Ray.UI.Util.isFunDefTab = function(tab) {
  return Ray.UI.mainBlocklyTabId !== tab.workspaceId_;
};

Ray.UI.Util.loadBlocklyAsObjField = function(obj, iframe) {
  var setField = function(Blockly) {
    obj.Blockly_ = Blockly;
    console.log('Blockly loaded');
    console.log(obj);
  };

  Ray.UI.Util.loadBlocklyIFrameThenCall(iframe, setField);
};

Ray.UI.Util.loadBlocklyIFrameThenCall = function(iframe, callback) {
  window._callback = callback;
  goog.dom.setProperties(iframe, {'src': Ray.UI.Util.DIRECTORY_PREFIX + Ray.UI.Util.READ_ONLY_BLOCKLY_FILENAME});
};
