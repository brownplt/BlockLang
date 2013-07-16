goog.provide('Ray.UI');

goog.require('Ray.Types');
goog.require('Blockly');

goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Container');
goog.require('goog.ui.ContainerRenderer');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.Control');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Dialog.ButtonSet');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.FlatMenuButtonRenderer');
goog.require('goog.ui.Option');
goog.require('goog.ui.Select');
goog.require('goog.ui.Tab');

Ray.UI.VISIBLE_CONTAINER_CLASS = "container";
Ray.UI.HIDDEN_CONTAINER_CLASS = "hidden_container";

/** @typedef {{type:Ray.Types.*, name: string}} */
var Arg = function(name, type) {
  this.name_ = name || 'x';
  this.type_ = type || null;
};
Arg.prototype.getName = function() {
  return this.name_;
};
Arg.prototype.getType = function() {
  return this.type_;
}
Arg.prototype.setName = function(name) {
  this.name_ = name;
};
Arg.prototype.setType = function(type) {
  this.type_ = type;
};

var ArgList = function(args) {
  /**
   * @type {Array.<Ray.FuncDefDialog.Arg>}
   * @private
   */
  this.args_ = args ? goog.array.clone(args) : [];
};
ArgList.EventType = {
  REMOVE_ARG_EVENT: 'REMOVE_ARG'
};
ArgList.prototype.getArgs = function() {
  return goog.array.clone(this.args_);
};
ArgList.prototype.removeArgAt = function(index) {
  if(this.args_.length > index && index >= 0) {
    var removed = this.args_.splice(index, 1);
    return removed[0]
  } else {
    throw "Index out of bounds!";
  }
};
ArgList.prototype.addArg = function(arg) {
  this.args_.push(arg);
};

var ArgUI = function(arg) {
  goog.base(this);
  this.arg_ = arg;
};
goog.inherits(ArgUI, goog.ui.Component);
ArgUI.prototype.getArg = function() {
  return this.arg_;
};
ArgUI.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var div = this.getContentElement();
  goog.dom.classes.add(div, 'arg-control');

  var index = this.getParent().indexOfChild(this);
  var argName = new goog.ui.LabelInput('arg' + String(index));
  this.argName_ = argName;

  this.addChild(argName, true);

  if(this.arg_.getName().length) {
    argName.setValue(this.arg_.getName());
  }

  goog.dom.append(div, ' of type ');
  //goog.dom.append(div, goog.dom.createDom('br'));

  var argType = Ray.UI.makeTypeSelector_();
  this.argType_ = argType;


  argType.setSelectedIndex(0);
  argType.setDefaultCaption('Pick a type for this argument');
  this.addChild(argType, true);
  this.arg_.setType(argType.getValue());

  goog.style.setInlineBlock(argType.getContentElement());

  var argRemoveButton = Ray.UI.makeButton_('-');
  this.argRemoveButton_ = argRemoveButton;

  this.addChild(argRemoveButton, true);
  goog.style.setInlineBlock(argRemoveButton.getContentElement());
};
ArgUI.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  goog.events.listen(this.argRemoveButton_, goog.ui.Component.EventType.ACTION, function(e) {
    this.dispatchEvent(ArgList.EventType.REMOVE_ARG_EVENT);
  }, true, this);
  goog.events.listen(this.argName_.getElement(), goog.ui.Component.EventType.BLUR, function(e) {
    this.arg_.setName(this.argName_.getValue());
  }, false, this);
  goog.events.listen(this.argType_, [goog.ui.Component.EventType.CHANGE, goog.ui.Component.EventType.ACTION], function(e) {

    this.arg_.setType(this.argType_.getValue());
    goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
  }, false, this);
};
ArgUI.prototype.getName = function() {
  return this.arg_.getName();
};
ArgUI.prototype.getType = function() {
  return this.arg_.getType();
};
ArgUI.prototype.getArg = function() {
  return this.arg_;
};
ArgUI.prototype.setArgTypeIndex = function(ix) {
  this.argType_.setSelectedIndex(ix);
  this.arg_.setType(this.argType_.getValue());
};
ArgUI.prototype.setArgName = function(name) {
  this.argName_.setValue(name);
  this.arg_.setName(name);
};
ArgUI.prototype.updateArgNameLabelIndex = function() {
  var index = this.getParent().indexOfChild(this);
  this.argName_.setLabel('arg' + String(index));
};
var ArgListContainer = function(argList, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.argList_ = argList;
  //this.setSupportedState(goog.ui.Component.State.ALL,  true);
};
goog.inherits(ArgListContainer, goog.ui.Component);
ArgListContainer.nextId_ = 0;
ArgListContainer.makeUniqueIdNum = function() {
  return ArgListContainer.nextId_++;
};
ArgListContainer.prototype.getContentElement = function() {
  return this.argListElement_;
};
ArgListContainer.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var containerDiv = this.element_;
  goog.dom.classes.set(containerDiv, 'arg-list-container');

  var argsDiv = goog.dom.createDom('div', {
    class: 'arg-list'
  });
  goog.dom.append(containerDiv, argsDiv);
  this.argListElement_ = argsDiv;

  goog.array.forEach(this.argList_.getArgs(), function(arg) {
    this.addChild(new ArgUI(arg), true);
  }, this);

  var argAddButton = new Ray.UI.makeButton_('+');
  this.argAddButton_ = argAddButton;
  argAddButton.render(containerDiv);
  goog.style.setInlineBlock(argAddButton.getContentElement());
};
ArgListContainer.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.forEachChild(function(child) {
    goog.events.listen(child,
                       ArgList.EventType.REMOVE_ARG_EVENT,
                       this.onRemoveArg_, true, this);
    goog.events.listen(
      child,
      goog.ui.Component.EventType.CHANGE,
      function(e) {
        goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
      }, false, this);
  }, this);
  goog.events.listen(this.argAddButton_, goog.ui.Component.EventType.ACTION, this.addArg, true, this);
};

