.PHONY: deps css production development compile

CLOSURE_BUILDER := closure-library/closure/bin/build/closurebuilder.py
DEPS_WRITER := closure-library/closure/bin/build/depswriter.py

JS_ROOT_DIRS := --root="ray" --root="blockly" --root="closure-library"

COMPILE_FLAGS := --output_mode="compiled" --compiler_jar="compiler.jar"
COMPILED_TARGETS := app_compiled.js ray/fun_def_blockly_compiled.js ray/main_blockly_compiled.js ray/read_only_blockly_compiled.js


RAY_JS := $(wildcard ray/*.js) $(wildcard ray/ui/*.js) $(wildcard ray/blocks/*.js) $(wildcard ray/lang/*.js)
BLOCKLY_JS := $(wildcard blockly/core/*.js)

all: $(COMPILED_TARGETS)

# This should be the deployed page
production: $(COMPILED_TARGETS) css
	@echo "finished building for production."

# Loads less dynamically, loads js dynamically
development: deps
	@echo "finished building for development."

# Compilation
compile: $(COMPILED_TARGETS)
	@echo "finished compiling ray and blockly."

app_compiled.js: $(RAY_JS) $(BLOCKLY_JS) app.js
	$(CLOSURE_BUILDER) $(JS_ROOT_DIRS) $(COMPILE_FLAGS) \
    app.js --namespace="Ray.App" --output_file="app_compiled.js"

ray/read_only_blockly_compiled.js: $(RAY_JS) $(BLOCKLY_JS) ray/blockly/read_only_blockly.js
	$(CLOSURE_BUILDER) $(JS_ROOT_DIRS) $(COMPILE_FLAGS) \
    --namespace="Ray.ReadOnlyBlockly" --output_file="ray/blockly/read_only_blockly_compiled.js"

ray/fun_def_blockly_compiled.js: $(RAY_JS) $(BLOCKLY_JS) ray/blockly/fun_def_blockly.js
	$(CLOSURE_BUILDER) $(JS_ROOT_DIRS) $(COMPILE_FLAGS) \
    --namespace="Ray.FunDefBlockly" --output_file="ray/blockly/fun_def_blockly_compiled.js"

ray/main_blockly_compiled.js: $(RAY_JS) $(BLOCKLY_JS) ray/blockly/main_blockly.js
	$(CLOSURE_BUILDER) $(JS_ROOT_DIRS) $(COMPILE_FLAGS) \
    --namespace="Ray.MainBlockly" --output_file="ray/blockly/main_blockly_compiled.js"

# Deps for uncompiled mode
deps: ray-deps.js
	@echo "ray-deps.js built."
ray-deps.js: $(RAY_JS) 
	$(DEPS_WRITER) --root_with_prefix="blockly ../../../blockly" --root_with_prefix="ray ../../../ray" > ray-deps.js

# LESS -> CSS
css: ray/ui/css/ui.css
	@echo "ray/ui/css/ui.css built."
ray/ui/css/ui.css: ray/ui/less/ui.less ray/ui/less/config.less ray/ui/less/modules/*.less
	lessc ray/ui/less/ui.less > ray/ui/css/ui.css


