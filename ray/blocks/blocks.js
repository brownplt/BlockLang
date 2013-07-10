/**
 * @desc Defines blocks from Ray constructs.
 *
 * The standard usage pattern for Ray.Blocks is to first
 * call Ray.Blocks.generate_all_blocks with an instance of Ray.Ray
 * to get an object of block name & block key-value pairs and set Blockly.Language to that object
 *
 * With the set of blocks generated, we can then call Ray.Blocks.generate_toolbox,
 * passing in the new Blockly.Language. This will return an xml string that can be passed in to
 * Blockly.inject as the value of the toolbox argument.
 *
 */

goog.provide('Ray.Blocks');
goog.require('Ray.Runtime');
goog.require('Ray.Types');
goog.require('Ray.Inference');
goog.require('Ray.Globals');

goog.require('Blockly');

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');

var Blocks = Ray.Globals.Blocks;
var R = Ray.Runtime;

//Ray.Blocks.BLOCK_COLOUR = 173;
Ray.Blocks.REST_ARG_PREFIX = "ray_rest_arg_";
Ray.Blocks.BLOCK_PREFIX = "ray_";
Ray.Blocks.PRIMITIVE_DATA_PREFIX = "ray_data_create_";
Ray.Blocks.CONDITIONAL_PREFIX = "ray_conditional_";
Ray.Blocks.ARG_PREFIX = "ray_function_arg_";
Ray.Blocks.FUNCTION_DEF_PREFIX = "ray_user_function_";
Ray.Blocks.HELP_URL = "#";

