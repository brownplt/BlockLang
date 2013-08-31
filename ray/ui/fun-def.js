goog.provide('Ray.UI.FunDef');

goog.require('Ray.Shared');
goog.require('Ray.Types');

goog.require('goog.array');
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
goog.require('goog.ui.Textarea');


Ray.UI.FunDef.CHANGE_EVENTS = [goog.events.EventType.PROPERTYCHANGE,
                               goog.events.EventType.KEYUP,
                               goog.events.EventType.INPUT,
                               goog.events.EventType.PASTE];

////////// Arg

// Arg
Ray.UI.Arg = function(name, type) {
  this.name_ = name || null;
  this.type_ = type || null;
};
Ray.UI.Arg.prototype.getName = function() {
  return this.name_;
};
Ray.UI.Arg.prototype.getType = function() {
  return this.type_;
};
Ray.UI.Arg.prototype.setName = function(name) {
  this.name_ = name;
};
Ray.UI.Arg.prototype.setType = function(type) {
  this.type_ = type;
};
Ray.UI.Arg.prototype.clone = function() {
  return new Ray.UI.Arg(this.name_, this.type_);
};


///////// ArgList

// Ray.UI.ArgList
Ray.UI.ArgList = function(args) {
  /**
   * @type {Array.<*>}
   * @private
   */
  this.args_ = args ? goog.array.map(args, function(arg) { return arg.clone(); }) : [];
};
Ray.UI.ArgList.EventType = {
  REMOVE_ARG_EVENT: 'REMOVE_ARG'
};
Ray.UI.ArgList.prototype.getArgs = function() {
  return goog.array.clone(this.args_);
};
Ray.UI.ArgList.prototype.removeArgAt = function(index) {
  if(this.args_.length > index && index >= 0) {
    var removed = this.args_.splice(index, 1);
    return removed[0];
  } else {
    throw "Index out of bounds!";
  }
};
Ray.UI.ArgList.prototype.addArg = function(arg) {
  this.args_.push(arg);
};

///////// ArgUI

// Ray.UI.ArgUI
Ray.UI.ArgUI = function(arg) {
  goog.base(this);
  this.arg_ = arg;
};
goog.inherits(Ray.UI.ArgUI, goog.ui.Component);
Ray.UI.ArgUI.prototype.getArg = function() {
  return this.arg_;
};
Ray.UI.ArgUI.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var div = this.getContentElement();
  goog.dom.classes.add(div, 'arg-control');

  var index = this.getParent().indexOfChild(this);
  var argName = new goog.ui.LabelInput('arg' + String(index));
  this.argName_ = argName;

  this.addChild(argName, true);

  if(this.arg_.getName() && this.arg_.getName().length) {
    argName.setValue(this.arg_.getName());
  }

  goog.dom.append(div, ' of type ');
  //goog.dom.append(div, goog.dom.createDom('br'));

  var argType = Ray.UI.FunDef.makeTypeSelector_();
  this.argType_ = argType;

  if(this.arg_.getType()) {
    Ray.UI.FunDef.setSelectedType(argType, this.arg_.getType());
  }

  argType.setDefaultCaption('pick a type...');
  this.addChild(argType, true);

  goog.style.setInlineBlock(argType.getContentElement());

  var removeIcon = goog.dom.createDom('i', {'class': 'icon-remove'});
  var argRemoveButton = Ray.UI.FunDef.makeButton_(removeIcon);
  this.argRemoveButton_ = argRemoveButton;

  this.addChild(argRemoveButton, true);
  goog.style.setInlineBlock(argRemoveButton.getContentElement());
};
Ray.UI.ArgUI.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.argRemoveButton_, goog.ui.Component.EventType.ACTION, function(e) {
    this.dispatchEvent(Ray.UI.ArgList.EventType.REMOVE_ARG_EVENT);
  }, true, this);
  this.getHandler().listen(this.argName_.getContentElement(), Ray.UI.FunDef.CHANGE_EVENTS, function(e) {
    this.arg_.setName(this.argName_.getValue());
    this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
  }, false, this);

  this.getHandler().listen(this.argType_, goog.ui.Component.EventType.CHANGE, function(e) {
    this.arg_.setType(this.argType_.getValue());
    this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
  }, false, this);
};
Ray.UI.ArgUI.prototype.getName = function() {
  return this.arg_.getName();
};
Ray.UI.ArgUI.prototype.getType = function() {
  return this.arg_.getType();
};
Ray.UI.ArgUI.prototype.getArg = function() {
  return this.arg_;
};
Ray.UI.ArgUI.prototype.setArgTypeIndex = function(ix) {
  this.argType_.setSelectedIndex(ix);
  this.arg_.setType(this.argType_.getValue());
};
Ray.UI.ArgUI.prototype.setArgName = function(name) {
  this.argName_.setValue(name);
  this.arg_.setName(name);
};
Ray.UI.ArgUI.prototype.updateArgNameLabelIndex = function() {
  var index = this.getParent().indexOfChild(this);
  this.argName_.setLabel('arg' + String(index));
};

