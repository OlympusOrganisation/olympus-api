'use strict';

var srxp = require('simple-regexp'); 
var stringToRegExp = require('string-to-regexp');

const processCustomSlots = function(slots) {
  let result = {};
  result.processedSlots = {};
  for (var slot of slots) {
    result.processedSlots[slot.name] = {};
    for (let enumeralID in slot.enumerals) {
      let enumeral = slot.enumerals[enumeralID];
      let regexStr = enumeral.synonyms.join("|");
      let RegExp = stringToRegExp("/(" + regexStr + ")/g");
      result.processedSlots[slot.name][enumeral.id] = RegExp;
    }
  }
  result.process = function(obj) {
    for (var slotID in this.processedSlots) {
      let slot = this.processedSlots[slotID];
      for (let RegExpID in slot) {
        let RegExp = slot[RegExpID];
        let matches = obj.shorthand.match(RegExp);
        if (matches !== null) {
          for (let matchID in matches) {
            let match = matches[matchID];
            obj.params.push({type: slotID, value: match})
          }          
          obj.shorthand = obj.shorthand.replace(RegExp, "{" + slotID + "}");
        }
      }
    }
    return obj;
  }
  return result;
}

module.exports = processCustomSlots;