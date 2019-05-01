'use strict';
const slots = require('./api/slots');

module.exports = function(admin, db) {
  const FieldValue = admin.firestore.FieldValue;
  
  const GenerateFormalRequest = require('./olympus_lib/GenerateFormalRequest');
  const processString = require("./olympus_lib/processString");
  const FindModule = require("./olympus_lib/FindModule");
  const LoadModule = require("./olympus_lib/LoadModule");

  const express = require('express');
  const cookieParser = require('cookie-parser')();
  const cors = require('cors')({origin: '*'});
  const app = express();

  const validateFirebaseIdToken = (req, res, next) => {
    // Check if request is authorized with Firebase ID token

    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) && !(req.cookies && req.cookies.__session)) {
      console.error('No Olympus ID token was passed as a Bearer token in the Authorization header.',
          'Make sure you authorize your request by providing the following HTTP header:',
          'Authorization: Bearer <Olympus ID Token>',
          'or by passing a "__session" cookie.');
      res.status(403).send('Unauthorized');
      return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      //console.log('Found "Authorization" header');
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else if(req.cookies) {
      // console.log('Found "__session" cookie');
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      res.status(403).send('Unauthorized');
      return;
    }
    console.log(req.url)
    console.log(idToken);
    admin.auth().verifySessionCookie(idToken, true).then((decodedClaims) => {
      req.user = decodedClaims;
      return next();
    }).catch((error) => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
  };

  //app.use(cors);
  app.use(cookieParser);
  app.use(validateFirebaseIdToken);

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://olympusorg.com');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  })
  
  app.get('/v1/getUser', (req, res) => {
    const uid = req.user.uid;

    return admin.auth().getUser(decodedToken.uid)
      .then((userData) => {
        const response = {
          email: userData.email,
          displayName: userData.displayName
        };
        return res.end(JSON.stringify(response));
      }).catch((error) => {
        console.log(error);
        return res.status(403).send(error);
      });
  });
  
  app.get('/v1/projects', (req, res) => {
    const body = req.query;
    const page_size = body.page_size;
    const page_token = body.page_token;
    return db.collection("projects").get()
      .then(function(querySnapshot) {
        let projectsData = {};
        querySnapshot.forEach(function(doc) {
          projectsData[doc.id] = doc.data();
        });
        return projectsData;
      })
      .then((projects) => {
        const map = {
          results: projects
          // add nextPageToken if over max
        }
        return res.status(200).send(JSON.stringify(map));
      }).catch(e => {
        return res.status(400).send(JSON.stringify({status: "failed"}));
      });
    
  });
  
  app.get('/v1/projects/:projectID', (req, res) => {
    const params = req.params;
    const projectID = params.projectID
    return db.collection("projects").doc(projectID).get()
      .then((doc) => {
        return res.status(200).send(JSON.stringify(doc.data()));
      }).catch(e => {
        return res.status(400).send();
      });
  });
  
  app.get('/v1/slots/:slotID/versions', (req, res) => {
    const params = req.params;
    const slotID = params.slotID
    return db.collection("slots").doc(slotID).collection("info").doc("versions").get()
      .then((doc) => {
        if (doc.exists) {
          return doc.data().versions;
        } else {
          return [];
        }
      }).then((versions) => {
        return res.status(200).send(JSON.stringify(versions));
      }).catch(e => {
        return res.status(400).send();
      });
  });
  
  // slots.deployments.create
  app.post('/v1/slots/:slotID/deployments', (req, res) => {
    slots.deployment.create(req, res, db);
  });
  
  // slots.deployments.delete
  app.post('/v1/slots/:slotID/deployments/:deploymentID/delete', (req, res) => {
   slots.deployment.delete(req, res, db);
  });
  
  // slots.deployments.get
  app.get('/v1/slots/:slotID/deployments/:deploymentID', (req, res) => {
    slots.deployment.get(req, res, db);
  });
  
  // slots.deployments.update
  app.put('/v1/slots/:slotID/deployments/:deploymentID', (req, res) => {
    slots.deployment.update(req, res, db);
  });
  
  // slots.deployments.list
  app.get('/v1/slots/:slotID/deployments', (req, res) => {
    slots.deployment.list(req, res, db);
  });
  
  app.get('/v1/slots/slotID/relases', (req, res) => {
    const body = req.body;
    let validPublicity = [true, false]
    let error = [];
    for (var slot in body.slots) {
      let slotId = body.slots.indexOf(slot);
      //if (!slotId.match(/[a-zA-Z0-9_]+/)) 
      //  throw "error";
      if (slot.public) {
        if (validPublicity.indexOf(slot.public) !== -1)
          error.push(`${slotId} - Slot public attribute must be either true or false`);
      } else 
         error.push(`${slotId} - Doesnt have a public attribute`);
      for (var enumeral in slot.enumerals) {
        let enumeralid = slot.enumerals.indexOf(enumeral);
        if (!enumeralid.match(/[A-Z0-9_]+/)) 
          error.push(`${slotId}:${enumeralid} - Enumeral must only contain a-z 0-9 or spaces`);
        for (var synonym in enumeral.synonyms) {
          if (!synonym.match(/[a-z0-9 ]+/)) 
            error.push(`${slotId}:${enumeralid}:${synonym} - Synonym must only contain a-z 0-9 or spaces`);
        }
      }
    }
    if (error.length <= 0) {
      return res.status(200).send();      
    } else
      return res.status(404).send(JSON.stringify(error));
  });
  
  app.get('/v1/fetchIntent', (request, response) => {
    const body = request.query;
    return processString(db, body.q).then(queryProcessor => {
      return FindModule(db, queryProcessor).then(processedRequest => {
        console.log("REQ" + processedRequest);
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
      });
    }).catch((error) => {
      console.log(error);
      response.send("error1"+ error);
    });
  });
  
  return app;
}