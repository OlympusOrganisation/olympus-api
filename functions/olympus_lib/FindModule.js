'use strict';

const FindModule = function(db, processedRequest) {
  return db.collection("modules").where("phrases."+processedRequest.shorthand+".public", "==", true).limit(1)
    .get()
    .then(querySnapshot => {
      let data;
      let first = true;
      querySnapshot.forEach(doc => {
        if (first) {
          data = doc.data();
          first = false;
        }
      });
      console.log(data);
      return {
        intentName: data.phrases[processedRequest.shorthand].intentName,
        moduleID: data.id,
        paramaters: processedRequest.params,
        failed: false
      };
    });
};

module.exports = FindModule;