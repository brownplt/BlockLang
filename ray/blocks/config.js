
goog.provide('Ray.Blocks.Config');

Ray.Blocks.Config.INPUT_CATEGORY_NAME = 'input';
Ray.Blocks.Config.OUTPUT_CATEGORY_NAME = 'output';
Ray.Blocks.Config.USER_FUN_CATEGORY_NAME = 'functions';
Ray.Blocks.Config.CONTROL_CATEGORY_NAME = 'control';
Ray.Blocks.Config.ARGUMENT_CATEGORY_NAME = 'arguments';
Ray.Blocks.Config.LIST_CATEGORY_NAME = 'list';
Ray.Blocks.Config.ALL_CATEGORY_NAME = 'all';


Ray.Blocks.Config.categoryKeyToDisplayName = function(category) {
  if(category === Ray.Blocks.Config.INPUT_CATEGORY_NAME) {
    return 'consumes';
  } else if(category === Ray.Blocks.Config.OUTPUT_CATEGORY_NAME) {
    return 'produces';
  } else {
    return category;
  }
};

