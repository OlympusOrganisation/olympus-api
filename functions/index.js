const functions = require('firebase-functions');
const express = require("express");
const server = require("./requestServer.js");
const engines = require("consolidate");
const admin = require("./lib/admin");

const firestore = admin.firestore();
const settings = {
  timestampsInSnapshots: true
};
firestore.settings(settings);
const FieldValue = admin.firestore.FieldValue;

exports.api = functions.https.onRequest(server(admin, firestore));

const app = express();
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

function getOrganisation(orgID) {
    const orgRef = firestore.collection("organisations").doc(orgID);
    return orgRef.get().then(snap => {
      return snap.data();
    })
}

app.get('/organisations/new', (req, res) => {
  return res.render('createOrganisation', {});
});

app.get('/o/', (req, res) => {
  return res.render('listOrganisations', {});
});

app.get('/o/:orgID', (req, res) => {
  const orgID = req.params.orgID.toLowerCase();
  return getOrganisation(orgID).then(organisation => {
    return res.render('viewOrganisation', {
      title: organisation.name,
      description: `${organisation.caption} ${organisation.name} has XX modules available. Use their modules on Olympus.`,
      organisation: organisation
    });
  }).catch(() => {
    return res.render('index', {});
  });
});

app.get('/o/:orgID/slots/create', (req, res) => {
  const orgID = req.params.orgID.toLowerCase();
  return getOrganisation(orgID).then(organisation => {
    return res.render('createSlot', organisation);
  }).catch(() => {
    return res.render('index', {});
  });
});

app.get('/o/:orgID/slots/:slotID', (req, res) => {
  const orgID = req.params.orgID.toLowerCase();
  return getOrganisation(orgID).then(organisation => {
    return res.render('viewSlot', {
      selectedOrganisation: organisation,
      slotID: req.params.slotID
    });
  }).catch(() => {
    return res.render('index', {});
  });
});

app.get('/o/:orgID/modules/create', (req, res) => {
  const orgID = req.params.orgID.toLowerCase();
  return getOrganisation(orgID).then(organisation => {
    console.log(organisation);
    return res.render('createModule', organisation);
  }).catch(() => {
    return res.render('index', {});
  });
});

app.get('/o/:orgID/modules/:moduleID', (req, res) => {
  const orgID = req.params.orgID.toLowerCase();
  return getOrganisation(orgID).then(organisation => {
    console.log(organisation);
    return res.render('viewModule', {
      selectedOrganisation: organisation,
      moduleID: req.params.moduleID
    });
  }).catch(() => {
    return res.render('index', {});
  });
});

exports.console = functions.https.onRequest(app);

exports.onUserCreate = functions.auth.user().onCreate((user) => {
  const email = user.email;
  let displayName = user.displayName;
  const userID = user.uid; // The email of the user.
  if (displayName === null)
    displayName = email.substr(0,email.indexOf("@"));

  const userRef = firestore.doc(`users/${userID}`);
  
  return userRef.set({
    displayName: displayName,
    organisations: {},
    teams: {},
    account: "basic",
  });
});

exports.revokeOauth2 = functions.https.onRequest((req, res) => {
  const code = req.body.sessionID;
  
  admin.auth().verifySessionCookie(sessionCookie).then((decodedClaims) => {
    return admin.auth().revokeRefreshTokens(decodedClaims.sub);
  }).then(() => {
    return res.status(200).send();
  }).catch((error) => {
    return res.status(404).send();
  });
});

exports.getAccessToken = functions.https.onRequest((req, res) => {
  const refresh_token = req.body.refresh_token;
  console.log(refresh_token);
  return admin.auth().verifyIdToken(refresh_token)
    .then((decodedToken) => {
      const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
      return admin.auth().createSessionCookie(refresh_token, {expiresIn}).then((access_token) => {
        const response = {
          expires_at: new Date(new Date().getTime() + expiresIn), 
          access_token: access_token,
          user: {
            name: decodedToken.name,
            email: decodedToken.email
          }
        };
        return res.status(200).send(JSON.stringify(response));
      }).catch((error) => {
        console.log(error);
        return res.status(404).send(error);
      });
    }).catch((error) => {
      return res.status(402).send(error);
    });
});

