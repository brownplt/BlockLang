goog.provide('Ray.UI');

goog.require('Ray.Types');

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
  var arg_name = new goog.ui.LabelInput('arg' + String(index));
  this.arg_name_ = arg_name;

  this.addChild(arg_name, true);

  if(this.arg_.getName().length) {
    arg_name.setValue(this.arg_.getName());
  }

  goog.dom.append(div, ' of type ');
  //goog.dom.append(div, goog.dom.createDom('br'));

  var arg_type = Ray.UI.make_type_selector();
  this.arg_type_ = arg_type;

  arg_type.setSelectedIndex(0);
  arg_type.setDefaultCaption('Pick a type for this argument');
  this.addChild(arg_type, true);
  //arg_type.setSupportedState(goog.ui.Component.State.ALL, true);
  //arg_type.setDispatchTransitionEvents(goog.ui.Component.State.HOVER, true);

  goog.style.setInlineBlock(arg_type.getContentElement());

  var arg_remove_button = Ray.UI.make_button('-');
  arg_remove_button.setSupportedState(goog.ui.Component.State.ALL, true);
  arg_remove_button.setAutoStates(goog.ui.Component.State.ALL, true);
  this.arg_remove_button_ = arg_remove_button;

  this.addChild(arg_remove_button, true);
  goog.style.setInlineBlock(arg_remove_button.getContentElement());
};
ArgUI.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  goog.events.listen(this.arg_remove_button_, goog.ui.Component.EventType.ACTION, function(e) {
    this.dispatchEvent(ArgList.EventType.REMOVE_ARG_EVENT);
  }, true, this);
  goog.events.listen(this.arg_name_.getElement(), goog.ui.Component.EventType.BLUR, function(e) {
    this.arg_.setName(this.arg_name_.getValue());
  }, false, this);
  goog.events.listen(this.arg_type_, [goog.ui.Component.EventType.CHANGE, goog.ui.Component.EventType.ACTION], function(e) {
    this.arg_.setType(this.arg_type_.getValue());
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
  this.arg_type_.setSelectedIndex(ix);
  this.arg_.setType(this.arg_type_.getValue());
};
ArgUI.prototype.setArgName = function(name) {
  this.arg_name_.setValue(name);
  this.arg_.setName(name);
};
ArgUI.prototype.updateArgNameLabelIndex = function() {
  var index = this.getParent().indexOfChild(this);
  this.arg_name_.setLabel('arg' + String(index));
};
ArgListContainer = function(argList, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.arg_list_ = argList;
  //this.setSupportedState(goog.ui.Component.State.ALL,  true);
};
goog.inherits(ArgListContainer, goog.ui.Component);
ArgListContainer.next_id_ = 0;
ArgListContainer.makeUniqueIdNum = function() {
  return ArgListContainer.next_id_++;
};
ArgListContainer.prototype.getContentElement = function() {
  return this.arg_list_element_;
};
ArgListContainer.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var container_div = this.element_;
  goog.dom.classes.set(container_div, 'arg-list-container');

  var args_div = goog.dom.createDom('div', {
    class: 'arg-list'
  });
  goog.dom.append(container_div, args_div);
  this.arg_list_element_ = args_div;

  goog.array.forEach(this.arg_list_.getArgs(), function(arg) {
    this.addChild(new ArgUI(arg), true);
  }, this);

  var arg_add_button = new Ray.UI.make_button('+');
  this.arg_add_button_ = arg_add_button;
  arg_add_button.render(container_div);
  goog.style.setInlineBlock(arg_add_button.getContentElement());
};
ArgListContainer.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.forEachChild(function(child) {
    goog.events.listen(child,
                       ArgList.EventType.REMOVE_ARG_EVENT,
                       this.onRemoveArg_, true, this);
  }, this);
  goog.events.listen(this.arg_add_button_, goog.ui.Component.EventType.ACTION, this.addArg, true, this);
};

ArgListContainer.prototype.addArg = function(e, arg) {
  if(!arg) {
    arg = new Arg();
  }
  this.arg_list_.addArg(arg);
  var arg_ui = new ArgUI(arg);
  this.addChild(arg_ui, true);
  goog.events.listen(arg_ui, ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, true, this);
};
ArgListContainer.prototype.onRemoveArg_ = function(e) {
  e.stopPropagation();
  this.arg_list_.removeArgAt(this.indexOfChild(e.currentTarget));
  this.removeChild(e.currentTarget, true);
  this.forEachChild(function(child) {
    child.updateArgNameLabelIndex();
  });
};
ArgListContainer.prototype.getArgs = function() {
  var args = [];
  this.forEachChild(function(child) {
    args.push(child.getArg());
  });
  return args;
};

Ray.UI.make_type_selector = function() {
  var select = new goog.ui.Select(null, null);//, goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.array.forEach(goog.object.getKeys(Ray.Types.atomic_types), function(type) {
    select.addItem(new goog.ui.Option(type.toLocaleUpperCase(), type));
  });
  return select;
};

Ray.UI.make_button = function(text) {
  return new goog.ui.Button(text, goog.ui.CustomButtonRenderer.getInstance());
};

