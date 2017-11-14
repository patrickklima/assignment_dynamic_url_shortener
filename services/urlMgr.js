var urlMgr = {};
var {redisClient} = require("./redisClient");

//UNIQUE ID GENERATOR from https://www.npmjs.com/package/uniqid
var uniqid = require('uniqid');
const COUNTER_TXT = "count-";
const LIST_OF_KEYS = "keys";

urlMgr._setIDtoValue = (id, url) => {
  var prStored = new Promise((resolve, reject) => {
    redisClient.set(id, url, (err) => {
      if (err) return reject(err);
      console.log(`newID = ${id}`);
      resolve(true);
    });
  });
  return prStored;
};

urlMgr.makeCounterID = (id, url) => {
  return id.concat(url); 
};

urlMgr.storeURL = (url) => {
  if (url.substr(0,4) !== "http") url = "http://".concat(url);
  var prStoredID = new Promise((resolve, reject) => {
    let newID = uniqid();
    let counterID = urlMgr.makeCounterID(newID, url);
    urlMgr._setIDtoValue(newID, url)
    .then(() => urlMgr._setIDtoValue(counterID, 0))
    .then(() => urlMgr._setToList(newID))
    .then(() => resolve({
      id: newID,
      url: url,
      visits: "0"
      })
    ).catch(err => reject(err));
  });
  return prStoredID;
};

urlMgr.getValue = (id) => {
  var prStoredValue = new Promise((resolve, reject) => {
    redisClient.get(id, (err, value) => {
      if (err) return reject(err);
      console.log("getValue's ID is "+id);
      console.log("getValue is "+value);
      resolve(value);
    });
  });
  return prStoredValue;
};

urlMgr.getLinkData = (id) => {
  var prRetrievedLinkData = new Promise((resolve, reject) => {
    let link = {};
    link.id = id;
    urlMgr.getValue(id).then(url => {
      if (!url) return reject(url);
      link.url = url;
      urlMgr.getValue(urlMgr.makeCounterID(id, url)).then(visits => {
        link.visits = visits || 0;
        console.log(`linkData is`);
        console.log(link);
        resolve(link);
      });
    });
  });
  return prRetrievedLinkData;
};


urlMgr.getAllLinks = () => {
  console.log("getAllLinks");
  return urlMgr._getList().then(linksArr => {
    var promises = linksArr.map(urlMgr.getLinkData);
    return Promise.all(promises);
  }); 
};

urlMgr.exists = (id) => {
  var prExists = new Promise((resolve, reject) => {
    redisClient.exists(id, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
  return prExists;
};

urlMgr._getList = () => {
  urlMgr.exists(LIST_OF_KEYS).then(result => {
    if (result === 0) return null;
  });
  var prListIfIDs = new Promise((resolve, reject) => {
    redisClient.lrange(LIST_OF_KEYS, 0, -1, (err, links) => {
      console.log("list of links here");
      console.log(links);
      if (err) return reject(err);
      if (!links) return resolve(false);
      resolve(links);
    });
  });
  return prListIfIDs;
};

urlMgr._setToList = (id) => {
  var prStoredToList = new Promise((resolve, reject) => {
    redisClient.rpush(LIST_OF_KEYS, id, (err) =>{
      if (err) return reject(err);
      resolve(true);
    });
  });
  return prStoredToList;
};

urlMgr.incr = (id) => {
  var prIncr = new Promise((resolve, reject) => {
  urlMgr.getValue(id)
    .then(url => {
      let counterID = urlMgr.makeCounterID(id, url);
      console.log("about to increment "+counterID);
      redisClient.incr(counterID, (err, newVal) => {
        if (err) return reject(err);
        resolve(newVal);
      });
      console.log("done incrementing");
    });
  });
  return prIncr;
};




module.exports = urlMgr;

