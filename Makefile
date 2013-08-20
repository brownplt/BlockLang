.PHONY: all deps css

all: deps css

deps: ray-deps.js
	@echo "ray-deps.js built."

ray-deps.js: ray/*.js ray/ui/*.js
	closure-library/closure/bin/build/depswriter.py --root_with_prefix="blockly ../../../blockly" --root_with_prefix="ray ../../../ray" > ray-deps.js

css: ray/ui/css/ui.css
	@echo "ray/ui/css/ui.css built."

ray/ui/css/ui.css: ray/ui/less/ui.less ray/ui/less/config.less ray/ui/less/modules/*.less
	lessc ray/ui/less/ui.less > ray/ui/css/ui.css

