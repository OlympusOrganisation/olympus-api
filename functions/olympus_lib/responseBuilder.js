'use strict';

class responseBuilder {
  constructor() {
    this.version = "V0.1alpha",
    this.sessionAttributes = {
      //"key": "value"
    }
    this.response = {
        /*"outputSpeech": {
          "type": "PlainText",
          "text": "Plain text string to speak",
          "ssml": "<speak>SSML text string to speak</speak>",
          "playBehavior": "REPLACE_ENQUEUED"      
        },
        /*"card": {
          "type": "Standard",
          "title": "Title of the card",
          "content": "Content of a simple card",
          "text": "Text content for a standard card",
          "image": {
            "smallImageUrl": "https://url-to-small-card-image...",
            "largeImageUrl": "https://url-to-large-card-image..."
          }
        },
        "reprompt": {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Plain text string to speak",
            "ssml": "<speak>SSML text string to speak</speak>",
            "playBehavior": "REPLACE_ENQUEUED"             
          }
        },*/
        "directives": [
          //{
            //"type": "InterfaceName.Directive|AudioPlayer.Play"
            //(...properties depend on the directive type)
         // }
        ],
        "shouldEndSession": true
      };
  }
  
  speak(str) {
    this.response.outputSpeech = {
      "type": "PlainText",
      "text": str,
      "ssml": "<speak>"+str+"</speak>",
      "playBehavior": "REPLACE_ENQUEUED"      
    };
    return this;
  }
  
  getResponse() {
    return this;
  }
}

module.exports = new responseBuilder();