Ray.Blocks.block_name = function(name) {
  return Ray.Blocks.BLOCK_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.rest_arg_block_name = function(name) {
  return Ray.Blocks.REST_ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.primitive_data_block_name = function(name) {
  return Ray.Blocks.PRIMITIVE_DATA_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.conditional_block_name = function(name) {
  return Ray.Blocks.CONDITIONAL_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.arg_block_name = function(name) {
  return Ray.Blocks.ARG_PREFIX + goog.string.htmlEscape(name);
};
Ray.Blocks.user_function_block_name = function(name) {
  return Ray.Blocks.FUNCTION_DEF_PREFIX + goog.string.htmlEscape(name);
};

Ray.Blocks.TypeColourTable = {};
var base_types = goog.object.getKeys(Ray.Types.atomic_types);
var hue_distance = 270 / base_types.length;
var current_hue = 0;
goog.array.forEach(base_types, function(ty) {
  Ray.Blocks.TypeColourTable[ty] = current_hue;
  current_hue += hue_distance;
});

Ray.Blocks.DEFAULT_BLOCK_COLOR = { R: 187, G: 187, B: 187 };
Ray.Blocks.UNKNOWN_BLOCK_COLOR = {  R: 102, G: 102, B: 102 };
Ray.Blocks.LIGHTEN_FACTOR = 0.4;

Ray.Blocks.get_colour = function(type) {
  var key = type.__type__;
  var c = Ray.Blocks.TypeColourTable[key];
  if(goog.isDef(c)) {
    var rgb = goog.color.hsvToRgb(c, Blockly.HSV_SATURATION, Blockly.HSV_VALUE * 256);
    return { R: rgb[0], G: rgb[1], B: rgb[2] };

  } else if(key === 'list') {
      var orig_c = Ray.Blocks.get_colour(type.element_type);
      if(orig_c.R) {
        var new_c = goog.color.lighten([orig_c.R, orig_c.G, orig_c.B], Ray.Blocks.LIGHTEN_FACTOR);
        return { R: new_c[0], G: new_c[1], B: new_c[2] };
    } else {
      throw 'Element type color wasn\'t an R G B object';
    }

  } else if(Ray.Types.is_unknown(type)) {
      return Ray.Blocks.UNKNOWN_BLOCK_COLOR;

  } else {
    //throw 'Unknown type!';
    return Ray.Blocks.DEFAULT_BLOCK_COLOR;

  }
};

Ray.Blocks.rest_arg_arg_block_name = "ray_rest_arg_arg_";
Ray.Blocks.rest_arg_arg_block = {
  init: function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle('arg');
  },
  __rest_arg__: true
};
Ray.Blocks.cond_test_body_block_name = "ray_conditional_cond_test_body";
Ray.Blocks.cond_else_block_name = "ray_conditional_cond_else";

Ray.Blocks.get_drawers = function(block) {
  var drawers = [];
  if(block.__value__) {
    var value = block.__value__;
    if(R.node_type(block.__value__) === 'primitive' || R.node_type(block.__value__) === 'closure') {
      var output_types = value.body_type.get_all_base_types();
      var input_types = value.arg_spec.arguments_type.get_all_base_types();
      goog.array.forEach(input_types, function(type) {
        drawers.push(type + '_input');
      });
      goog.array.forEach(output_types, function(type) {
        drawers.push(type + '_output');
      });
      if(block.__user_function__) {
        drawers.push('functions');
      }
    } else {
      goog.array.forEach(block.__type__.get_all_base_types(), function(type)  {
        drawers.push(type + '_input');
      });
    }

  } else if(block.__form__) {
    drawers.push('forms');
  } else if(block.__datatype__) {
    drawers.push(block.__datatype__ + '_output');
  } else if(block.__arguments__) {
    drawers.push('arguments');
  } else{
    throw new Ray.Error("Unknown sort of block!!");
  }
  return drawers;
};

/**
 * Generates all the blocks for a given instance of Ray.
 * Right now, this just sequentially generates all the primitive data blocks,
 * and then all the blocks for builtin procedures.
 * @param r
 * @returns {{}}
 */
Ray.Blocks.generate_all_blocks = function(r) {
  var obj = {};
  Ray.Blocks.define_primitive_data_blocks(r, obj);
  Ray.Blocks.define_list_blocks(r, obj);
  Ray.Blocks.define_builtin_blocks(r, obj);
  Ray.Blocks.define_conditional_blocks(r, obj);
  return obj;
};

// Cons, first, rest, empty
Ray.Blocks.define_list_blocks = function(r, obj) {
  var ListBlock = function(name) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = r.builtins.lookup(name);
    this.__list__ = name;
    this.__name__ = name;
    this.__block_class__ = Blocks[goog.string.toTitleCase(name)];
  };

  var cons_block = new ListBlock('cons');
  cons_block.__type__ = new Ray.Types.List(new Ray.Types.Unknown());
  cons_block.init = function() {
    this.setOutputType(new Ray.Types.List(new Ray.Types.Unknown()));
    this.appendDummyInput()
      .appendTitle('cons')
      .setAlign(this.Blockly.ALIGN_CENTRE);
    this.appendValueInput('car')
      .setType(new Ray.Types.Unknown());
    this.appendValueInput('cdr')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('cons')] = cons_block;

  var empty_block = new ListBlock('empty');
  empty_block.__type__ = new Ray.Types.List(new Ray.Types.Unknown())
  empty_block.init = function() {
    this.setOutputType(new Ray.Types.List(new Ray.Types.Unknown()));
    this.appendDummyInput()
      .appendTitle(this.__name__)
      .setAlign(Blockly.ALIGN_CENTRE);
  };
  obj[Ray.Blocks.block_name('empty')] = empty_block;

  var first_block = new ListBlock('first');
  first_block.__type__ = new Ray.Types.Unknown();
  first_block.init = function() {
    this.setOutputType(new Ray.Types.Unknown());
    this.appendDummyInput()
      .appendTitle('first')
      .setAlign(this.Blockly.ALIGN_CENTRE);
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('first')] = first_block;

  var rest_block = new ListBlock('rest');
  rest_block.__type__ = new Ray.Types.List(new Ray.Types.Unknown());
  rest_block.init = function() {
    this.setOutputType(new Ray.Types.Unknown());
    this.appendDummyInput()
      .appendTitle('rest')
      .setAlign(this.Blockly.ALIGN_CENTRE);
    this.appendValueInput('x')
      .setType(new Ray.Types.List(new Ray.Types.Unknown()));
  };
  obj[Ray.Blocks.block_name('rest')] = rest_block;

};

Ray.Blocks.define_function_def_block = function(r, obj, name, desc, return_type) {
  var fun_def_block = {
    helpUrl: Ray.Blocks.HELP_URL,
    __value__: null,
    __datatype__: null,
    __form__: null,
    __name__: name,
    __arguments__: null,
    __function_definition__: true,
    __return_type__: return_type,
    __desc__: desc
  };

  fun_def_block.init = function() {
    this.setColour(Ray.Blocks.get_colour(this.__return_type__));
    this.appendDummyInput()
      .appendTitle(this.__name__)
      .setAlign(this.Blockly.ALIGN_CENTRE);
    this.appendValueInput('BODY');
            this.setTooltip(this.__desc__);
    this.setOutput(false);
  };

  obj[Ray.Blocks.function_def_block_name(name)] = fun_def_block;
  return obj;
};

Ray.Blocks.define_arg_blocks = function(r, obj, args) {
  function ArgumentBlock(name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = null;
    this.__form__ = null;
    this.__name__ = name;
    this.__type__ = type;
    this.__arguments__ = true;
    this.init = function() {
      this.appendDummyInput()
        .appendTitle(this.__name__);
    };
  }

  goog.array.forEach(args, function(arg) {
    var arg_block = new ArgumentBlock(arg.name_, arg.type_);
    obj[Ray.Blocks.arg_block_name(arg.name_)] = arg_block;
  });
  return obj;
};

Ray.Blocks.define_conditional_blocks = function(r, obj) {
  function ConditionalBlock(name) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = null;
    this.__form__ = name;
    this.__name__ = name;
    this.__block_class__ = Blocks[goog.string.toTitleCase(name)];
  }

  // If
  var if_block = new ConditionalBlock('if');
  if_block.__expr__ = Expressions.If;
  if_block.init = function() {
    this.setOutputType(new Ray.Types.Unknown());
    this.appendValueInput('PRED')
      .appendTitle("if")
      .setType(new Ray.Types.Boolean());

    this.appendValueInput('T_EXPR')
      .appendTitle('then')
      .setType(new Ray.Types.Unknown());

    this.appendValueInput('F_EXPR')
      .appendTitle('else')
      .setType(new Ray.Types.Unknown());

  };

  obj[Ray.Blocks.conditional_block_name('if')] = if_block;

  // And
  var and_block = new ConditionalBlock('and', new Ray.Types.Boolean());
  and_block.init = function() {
    this.setOutputType(new Ray.Types.Boolean());

    this.appendDummyInput()
      .setAlign(this.Blockly.ALIGN_CENTRE)
      .appendTitle('and');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 2;
  };

  Ray.Blocks.add_rest_arg(and_block, obj, 'and', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditional_block_name('and')] = and_block;

  // Or
  var or_block = new ConditionalBlock('or', new Ray.Types.Boolean());
  or_block.init = function() {
    this.setOutputType(new Ray.Types.Boolean());

    this.appendDummyInput()
      .setAlign(this.Blockly.ALIGN_CENTRE)
      .appendTitle('or');
    this.appendValueInput('REST_ARG0')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('REST_ARG1')
      .setType(new Ray.Types.Boolean());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
    this.rest_arg_count_ = 2;
  };

  Ray.Blocks.add_rest_arg(or_block, obj, 'or', new Ray.Types.Boolean());
  obj[Ray.Blocks.conditional_block_name('or')] = or_block;

  // Cond
  var cond_block = new ConditionalBlock('cond');
  cond_block.init = function() {
    this.setOutputType(new Ray.Types.Unknown());
    this.appendDummyInput()
      .setAlign(this.Blockly.ALIGN_CENTRE)
      .appendTitle('cond');
    this.appendValueInput('CONDITION')
      .appendTitle('when')
      .setType(new Ray.Types.Boolean());
    this.appendValueInput('BODY')
      .setType(new Ray.Types.Unknown());
    this.setMutator(new this.Blockly.Mutator([Ray.Blocks.cond_test_body_block_name, Ray.Blocks.cond_else_block_name]));
    this.test_clause_count_ = 0;
    this.else_clause_ = false;
  };

  cond_block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('test_clauses', String(this.test_clause_count_));
    container.setAttribute('else_clause', String(this.else_clause_ ? 1 : 0));
    return container;
  };
  cond_block.domToMutation = function(container) {
    for(var i = 0; i < this.test_clause_count_; i++) {
      this.removeInput('CONDITION' + String(i));
      this.removeInput('BODY' + String(i));
    }

    if(this.else_clause_) {
      this.removeInput('ELSE');
    }
    this.test_clause_count_ = window.parseInt(container.getAttribute('test_clauses'));
    for(var i = 0; i < this.test_clause_count_; i++) {
      this.appendValueInput('CONDITION' + String(i))
        .appendTitle('when')
        .setType(new Ray.Types.Boolean());
      this.appendValueInput('BODY' + String(i))
        .setType(new Ray.Types.Unknown());
    }

    this.else_clause_ = Boolean(window.parseInt(container.getAttribute('else_clause')));
    if(this.else_clause_) {
      this.appendValueInput('ELSE')
        .appendTitle('otherwise')
        .setType(new Ray.Types.Unknown());
    }
  };
  cond_block.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace, Ray.Blocks.conditional_block_name('cond_cond'));
    container_block.initSvg();
    var connection = container_block.getInput('STACK').connection;
    for(var x = 0; x < this.test_clause_count_; x++) {
      var conditionConnection = this.getInput('CONDITION' + String(x)).connection;
      var bodyConnection = this.getInput('BODY' + String(x)).connection;
      var test_body_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_test_body_block_name);
      test_body_block.initSvg();
      test_body_block.conditionConnection_ = conditionConnection.targetConnection;
      test_body_block.bodyConnection_ = bodyConnection.targetConnection;
      connection.connect(test_body_block.previousConnection);
      connection = test_body_block.nextConnection;
    }

    if(this.else_clause_) {
      var elseConnection = this.getInput('ELSE').connection;
      var else_block = new this.Blockly.Block(workspace, Ray.Blocks.cond_else_block_name);
      else_block.initSvg();
      else_block.elseConnection_ = elseConnection.targetConnection;
      connection.connect(else_block.previousConnection);

    }
    return container_block;

  };
  cond_block.compose = function(container_block) {
    if(this.else_clause_) {
      this.else_clause_ = false;
      this.removeInput('ELSE');
    }

    for(var x = this.test_clause_count_ - 1; x >= 0; x--) {
      this.test_clause_count_--;
      this.removeInput('CONDITION' + String(x));
      this.removeInput('BODY' + String(x));
    }

    var clause_block = container_block.getInputTargetBlock('STACK');
    while(clause_block) {
      switch(clause_block.__type__) {
        case Ray.Blocks.cond_test_body_block_name:
          var condition_input = this.appendValueInput('CONDITION' + String(this.test_clause_count_))
            .appendTitle('when')
            .setType(new Ray.Types.Boolean());
          if(clause_block.conditionConnection_) {
            condition_input.connection.connect(clause_block.conditionConnection_);
          }

          var body_input = this.appendValueInput('BODY' + String(this.test_clause_count_))
            .setType(new Ray.Types.Unknown());
          if(clause_block.bodyConnection_) {
            body_input.connection.connect(clause_block.bodyConnection_);
          }
          this.test_clause_count_++;
          break;
        case Ray.Blocks.cond_else_block_name:
          this.else_clause_ = true;
          var else_input = this.appendValueInput('ELSE')
            .appendTitle('otherwise')
            .setType(new Ray.Types.Unknown());
          if(clause_block.elseConnection_) {
            else_input.connection.connect(clause_block.elseConnection_);
          }
          break;
        default:
          throw "Unknown block type inside ray_conditional_cond_cond!";
          break;
      }
      clause_block = clause_block.nextConnection &&
        clause_block.nextConnection.targetBlock();
    }

    Ray.Blocks.TypeChecker.typecheck_block(this);

  };
  obj[Ray.Blocks.conditional_block_name('cond')] = cond_block;

  var cond_cond_block = {
    __rest_arg_container__: true,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('cond');
      this.appendDummyInput()
        .appendTitle('test/body');
      this.appendStatementInput('STACK');
      this.contextMenu = false;
    }
  };
  obj[Ray.Blocks.conditional_block_name('cond_cond')] = cond_cond_block;

  var cond_test_body_block = {
    __type__: Ray.Blocks.cond_test_body_block_name,
    __rest_arg__: true,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('test/body');
    }
  };
  obj[Ray.Blocks.cond_test_body_block_name] = cond_test_body_block;

  var cond_else_block = {
    __type__: Ray.Blocks.cond_else_block_name,
    __rest_arg__: true,
    init: function() {
      this.setColour(Ray.Blocks.get_colour('forms'));
      this.appendDummyInput()
        .appendTitle('otherwise');
      this.nextConnection.dispose();
      this.nextConnection = null;
    }
  };
  obj[Ray.Blocks.cond_else_block_name] = cond_else_block;

  return obj;
};

