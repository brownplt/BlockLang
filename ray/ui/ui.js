
goog.provide('Ray.UI');

goog.require('Ray.UI.FunDef');

goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.Button');
goog.require('goog.ui.LinkButtonRenderer');

Ray.UI.VISIBLE_CONTAINER_CLASS = "container";
Ray.UI.HIDDEN_CONTAINER_CLASS = "hidden_container";


Ray.UI.switchDisplayedWorkspace = function(from, to) {
  goog.dom.classes.swap(goog.dom.getParentElement(from),
                        Ray.UI.VISIBLE_CONTAINER_CLASS,
                        Ray.UI.HIDDEN_CONTAINER_CLASS);
  goog.dom.classes.swap(goog.dom.getParentElement(to),
                        Ray.UI.HIDDEN_CONTAINER_CLASS,
                        Ray.UI.VISIBLE_CONTAINER_CLASS);
};

Ray.UI.showWorkspaceForTab = function(tab, workspace_content) {
  var currWorkspaceId = tab.workspaceId_;
  var containers = goog.dom.getChildren(workspace_content);
  goog.array.forEach(containers, function(container) {
    var workspace = goog.dom.getFirstElementChild(container);
    if(workspace.id === currWorkspaceId) {
      goog.dom.classes.swap(container, Ray.UI.HIDDEN_CONTAINER_CLASS, Ray.UI.VISIBLE_CONTAINER_CLASS);
    } else {
      goog.dom.classes.swap(container, Ray.UI.VISIBLE_CONTAINER_CLASS, Ray.UI.HIDDEN_CONTAINER_CLASS);
    }
  });
};

Ray.UI.addFunDefWorkspaceDom = function(id, container) {
  var funDefDiv = goog.dom.createDom('div', 'hidden_container');
  var funDefIFrame = goog.dom.createDom('iframe', {
    id: 'blockly_function_definition_' + String(id),
    src: "Javascript:''"});
  goog.dom.appendChild(funDefDiv, funDefIFrame);
  goog.dom.appendChild(container, funDefDiv);
  return funDefIFrame;
};

Ray.UI.funDefCount_ = 0;
Ray.UI.getFunId = function() {
  return Ray.UI.funDefCount_++;
};


Ray.UI.addFunDefWorkspaceTab = function(id, funName, tabbar) {
  var funDefContent = goog.dom.createDom('div', 'goog-inline-block',
                                         [goog.dom.createTextNode('Define ' + funName + ' ')]);
  var button = Ray.UI.makeEditButton();
  var funDefTab = new goog.ui.Tab(funDefContent);

  funDefTab.addChild(button, true);
  funDefTab.workspaceId_ = 'blockly_function_definition_' + String(id);
  tabbar.addChild(funDefTab, true);

  goog.events.listen(button.getElement(), goog.events.EventType.CLICK, function(e) {
    console.log('hello');
    var Blockly = Ray.Shared.lookupFunDefBlockly(id);
    Ray.UI.openFunDefEditor(Blockly);
  });
  return funDefTab;
};

Ray.UI.openFunDefEditor = function(Blockly) {
  var dialog = Ray.UI.dialog;
  dialog.asEdit();
  dialog.onApplyChanges(function(e) { console.log('\'Apply changes\' clicked!'); });
  dialog.onDelete(function(e) { console.log('\'Delete\' clicked!'); });
  dialog.setFunSpec(Blockly.funSpec);
  dialog.setVisible(true);
};


Ray.UI.makeEditButton = function() {
  var image = goog.dom.createDom('img', {'src': '../../iconic/raster/cyan/pen_alt_fill_12x12.png'});
  var button = new goog.ui.CustomButton(image, Ray.UI.EditButtonRenderer);
  return button;
};

Ray.UI.EvaluateButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.FlatButtonRenderer, 'evaluate-button');
Ray.UI.EditButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.CustomButtonRenderer, 'edit-button');