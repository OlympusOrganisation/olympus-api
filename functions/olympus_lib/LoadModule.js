'use strict';
const {NodeVM, VMScript} = require('vm2');
const ModuleBuilder = require('./ModuleBuilder');

const vm = new NodeVM({
  sandbox: {ModuleBuilder},
});

const LoadModule = function(db, request) {
  return db.collection("modules").doc(request.moduleID).get()
    .then((doc) => {
      if (doc.exists) {
        const code = doc.data().code;
        let moduleAdd = vm.run(code);
        return moduleAdd;
      } else {
        return null;
      }
    }).catch(e => {
      console.log(e);
    });
};

module.exports = LoadModule;