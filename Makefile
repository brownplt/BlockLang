.PHONY: assets deps css production development

all: production development assets

production: assets demo.html

development: assets dev_demo.html

demo.html: demo_template.html
	sed 's/<!--PRODUCTION \(.*\)-->/\1/' demo_template.html > demo.html

dev_demo.html: demo_template.html
	sed 's/<!--DEVELOPMENT \(.*\)-->/\1/' demo_template.html > dev_demo.html


assets: deps css

deps: ray-deps.js
	@echo "ray-deps.js built."

ray-deps.js: ray/*.js ray/ui/*.js
	closure-library/closure/bin/build/depswriter.py --root_with_prefix="blockly ../../../blockly" --root_with_prefix="ray ../../../ray" > ray-deps.js

css: ray/ui/css/ui.css
	@echo "ray/ui/css/ui.css built."

ray/ui/css/ui.css: ray/ui/less/ui.less ray/ui/less/config.less ray/ui/less/modules/*.less
	lessc ray/ui/less/ui.less > ray/ui/css/ui.css

