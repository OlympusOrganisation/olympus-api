'use strict';

const processCustomSlots = require('./processSlots');

const loadSlots = function(db) {
  return db.collection("slots").get().then(querySnapshot => {
    let slots = [];
    querySnapshot.forEach(doc => {
      slots.push(doc.data());
    });
    return slots;
  }).then(slots => {
    for (var slotID in slots) {
      slots[slotID] = processCustomSlots(slots);
    }
    return slots;
  })
}

module.exports = loadSlots;