/**
 * Defines the blocks that allow you to enter primitive data.
 * Currently, this is limited to: booleans, numbers, characters, and strings.
 * @param r
 * @param obj
 */
Ray.Blocks.define_primitive_data_blocks = function(r, obj) {
  function PrimitiveDataBlock(type_name, type) {
    this.helpUrl = Ray.Blocks.HELP_URL;
    this.__value__ = null;
    this.__datatype__ = type_name;
    this.__type__ = type;
    this.__block_class__ = Blocks[goog.string.toTitleCase(type_name)];
  }

  // Boolean
  var boolean_block = new PrimitiveDataBlock('boolean', new Ray.Types.Boolean());
  boolean_block.init = function() {
    var dropdown = new this.Blockly.FieldDropdown([['true', 'TRUE'],['false', 'FALSE']]);
    this.appendDummyInput()
      .appendTitle(dropdown, 'B');
  };

  obj[Ray.Blocks.primitive_data_block_name('boolean')] = boolean_block;

  // Number
  var number_block = new PrimitiveDataBlock('num', new Ray.Types.Num());
  number_block.init = function() {
    var textfield = new this.Blockly.FieldTextInput('0', this.Blockly.FieldTextInput.numberValidator);
    this.appendDummyInput()
      .appendTitle(textfield, 'N');
  };

  obj[Ray.Blocks.primitive_data_block_name('num')] = number_block;

  //String
  var string_block = new PrimitiveDataBlock('str', new Ray.Types.Str());
  string_block.init = function() {
    var textfield = new this.Blockly.FieldTextInput('Hello, World!');
    this.appendDummyInput()
      .appendTitle('"')
      .appendTitle(textfield, 'S')
      .appendTitle('"');
  };

  obj[Ray.Blocks.primitive_data_block_name('str')] = string_block;

  //Chars
  var char_block = new PrimitiveDataBlock('char', new Ray.Types.Char());
  char_block.init = function() {
    var char_validator = function(text) {
      return text.length === 1 ? text : null;
    };
    var textfield = new this.Blockly.FieldTextInput('a', char_validator);
    this.appendDummyInput()
      .appendTitle('#\\')
      .appendTitle(textfield, 'C')
  };

  obj[Ray.Blocks.primitive_data_block_name('char')] = char_block;
};


