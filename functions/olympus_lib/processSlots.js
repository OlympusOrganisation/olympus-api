'use strict';

var stringToRegExp = require('string-to-regexp');

const processSlots = function(slots) {
  let result = {};
  result.processedSlots = {};
  for (var slot of slots) {
    result.processedSlots[slot.name] = {
      regex: stringToRegExp(slot.regex),
      values: []
    };
    for (let valueID in slot.values) {
      let value = slot.values[valueID];
      result.processedSlots[slot.name][valueID] = stringToRegExp("/"+value.join("|")+"/g");
    }
  }
  result.process = function(obj) {
    for (var slotID in this.processedSlots) {
      const result = obj.str.match(this.processedSlots[slotID].regex);
      if (result !== null)
        for (let matched in result) {
          for (let valueID in this.processedSlots[slotID].values) {
            if (matched.match(this.processedSlots[slotID].values[valueID])) {
              let match = matches[matchID];
              obj.params.push({type: slotID, value: match});
              obj.shorthand = obj.shorthand.replace(matched, "{" + slotID + "}");
            }
          }
        }
    }
    return obj;
  }

  return result;
}

module.exports = processSlots;