exports.getSession = functions.https.onRequest((req, res) => {
  const code = req.body.refresh_token;
  console.log(code);
  return admin.auth().verifyIdToken(code)
    .then((decodedToken) => {
      //const userData = userRecord.toJSON();
      const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
      return admin.auth().createSessionCookie(code, {expiresIn}).then((sessionCookie) => {
        // Set cookie policy for session cookie.
        const response = {
          expires_at: new Date(new Date().getTime() + expiresIn), 
          session_token: sessionCookie,
        };
        return res.end(JSON.stringify(response));
      }).catch((error) => {
        console.log(error);
        return res.status(404).send(error);
      });
    }).catch((error) => {
      return res.status(402).send(error);
    });
});

exports.onUserDelete = functions.auth.user().onDelete((user) => {
  const userID = user.uid;
  const userRef = firestore.doc(`users/${userID}`);
  
  //const organisationsToDeleteRef = firestore.collection(`organisations`).where("ownerCount", "==", 0);
  //delete org if owner/empty
  
  return userRef.delete();
});

exports.onOrganisationCreated = functions.firestore.document('organisations/{organisationID}').onCreate((snap, context) => {
  const organisation = snap.data();
  const organisationID = context.params.organisationID;
  const userID = organisation.ownerID;
  
  const userRef = firestore.doc(`users/${userID}`);
  return userRef.get().then(doc => {
    if (doc.exists) {
      userData = doc.data();
      var batch = firestore.batch();
      
      const organisationRef = firestore.doc(`organisations/${organisationID}`);
      batch.set(organisationRef, {
        name: organisation.name,
        description: organisation.description,
        contactEmail: organisation.contactEmail,
        users: {
          [userID]: {
            role: "owner",
            displayName: userData.displayName,
            account: userData.account,
          },
        },
        teams: {},
        requests: {},
      });

      const organisationOwnerRef = firestore.doc(`organisations/${organisationID}/users/${userID}`);
      batch.set(organisationOwnerRef, {
        role: "owner",
      });

      const userRef = firestore.doc(`users/${userID}`);
      let userDoc = {
        ["organisations."+organisationID]: {
          role: "owner"
        }
      };
      batch.update(userRef, userDoc);
      
      return batch.commit();
    } else {
      console.log("No such document!");
      return null;
    }
  }).catch(error => {
    console.log("Error getting document:", error);
  });
});

exports.onOrganisationCreateUser = functions.firestore.document('organisations/{organisationID}/users/{userID}').onCreate((snap, context) => {
  const organisationID = context.params.organisationID;
  const userID = context.params.userID;
  const roleData = snap.data();
  
  const userRef = firestore.doc(`users/${userID}`);
  return userRef.get().then(doc => {
    if (doc.exists) {
      userData = doc.data();
      const orgRef = firestore.doc(`organisations/${organisationID}`);
      return orgRef.get().then(doc => {
        if (doc.exists) {
          orgData = doc.data();
          var batch = firestore.batch();

          const organisationRef = firestore.doc(`organisations/${organisationID}`);
          batch.update(organisationRef, {
            ["users." +userID]: {
              role: roleData.role,
              displayName: userData.displayName,
              account: userData.account,
            },
          });

          const userRef = firestore.doc(`users/${userID}`);
          let userDoc = {
            ["organisations."+organisationID]: {
              role: roleData.role,
              name: orgData.name,
            },
          };
          batch.update(userRef, userDoc);

          return batch.commit();
        } else {
          console.log("No such document!");
          return null;
        }
      }).catch(error => {
        console.log("Error getting document:", error);
      });
    } else {
      console.log("No such document!");
      return null;
    }
  }).catch(error => {
    console.log("Error getting document:", error);
  });
});

