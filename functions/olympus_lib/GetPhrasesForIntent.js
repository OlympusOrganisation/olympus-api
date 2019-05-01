'use strict';
const {NodeVM} = require('vm2');
const ModuleBuilder = require('./ModuleBuilder');

const vm = new NodeVM({
  sandbox: {ModuleBuilder},
});

const getPhrasesForIntent = function(code, intentName) {
    let moduleCompiled = vm.run(code);
    return moduleCompiled.getPhrasesForIntent(intentName);
};

module.exports = getPhrasesForIntent;