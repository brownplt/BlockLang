
goog.provide('Ray.UI.RunButton');

goog.require('Ray.Evaluation');
goog.require('Ray.UI.Util');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.Button');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.FlatButtonRenderer');

Ray.UI.RunButton = function(div) {
  goog.base(this, undefined, Ray.UI.RunButton.EvaluateButtonRenderer);
  this.decorate(div);
  this.setContent(Ray.UI.Util.GO_BUTTON_MAIN_WORKSPACE_TEXT);
  this.haltMode_ = false;

  this.handler = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler);
  this.handler.listen(Ray.UI.tabBar, goog.ui.Component.EventType.SELECT, function(e) {
    var tab = e.target;
    // Remove old listener
    if(this.changeListener_) {
      this.watchedTab_.Blockly.removeChangeListener(this.changeListener_);
    }
    // Create a new listener
    if(Ray.UI.Util.isFunDefTab(tab)) {
      this.setFunTabText();
      this.watchedTab_ = tab;
      this.changeListener_ = tab.Blockly.addChangeListener(goog.bind(this.checkValidFunDef, this));
    } else {
      this.setMainWorkspaceText();
      this.watchedTab_ = tab;
      this.changeListener_ = tab.Blockly.addChangeListener(goog.bind(this.checkValidMainWorkspace, this));
    }
  });

};
goog.inherits(Ray.UI.RunButton, goog.ui.Button);

Ray.UI.RunButton.prototype.changeListener_ = null;
Ray.UI.RunButton.prototype.watchedTab_ = null;

Ray.UI.RunButton.EvaluateButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(
  goog.ui.FlatButtonRenderer,
  'run-button');

Ray.UI.RunButton.prototype.watchMainWorkspace = function(tab) {
  this.watchedTab_ = tab;
  this.changeListener_ = tab.Blockly.addChangeListener(goog.bind(this.checkValidMainWorkspace, this));
  this.checkValidMainWorkspace();
};

Ray.UI.RunButton.prototype.checkValidFunDef = function() {
  if(Ray.Evaluation.isIncompleteFunctionDefinition(Ray.UI.currentTab.Blockly)) {
    this.setEnabled(false);
    // this.setTooltip ...
  } else {
    this.setEnabled(true);
    // this.setTooltip ...
  }
};

Ray.UI.RunButton.prototype.checkValidMainWorkspace = function() {
  if(Ray.Evaluation.hasSingleMainExpressionBlock()) {
    this.setEnabled(true);
    // this.setTooltip ...
  } else {
    this.setEnabled(false);
    // this.setTooltip ...
  }
};

Ray.UI.RunButton.prototype.setFunTabText = function() {
  this.setContent(Ray.UI.Util.GO_BUTTON_FUN_TAB_TEXT);
};

Ray.UI.RunButton.prototype.setMainWorkspaceText = function() {
  this.setContent(Ray.UI.Util.GO_BUTTON_MAIN_WORKSPACE_TEXT);
};

Ray.UI.RunButton.prototype.enterHaltMode = function() {
  this.oldContent_ = this.getContent();
  this.oldTooltip_ = this.getTooltip();
  this.setContent(Ray.UI.Util.HALT_BUTTON_TEXT);
  this.setTooltip(Ray.UI.Util.HALT_BUTTON_TOOLTIP);
  goog.dom.classes.add(this.getContentElement(), Ray.UI.Util.HALT_BUTTON_CLASS);
  this.haltMode_ = true;
};

Ray.UI.RunButton.prototype.exitHaltMode = function() {
  if(!this.haltMode_) {
    throw 'unmatched call to exitHaltMode!';
  }
  this.setContent(this.oldContent_);
  this.setTooltip(this.oldTooltip_);
  this.oldContent_ = null;
  this.oldTooltip_ = null;
  goog.dom.classes.remove(this.getContentElement(), Ray.UI.Util.HALT_BUTTON_CLASS);
  this.haltMode_ = false;
};