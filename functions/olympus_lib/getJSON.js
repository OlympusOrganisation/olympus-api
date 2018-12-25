'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const getFile = (path) => {
  return fs.readFileAsync(path, 'utf8');
}

const getJSON = (path) => {
  return getFile(path).then(data => {
    return JSON.parse(data);
  });
}

module.exports = getJSON