/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('Ray.Kernel');

goog.require('Ray._');
goog.require('Ray.Util');
goog.require('Ray.Env');
goog.require('Ray.Types');

Ray.Kernel = function() {

  var env = Ray.Env();

  var _ = Ray._;

  var global = window;
  // inject utility functions into the global namespace
  Ray.Util().install(global);

  var make_expr = function(r,type,obj) {
    var proto = {};
    _.extend(proto, obj);
    proto.toString = function() { return type + 'E'; };
    proto.__node_type__ = type.toLocaleLowerCase() + 'E';
    proto.R = r;
    proto.expr = true;
    return proto;
  };

  var make_value = function(r,type,obj) {
    var proto = {};
    _.extend(proto, obj);
    proto.toString = function() { return type; };
    proto.__node_type__ = type.toLocaleLowerCase();
    proto.R = r;
    proto.interp = function() {
      throw new Error(type + " has no interp method!!!");
    };
    proto.value = true;
    return proto;
  };

  var attach_value_node = function(r,Node,type,obj) {
    function Builder(args) {
      return Node.apply(this, args);
    }
    Builder.prototype = make_value(r,type,obj);
    var NodeConstructor = function() {
      var node = new Builder(arguments);
      //console.log('Making ' + Builder.prototype.type);
      if(!node.__proto__.__node_type__) { throw new Error("No type set for this expr!!"); }
      return node;
    };
    r.Value[type] = NodeConstructor;
    Builder.prototype.__node_constructor__ = NodeConstructor;
  };

  var attach_expr_node = function(r,Node,type,obj) {
    function Builder(args) {
      return Node.apply(this, args);
    }
    Builder.prototype = make_expr(r,type,obj);
    var NodeConstructor = function() {
      var node = new Builder(arguments);
      //console.log('Making ' + Builder.prototype.type);
      if(!node.__proto__.__node_type__) { throw new Error("No type set for this expr!!"); }
      return node;
    };
    r.Expr[type] = NodeConstructor;
    Builder.prototype.__node_constructor__ = NodeConstructor;
  };

  /**
   * @desc Values
   */
  var Pair = product(['car','cdr']);
  Pair.proto = {
    clone: clone_constructor,
    display: function() { 
      return '(' + this.R.display(this.car) + ' . ' + this.R.display(this.cdr) + ')';
    }
  };

  var Empty = product([]);
  Empty.proto = {
    clone: clone_constructor,
    display: function() { 
      return '()';
    }
  };

  var Boolean = product(['b']);
  Boolean.proto = {
    clone: clone_constructor,
    display: function() {
      return this.b ? "#t" : "#f";
    }
  };

  var Num = product(['n']);
  Num.proto = {
    clone: clone_constructor,
    display: function() { 
      return String(this.n);
    }
  };

  var Str = product(['s']);
  Str.proto = {
    clone: clone_constructor,
    display: function() {
      return "\"" + this.s + "\"";
    }
  };

  var Char = product(['c']);
  Char.proto = {
    clone: clone_constructor,
    display: function() {
      return "#\\" + this.c;
    }
  }

  var Primitive = product(['arg_spec', 'f'], ['f_type']);
  Primitive.proto = {
    clone: clone_constructor,
    bind_arguments: function(args) {      
	    this.args = this.R.interp(args);
    },
    evaluate_body: function() {
	    var args = [];
	    var p_args = this.args.p_args;
	    var num_p_args = this.arg_spec.p_args.length;
	    for(var i = 0; i < num_p_args; i++) {
	      args.push(p_args[i]);
	    }
      var kw_args = this.args.kw_args;
      if(kw_args.length > 0) {
        // I don't handle kw_args at the moment in primitives!!!
        throw new Error("Keyword arguments not supported for primitives");
      }

	    args.push(p_args.slice(num_p_args)); // rest_arg
	    return this.f.apply(this, args);
    },
    unbind_arguments: function() {
	    this.args = null;
    },
    display: function() { 
      return '(primitive ' + this.R.display(this.arg_spec) + ' ...)';
    }
  };

  var Closure = product(['arg_spec', 'body', 'envs'], ['body_type']);
  Closure.proto = {
    clone: function() {
      return new this.R.Value.Closure(this.R.clone(this.arg_spec), 
                                      this.R.clone(this.body),
                                      this.R.clone_envs(this.envs),
                                      this.body_type);
    },
    bind_arguments: function(args) {
      if(!this.saved_envs) { this.saved_envs = []; }
      var arg_env = this.arg_spec.bind_arguments(args);
      this.saved_envs.unshift(this.R.swap_envs(this.envs));
      this.R.push_env(arg_env);

    },
    evaluate_body: function() {
      this.R.record_function_call(this, this.__name__);
	    return this.R.interp(this.body);
    },
    unbind_arguments: function() {
      this.arg_spec.unbind_arguments();
      this.R.swap_envs(this.saved_envs.shift());
    },
    display: function() { 
      return '(lambda ' + this.R.display(this.arg_spec) + ' ' + this.R.display(this.body) + ')';
    }
  };

  var ArgumentSpec = product(['p_args', 'kw_args', 'rest_arg'], ['arguments_type']);
  ArgumentSpec.proto = { 
    clone: function() { 
      return new this.R.Value.ArgumentSpec(_.map(this.p_args, _.identity),
                                           _.clone(this.kw_args),
                                           this.rest_arg);
    },
    /**
     * @desc Does the provided arguments object match the argument specification,
     * so that it is a valid function call?
     */
    accepts: function(args) {
	    var p_args_match = (args.p_args.length === this.p_args.length) ||
        (this.rest_arg && (args.p_args.length > this.p_args.length));
	    if(!p_args_match) {
	      return false;
	    }
	    var keywords_needed = _.keys(this.kw_args);
	    var keywords_provided = _.keys(args.kw_args);
	    return (_.difference(keywords_needed, keywords_provided).length === 0) &&
        (_.difference(keywords_provided, keywords_needed).length === 0);
    },
    /**
     * @requires args must be accepted, (call ArgumentSpec.accepts(args) before this)
     */
    bind_arguments: function(args) {
      var env = this.R.get_env();
	    var self = this;
	    self.bound_args = self.bound_args || [];
	    for(var i = 0; i < self.p_args.length; i++) {
	      env = env.extend(self.p_args[i], self.R.interp(args.p_args[i]));
	    }

	    if(self.rest_arg) {
	      env = env.extend(self.rest_arg, _.map(args.p_args.slice(self.p_args.length), self.R.interp));
	    }
	    _.each(self.kw_args, function(kw_name, kw) {
	      env = env.extend(kw_name, self.R.interp(args.kw_args[kw]));
	    });

      return env;
    },
    unbind_arguments: function() {
      return this.R.pop_env();
    },
    display: function() { 
      return '(' + this.p_args.concat(
          _.map(this.kw_args, function(v,k) { return '#:' + k + ' ' + v; })).concat(
          (this.rest_arg ? ['. ' + this.rest_arg] : [])).join(' ') + ')';
    }
  };

  var Arguments = product(['p_args','kw_args']);
  Arguments.proto = {
    clone: function() {
      return new this.R.Value.Arguments(_.map(this.p_args, _.identity), _.clone(this.kw_args));
    }
  };

  /////////////////////////////////////////////////////// Expressions

  var PairExpr = product(['car','cdr']);
  PairExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Pair(this.R.interp(this.car), 
                                   this.R.interp(this.cdr));
    },
    display: function() { 
      return '(' + this.R.display(this.car) + ' . ' + this.R.display(this.cdr) + ')';
    }
  };

  var EmptyExpr = product([]);
  EmptyExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Empty();
    },
    display: function() { 
      return '()';
    }
  };

  var BooleanExpr = product(['b']);
  BooleanExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Boolean(this.b);     
    },
    display: function() { 
      return this.b ? "#t" : "#f";
    }
  };

  var NumExpr = product(['n']);
  NumExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Num(this.n);
    },
    display: function() { 
      return String(this.n);
    }
  };

  var StrExpr = product(['s']);
  StrExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Str(this.s);
    },
    display: function() {
      return "\"" + this.s + "\"";
    }
  };

  var CharExpr = product(['c']);
  CharExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Char(this.c);
    },
    display: function() {
      return "#\\" + this.c;
    }
  };

  var PrimitiveExpr = product(['arg_spec', 'f'], ['f_type']);
  PrimitiveExpr.proto = {
    clone: clone_constructor,
    interp: function() {
      return new this.R.Value.Primitive(this.R.interp(this.arg_spec), this.f, this.f_type);
    },
    display: function() { 
      return '(primitive ' + this.R.display(this.arg_spec) + ' ...)';
    }
  };

  var If = product(['pred', 't_expr', 'f_expr']);
  If.proto = {
    clone: clone_constructor,
    interp: function() {
      var pred_value = this.R.interp(this.pred);
      return this.R.interp(pred_value.b ? this.t_expr : this.f_expr);
    },
    display: function() { 
      return ['(if',
              this.R.display(this.pred),
              this.R.display(this.t_expr),
              this.R.display(this.f_expr) + ')'].join(' ');
    }
  };

  // Note that at least one clause must be present, but it can be an else clause!!
  var Cond = product(['test_clauses', 'else_clause']);
  Cond.proto = {
    clone: function() {
      var self = this;
      var test_clause_clones = _.map(this.test_clauses, function(test_clause) {
        return [self.R.clone(test_clause[0]), self.R.clone(test_clause[1])];
      });

      var else_clause_clone = self.R.clone(this.else_clause);
      return new self.R.Expr.Cond(test_clause_clones, else_clause_clone);
    },
    interp: function() {
      if(this.test_clauses.length === 0 && !this.else_clause) {
        throw new Error("At least 1 clause required in cond form!");
      }
      for(var i = 0; i < this.test_clauses.length; i++) {
        var test_value = this.R.interp(this.test_clauses[i][0]);
        if(this.R.node_type(test_value) !== 'boolean' || test_value.b) {
          return this.R.interp(this.test_clauses[i][1]);
        }
      }
      if(this.else_clause) {
        return this.R.interp(this.else_clause);
      } else {
        throw new Error("All test results were false, and no else clause provided!");
      }
    },
    display: function() {
      var self = this;
      var displayed_clauses = _.map(this.test_clauses, function(clause) {
        return '[' + self.R.display(clause[0]) + ' ' + self.R.display(clause[1]) + ']';
      });
      if(this.else_clause) {
        displayed_clauses.push('[else ' + this.R.display(this.else_clause) + ']');
      }
      return ['(cond'].concat(displayed_clauses).join(' ') + ')';
    }
  };

  var And = product(['args']);
  And.proto = {
    clone: function() {
      var self = this;
      return new this.R.Expr.And(_.map(this.args, function(arg) { 
        return self.R.clone(arg);
      }));
    },
    interp: function() {
      var arg_val = new this.R.Value.Boolean(true);
      for(var i = 0; i < this.args.length; i++) {
        arg_val = this.R.interp(this.args[i]);
        if((this.R.node_type(arg_val) === 'boolean') && (arg_val.b === false)) {
            return new this.R.Value.Boolean(false);
        }
      }
      return arg_val;
    },
    display: function() {
      var self = this;
      var displayed_args = _.map(this.args, self.R.display).join(' ');
      return '(and'  + (displayed_args ? ' ' : '') + displayed_args + ')';
    }
  };

  var Or = product(['args']);
  Or.proto = {
    clone: function() {
      var self = this;
      return new this.R.Expr.Or(_.map(this.args, function(arg) { 
        return self.R.clone(arg); 
      }));
    },
    interp: function() {
      var arg_val;
      for(var i = 0; i < this.args.length; i++) {
        arg_val = this.R.interp(this.args[i]);
        if((this.R.node_type(arg_val) !== 'boolean') || (arg_val.b === true)) {
            return arg_val;
        }
      }
      return new this.R.Value.Boolean(false);
    },
    display: function() {
      var self = this;
      var displayed_args = _.map(this.args, self.R.display).join(' ');
      return '(or'  + (displayed_args ? ' ' : '') + displayed_args + ')';
    }
  };

  /**
   * @desc Names/Identifiers
   */
  var Name = product(['name']);
  Name.proto = {
    clone: clone_constructor,
    interp: function() {
        var result = this.R.lookup(this.name);
	    if(result) {
            return result;
        } else {
            throw new Error('Unbound identifier: \'' + this.name + '\'');
        }
    }, 
    display: function() { 
      return this.name;
    }
  };

  /**
   * @desc Arguments objects
   */
  var ArgumentsExpr = product(['p_args','kw_args']);
  ArgumentsExpr.proto = {
    clone: function() {
      return new this.R.Expr.Arguments(_.map(this.p_args, _.identity), _.clone(this.kw_args));
    },
    interp: function() {
	    var self = this;
	    var p_arg_values = _.map(this.p_args, self.R.interp, self.R);
	    var kw_arg_values = {};
	    _.each(this.kw_args, function(kw_arg_expr, kw) {
	      kw_arg_values[kw] = self.R.interp(kw_arg_expr);
	    });
      return new this.R.Value.Arguments(p_arg_values, kw_arg_values);
    },
    display: function() {
      var self = this;
      return _.map(this.p_args, self.R.display).join(' ') +
        (_.map(this.kw_args, function(v,k) { return '#:' + k + ' ' + self.R.display(v); })).join(' ') +
        (this.rest_arg ? ' . ' + self.R.display(this.rest_arg) : '');
    }
  };

  /**
   * @desc Function Applications
   */
  var App = product(['f', 'args']);
  App.proto = {
    clone: clone_constructor,
    interp: function() {
	    var f_value = this.R.interp(this.f);
	    if(!(this.R.node_type(f_value) === 'closure' ||
	         this.R.node_type(f_value) === 'primitive')) {
	      throw new Error("Tried to apply a non-function");
	    }
	    if(!f_value.arg_spec.accepts(this.args)) {
	      throw new Error("Arity mismatch in function application");
	    }

	    f_value.bind_arguments(this.args);
	    var body_val = f_value.evaluate_body();
	    f_value.unbind_arguments();

	    return body_val;
    },
    display: function() {
      var displayed_args = this.R.display(this.args);
      return '(' + this.R.display(this.f) + (displayed_args ? ' ' : '') + displayed_args + ')';
    }
  };

  /**
   * @desc Argument specification for a function
   */
  var ArgumentSpecExpr = product(['p_args', 'kw_args', 'rest_arg'], ['arguments_type']);
  ArgumentSpecExpr.proto = {
    clone: function() { 
      return new this.R.Expr.ArgumentSpec(_.map(this.p_args, _.identity),
                                          _.clone(this.kw_args),
                                          this.rest_arg,
                                          this.arguments_type);
    },
    interp: function() {
      return new this.R.Value.ArgumentSpec(_.map(this.p_args, _.identity),
                                          _.clone(this.kw_args),
                                          this.rest_arg,
                                          this.arguments_type);
    },
    display: function() {
      var args = _.map(this.p_args, _.identity);
      _.each(this.kw_args, function(v,k) {
        args = args.concat('#:' + k, v);
      });
      if(this.rest_arg) {
        args = args.concat('.', this.rest_arg);
      }
      return '(' + args.join(' ') + ')';
    }
  };

  /**
   * @desc Lambdas
   */
  var Lambda = product(['arg_spec', 'body'], ['body_type']);
  Lambda.proto = {
    clone: clone_constructor,
    interp: function() {
	    return new this.R.Value.Closure(this.R.interp(this.arg_spec), this.R.clone(this.body), this.R.clone_envs(), this.body_type);
    },
    display: function() {
      return ['(lambda',
              this.R.display(this.arg_spec),
              this.R.display(this.body) + ')'].join(' ');
    }
  };

  var Error = function(message) {
    this.message =  message;
  };

  self.Error = Error;
  global.R = R;

  var R = function(dict, config) {
    this.envs = [];
    this.top_level = env.empty_env();
    this.builtins = env.empty_env();
    this.function_call_limit = (config ? config.function_call_limit : 100) || 100;
    var self = this;

    this.Value = {};
    attach_value_node(self,Pair,'Pair',Pair.proto);
    attach_value_node(self,Empty,'Empty',Empty.proto);
    attach_value_node(self,Num,'Num',Num.proto);
    attach_value_node(self,Boolean,'Boolean',Boolean.proto);
    attach_value_node(self,Primitive,'Primitive',Primitive.proto);
    attach_value_node(self,Closure,'Closure',Closure.proto);
    attach_value_node(self,ArgumentSpec,'ArgumentSpec',ArgumentSpec.proto);
    attach_value_node(self,Arguments,'Arguments',Arguments.proto);
    attach_value_node(self,Str,'Str',Str.proto);

    this.Expr = {};
    attach_expr_node(self,PairExpr,'Pair',PairExpr.proto);
    attach_expr_node(self,EmptyExpr,'Empty',EmptyExpr.proto);
    attach_expr_node(self,NumExpr,'Num',NumExpr.proto);
    attach_expr_node(self,BooleanExpr,'Boolean',BooleanExpr.proto);
    attach_expr_node(self,PrimitiveExpr,'Primitive',PrimitiveExpr.proto);
    attach_expr_node(self,StrExpr,'Str',StrExpr.proto);
    attach_expr_node(self,Lambda,'Lambda',Lambda.proto);

    attach_expr_node(self,Name,'Name',Name.proto);
    attach_expr_node(self,Cond,'Cond',Cond.proto);
    attach_expr_node(self,If,'If',If.proto);
    attach_expr_node(self,And,'And',And.proto);
    attach_expr_node(self,Or,'Or',Or.proto);
    attach_expr_node(self,App,'App',App.proto);
    attach_expr_node(self,ArgumentsExpr,'Arguments',ArgumentsExpr.proto);
    attach_expr_node(self,ArgumentSpecExpr,'ArgumentSpec',ArgumentSpecExpr.proto);                      
  };

  R.prototype = {
    builtins_bind: function(name, val) {
      var value = this.interp(val);
      if(this.builtins.lookup(name)) {
        throw new Error("Trying to change a builtin binding: " + name);
      } else {
        this.builtins = this.builtins.extend(name, value);
        value.__name__ = name;
      }
    },
    top_level_bind: function(name, val) {
      var value = this.interp(val);
      this.top_level = this.top_level.extend(name, value);
      value.__name__ = name;
    },
    local_bind: function(name, val) {
      var value = this.interp(val);
      var tmp = this.envs[0].lookup(name);
      this.envs[0] = this.envs[0].extend(name, value);
      return tmp || null;
    },
    bind: function(name, val) {
      this.top_level_bind(name, val);
    },
    lookup: function(name) {
      var value;
      for(var i = 0; i < this.envs.length; i++) {
        value = this.envs[i].lookup(name);
        if(value) {
          return value;
        }
      }
      value = this.top_level.lookup(name);
      if(value) {
        return value;
      }
      value = this.builtins.lookup(name);
      if(value) {
        return value;
      }

      return null;
    },
    node_type: function(obj) {
      return obj.__node_type__;
    },
    clone: function(expr) {
      return expr.clone();
    },
    set_stop: function(should_stop) {
      if(arguments.length === 0) {
        this.should_stop = true;
      } else {
        this.should_stop = should_stop;
      }
      return this.should_stop;
    },
    stop: function() {
      this.envs = [];
      var name = this.current_function_name;
      this.current_function = null;
      this.function_call_count = 0;
      throw new Error("Stopping in:" + (name ? name : "**unknown**"));
    },
    record_function_call: function(f, name) {
      if(name) { 
        this.current_function_name = name;
      }
      
      if(this.current_function === f) {
        // Increment calls to this function
        this.function_call_count++;
        if(this.function_call_count > this.function_call_limit) {
          this.should_stop = true;
        }
      } else {
        // Reset current function name and start function call count at 1
        this.current_function = f;
        this.function_call_count = 1;
      }
    },
    interp: function(expr) {
      if(this.should_stop) {
        return this.stop();
      } else {
        return expr.interp();
      }
    },
    eval: function(expr) {
      if(!expr.expr) {
        throw new Error("Can't evaluate a non-expression!!");
      }

      /* try { */
        return this.interp(expr);
      /* } catch (e) {
        console.log(e);
        throw e;

      }
      */
    },
    swap_envs: function(envs) {
      var tmp_envs = this.envs;
      this.envs = envs;
      return tmp_envs;
    },
    get_env: function() {
      return env.empty_env();
    },
    push_env: function(env) {
      this.envs.unshift(env);
    },
    pop_env: function() {
      return this.envs.shift();
    },
    clone_envs: function(envs) {
      var old_envs = envs || this.envs;
      return _.map(old_envs, function(env) {
        return env.clone();
      });
    },
    display: function(expr) { 
      return expr.display();
    },
    quote: function(str) { 
      return "'" + str;
    }
  };

  /**
   * @desc Helper object to make constructing all this stuff easier
   */
  R.prototype.make_helper = function() {
    var r = this;
    return {
      app: function(f, args) {
	      return new r.Expr.App(f, args);
      },
      prim: function(arg_spec, f, f_type) {
	      return new r.Expr.Primitive(arg_spec, f, f_type);
      },
      args: function(p_args, kw_args) {
	      return new r.Expr.Arguments(p_args, kw_args);
      },
      p_args: function(/* args */) { 
        return new r.Expr.Arguments(Array.prototype.slice.call(arguments,0), {});
      },
      name: function(name_arg) {
	      return new r.Expr.Name(name_arg);
      },
      spec: function(p_args, kw_args, rest_arg) {
        var p_arg_names = _.map(p_args, function(p_arg) { return p_arg[0]; });
        var p_arg_types = _.map(p_args, function(p_arg) { return p_arg[1]; });
        var rest_arg_name = rest_arg[0];
        var rest_arg_type = rest_arg[1];
        return new r.Expr.ArgumentSpec(p_arg_names,
                                       kw_args,
                                       rest_arg_name,
                                       Ray.Types.args(Ray.Types.ty_list(p_arg_types),
                                                      Ray.Types.ty_n_arity(rest_arg_type)));
      },
      p_spec: function(/* args */) {
        var args = _.toArray(arguments);
        var arg_names = _.map(args, function(arg) { return arg[0]; });
        var arg_types = _.map(args, function(arg) { return arg[1]; });
        return new r.Expr.ArgumentSpec(arg_names,
                                       {}, // kw_args
                                       null, // rest_arg
                                       Ray.Types.args(Ray.Types.ty_list(arg_types), null)); // Type annotations
      },
      kw_spec: function(args, arg_types) {
        // Ignoring kw_args for now
        throw new Error("kw_args not implemented yet!");
        // return new r.Expr.ArgumentSpec([], args, null, arg_types);
      },
      rest_spec: function(name, type) {
        return new r.Expr.ArgumentSpec([], {}, name, Ray.Types.rest_arg(type));
      },
      fn: function(arg_spec, body, body_type) {
	      return new r.Expr.Lambda(arg_spec, body, body_type);
      },
      num: function(n) {
        return new r.Expr.Num(n);
      },
      str: function(s) {
        return new r.Expr.Str(s);
      },
      char: function(c) {
          return new r.Expr.Char(c);
      },
      pair: function(car, cdr) {
        return new r.Expr.Pair(car, cdr);
      },
      empty: function() {
        return new r.Expr.Empty();
      },
      bool: function(b) {
        return new r.Expr.Boolean(b);
      },
      cond: function(test_clauses, else_clause) {
        if(test_clauses.length === 0 && !else_clause) {
          throw new Error("At least one clause needed in cond form!");
        } else {
          return new r.Expr.Cond(test_clauses, else_clause || null);
        }
      },
      _if: function(p, t, f) {
        return new r.Expr.If(p, t, f);
      },
      and: function(/* args */) {
        return new r.Expr.And(Array.prototype.slice.call(arguments, 0));
      },
      or: function(/* args */) {
        return new r.Expr.Or(Array.prototype.slice.call(arguments, 0));
      }
    };
  };

  return R;

};
