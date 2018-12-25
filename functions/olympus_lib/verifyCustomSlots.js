'use strict';

const verifyCustomSlots = function(json) {
  return new Promise((resolve, reject) => {
    if (!json.custom_slots || json.custom_slots.length < 0) {
      return reject(new Error("Custom Slots is not set up properly, please check!"));
      
    }
    const slots = json.custom_slots;
    for (let slot of slots) {
      if (!slot.name || !slot.name.match(/(^[A-Z]+([_][A-Z]+){0,}$)/g)) {
        return reject(new Error(slot.name + " is not a valid slot name"));
      } else if (!slot.visibility || !slot.visibility.match(/(^(private|public)$)/g)) {
        return reject(new Error(slot.name + " visibility must be private or public"));
      }
      for (let enumeralID in slot.enumerals) {
        let enumeral = slot.enumerals[enumeralID];
        if (!enumeral.id || !enumeral.id.match(/(^([A-Z]+)$)/g)) {
          return reject(new Error(enumeral.id + " ID isn't not a valid ID"));
        }
        for (let synonymID in enumeral.synonyms) {
          let synonym = enumeral.synonyms[synonymID];
          if (!synonym || !synonym.match(/(^([a-z ]+)$)/g)) {
            return reject(new Error(enumeral.id + "'s synonym '" +synonym+ "' is not a valid value"));
          }
        }
      }
    }
    return resolve();
  });
}

module.exports.verifyCustomSlots = verifyCustomSlots;