////////// ArgListContainer

// Ray.UI.ArgListContainer
Ray.UI.ArgListContainer = function(argList, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.argList_ = argList;
  //this.setSupportedState(goog.ui.Component.State.ALL,  true);
};
goog.inherits(Ray.UI.ArgListContainer, goog.ui.Component);
Ray.UI.ArgListContainer.nextId_ = 0;
Ray.UI.ArgListContainer.makeUniqueIdNum = function() {
  return Ray.UI.ArgListContainer.nextId_++;
};
Ray.UI.ArgListContainer.prototype.getContentElement = function() {
  return this.argListElement_;
};
Ray.UI.ArgListContainer.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var containerDiv = this.element_;
  goog.dom.classes.set(containerDiv, 'arg-list-container');

  var argsDiv = goog.dom.createDom('div', {
    'class': 'arg-list'
  });
  goog.dom.append(containerDiv, argsDiv);
  this.argListElement_ = argsDiv;

  goog.array.forEach(this.argList_.getArgs(), function(arg) {
    this.addChild(new Ray.UI.ArgUI(arg), true);
  }, this);

  var addIcon = goog.dom.createDom('i', {'class': 'icon-plus'});
  var argAddButton = Ray.UI.FunDef.makeButton_(addIcon);
  this.argAddButton_ = argAddButton;
  argAddButton.render(containerDiv);
  goog.style.setInlineBlock(argAddButton.getContentElement());
};
Ray.UI.ArgListContainer.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.forEachChild(function(child) {
    this.getHandler().listen(child,
                             Ray.UI.ArgList.EventType.REMOVE_ARG_EVENT,
                             this.onRemoveArg_, true, this);
    this.getHandler().listen(child,
                             goog.ui.Component.EventType.CHANGE,
                             this.dispatchChange, false, this);
  }, this);
  this.getHandler().listen(this.argAddButton_, goog.ui.Component.EventType.ACTION, this.addArg, true, this);
};

Ray.UI.ArgListContainer.prototype.dispatchChange = function(e) {
  this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
};

Ray.UI.ArgListContainer.prototype.addArg = function(e, arg) {
  if(!arg) {
    arg = new Ray.UI.Arg();
  }
  this.argList_.addArg(arg);
  var argUI = new Ray.UI.ArgUI(arg);
  this.addChild(argUI, true);
  this.getHandler().listen(argUI, Ray.UI.ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, true, this);
  this.getHandler().listen(argUI, goog.ui.Component.EventType.CHANGE, this.dispatchChange, false, this);
  this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
};
Ray.UI.ArgListContainer.prototype.onRemoveArg_ = function(e) {
  e.stopPropagation();
  this.argList_.removeArgAt(this.indexOfChild(e.currentTarget));
  this.removeChild(e.currentTarget, true);
  this.forEachChild(function(child) {
    child.updateArgNameLabelIndex();
  });
  this.dispatchEvent(goog.ui.Component.EventType.CHANGE);
};
Ray.UI.ArgListContainer.prototype.getArgs = function() {
  var args = [];
  this.forEachChild(function(child) {
    args.push(child.getArg());
  });
  return args;
};

/////////// Ray.UI.FunDef.Dialog

