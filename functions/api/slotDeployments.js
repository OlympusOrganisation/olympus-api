/*
  slots.deployments.create
  params: slotID
  requestBody: {
    script: string,
    versionNumber: integer,
    manifestFileName: string,
    description: string
  }
  responceBody: slotDeploymentObj
*/
exports.create = (req, res, db) => {
  const body = req.body;
  var deployment = s({
    script: 'string',
    versionNumber: 'number',
    manifestFileName: 'string',
    description: 'string',
  });
  var checkObj = deployment.match(body);

  return db.collection("slots").doc(slotID).collection("deployments").doc()
    .create({
      deploymentConfig: {
        script: body.script,
        versionNumber: body.versionNumber,
        manifestFileName: body.manifestFileName,
        description: body.description
      },
      updateTime: FieldValue.serverTimestamp(),
      current: true
    })
    .then((docRef) => {
      //TODO Update to make previous current not current using funciton
      return docRef.get().then((doc) => {
        return res.status(200).send(JSON.stringify({
          deploymentId: docRef.id,
          deploymentConfig: {
            script: doc.script,
            versionNumber: doc.versionNumber,
            manifestFileName: doc.manifestFileName,
            description: doc.description
          },
          updateTime: doc.updateTime
        }));
      }).catch(e => {
        return res.status(400).send();
      });
    }).catch(e => {
      return res.status(400).send();
    });
}

/*
  slots.deployments.delete
  params: slotID, deploymentID
  TODO: if current change active to previous
*/
exports.delete = (req, res, db) => {
  const params = req.params;
  const slotID = params.slotID;
  const deploymentID = params.deploymentID;

  return db.collection("slots").doc(slotID).collection("deployments").doc(deploymentID).delete()
    .then((versions) => {
      return res.status(200).send();
    }).catch(e => {
      return res.status(400).send();
    });
};

/*
  slots.deployments.get
  params: slotID, deploymentID
  responceBody: slotDeploymentObj
*/
exports.get = (req, res, db) => {
  const params = req.params;
  const slotID = params.slotID;
  const deploymentID = params.deploymentID;
  return db.collection("slots").doc(slotID).collection("deployments").doc(deploymentID).get()
    .then((doc) => {
      if (doc.exists) {
        return doc.data();
      } else {
        return res.status(400).send();
      }
    }).then((versions) => {
      return res.status(200).send(JSON.stringify(versions));
    }).catch(e => {
      return res.status(400).send();
    });
};

/*
  slots.deployments.update
  params: slotID, deploymentID
  requestBody: {
    script: string,
    versionNumber: integer,
    manifestFileName: string,
    description: string
  }
  responceBody: slotDeploymentObj
*/
exports.update = (req, res, db) => {
  const params = req.params;
  const slotID = params.slotID;
  const deploymentID = params.deploymentID;

  const body = req.body;
  var deployment = s({
    script: 'string',
    versionNumber: 'number',
    manifestFileName: 'string',
    description: 'string'
  });
  var checkObj = deployment.match(body);

  return db.collection("slots").doc(slotID).collection("deployments").doc(deploymentID)
    .update({
      deploymentConfig: body.deploymentConfig,
      //updateTime: 
    })
    .then((docRef) => {
      //TODO Update to make previous current not current using funciton
      return docRef.get().then((doc) => {
        return res.status(200).send(JSON.stringify({
          deploymentId: docRef.id,
          deploymentConfig: {
            script: doc.script,
            versionNumber: doc.versionNumber,
            manifestFileName: doc.manifestFileName,
            description: doc.description,
          },
          updateTime: doc.updateTime
        }));
      }).catch(e => {
        return res.status(400).send();
      });
    }).catch(e => {
      return res.status(400).send();
    });
};

/*
  slots.deployments.list
  params: slotID
  responceBody: {
    deployments: [
      slotDeploymentObj,
      ...
    ],
    nextPageToken: int (null if no more pages)
  }
*/
exports.list = (req, res, db) => {
  const params = req.params;
  const slotID = params.slotID;

  return db.collection("slots").doc(slotID).collection("info").doc("deployments").get()
    .then((doc) => {
      if (doc.exists) {
        return {
          "deployments": doc.data().deployments,
          nextPageToken: null
        };
      } else
        return res.status(400).send();
    }).then((versions) => {
      return res.status(200).send(JSON.stringify(versions));
    }).catch(e => {
      return res.status(400).send();
    });
}