
goog.provide('Ray.UI');

goog.require('Ray.UI.FunDefDialog');

goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.FlatButtonRenderer');

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

Ray.UI.addFunDefWorkspaceDom = function(function_name, container) {
  var funDefDiv = goog.dom.createDom('div', 'hidden_container');
  var funDefIFrame = goog.dom.createDom('iframe', {
    id: 'blockly_function_definition_' + function_name,
    src: "Javascript:''"});
  goog.dom.appendChild(funDefDiv, funDefIFrame);
  goog.dom.appendChild(container, funDefDiv);
  return funDefIFrame;
};

Ray.UI.addFunDefWorkspaceTab = function(funName, tabbar) {
  /*var remove_fun_button = goog.dom.createDom('span', 'remove_function_button');
   goog.style.setInlineBlock(remove_fun_button);
   goog.events.listen(remove_fun_button, goog.events.EventType.CLICK, function(e) {
   // TODO(fill in here)
   });*/
  var funDefContent = goog.dom.createDom('div', 'goog-inline-block',
                                         [goog.dom.createTextNode('Edit ' + funName + ' ')]);//,
  //remove_fun_button]);
  var funDefTab = new goog.ui.Tab(funDefContent);
  funDefTab.workspaceId_ = 'blockly_function_definition_' + funName;
  //funDefTab.remove_fun_button = remove_fun_button;
  tabbar.addChild(funDefTab, true);
  return funDefTab;
};

Ray.UI.EvaluateButtonRenderer = goog.ui.ControlRenderer.getCustomRenderer(goog.ui.FlatButtonRenderer, 'evaluate-button');
