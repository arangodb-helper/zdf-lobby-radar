"use strict";

var processJsonFile = require("internal").processJsonFile;

function convertEntries(obj) {
  Object.keys(obj).forEach(function(key) {
    var val = obj[key];

    if (typeof val === "object" && val !== null) {
      if (val.hasOwnProperty('$date')) {
        obj[key] = val['$date'];
      } else if (val.hasOwnProperty('$oid')) {
        obj[key] = val['$oid'];
      } else {
        convertEntries(val);
      }
    }
  });
}

function convertObject(obj) {
  var id = obj._id['$oid'];

  delete obj._id;
  obj._key = id;

  convertEntries(obj);
}

function importerEntities(obj) {
  convertObject(obj);
  db.entities.save(obj);
}

function importerRelations(obj) {
  convertObject(obj);

  var from = obj.entities[0];

  try {
    from = db.entities.document(from);
  } catch (err) {
    console.log("from '%s' not found for %s", from, obj._key);
    return;
  }

  var to = obj.entities[1];

  try {
    to = db.entities.document(to);
  } catch (err) {
    console.log("to '%s' not found for %s", to, obj._key);
    return;
  }

  delete obj.entities;

  if (from.type > to.type) {
    var tmp = from;
    from = to;
    to = tmp;
  }

  obj._from = from._id;
  obj._to = to._id;

  db.relations.save(obj);
}

module.exports.convert = function() {
  db._drop("entities");
  db._create("entities");
  processJsonFile("entities.json", importerEntities);

  db._drop("relations");
  db._createEdgeCollection("relations");
  processJsonFile("relations.json", importerRelations);
};
