
goog.provide('Ray.UI');

goog.require('Ray.UI.FunDef');
goog.require('Ray.UI.FunTab');

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

Ray.UI.isDisplayedContainer = function(workspace) {
  return goog.dom.classes.has(goog.dom.getParentElement(workspace), 'container');
};

Ray.UI.mainDom = function() {
  return goog.dom.getElement('blockly_main');
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
    id: Ray.UI.Util.funDefDomId(id),
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
  var Blockly = Ray.Shared.lookupFunDefBlockly(id);

  var funDefTab = new Ray.UI.FunTab.FunTab(Blockly);
  tabbar.addChild(funDefTab, true);

  Blockly.funDefTab = funDefTab;

  funDefTab.onEdit(function(e) {
    Ray.UI.openFunDefEditor(Blockly);
  });


  return funDefTab;
};

Ray.UI.removeFunDef = function(id, funDefTab) {
  var tabbar = funDefTab.getParent();
  tabbar.removeChild(funDefTab, true);
  funDefTab.dispose();

  var funDefWorkspace = goog.dom.getElement(Ray.UI.Util.funDefDomId(id));
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
    Ray.Shared.destroyFunGlobally(Blockly, Blockly.funId);
    Ray.UI.removeFunDef(Blockly.funId, Blockly.funDefTab);
  });
  dialog.setFunSpec(Blockly.funSpec);
  dialog.setVisible(true);
};