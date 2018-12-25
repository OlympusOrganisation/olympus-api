'use strict';

const getJSON = require('./getJSON');
const { verifyCustomSlots } = require('./verifyCustomSlots');
const processCustomSlots = require('./processCustomSlots');

const loadSlots = function(db) {
  return db.collection("customSlots").get().then(querySnapshot => {
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