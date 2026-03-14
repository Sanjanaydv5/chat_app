const crypto = require('crypto');

const otpGenerate = () => {
  return String(crypto.randomInt(100000, 1000000));
}
module.exports = otpGenerate;
