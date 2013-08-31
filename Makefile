.PHONY: deps css production development compiled

RAY_JS := $(wildcard ray/*.js) $(wildcard ray/ui/*.js) $(wildcard ray/blocks/*.js) $(wildcard ray/lang/*.js)
BLOCKLY_JS := $(wildcard blockly/core/*.js)
MAIN_PAGE_NAME := demo
MAIN_PAGE := $(MAIN_PAGE_NAME).html
MAIN_PAGE_TEMPLATE := $(MAIN_PAGE_NAME)_template.html

DEV_PREFIX := dev
DEV_PAGE := $(DEV_PREFIX)_$(MAIN_PAGE_NAME).html

all: production development

# This should be the deployed page
production: compiled css $(MAIN_PAGE) 
	@echo "finished building for production."
$(MAIN_PAGE): $(MAIN_PAGE_TEMPLATE)
	sed -e 's/<!--PRODUCTION \(.*\)-->/\1/' -e '/<!--PRODUCTION/ d' -e '/PRODUCTION-->/ d' $(MAIN_PAGE_TEMPLATE) > $(MAIN_PAGE)

# Loads less dynamically, loads js dynamically
development: deps $(DEV_PAGE)
	@echo "finished building for development."
$(DEV_PAGE): $(MAIN_PAGE_TEMPLATE)
	sed -e 's/<!--DEVELOPMENT \(.*\)-->/\1/' -e '/<!--DEVELOPMENT/ d' -e '/DEVELOPMENT-->/ d' $(MAIN_PAGE_TEMPLATE) > $(DEV_PAGE)

# Compilation
compiled: app_compiled.js
	@echo "finished compiling ray and blockly."
app_compiled.js: $(RAY_JS) $(BLOCKLY_JS) app.js
	closure-library/closure/bin/build/closurebuilder.py \
    --root="ray" \
    --root="blockly" \
    --root="closure-library" app.js \
    --output_mode="compiled" \
    --namespace="Ray.App" \
    --compiler_jar="compiler.jar" \
    --output_file="app_compiled.js"

# Deps for uncompiled mode
deps: ray-deps.js
	@echo "ray-deps.js built."
ray-deps.js: $(RAY_JS) 
	closure-library/closure/bin/build/depswriter.py --root_with_prefix="blockly ../../../blockly" --root_with_prefix="ray ../../../ray" > ray-deps.js

# LESS -> CSS
css: ray/ui/css/ui.css
	@echo "ray/ui/css/ui.css built."
ray/ui/css/ui.css: ray/ui/less/ui.less ray/ui/less/config.less ray/ui/less/modules/*.less
	lessc ray/ui/less/ui.less > ray/ui/css/ui.css