/**
 * Looks through the builtins in a Ray, finds those for which
 * there aren't blocks in obj, and creates blocks for them.
 *
 * If you want to change a pre-existing block, you cannot do so here.
 *
 * @param ray, has to have builtins already installed
 * @param obj, the object into which we install the missing blocks
 */
Ray.Blocks.define_builtin_blocks = function(r, obj) {
  var builtins = r.builtins.dict({});
  goog.object.forEach(builtins, function(value, name) {
    var block_name = Ray.Blocks.block_name(name);
    if(!goog.object.containsKey(obj, block_name)) {
      Ray.Blocks.generate_block(r, name, value, obj);
    }
  });
  obj[Ray.Blocks.rest_arg_arg_block_name] = Ray.Blocks.rest_arg_arg_block;
  return obj;
};

/**
 * Create the block corresponding to a use of value
 * (Note, that this is function application, and not definition)
 * value is either:
 *   a Pair,
 *   a Number,
 *   a Null,
 *   a Boolean,
 *   a Str,
 *   a Char,
 *   a Primitive, (At the moment we only are considering this and
 *   a Closure,    this)
 *   an ArgumentSpec, <-- Should never be passed in directly
 *   an Arguments. <-- Should never be passed in directly, not really a Value either.
 * @param r
 * @param name the name of the block, will be used in looking it up, and as title on block.
 * @param value the value from which we are creating the block
 * @param obj
 * @param {?boolean=} opt_user_function
 */