Ray.UI.make_function_definition_dialog = function() {
  var dom = goog.dom.getDomHelper(document.body);

  var dialog = new goog.ui.Dialog(null, true, dom);
  var dialog_buttons = new goog.ui.Dialog.ButtonSet();
  dialog_buttons.set('create', 'Create Function');
  dialog_buttons.set('cancel', 'Cancel');
  dialog_buttons.setCancel('cancel');
  dialog_buttons.setDefault('create');
  dialog.setButtonSet(dialog_buttons);
  dialog.setTitle("Define a new function");

  var elem = dialog.getContentElement();


  goog.dom.append(elem, "What will you name the function?");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var func_name = new goog.ui.LabelInput('name');
  dialog.func_name_ = func_name;
  dialog.addChild(func_name, true);

  goog.dom.append(elem, goog.dom.createElement('br'));

  goog.dom.append(elem, "Describe the input to the function:");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var func_desc = new goog.ui.LabelInput('description');
  dialog.func_desc_ = func_desc;
  dialog.addChild(func_desc, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  goog.dom.append(elem, "This function consumes:");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var arg_list = new ArgList();
  var arg_list_container = new ArgListContainer(arg_list);
  dialog.arg_list_container_ = arg_list_container;
  dialog.addChild(arg_list_container, true);

  goog.dom.append(elem, "This function produces:");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var return_type = Ray.UI.make_type_selector();
  dialog.return_type_ = return_type;
  return_type.setSelectedIndex(0);
  return_type.setDefaultCaption('Pick a return type for this function');
  dialog.addChild(return_type, true);
  //dialog.render(document.body);

  return dialog;
};

Ray.UI.populate_dialog_w_test_data = function(dialog) {
  dialog.func_name_.setValue('double_if');
  dialog.func_desc_.setValue('doubles x if y is true');

  dialog.arg_list_container_.addArg();
  dialog.arg_list_container_.getChildAt(0).setArgTypeIndex(1);
  dialog.arg_list_container_.getChildAt(0).setArgName('x');

  dialog.arg_list_container_.addArg();
  dialog.arg_list_container_.getChildAt(1).setArgTypeIndex(0);
  dialog.arg_list_container_.getChildAt(1).setArgName('y');

  dialog.return_type_.setSelectedIndex(1);
};

Ray.UI.get_function_definition_dialog_values = function(dialog) {
  var name = dialog.func_name_.getValue();
  var desc = dialog.func_desc_.getValue();
  var args = dialog.arg_list_container_.getArgs();
  var return_type = dialog.return_type_.getSelectedItem().getValue();
  return {name: name, desc: desc, args: args, return_type: return_type};
};

Ray.UI.switch_displayed_blockly = function(from, to) {
  goog.dom.classes.swap(goog.dom.getParentElement(from),
                        Ray.UI.VISIBLE_CONTAINER_CLASS,
                        Ray.UI.HIDDEN_CONTAINER_CLASS);
  goog.dom.classes.swap(goog.dom.getParentElement(to),
                        Ray.UI.HIDDEN_CONTAINER_CLASS,
                        Ray.UI.VISIBLE_CONTAINER_CLASS);
};

Ray.UI.show_workspace_from_tab = function(tab, workspace_content) {
  var active_workspace_id = tab.workspace_id_;
  var containers = goog.dom.getChildren(workspace_content);
  goog.array.forEach(containers, function(container) {
    var workspace = goog.dom.getFirstElementChild(container);
    if(workspace.id === active_workspace_id) {
      goog.dom.classes.swap(container, Ray.UI.HIDDEN_CONTAINER_CLASS, Ray.UI.VISIBLE_CONTAINER_CLASS);
    } else {
      goog.dom.classes.swap(container, Ray.UI.VISIBLE_CONTAINER_CLASS, Ray.UI.HIDDEN_CONTAINER_CLASS);
    }
  });
};

Ray.UI.add_function_definition_workspace_dom = function(function_name, container) {
  var func_def_div = goog.dom.createDom('div', 'hidden_container');
  var func_def_iframe = goog.dom.createDom('iframe', {
    id: 'blockly_function_definition_' + function_name,
    src: "Javascript:''"});
  goog.dom.appendChild(func_def_div, func_def_iframe);
  goog.dom.appendChild(container, func_def_div);
  return func_def_iframe;
};

Ray.UI.add_function_definition_workspace_tab = function(function_name, tabbar) {
  /*var remove_func_button = goog.dom.createDom('span', 'remove_function_button');
  goog.style.setInlineBlock(remove_func_button);
  goog.events.listen(remove_func_button, goog.events.EventType.CLICK, function(e) {
    // TODO(fill in here)
  });*/
  var func_def_content = goog.dom.createDom('div', 'goog-inline-block',
    [goog.dom.createTextNode('Edit ' + function_name + ' ')]);//,
     //remove_func_button]);
  var func_def_tab = new goog.ui.Tab(func_def_content);
  func_def_tab.workspace_id_ = 'blockly_function_definition_' + function_name;
  //func_def_tab.remove_func_button = remove_func_button;
  tabbar.addChild(func_def_tab, true);
  return func_def_tab;
};
