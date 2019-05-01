'use strict';
const {NodeVM} = require('vm2');
const ModuleBuilder = require('./ModuleBuilder');

const vm = new NodeVM({
  sandbox: {ModuleBuilder},
});

const GetIntents = function(code) {
    let moduleCompiled = vm.run(code);
    return moduleCompiled.getIntentList();
};

module.exports = GetIntents;