exports.onOrganisationUserRequest = functions.firestore.document('organisations/{organisationID}/requests/{userID}').onCreate((snap, context) => {
  const organisationID = context.params.organisationID;
  const userID = context.params.userID;
  
  const userRef = firestore.doc(`users/${userID}`);
  return userRef.get().then(doc => {
    if (doc.exists) {
      userData = doc.data();
      const orgRef = firestore.doc(`organisations/${organisationID}`);
      return orgRef.get().then(doc => {
        if (doc.exists) {
          orgData = doc.data();
          var batch = firestore.batch();

          const organisationRef = firestore.doc(`organisations/${organisationID}`);
          batch.update(organisationRef, {
            ["requests." +userID]: {
              displayName: userData.displayName,
              account: userData.account,
            },
          });

          const userRef = firestore.doc(`users/${userID}`);
          let userDoc = {
            ["requests."+organisationID]: {
              name: orgData.name,
            },
          };
          batch.update(userRef, userDoc);

          return batch.commit();
        } else {
          console.log("No such document!");
          return null;
        }
      }).catch(error => {
        console.log("Error getting document:", error);
      });
    } else {
      console.log("No such document!");
      return null;
    }
  }).catch(error => {
    console.log("Error getting document:", error);
  });
});

exports.onOrganisationDeleteUserRequest = functions.firestore.document('organisations/{organisationID}/requests/{userID}').onDelete((snap, context) => {
  const organisationID = context.params.organisationID;
  const userID = context.params.userID;
  var batch = firestore.batch();

  const organisationRef = firestore.doc(`organisations/${organisationID}`);
  batch.update(organisationRef, {
    ["requests." +userID]: FieldValue.delete(),
  });

  const userRef = firestore.doc(`users/${userID}`);
  let userDoc = {
    ["requests."+organisationID]: FieldValue.delete(),
  };
  batch.update(userRef, userDoc);

  return batch.commit();
});

exports.onOrganisationUpdateUser = functions.firestore.document('organisations/{organisationID}/users/{userID}').onUpdate((change, context) => {
  const organisationID = context.params.organisationID;
  const userID = context.params.userID;
  const roleData = change.after.data();
  
  var batch = firestore.batch();
      
  const organisationRef = firestore.doc(`organisations/${organisationID}`);
  let orgObj = {};
  orgObj[`users.${userID}.role`] = roleData.role;
  batch.update(organisationRef, orgObj);
  
  const userRef = firestore.doc(`users/${userID}`);
  let userObj = {};
  userObj[`organisations.${organisationID}.role`] = roleData.role;
  batch.update(userRef, userObj);
  
  return batch.commit();
});

exports.onOrganisationUserRequest = functions.firestore.document('organisations/{organisationID}/requests/{userID}').onUpdate((snap, context) => {
  const organisationID = context.params.organisationID;
  const userID = context.params.userID;
  
  const userRef = firestore.doc(`users/${userID}`);
  return userRef.get().then(doc => {
    if (doc.exists) {
      userData = doc.data();
      
      const organisationRef = firestore.doc(`organisations/${organisationID}`);
      let orgRef = {};
      orgRef[`requests.${userID}`] = {
        displayName: userData.displayName,
        account: userData.account,
      };
      return organisationRef.update(orgRef);
    } else {
      console.log("No such User!");
      return null;
    }
  }).catch(error => {
    console.log("Error getting document:", error);
  });
});

exports.onOrganisationDelete = functions.firestore.document('organisations/{organisationID}').onDelete((snap, context) => {
  const organisationData = snap.data();
  const organisationID = context.params.organisationID;
  var batch = firestore.batch();
  
  for (userID in organisationData.users) {
    let userRef = firestore.doc(`users/${userID}`);
    batch.update(userRef, {
        ["organisations."+organisationID]: FieldValue.delete(),
    });
  }
  
  for (teamID in organisationData.temas) {
    let teamRef = firestore.doc(`teams/${teamID}`);
    batch.delete(teamRef);
  }
  return batch.commit();
});

exports.onTeamCreated = functions.firestore.document('organisations/{organisationID}/teams/{teamID}').onCreate((snap, context) => {
  const organisationID = context.params.organisationID;
  const teamID = context.params.teamID;
  const team = snap.data();
  var batch = firestore.batch();

  const teamRef = firestore.doc(`organisations/${organisationID}/teams/${teamID}`);
  let teamObj = team;
  teamObj.users = {};
  teamObj.subTeams = {};
  batch.set(teamRef, teamObj);

  if (!team.parentTeamID) {
    const organisationRef = firestore.doc(`organisations/${organisationID}`);
    batch.update(organisationRef, {
      ['teams.'+teamID]: {
        name: team.name,
        description: team.description,
      }
    });
  } else {
    const teamRef = firestore.doc(`organisations/${organisationID}/teams/${team.parentTeamID}`);
    batch.update(organisationRef, {
      ['subTeams.'+teamID]: {
        name: team.name,
        description: team.description,
      }
    });
  }

  return batch.commit();
});


