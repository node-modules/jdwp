'use strict';

let id = 0;
exports.nextId = () => {
  id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 0;
  return id;
};


exports.isObjectTag = tag => {
  return tag === 76 || tag === 91 || tag === 115 || tag === 116 || tag === 103 || tag === 108 || tag === 99;
};