Ray.Blocks.generate_block = function(r, name, value, obj, opt_user_function) {
  var is_user_function = !!opt_user_function;
  var block_name = is_user_function ? Ray.Blocks.user_function_block_name(name) : Ray.Blocks.block_name(name);
  var block = null;
  switch(R.node_type(value)) {
    case 'pair':
    case 'number':
    case 'empty':
    case 'boolean':
    case 'str':
    case 'char':
      break;
    case 'primitive':
    case 'closure':
      block = {};
      var arg_spec = value.arg_spec;
      // Ignoring rest and keyword arguments
      var arity = arg_spec.p_args.length;
      var rest_arg = arg_spec.rest_arg || null;

      block.__name__ = name;
      block.__value__ = value;
      block.__type__ = value.body_type;
      block.__block_class__ = Blocks.App;
      if(is_user_function) {
        block.__user_function__ = true;
      }
      block.helpUrl = Ray.Blocks.HELP_URL;
      block.init = function() {

        this.appendDummyInput()
          .setAlign(this.Blockly.ALIGN_CENTRE)
          .appendTitle(name);

        for(var i = 0; i < arity; i++) {
          this.appendValueInput(arg_spec.p_args[i])
            .setType(arg_spec.arguments_type.p_arg_types.list[i])
        }

        if(rest_arg) {
          this.appendDummyInput('NO_REST_ARGS')
            .appendTitle('...');
          this.setMutator(new this.Blockly.Mutator([Ray.Blocks.rest_arg_arg_block_name]));
          this.rest_arg_count_ = 0;
        }
      };

      if(rest_arg) {
        Ray.Blocks.add_rest_arg(block, obj, rest_arg, arg_spec.arguments_type.rest_arg_type.base_type);
      }
      break;
    default:
      throw new Ray.Error("Unknown value, can't create block!");
      block = null;
      break;
  }
  if(block) {
    obj[block_name] = block;
  };
  return block;
};

