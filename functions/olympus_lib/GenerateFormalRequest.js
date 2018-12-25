'use strict';

const handlerInput = function(requestType, intentName, intentParameters) {
  return {
      "request": {
        "type": requestType, // "LaunchRequest|IntentRequest|SessionEndedRequest",
        "requestId": "string",
        "timestamp": new Date().toISOString(),
        "locale": "en-GB",
        "intent": {
          "name": intentName,
          "paramaters": intentParameters,
        }
      },
    attributesManager: {}
  }
}
module.exports = handlerInput;