Ray.UI.FunDef.Dialog = function(opt_domHelper) {
  goog.base(this, null, true, opt_domHelper);
};
goog.inherits(Ray.UI.FunDef.Dialog, goog.ui.Dialog);
Ray.UI.FunDef.Dialog.prototype.createDom = function() {
  goog.base(this, 'createDom');

  this.asCreate();

  var elem = this.getContentElement();

  goog.dom.append(elem, "What will you name the function?");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var funName = new goog.ui.LabelInput('name');
  this.funName_ = funName;
  this.addChild(funName, true);

  goog.dom.append(elem, goog.dom.createElement('br'));

  goog.dom.append(elem, "What does this function do?");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var funDescription = new goog.ui.Textarea('description');
  this.funDescription_ = funDescription;
  this.addChild(funDescription, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  goog.dom.append(elem, "This function consumes:");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var argList = new Ray.UI.ArgList();
  var argListContainer = new Ray.UI.ArgListContainer(argList);
  this.argListContainer_ = argListContainer;
  this.addChild(argListContainer, true);

  var producesStart = goog.dom.createTextNode("This function produces:");
  this.producesStart_ = producesStart;
  goog.dom.append(elem, producesStart);
  var returnType = Ray.UI.FunDef.makeTypeSelector_();
  this.returnType_ = returnType;
  returnType.setSelectedIndex(0);
  returnType.setDefaultCaption('Pick a return type for this function');
  this.addChild(returnType, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  var message = goog.dom.createDom('span', {'class': 'invalid-state-message'});
  goog.dom.setTextContent(message, '');
  goog.dom.append(elem, message);
  this.message_ = message;
  this.resetValidity();

  goog.dom.append(elem, goog.dom.createElement('br'));
  var blocklyContainer = goog.dom.createDom('iframe', {'src': "Javascript:''"});
  goog.style.setSize(blocklyContainer, 200, 200);
  goog.dom.append(elem, blocklyContainer);
  this.blocklyContainer_ = blocklyContainer;
  return this;
};

Ray.UI.FunDef.Dialog.prototype.asCreate = function() {
  if(this.getButtonSet().getButton('apply')) {
    this.getHandler().unlisten(this.getButtonSet().getButton('apply') || null, goog.events.EventType.CLICK, this.onApplyChangesFun_);
  }
  if(this.getButtonSet().getButton('delete')) {
    this.getHandler().unlisten(this.getButtonSet().getButton('delete') || null, goog.events.EventType.CLICK, this.onDeleteFun_);
  }
  var dialogButtons = new goog.ui.Dialog.ButtonSet();
  dialogButtons.set('create', 'Create function');
  dialogButtons.set('cancel', 'Cancel');
  dialogButtons.setCancel('cancel');
  dialogButtons.setDefault('create');
  this.setButtonSet(dialogButtons);
  this.setTitle("Define a new function");
  if(this.onCreateFun_) {
    this.getHandler().listen(this.getButtonSet().getButton('create'), goog.events.EventType.CLICK, this.onCreateFun_);
  }

};

Ray.UI.FunDef.Dialog.prototype.asEdit = function() {
  if(this.getButtonSet().getButton('create')) {
    this.getHandler().unlisten(this.getButtonSet().getButton('create') || null, goog.events.EventType.CLICK, this.onCreateFun_);
  }
  var dialogButtons = new goog.ui.Dialog.ButtonSet();
  dialogButtons.set('apply', 'Apply changes');
  dialogButtons.set('delete', 'Delete this function');
  dialogButtons.set('cancel', 'Cancel');
  dialogButtons.setCancel('cancel');
  dialogButtons.setDefault('apply');
  this.setButtonSet(dialogButtons);
  this.setTitle("Edit this function");
  if(this.onApplyChangesFun_) {
    this.getHandler().listen(this.getButtonSet().getButton('apply'), goog.events.EventType.CLICK, this.onApplyChangesFun_);
  }
  if(this.onDeleteFun_) {
    this.getHandler().listen(this.getButtonSet().getButton('delete'), goog.events.EventType.CLICK, this.onDeleteFun_);
  }

};

Ray.UI.FunDef.Dialog.prototype.onCreate = function(onCreateFun) {
  if(this.getButtonSet().getButton('create')) {
    // In create mode
    if(this.onCreateFun_) {
      // Clear old onCreate listener
      this.getHandler().unlisten(this.getButtonSet().getButton('create'), goog.events.EventType.CLICK, this.onCreateFun_);
    }
    // Make wrapper function
    this.onCreateFun_ = function(e) {
      var funSpec = this.getFunSpec();
      onCreateFun(funSpec);
    };
    // Set up new listener
    this.getHandler().listen(this.getButtonSet().getButton('create'), goog.events.EventType.CLICK, this.onCreateFun_);
  } else {
    // Make and save wrapped function
    this.onCreateFun_ = function(e) {
      var funSpec = this.getFunSpec();
      onCreateFun(funSpec);
    };
  }
};

Ray.UI.FunDef.Dialog.prototype.onApplyChanges = function(onApplyChangesFun) {
  if(this.getButtonSet().getButton('apply')) {
    if(this.onApplyChangesFun_) {
      this.getHandler().unlisten(this.getButtonSet().getButton('apply'), goog.events.EventType.CLICK, this.onApplyChangesFun_);
    }
    this.onApplyChangesFun_ = onApplyChangesFun;
    this.getHandler().listen(this.getButtonSet().getButton('apply'), goog.events.EventType.CLICK, this.onApplyChangesFun_);
  } else {
    this.onApplyChangesFun_ = onApplyChangesFun;
  }
};

Ray.UI.FunDef.Dialog.prototype.onDelete = function(onDeleteFun) {
  if(this.getButtonSet().getButton('delete')) {
    if(this.onDeleteFun_) {
      this.getHandler().unlisten(this.getButtonSet().getButton('delete'), goog.events.EventType.CLICK, this.onDeleteFun_);
    }
    this.onDeleteFun_ = onDeleteFun;
    this.getHandler().listen(this.getButtonSet().getButton('delete'), goog.events.EventType.CLICK, this.onDeleteFun_);
  } else {
    this.onDeleteFun_ = onDeleteFun;
  }
};

Ray.UI.FunDef.Dialog.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.funName_.getContentElement(),
                           Ray.UI.FunDef.CHANGE_EVENTS,
                           this.updatePreviewAndValidate);
  this.getHandler().listen(this.argListContainer_, goog.ui.Component.EventType.CHANGE,
                           this.updatePreviewAndValidate);
  this.getHandler().listen(this.returnType_, goog.ui.Component.EventType.CHANGE,
                           this.updatePreviewAndValidate);
  Ray.UI.Util.loadBlocklyAsObjField(this, this.blocklyContainer_);
};
Ray.UI.FunDef.Dialog.prototype.resetValidity = function() {
  var message = this.message_;
  goog.dom.setProperties(message, {'display': 'none'});
  goog.dom.setTextContent(message, '');
  this.getButtonSet().setButtonEnabled('create', true);
};
Ray.UI.FunDef.Dialog.prototype.markInvalid = function(errorMessage) {
  var message = this.message_;
  goog.dom.setTextContent(message, errorMessage);
  goog.style.setInlineBlock(message);
  this.getButtonSet().setButtonEnabled('create', false);
};
Ray.UI.FunDef.Dialog.prototype.updatePreviewAndValidate = function(e) {
  if(this.block) {
    this.block.dispose(true, false);
  }
  this.block = null;
  this.resetValidity();

  var isInvalid = this.isInvalid();
  if(isInvalid) {
    this.markInvalid(isInvalid);
    return;
  }

  if(!this.Blockly_) {
    setTimeout(goog.bind(this.updatePreviewAndValidate, this), 200);
    return;
  }


  var funSpec = this.getFunSpec();
  var blockProto = {
    outputType_: funSpec.returnType,
    renderAsExpression_: true
  };
  blockProto.init = function() {
    this.makeTitleRow(funSpec.name);
    goog.array.forEach(funSpec.args, function(arg) {
      var input = this.appendValueInput(arg.getName())
        .setType(arg.getType());
    }, this);
  };

  var block = new this.Blockly_.Block(this.Blockly_.mainWorkspace, blockProto);
  block.initSvg();
  block.render();
  this.Blockly_.svgResize();

  goog.array.forEach(funSpec.args, function(arg) {
    var argBlockProto = {
      outputType_: arg.getType(),
      renderAsExpression_: true,
      init: function() {
        this.makeTitleRow(arg.getName());
      }
    };
    var argBlock = new this.Blockly_.Block(this.Blockly_.mainWorkspace, argBlockProto);
    argBlock.initSvg();
    argBlock.render();
    block.getInput(arg.getName()).connection.connect(argBlock.outputConnection);
  }, this);

  var xy = block.getRelativeToSurfaceXY();
  block.moveBy(this.Blockly_.BlockSvg.SEP_SPACE_X + this.Blockly_.BlockSvg.TAB_WIDTH - xy.x, this.Blockly_.BlockSvg.SEP_SPACE_Y - xy.y);
  this.block = block;
};
Ray.UI.FunDef.Dialog.prototype.isInvalid = function() {
  var funSpec = this.getFunSpec();

  if(funSpec.name.length === 0) {
    return 'Function name must contain at least one character';
  }

  if(Ray.Shared.conflictingFunctionName(funSpec.name)) {
    return "Function name can't be the same as already existing function";
  }

  var argNames = [];
  for(var i = 0; i < funSpec.args.length; i++) {
    var arg = funSpec.args[i];
    var argType = arg.getType();
    var argName = arg.getName();
    if(!argName || argName.length === 0) {
      return 'all argument names must contain at least one character';
    }
    if(!argType) {
      return 'all arguments must have a type';
    }
    if(goog.array.contains(argNames, arg.getName())) {
      return 'all arguments names must be distinct';
    }
    argNames.push(arg.getName());
  }

  if(funSpec.name.length === 0) {

  }
  return false;
};
Ray.UI.FunDef.Dialog.prototype.setVisible = function(visible) {
  goog.base(this, 'setVisible', visible);
  this.updatePreviewAndValidate();
  if(visible) {
    var self = this;
    var resizeBlockly = function() {
      if(self.Blockly_) {
        self.Blockly_.svgResize();
      } else {
        setTimeout(resizeBlockly, 200);
      }
    };
    resizeBlockly();
  }
};


