
goog.provide('Ray.UI');

goog.require('Ray.UI.FunDef');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.Button');
goog.require('goog.ui.LinkButtonRenderer');

Ray.UI.VISIBLE_CONTAINER_CLASS = "container";
Ray.UI.HIDDEN_CONTAINER_CLASS = "hidden_container";


Ray.UI.functionDefinitionDom = function(id) {
  var iframe = goog.dom.getElementById('blockly_function_definition_' + String(id));
};

Ray.UI.isDisplayedContainer = function(workspace) {
  return goog.dom.classes.has(goog.dom.getParentElement(workspace), 'container');
};

Ray.UI.mainDom = function() {
  return goog.dom.getElementById('blockly_main');
}

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
  var funDefTabNameSpan = goog.dom.createDom('span', {},
                                             [goog.dom.createTextNode('Define ' + funName + ' ')]);
  var funDefContent = goog.dom.createDom('div', 'goog-inline-block',
                                         [funDefTabNameSpan]);
  var button = Ray.UI.makeEditButton();
  var funDefTab = new goog.ui.Tab(funDefContent);

  funDefTab.nameSpan_ = funDefTabNameSpan;

  funDefTab.addChild(button, true);
  funDefTab.workspaceId_ = 'blockly_function_definition_' + String(id);
  tabbar.addChild(funDefTab, true);

  var Blockly = Ray.Shared.lookupFunDefBlockly(id);
  Blockly.funDefTab = funDefTab;

  goog.events.listen(button.getElement(), goog.events.EventType.CLICK, function(e) {
    console.log('hello');
    Ray.UI.openFunDefEditor(Blockly);
  });
  return funDefTab;
};

Ray.UI.removeFunDef = function(id, funDefTab) {
  var tabbar = funDefTab.getParent();
  tabbar.removeChild(funDefTab, true);
  funDefTab.dispose();

  var funDefWorkspace = Ray.UI.functionDefinitionDom(id);
  if(Ray.UI.isDisplayedContainer(funDefWorkspace)) {
    Ray.UI.switchDisplayedWorkspace(funDefWorkspace, Ray.UI.mainDom());
  }

  goog.dom.removeNode(goog.dom.getParentElement(funDefWorkspace));

};

Ray.UI.openFunDefEditor = function(Blockly) {
  var dialog = Ray.UI.dialog;
  dialog.asEdit();
  dialog.onApplyChanges(function(e) {
    console.log('\'Apply changes\' clicked!');
    var funSpec = this.getFunSpec();
    Ray.Shared.applyFunDefChanges(Blockly.funId, funSpec);
  });
  dialog.onDelete(function(e) {
    console.log('\'Delete\' clicked!');
    Ray.UI.removeFunDef(Blockly.funId, Blockly.funDefTab);
  });
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