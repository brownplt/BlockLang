goog.provide('Ray.UI.FunDef');

goog.require('Ray.Types');
goog.require('Blockly');

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

/** @typedef {{type:*, name: string}} */
// Arg
var Arg = function(name, type) {
  this.name_ = name || null;
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

// ArgList
var ArgList = function(args) {
  /**
   * @type {Array.<*>}
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
    return removed[0];
  } else {
    throw "Index out of bounds!";
  }
};
ArgList.prototype.addArg = function(arg) {
  this.args_.push(arg);
};

// ArgUI
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

  if(this.arg_.getName() && this.arg_.getName().length) {
    argName.setValue(this.arg_.getName());
  }

  goog.dom.append(div, ' of type ');
  //goog.dom.append(div, goog.dom.createDom('br'));

  var argType = Ray.UI.FunDef.makeTypeSelector_();
  this.argType_ = argType;


  argType.setSelectedIndex(0);
  argType.setDefaultCaption('Pick a type for this argument');
  this.addChild(argType, true);
  this.arg_.setType(argType.getValue());

  goog.style.setInlineBlock(argType.getContentElement());

  var argRemoveButton = Ray.UI.FunDef.makeButton_('-');
  this.argRemoveButton_ = argRemoveButton;

  this.addChild(argRemoveButton, true);
  goog.style.setInlineBlock(argRemoveButton.getContentElement());
};
ArgUI.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  goog.events.listen(this.argRemoveButton_, goog.ui.Component.EventType.ACTION, function(e) {
    this.dispatchEvent(ArgList.EventType.REMOVE_ARG_EVENT);
  }, true, this);
  goog.events.listen(this.argName_.getContentElement(), [goog.events.EventType.PROPERTYCHANGE,
                                     goog.events.EventType.KEYUP,
                                     goog.events.EventType.INPUT,
                                     goog.events.EventType.PASTE], function(e) {
    this.arg_.setName(this.argName_.getValue());
    goog.events.dispatchEvent(this, goog.ui.Component.EventType.CHANGE);
  }, false, this);

  goog.events.listen(this.argType_, goog.ui.Component.EventType.CHANGE, function(e) {
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

// ArgListContainer
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

  var argAddButton = new Ray.UI.FunDef.makeButton_('+');
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

Ray.UI.FunDef.Dialog = function(opt_domHelper) {
  goog.base(this, null, true, opt_domHelper);
};
goog.inherits(Ray.UI.FunDef.Dialog, goog.ui.Dialog);
Ray.UI.FunDef.Dialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var dialogButtons = new goog.ui.Dialog.ButtonSet();
  dialogButtons.set('create', 'Create Function');
  dialogButtons.set('cancel', 'Cancel');
  dialogButtons.setCancel('cancel');
  dialogButtons.setDefault('create');
  this.setButtonSet(dialogButtons);
  this.setTitle("Define a new function");

  var elem = this.getContentElement();

  goog.dom.append(elem, "What will you name the function?");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var funName = new goog.ui.LabelInput('name');
  this.funName_ = funName;
  this.addChild(funName, true);

  goog.dom.append(elem, goog.dom.createElement('br'));

  goog.dom.append(elem, "What does this function do?");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var funDescription = new goog.ui.LabelInput('description');
  this.funDescription_ = funDescription;
  this.addChild(funDescription, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  goog.dom.append(elem, "This function consumes:");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var argList = new ArgList();
  var argListContainer = new ArgListContainer(argList);
  this.argListContainer_ = argListContainer;
  this.addChild(argListContainer, true);

  goog.dom.append(elem, "This function produces:");
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
  var blocklyContainer = goog.dom.createElement('div');
  goog.dom.setProperties(blocklyContainer, {
    'style': "height : 400px; width: 400px;"
  });
  goog.dom.append(elem, blocklyContainer);
  this.blocklyContainer_ = blocklyContainer;
  return this;
};
Ray.UI.FunDef.Dialog.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var updatePreviewAndValidate = goog.bind(this.updatePreviewAndValidate, this);

  goog.events.listen(this.funName_.getContentElement(), [goog.events.EventType.PROPERTYCHANGE,
                                                         goog.events.EventType.KEYUP,
                                                         goog.events.EventType.INPUT,
                                                         goog.events.EventType.PASTE],
                     updatePreviewAndValidate);
  goog.events.listen(this.argListContainer_, [goog.ui.Component.EventType.CHANGE],
                     updatePreviewAndValidate);
  goog.events.listen(this.returnType_, goog.ui.Component.EventType.CHANGE,
                     updatePreviewAndValidate);

  Blockly.inject(this.blocklyContainer_, {
    'path': '../', 'readOnly': true
  });
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

  var block = new Blockly.Block(Blockly.mainWorkspace, blockProto);
  block.initSvg();
  block.render();
  Blockly.svgResize();

  goog.array.forEach(funSpec.args, function(arg) {
    var argBlockProto = {
      outputType_: arg.getType(),
      renderAsExpression_: true,
      init: function() {
        this.makeTitleRow(arg.getName());
      }
    };
    var argBlock = new Blockly.Block(Blockly.mainWorkspace, argBlockProto);
    argBlock.initSvg();
    argBlock.render();
    block.getInput(arg.getName()).connection.connect(argBlock.outputConnection);
  });

  var xy = block.getRelativeToSurfaceXY();
  block.moveBy(Blockly.BlockSvg.SEP_SPACE_X + Blockly.BlockSvg.TAB_WIDTH - xy.x, Blockly.BlockSvg.SEP_SPACE_Y - xy.y);
  this.block = block;
};
Ray.UI.FunDef.Dialog.prototype.isInvalid = function() {

  var funSpec = this.getFunSpec();

  var argNames = [];
  for(var i = 0; i < funSpec.args.length; i++) {
    var arg = funSpec.args[i];
    var argName = arg.getName();
    if(!argName || argName.length === 0) {
      return 'all argument names must contain at least one character';
    }
    if(goog.array.contains(argNames, arg.getName())) {
      return 'all arguments names must be distinct';
    }
    argNames.push(arg.getName());
  }

  if(funSpec.name.length === 0) {
    return 'Function name must contain at least one character';
  }
  return false;
};

Ray.UI.FunDef.Dialog.prototype.testPopulate_ = function() {
  this.funName_.setValue('double_if');
  this.funDescription_.setValue('doubles x if y is true');

  this.argListContainer_.addArg();
  this.argListContainer_.getChildAt(0).setArgTypeIndex(1);
  this.argListContainer_.getChildAt(0).setArgName('x');

  this.argListContainer_.addArg();
  this.argListContainer_.getChildAt(1).setArgTypeIndex(0);
  this.argListContainer_.getChildAt(1).setArgName('y');

  this.returnType_.setSelectedIndex(1);
};

Ray.UI.FunDef.Dialog.prototype.getFunSpec = function() {
  var name = this.funName_.getValue();
  var desc = this.funDescription_.getValue();
  var args = this.argListContainer_.getArgs();
  var returnType = this.returnType_.getValue();
  return {name: name, desc: desc, args: args, returnType: returnType};
};


Ray.UI.FunDef.makeTypeSelector_ = function() {
  var select = new goog.ui.Select(null, null, goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.object.forEach(Ray.Types.atomicTypes_, function(type, typeName) {
    select.addItem(new goog.ui.Option(typeName, new type()));
  });
  return select;
};

Ray.UI.FunDef.makeButton_ = function(text) {
  return new goog.ui.Button(text, goog.ui.FlatButtonRenderer.getInstance());
};