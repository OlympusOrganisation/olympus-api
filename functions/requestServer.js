'use strict';

let server = function(admin, db) {
  const GenerateFormalRequest = require('./olympus_lib/GenerateFormalRequest');
  const processString = require("./olympus_lib/processString");
  const FindModule = require("./olympus_lib/FindModule");
  const LoadModule = require("./olympus_lib/LoadModule");

  const express = require('express');
  const cookieParser = require('cookie-parser')();
  const cors = require('cors')({origin: true});
  const app = express();

  const validateFirebaseIdToken = (req, res, next) => {
    console.log('Check if request is authorized with Firebase ID token');

    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
      console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
          'Make sure you authorize your request by providing the following HTTP header:',
          'Authorization: Bearer <Firebase ID Token>',
          'or by passing a "__session" cookie.');
      res.status(403).send('Unauthorized');
      return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      console.log('Found "Authorization" header');
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if(req.cookies) {
      console.log('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      res.status(403).send('Unauthorized');
      return;
    }
    admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
      console.log('ID Token correctly decoded', decodedIdToken);
      req.user = decodedIdToken;
      req.user = decodedIdToken;
      return next();
    }).catch((error) => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
  };

  app.use(cors);
  app.use(cookieParser);
  app.use(validateFirebaseIdToken);
  app.get('/fetchIntent', (request, response) => {
    const body = request.query;
    const queryProcessor = processString(db, body.q);
    return queryProcessor.then((request) => {
      console.log(request);
      return FindModule(db, request).then(processedRequest => {
        let handler = {};
        handler.requestEnvelope = GenerateFormalRequest("IntentRequest", processedRequest.intentName, processedRequest.paramaters);
        if (processedRequest.failed !== false) {
            return response.send(JSON.stringify(handler));
        } else {
            return LoadModule(db, processedRequest).then(module => {
              if (module.process(handler))
                return response.send(JSON.stringify(handler));
              return null;
            });
        }
      })
    }).catch((error) => {
      response.send("error1"+ error);
    });
  });
  
  return app;
  
}

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
module.exports = server;
