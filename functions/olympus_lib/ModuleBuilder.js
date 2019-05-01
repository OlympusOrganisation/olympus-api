'use strict';
const responseBuilder = require("../olympus_lib/responseBuilder");

class ModuleBuilder {
  constructor() {
    this.handlers = [];
    this.stores = [];
    this.loaded = false;
  }

  getIntentList() {
    const intentList = this.handlers.map(h => h.intentName);
    return intentList.filter((item, pos) => {
      return intentList.indexOf(item) === pos;
    });
  }

  getPhrasesForIntent(intentName) {
    for (var handler of this.handlers) {
      if (handler.intentName === intentName)
        return handler.phrases;
    }
    return [];
  }
  
  process(moduleHandler) {
    moduleHandler.responseBuilder = responseBuilder;
    for (var i in this.handlers) {
      const handler = this.handlers[i];
      if (handler.canHandle(moduleHandler))
        return handler.handle(moduleHandler);
    }
    return null;
  }
  
  addRequestHandlers() {
    const params = arguments;
    for (var handler of params)
      this.handlers.push(handler);
    return this;
  }
  
  addDataStore() {
    const params = arguments;
    for (var store of params)
      this.stores.push(store);
    return this;
  }
  
  lambda() {
    this.loaded = true;
    return this;
  }
}
const moduleBuilder = new ModuleBuilder();

module.exports = moduleBuilder;