/**
 * Generates an xml string representing the toolbox of blocks that will be available on a Blockly page.
 * @param {Object} block_dir the block directory for which we will generate the toolbox
 * @param {?boolean=} opt_include_arguments
 */
Ray.Blocks.generate_toolbox = function(block_dir, opt_include_arguments) {
  var include_arguments = goog.isDef(opt_include_arguments) ? opt_include_arguments : true;
  var toolbox_categories = goog.object.getKeys(block_dir);
  toolbox_categories.sort();
  var toolbox = goog.dom.createDom('xml', {id: 'toolbox'});
  goog.array.forEach(toolbox_categories, function(category) {
    // Don't display arguments if false is passed in as opt_include_arguments
    if(category === 'arguments' && !include_arguments) {
      return;
    }
    // Otherwise, display category, even if it is empty!
    var cat = goog.dom.createDom('category');
    goog.dom.xml.setAttributes(cat, {name: category});

    if(!goog.isArray(block_dir[category])) {
      goog.array.forEach(goog.object.getKeys(block_dir[category]), function(subcategory) {
        var attributes = {};
        attributes.name = (subcategory === 'input' ? 'consumes' : 'produces') + ' ' + category;
        attributes.key = subcategory;
        attributes.custom = category + '_' + attributes.key;
        var subcat = goog.dom.createDom('category');
        goog.dom.xml.setAttributes(subcat, attributes);
        goog.dom.appendChild(cat, subcat);
      });
    } else {
      goog.dom.xml.setAttributes(cat, {custom: category});
    }

    goog.dom.appendChild(toolbox, cat);
  });
  return goog.dom.xml.serialize(toolbox);
};

