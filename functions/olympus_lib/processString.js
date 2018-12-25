'use strict';

const loadSlots = require('./loadSlots');

const processString = function(db, string) {
  return loadSlots(db).then(slots => {
    let requestObj = {
      str: string,
      shorthand: string,
      params: []
    };
    for (var slotID in slots) {
      requestObj = slots[slotID].process(requestObj);
    }
    return requestObj;
  });
};

module.exports = processString;