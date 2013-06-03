/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

define(["jquery", "underscore"], function($, _) { 

  var global = this;

  var R = function(dict) {     
    this.names = dict || {};
    var self = this;
  
    /**
     * @desc Names/Identifiers
     */
    var Int = function(i) { 
      this.i = i;
    };

    Int.prototype = { 
      R: self,
      type: 'int',
      get: function() { 
	return this.i; 
      },
      eval: function() { 
	return this;
      }
    };
    
    self.Int = Int;

    var Name = function(name) { 
      this.name = name;
    };

    Name.prototype = {
      R: self,
      type: 'name',
      toString: function() { 
	return name;
      },
      eval: function() { 
	return this.R.lookup(this.name).eval();
      }
    };

    self.Name = Name;

    /**
     * @desc Arguments objects
     */
    var Arguments = function(p_args, kw_args) { 
      this.p_args = p_args || [];
      this.kw_args = kw_args || {};
    };

    Arguments.prototype = { 
      R: self,
      type: 'arguments',
      toString: function() { 
	return 'Arguments';
      },
      eval: function() { 
	var self = this;
	var p_arg_values =  _.map(this.p_args, function(p_arg_expr) { 
	  return p_arg_expr.eval(); 
	});      
	self.p_args = p_arg_values;
	var k_arg_values = {};
	_.each(this.kw_args, function(k_arg_expr, kw) { 
	  k_arg_values[kw] = k_arg_expr.eval();
	});
	return self;
      }
    };

    self.Arguments = Arguments;

    /**
     * @desc Function Applications
     */
    var App = function(f, args) { 
      this.f = f;
      this.args = args;
    };
    
    App.prototype = { 
      R: self,
      type: 'application',
      toString: function() { 
	return 'Function Application';
      },
      eval: function() { 
	var f_value = this.f.eval();
	if(!(this.R.type(f_value) === 'function' ||
	     this.R.type(f_value) === 'primitive')) { 
	  throw new Error("Tried to apply a non-function");
	}
	if(!f_value.arg_spec.accepts(this.args)) { 
	  throw new Error("Arity mismatch in function application");
	}

	var arg_values = this.args.eval();

	f_value.bind_arguments(arg_values);
	var body_val = f_value.evaluate();
	f_value.unbind_arguments();

	return body_val;
      }
    };

    self.App = App;

    /** 
     * @desc Primitive functions
     */ 
    var Primitive = function(arg_spec, f) { 
      this.arg_spec = arg_spec;
      this.f = f;
    };

    Primitive.prototype = { 
      R: self,
      type: 'primitive',
      toString: function() { 
	return 'Primitive';
      },
      eval: function() { 
	return this;
      },
      bind_arguments: function(args) { 
	this.args = args;
      },
      evaluate: function() { 
	var args = [];
	var p_args = _.map(this.args.p_args,
				    function(arg) { return arg.get(); });
	var num_p_args = this.arg_spec.p_args.length;
	for(var i = 0; i < num_p_args; i++) { 
	  args.push(p_args[i]);
	}
	args.push(p_args.slice(num_p_args)); // rest_arg
	return this.f.apply(this, args);
      },
      unbind_arguments: function() { 
	this.args = null;
      }
    };

    self.Primitive = Primitive;

    /**
     * @desc Argument specification for a function
     */

    var ArgumentSpec = function(dict) { 
      this.p_args = dict.p_args || [];
      this.kw_args = dict.kw_args || {};
      this.rest_arg = dict.rest_arg || null;
    };

    ArgumentSpec.prototype = { 
      R: self,
      type: 'argument specification',
      toString: function() { 
	return 'ArgumentSpec';
      },
      /** 
       * @desc Does the provided arguments object match the argument specification, 
       * so that it is a valid function call
       */
      accepts: function(args) { 
	var p_args_match = false;
	if(args.p_args.length === this.p_args.length) { 
	  p_args_match = true;
	} else if(this.rest_arg) { 
	  if(args.p_args.length > this.p_args.length) { 
	    p_args_match = true;
	  }
	}
	
	if(!p_args_match) { 
	  return false;
	}

	var kw_args_match = false;
	var keywords_needed = _.keys(this.kw_args);
	var keywords_provided = _.keys(args.kw_args);
	
	if(_.difference(keywords_needed, keywords_provided).length === 0 && 
	   _.difference(keywords_provided, keywords_needed).length === 0)  { 
	  kw_args_match = true;
	}

	return kw_args_match;
      }, 
      /** 
       * @requires args must be accepted, (call ArgumentSpec.accepts(args) before this)
       */
      bind_arguments: function(args) { 
	var self = this;
	if(!self.bound_args) { 
	  self.bound_args = []; 
	}
	for(var i = 0; i < self.p_args.length; i++) { 
	  self.bound_args.unshift(self.p_args[i]);
	  self.R.bind(self.p_args[i], 
		      args.p_args[i]);
	}

	if(self.rest_arg) { 
	  self.bound_args.unshift(self.rest_arg);
	  self.R.bind(self.rest_arg, 
		      args.p_args.slice(self.p_args.length));
	}
	
	_.each(self.kw_args, function(kw_name, kw) { 
	  self.bound_args.unshift(self.kw_name);
	  self.R.bind(kw_name, 
		      args.kw_args[kw]);
	});
      },
      unbind_arguments: function() { 
	var self = this;
	_.each(self.bound_args, function(arg_name) { 
	  self.R.unbind(arg_name);
	});
      }
    };
    
    self.ArgumentSpec = ArgumentSpec;  
    
    /**
     * @desc Lambdas
     */ 
    var Lambda = function(arg_spec, body) { 
      this.arg_spec = arg_spec;
      this.body = body;
    };

    Lambda.prototype = { 
      R: self,
      type: 'lambda',
      toString: function() { 
	return 'Lambda';
      },
      eval: function() { 
	return new this.R.Closure(this.arg_spec, this.body, this.);
      },
      bind_arguments: function(args) { 
	this.arg_spec.bind_arguments(args);
      },
      evaluate: function() { 
	return this.body.eval();
      },
      unbind_arguments: function() { 
	this.arg_spec.unbind_arguments();
      }
    };

    self.Lambda = Lambda;

    var Closure = function(arg_spec, body, env) { 
      this.arg_spec = arg_spec;
      this.body = body;
    };
    
    Closure.prototype = { 
      R: self, 
      type: 'closure',
      toString: function() { 
	return 'Closure';
      },
      eval: function() { 
	return this;
      }

  };



  var Error = function(message) { 
    this.message =  message;
  };

  self.Error = Error;
  global.R = R;

  R.prototype = { 
    list_all: function () { 
      return _.keys(this.names);
    },
    bind: function(name, val) { 
      if(!this.names[name]) { 
	this.names[name] = [];
      }
      this.names[name].unshift(val);
    },
    unbind: function(name) { 
      if(!this.names[name]) {
	throw new Error("Can't unbind " + name + ": no bound values!");
      }
      return this.names[name].shift();
    },
    lookup: function(name) { 
      if(!this.names[name]) { 
	return null;
      }
      return this.names[name][0];
    },
    type: function(obj) { 
      return obj.type;
    },
    eval: function(expr) { 
      return expr.eval();
    }
  };

  return R;

});  
