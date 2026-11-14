const crypto = require('crypto');
if (typeof crypto.hash !== 'function') {
  crypto.hash = function(algorithm, data, outputEncoding) {
    const hash = crypto.createHash(algorithm).update(data);
    return outputEncoding ? hash.digest(outputEncoding) : hash.digest();
  };
}

const util = require('util');
if (typeof util.styleText !== 'function') {
  util.styleText = function(format, text) {
    return text;
  };
}
