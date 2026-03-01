const en = require('../messages/en.json');
const es = require('../messages/es.json');

function flatKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object' && v !== null) {
      keys = keys.concat(flatKeys(v, key));