Ray.Blocks.add_to_block_directory = function(block_dir, block_name, block) {
  var drawers = Ray.Blocks.get_drawers(block);
  goog.array.forEach(drawers, function(drawer) {
    var end_index = drawer.search(/(input|output)/);
    if(end_index < 0) {
      block_dir[drawer].push(block_name);
    } else {
      var in_or_out = drawer.substring(end_index);
      var type = drawer.substring(0, end_index - 1);
      block_dir[type][in_or_out].push(block_name);
    }
  });
  block_dir['all'].push(block_name);
  return block_dir;
};

Ray.Blocks.empty_block_directory = function() {
  var block_dir  = {};
  goog.array.forEach(['num', 'str', 'char', 'boolean', 'unknown'], function(ty)   {
    block_dir[ty] = {};
    block_dir[ty]['input'] = [];
    block_dir[ty]['output'] = [];
  });

  block_dir['forms'] = [];
  block_dir['arguments'] = [];
  block_dir['functions'] = [];
  block_dir['all'] = [];
  return block_dir;
};

Ray.Blocks.generate_block_directory = function(blocks) {
  var block_dir = Ray.Blocks.empty_block_directory();

  var block_names = goog.array.filter(goog.object.getKeys(blocks), function(name) {
    var is_cond_cond = name.indexOf(Ray.Blocks.CONDITIONAL_PREFIX + 'cond_') === 0;
    var is_rest_arg = name.indexOf(Ray.Blocks.REST_ARG_PREFIX) === 0;
    return !(is_cond_cond || is_rest_arg);
  });
  goog.array.forEach(block_names, function(block_name) {
    var block = blocks[block_name];
    Ray.Blocks.add_to_block_directory(block_dir, block_name, block);
  });
  return block_dir;

};

Ray.Blocks.add_rest_arg = function(block, obj, rest_arg, type) {
  // Create the block which will hold the arguments as I add or subtract them.
  // The arguments themselves will be shared by any blocks with rest args.
  var rest_arg_container = {};
  rest_arg_container.__rest_arg_container__ = true;
  rest_arg_container.helpUrl = Ray.Blocks.HELP_URL;
  rest_arg_container.init = function() {
    this.setColour(Ray.Blocks.DEFAULT_BLOCK_COLOR);
    this.appendDummyInput()
      .appendTitle(rest_arg);
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  };

  var container_block_name = Ray.Blocks.rest_arg_block_name(block.__name__);
  obj[container_block_name] = rest_arg_container;

  block.decompose = function(workspace) {
    var container_block = new this.Blockly.Block(workspace,
                                                 container_block_name);
    container_block.initSvg();
    if(container_block.getInput('STACK')) {
      var connection = container_block.getInput('STACK').connection;
      for(var x = 0; x < this.rest_arg_count_; x++) {
        var arg_block = new this.Blockly.Block(workspace, Ray.Blocks.rest_arg_arg_block_name);
        arg_block.initSvg();
        connection.connect(arg_block.previousConnection);
        connection = arg_block.nextConnection;
      }
    }
    return container_block;
  };
  block.compose = function(container_block) {
    for(var i = this.rest_arg_count_ - 1; i >= 0; i--) {
      this.removeInput('REST_ARG' + String(i));
    }
    this.rest_arg_count_ = 0;
    var arg_block = container_block.getInputTargetBlock('STACK');
    while(arg_block) {
      var arg = this.appendValueInput('REST_ARG' + String(this.rest_arg_count_))
        .setType(type);
      // This should never be set!
      if(arg_block.value_connection_) {
        arg.connection.connect(arg_block.value_connection_);
      }
      this.rest_arg_count_++;
      arg_block = arg_block.nextConnection &&
        arg_block.nextConnection.targetBlock();
    }

  };
  block.mutationToDom = function(workspace) {
    var container = document.createElement('mutation');
    container.setAttribute('rest_args', String(this.rest_arg_count_));
    return container;
  };
  block.domToMutation = function(container) {
    for(var x = 0; x < this.rest_arg_count_; x++) {
      this.removeInput('REST_ARG' + String(x));
    }
    this.rest_arg_count_ = window.parseInt(container.getAttribute('rest_args'), 10);
    for(var x = 0; x < this.rest_arg_count_; x++) {
      this.appendValueInput('REST_ARG' + String(x))
        .setType(type);
    }
  };
};