Ray.UI.FunDef.Dialog.prototype.testPopulate_ = function() {
  this.funName_.setValue('string-last');
  this.funDescription_.setValue('gets the last character of the passed-in string');

  this.argListContainer_.addArg();
  this.argListContainer_.getChildAt(0).setArgTypeIndex(2);
  this.argListContainer_.getChildAt(0).setArgName('x');

  this.returnType_.setSelectedIndex(3);
};

Ray.UI.FunDef.Dialog.prototype.getFunSpec = function() {
  var name = this.funName_.getValue();
  var desc = this.funDescription_.getValue();
  var args = this.argListContainer_.getArgs();
  var returnType = this.returnType_.getValue();
  return {name: name, desc: desc, args: args, returnType: returnType};
};

Ray.UI.FunDef.Dialog.prototype.setFunSpec = function(funSpec) {
  this.funName_.setValue(funSpec.name);
  this.funDescription_.setValue(funSpec.desc);

  var ix = this.indexOfChild(this.argListContainer_);
  this.removeChild(this.argListContainer_, true);
  this.getHandler().unlisten(this.argListContainer_, goog.ui.Component.EventType.CHANGE,
                             this.updatePreviewAndValidate);

  this.argListContainer_ = new Ray.UI.ArgListContainer(new ArgList(funSpec.args));
  this.addChildAt(this.argListContainer_, ix, false);
  this.argListContainer_.renderBefore(this.producesStart_);
  this.getHandler().listen(this.argListContainer_, goog.ui.Component.EventType.CHANGE,
                           this.updatePreviewAndValidate);

  Ray.UI.FunDef.setSelectedType(this.returnType_, funSpec.returnType);
};

Ray.UI.FunDef.makeTypeSelector_ = function() {
  var select = new goog.ui.Select(null, null, goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.object.forEach(Ray.Types.atomicTypes_, function(type, typeName) {
    select.addItem(new goog.ui.Option(typeName, new type()));
  });
  return select;
};

Ray.UI.FunDef.setSelectedType = function(typeSelector, type) {
  var i = 0;
  var item;
  while(item = typeSelector.selectionModel_.getItemAt(i)) {
    if (item && Ray.Types.areSameType(item.getValue(), type)) {
      typeSelector.setSelectedItem(/** @type {goog.ui.MenuItem} */ (item));
      return;
    }
    i++;
  }
  typeSelector.setSelectedItem(null);
};

Ray.UI.FunDef.makeButton_ = function(content) {
  return new goog.ui.Button(content, goog.ui.FlatButtonRenderer.getInstance());
};

Ray.UI.FunDef.makeDialog = function(opt_domHelper) {
  var dialog =  new Ray.UI.FunDef.Dialog(opt_domHelper);
  Ray.UI.dialog = dialog;
  return dialog;
};