exports.onTeamUpdateUsers = functions.firestore.document('organisations/{organisationID}/teams/{teamsID}/users/{userID}').onUpdate((snap, context) => {
  const teamID = context.params.teamID;
  const userID = context.params.userID;
  const roleData = snap.data();
  
  const userRef = firestore.doc(`users/${userID}`);
  return userRef.get().then(doc => {
    if (doc.exists) {
      userData = doc.data();
      var batch = firestore.batch();
      
      const organisationRef = firestore.doc(`teams/${teamsID}`);
batch.update(organisationRef, {
        ["users" +userID]: {
          role: roleData.role,
          displayName: userData.displayName,
          account: userData.account,
        },
      });

      const userRef = firestore.doc(`users/${userID}`);
      let userDoc = {
        ["teams."+organisationID]: {
          role: roleData.role,
        },
      };
      batch.update(userRef, userDoc);
      
      return batch.commit();
    } else {
      console.log("No such document!");
      return null;
    }
  }).catch(error => {
    console.log("Error getting document:", error);
  });
});

const GetIntents = require('./olympus_lib/GetIntents');

exports.onModuleCreation = functions.firestore.document('modules/{moduleID}').onCreate((snap, context) => {
  const moduleID = context.params.moduleID;
  const moduleData = snap.data();
  //code moduleData.code
  const intents = GetIntents(moduleData.code);

  return snap.ref.set({
    moduleID: moduleID,
    name: moduleData.name,
    intents: intents,
    createTime: new Date()
  });
});

const GetPhrasesForIntent = require('./olympus_lib/GetPhrasesForIntent');

exports.onModuleUpdation = functions.firestore.document('modules/{moduleID}').onUpdate((change, context) => {
  const newData = change.after.data();
  const oldData = change.before.data();

  let map = {};
  if (newData.code !== oldData.code) {
    let intents = GetIntents(newData.code);
    if (oldData.intents !== intents)
      map.intents = intents;
    if (newData.intents !== oldData.intents)
      for (var intent of intents)
        if (oldData.intents.indexOf(intent) !== -1) {
          const phrases = GetPhrasesForIntent(newData.code, intent);
          if (oldData.phrases !== phrases) {
            let map = {};
            for (var phrase of phrases)
              if (!oldData.phrases || !oldData.phrases[phrase])
                map["phrases."+phrase] = {
                  public: true,
                  intentName: intent
                };
          }
        }
  }
  if (map !== {}) {
    return change.after.ref.update(map);
  } else
    return null;
});

exports.onModuleDeletion = functions.firestore.document('modules/{moduleID}').onDelete((snap, context) => {
  const moduleID = context.params.moduleID;
  const moduleConfigRef = firestore.doc(`modulesConfig/${moduleID}`);
  return moduleConfigRef.delete();
});

exports.onSlotUpdation = functions.firestore.document('slots/{slotID}').onUpdate((change, context) => {
  const newData = change.after.data();
  const oldData = change.before.data();

  if (newData.values !== oldData.values) {
    let list = [];
    for (var value in newData.values)
      list = list.concat(newData.values[value]);
    return change.after.ref.update({
      regex: "/(" + list.join("|") + ")/g"
    });
  }
  return null;
});

/// API ///
exports.api_v1beta1_modules = functions.https.onRequest((req, res) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  
  const modulesConfigRef = firestore.collection(`modulesConfig`);
  return modulesConfigRef.get().then(querySnapshot => {
    let modules = [];
    return querySnapshot.forEach(function(doc) {
      modules.push(doc.data());
    }).then(() => {
    	return modules;		
	});
  }).then(modules => {
    var responce = {
      "modules": modules
    };
    return res.status(200).send(JSON.stringify(responce));
  }).catch(function(error) {
    var responce = {
      "error": {
        "code": 401,
        "message": "Something went wrong",
        "status": "UNAUTHENTICATED"
      }
    }
    return res.status(200).send(JSON.stringify(responce));
  });
});