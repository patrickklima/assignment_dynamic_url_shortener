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
  var prStoredID = new Promise((resolve, reject) => {
    let newID = uniqid();
    let counterID = urlMgr.makeCounterID(newID, url);
    urlMgr._setIDtoValue(newID, url).then(() => {
      urlMgr._setIDtoValue(counterID, "0").then(() => {
        urlMgr.__setToList(newID).then(() => {
          resolve({
            id: newID,
            url: url,
            visits: 0
          });
        });
      });  
    }).catch(err => reject(err));
  });
  return prStoredID;
};

urlMgr.getVisitCount = (id) => {
  var prStoredVisits = new Promise((resolve, reject) => {
    redisClient.get(COUNTER_TXT+id, (err, visits) => {
      if (err) return reject(err);
      resolve(visits);
    });
  });
  return prStoredVisits;
};

urlMgr.getURL = (id) => {
  var prStoredLink = new Promise((resolve, reject) => {
    redisClient.get(id, (err, url) =>{
      if (err) return reject(err);
      resolve(url);
    });
  });
  return prStoredLink;
};

urlMgr.getLinkData = (id) => {
  var prRetrievedLinkData = new Promise((resolve, reject) => {
    let link = {};
    link.id = id;
    urlMgr.getURL(id).then(url => {
      if (!url) return reject(url);
      link.url = url;
      urlMgr.getVisitCount(urlMgr.makeCounterID(id, url)).then(visits => {
        link.visits = visits;
        console.log(`linkData is`);
        console.log(link);
        resolve(link);
      });
    });
  });
  return prRetrievedLinkData;
};

urlMgr.getAllLinks = () => {
  var prStoredListOfLinks = new Promise((resolve, reject) => {
    var linksArr;
    redisClient.lrange(LIST_OF_KEYS, 0, -1, (err, links) => {
      if (err) return reject(err);
      linksArr = links;
      // console.log(`linksArr = ${typeof linksArr}`);
      // linksArr = linksArr.toString();
      // console.log(`linksArr = ${linksArr}`);
      // linksArr = linksArr.split(',');
      // console.log(`linksArr = ${linksArr}`);
    });
    resolve(linksArr);
  });
  var allLinks = [];
  prStoredListOfLinks.then(linksArr => {
    console.log(`linksArr right before the loop = ${linksArr}`);
    let linkData;
    linksArr.forEach(id => {
      urlMgr.getLinkData(id).then(ld => {
        linkData = ld;  
      });
      allLinks.push(linkData);
    });
  });
  console.log("allLinks is");
  console.log(allLinks);
  return allLinks;
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







module.exports = urlMgr;