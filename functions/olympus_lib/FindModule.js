'use strict';

const findModule = function(db, processedRequest) {
  return db.collection("requestShortHands").doc(processedRequest.shorthand).get()
    .then((doc) => {
      if (doc.exists) {
        processedRequest.intentName = doc.data().intentName;
        processedRequest.moduleID = doc.data().moduleID;
        processedRequest.paramaters = processedRequest.params;
        processedRequest.failed = false;
      } else {
        processedRequest.failed = true;
      }
      return processedRequest;
    })
};

module.exports = findModule;