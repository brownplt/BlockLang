
.PHONY: deps
deps: ray/*.js
	closure-library-read-only/closure/bin/build/depswriter.py --root_with_prefix="blockly ../../../blockly" --root_with_prefix="ray ../../../ray" > ray/ray-deps.js