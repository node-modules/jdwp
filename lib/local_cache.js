'use strict';

const cache = new Map();

exports.has = id => {
  return cache.has(id);
};

exports.get = id => {
  return cache.get(id);
};

exports.set = (id, value) => {
  cache.set(id, value);
};

exports.reset = () => {
  cache.clear();
};