ArgListContainer.prototype.addArg = function(e, arg) {
  if(!arg) {
    arg = new Arg();
  }
  this.argList_.addArg(arg);
  var argUI = new ArgUI(arg);
  this.addChild(argUI, true);
  goog.events.listen(argUI, ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, true, this);
  goog.events.listen(argUI, goog.ui.Component.EventType.CHANGE, function(e) {
    goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
  }, false, this);
  goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
};
ArgListContainer.prototype.onRemoveArg_ = function(e) {
  e.stopPropagation();
  this.argList_.removeArgAt(this.indexOfChild(e.currentTarget));
  this.removeChild(e.currentTarget, true);
  this.forEachChild(function(child) {
    child.updateArgNameLabelIndex();
  });
  goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
};
ArgListContainer.prototype.getArgs = function() {
  var args = [];
  this.forEachChild(function(child) {
    args.push(child.getArg());
  });
  return args;
};

Ray.UI.makeTypeSelector_ = function() {
  var select = new goog.ui.Select(null, null, goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.object.forEach(Ray.Types.atomicTypes_, function(type, typeName) {
    select.addItem(new goog.ui.Option(typeName, new type()));
  });
  return select;
};

Ray.UI.makeButton_ = function(text) {
  return new goog.ui.Button(text, goog.ui.FlatButtonRenderer.getInstance());
};

Ray.UI.makeFunDefDialog = function() {
  var dom = goog.dom.getDomHelper(document.body);

  var dialog = new goog.ui.Dialog(null, true, dom);
  var dialogButtons = new goog.ui.Dialog.ButtonSet();
  dialogButtons.set('create', 'Create Function');
  dialogButtons.set('cancel', 'Cancel');
  dialogButtons.setCancel('cancel');
  dialogButtons.setDefault('create');
  dialog.setButtonSet(dialogButtons);
  dialog.setTitle("Define a new function");

  var elem = dialog.getContentElement();


  goog.dom.append(elem, "What will you name the function?");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var funName = new goog.ui.LabelInput('name');
  dialog.funName_ = funName;
  dialog.addChild(funName, true);
  goog.events.listen(funName.getContentElement(), [goog.events.EventType.PROPERTYCHANGE,
                                                   goog.events.EventType.KEYUP,
                                                   goog.events.EventType.INPUT,
                                                   goog.events.EventType.PASTE],
                     Ray.UI.makeDemoBlock);

  goog.dom.append(elem, goog.dom.createElement('br'));

  goog.dom.append(elem, "What does this function do?");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var funDescription = new goog.ui.LabelInput('description');
  dialog.funDescription_ = funDescription;
  dialog.addChild(funDescription, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  goog.dom.append(elem, "This function consumes:");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var argList = new ArgList();
  var argListContainer = new ArgListContainer(argList);
  dialog.argListContainer_ = argListContainer;
  dialog.addChild(argListContainer, true);
  goog.events.listen(argListContainer, [goog.ui.Component.EventType.CHANGE], Ray.UI.makeDemoBlock);

  goog.dom.append(elem, "This function produces:");
  var returnType = Ray.UI.makeTypeSelector_();
  dialog.returnType_ = returnType;
  returnType.setSelectedIndex(0);
  returnType.setDefaultCaption('Pick a return type for this function');
  dialog.addChild(returnType, true);
  goog.events.listen(returnType, [goog.ui.Component.EventType.CHANGE, goog.ui.Component.EventType.ACTION], Ray.UI.makeDemoBlock);

  goog.dom.append(elem, goog.dom.createElement('br'));
  var blocklyContainer = goog.dom.createElement('div');
  goog.dom.setProperties(blocklyContainer, {
    'style': "height : 400px; width: 400px;"
  });
  goog.dom.append(elem, blocklyContainer);

  Blockly.inject(blocklyContainer, {
    'path': '../', 'readOnly': true
  });

  Ray.UI.dialog = dialog;
  //dialog.render(document.body);

  return dialog;
};

Ray.UI.makeDemoBlock = function(e) {
  var dialog = Ray.UI.dialog;
  if(dialog.block) {
    dialog.block.dispose(true, false);
  }
  var funSpec = Ray.UI.getFunDefDialogValues(dialog);

  var blockProto = {
    outputType_: funSpec.returnType,
    renderAsExpression_: true
  };
  blockProto.init = function() {
    this.makeTitleRow(funSpec.name);
    goog.array.forEach(funSpec.args, function(arg) {
      this.appendValueInput(arg.getName())
        .setType(arg.getType());
    }, this);
  };

  var block = new Blockly.Block(Blockly.mainWorkspace, blockProto);
  block.initSvg();
  block.render();

  var xy = block.getRelativeToSurfaceXY();
  block.moveBy(Blockly.BlockSvg.SEP_SPACE_X + Blockly.BlockSvg.TAB_WIDTH - xy.x, Blockly.BlockSvg.SEP_SPACE_Y - xy.y);
  dialog.block = block;
};

Ray.UI.testPopulateFunDefDialog_ = function(dialog) {
  dialog.funName_.setValue('double_if');
  dialog.funDescription_.setValue('doubles x if y is true');

  dialog.argListContainer_.addArg();
  dialog.argListContainer_.getChildAt(0).setArgTypeIndex(1);
  dialog.argListContainer_.getChildAt(0).setArgName('x');

  dialog.argListContainer_.addArg();
  dialog.argListContainer_.getChildAt(1).setArgTypeIndex(0);
  dialog.argListContainer_.getChildAt(1).setArgName('y');

  dialog.returnType_.setSelectedIndex(1);
};

Ray.UI.getFunDefDialogValues = function(dialog) {
  var name = dialog.funName_.getValue();
  var desc = dialog.funDescription_.getValue();
  var args = dialog.argListContainer_.getArgs();
  var returnType = dialog.returnType_.getSelectedItem().getValue();
  return {name: name, desc: desc, args: args, returnType: returnType};
};

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
