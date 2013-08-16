
goog.provide('Ray.UI.FunTab');

goog.require('Ray.Evaluation');
goog.require('Ray.UI.Util');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Tab');
goog.require('goog.Timer');


Ray.UI.FunTab.makeTabText = function(funName) {
  return 'Define ' + funName + ' ';
};

Ray.UI.FunTab.EditButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.CustomButtonRenderer, 'edit-button');

Ray.UI.FunTab.makeUnfinishedIconDom = function() {
  var iconDiv = goog.dom.createDom('div', { 'class': 'goog-inline-block unfinished-icon' },
                                   [goog.dom.createDom('i', { 'class': 'icon-exclamation-sign' })]);
  return iconDiv;
};

Ray.UI.FunTab.makeEditButton = function() {
  var image = goog.dom.createDom('i', { 'class': 'icon-gears' });
  var button = new goog.ui.CustomButton(image, Ray.UI.FunTab.EditButtonRenderer);
  //goog.style.setInlineBlock(button.getContentElement());
  return button;
};

Ray.UI.FunTab.FunTab = function(Blockly) {
  this.blockly_ = Blockly;
  var funName = this.getFunName();
  this.nameSpan_  = goog.dom.createDom('span', {},
                                       [goog.dom.createTextNode(Ray.UI.FunTab.makeTabText(funName))]);
  var funDefContent = goog.dom.createDom('div', 'goog-inline-block', [this.nameSpan_]);
  this.button_ = Ray.UI.FunTab.makeEditButton();
  goog.base(this, funDefContent);
  this.addChild(this.button_, true);
  this.workspaceId_ = this.getFunWorkspaceId();
};
goog.inherits(Ray.UI.FunTab.FunTab, goog.ui.Tab);

Ray.UI.FunTab.FunTab.prototype.getFunWorkspaceId = function() {
  return Ray.UI.Util.funDefDomId(this.blockly_.funId);
};

Ray.UI.FunTab.FunTab.prototype.getFunName = function() {
  return this.blockly_.funSpec.name;
};

/**
 * I pass in the newName here even though I should be able to look this up in funSpec,
 * because I call this before I've swapped the old and new funSpecs
 * @param newName
 */
Ray.UI.FunTab.FunTab.prototype.updateFunName = function(newName) {
  goog.dom.setTextContent(this.nameSpan_,
                          Ray.UI.FunTab.makeTabText(newName));
};

Ray.UI.FunTab.FunTab.prototype.onEdit = function(listener) {
  return this.getHandler().listen(this.button_.getContentElement(),
                                  goog.events.EventType.CLICK, listener);
};

Ray.UI.FunTab.FunTab.prototype.updateStatus = function() {
  if(Ray.Evaluation.isFinishedFunctionDefinition(this.blockly_)) {
    if(this.unfinishedIcon_) {
      goog.dom.removeNode(this.unfinishedIcon_);
      this.unfinishedIcon_ = null;
    }
  } else {
    if(!this.unfinishedIcon_) {
      this.unfinishedIcon_ = Ray.UI.FunTab.makeUnfinishedIconDom();
      goog.dom.appendChild(this.element_, this.unfinishedIcon_);
    }
  }
};

Ray.UI.FunTab.FunTab.prototype.clearStatus = function() {
  if(this.unfinishedIcon_) {
    goog.dom.removeNode(this.unfinishedIcon_);
    this.unfinishedIcon_ = null;
  }
};

Ray.UI.FunTab.FunTab.prototype.activate = function() {
  this.clearStatus();
  this.updateStatus();
  this.startPollingForStatus();
};

Ray.UI.FunTab.FunTab.prototype.deactivate = function() {
  this.stopPollingForStatus();
  this.clearStatus();
  this.updateStatus();
};

Ray.UI.FunTab.FunTab.prototype.startPollingForStatus = function() {
  this.timer_ = new goog.Timer(1000);
  this.timer_.addEventListener(goog.Timer.TICK, this.updateStatus, false, this);
  this.timer_.start();
};

Ray.UI.FunTab.FunTab.prototype.stopPollingForStatus = function() {
  if(!this.timer_) {
    throw 'No timer to stop!';
  }

  this.timer_.stop();
  this.timer_.dispose();
  this.timer_ = null;
}