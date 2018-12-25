'use strict';
const HelloWorld = {
  canHandle(handler) {
      return handler.requestEnvelope.request.intent.name === 'helloWorld';
  },
  handle(handlerInput) {
    const randomFact = "Random Fact"
    const speakOutput = "Did you know " + randomFact;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();   
  },
} 
const HelloWorld2 = {
  canHandle(handler) { 
    return handler.requestEnvelope.request.intent.name === 'helloWorld2';
  }, 
  handle(handlerInput) { 
    const randomFact = "Random Fact2";
    const speakOutput = "Did you know " + randomFact; 
    return handlerInput.responseBuilder       
      .speak(speakOutput)
      .getResponse();   
  }, 
}

module.exports = ModuleBuilder
  .addRequestHandlers(     
    HelloWorld,
    HelloWorld2
  )
  .lambda();