
goog.provide('Ray.UI.FunTab');

goog.require('Ray.Evaluation');
goog.require('Ray.UI.Util');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.fx.dom.BgColorTransform');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.CustomButton')
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.Tab');
goog.require('goog.ui.Tooltip');
goog.require('goog.Timer');


Ray.UI.FunTab.makeTabText = function(funName) {
  return 'Define ' + funName + ' ';
};

Ray.UI.FunTab.EditButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.CustomButtonRenderer, 'edit-button');
Ray.UI.FunTab.UnfinishedButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.CustomButtonRenderer, 'unfinished-button');

Ray.UI.FunTab.ICON_TOOLTIP_CLASS_PREFIX = 'icontooltip';
Ray.UI.FunTab.getIconTooltipClass = function(key) {
  return Ray.UI.FunTab.ICON_TOOLTIP_CLASS_PREFIX + '-' + key;
};

Ray.UI.FunTab.TEST_FAILURE_COLOR = [255, 0, 0];
Ray.UI.FunTab.TEST_SUCCESS_COLOR = [0, 255, 0];
Ray.UI.FunTab.TEST_COLOR_ANIMATION_MILLIS = 500;

Ray.UI.FunTab.makeUnfinishedIconButton = function() {
  var image = goog.dom.createDom('i', { 'class': 'icon-exclamation-sign' });
  var button = new goog.ui.CustomButton(image, Ray.UI.FunTab.UnfinishedButtonRenderer);
  return button;
};

Ray.UI.FunTab.makeEditIconButton = function() {
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
  goog.base(this, funDefContent);

  this.editButton_ = Ray.UI.FunTab.makeEditIconButton();
  this.addChild(this.editButton_, true);

  var editTooltip = new goog.ui.Tooltip(this.editButton_.getContentElement(), 'Edit the function signature and description or remove this function');
  editTooltip.className = Ray.UI.FunTab.getIconTooltipClass('edit');
  this.editButton_.registerDisposable(editTooltip);

  this.workspaceId_ = this.getFunWorkspaceId();
};
goog.inherits(Ray.UI.FunTab.FunTab, goog.ui.Tab);

Ray.UI.FunTab.FunTab.prototype.workspaceId_ = null;

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
  return this.getHandler().listen(this.editButton_.getContentElement(),
                                  goog.events.EventType.CLICK, listener);
};

Ray.UI.FunTab.FunTab.prototype.updateStatus = function() {
  var incompleteMessage = Ray.Evaluation.isIncompleteFunctionDefinition(this.blockly_);
  if(!incompleteMessage) {
    if(this.unfinishedButton_) {
      this.removeChild(this.unfinishedButton_, true);
      this.unfinishedButton_.dispose();
      this.unfinishedButton_ = null;
      this.unfinishedTooltip_ = null;
    }
  } else {
    if(!this.unfinishedButton_) {
      this.unfinishedButton_ = Ray.UI.FunTab.makeUnfinishedIconButton();
      this.addChild(this.unfinishedButton_, true);
      var iconTooltip = new goog.ui.Tooltip(this.unfinishedButton_.getContentElement());
      iconTooltip.className = Ray.UI.FunTab.getIconTooltipClass('unfinished');
      this.unfinishedTooltip_ = iconTooltip;
      this.unfinishedButton_.registerDisposable(iconTooltip);
    }
    this.unfinishedTooltip_.setText(incompleteMessage);
  }
};

Ray.UI.FunTab.FunTab.prototype.animateColorFromTestResults = function (allTestsPassed) {
  if(goog.isNull(allTestsPassed)) {
    return;
  }

  var contentElement = this.getContentElement();
  var originalColor = goog.color.parse(goog.style.getComputedStyle(contentElement, 'background-color'));
  var originalColorRgb = goog.color.hexToRgb(originalColor.hex);

  var animation = new goog.fx.dom.BgColorTransform(
    this.getContentElement(),
    originalColorRgb,
    allTestsPassed ? Ray.UI.FunTab.TEST_SUCCESS_COLOR : Ray.UI.FunTab.TEST_FAILURE_COLOR,
    Ray.UI.FunTab.TEST_COLOR_ANIMATION_MILLIS);

  animation.addEventListener(goog.fx.Transition.EventType.END, function(e) {
    // If this tab is selected, then reset after the animation finishes
    if(this.isSelected()) {
      goog.style.setStyle(contentElement, 'background-color', '');
    }
    animation.dispose();
  }, false, this);

  animation.play();
};

Ray.UI.FunTab.FunTab.prototype.clearStatus = function() {
  if(this.unfinishedButton_) {
    this.removeChild(this.unfinishedButton_, true);
    this.unfinishedButton_.dispose();
    this.unfinishedButton_ = null;
  }

  goog.style.setStyle(this.getContentElement(), 'background-color', '');
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