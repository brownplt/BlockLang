
goog.provide('Ray.UI.FunTab');

goog.require('Ray.Evaluation');
goog.require('Ray.UI.Util');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Tab');


Ray.UI.FunTab.makeTabText = function(funName) {
  return 'Define ' + funName + ' ';
};

Ray.UI.FunTab.EditButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.CustomButtonRenderer, 'edit-button');

Ray.UI.FunTab.makeEditButton = function() {
  var image = goog.dom.createDom('img', {'src': '../../iconic/raster/cyan/pen_alt_fill_12x12.png'});
  var button = new goog.ui.CustomButton(image, Ray.UI.FunTab.EditButtonRenderer);
  return button;
};

Ray.UI.FunTab.FunTab = function(Blockly) {
  this.blockly_ = Blockly;
  var funName = this.getFunName();
  this.nameSpan_  = goog.dom.createDom('span', {},
                                       [goog.dom.createTextNode('Define ' + funName + ' ')]);
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

//Ray.UI.FunTab.FunTab.

Ray.UI.FunTab.FunTab.prototype.updateName = function() {
  goog.dom.setTextContent(this.nameSpan_,
                          Ray.UI.FunTab.makeTabText(this.getFunName()));
};

Ray.UI.FunTab.FunTab.prototype.onEdit = function(listener) {
  return this.getHandler().listen(this.button_.getContentElement(),
                                  goog.events.EventType.CLICK, listener);
};

Ray.UI.FunTab.FunTab.prototype.updateIcons = function() {
  if(this.unfinishedIcon_) {
    this.removeChild(this.unfinishedIcon_, true);
  }
};