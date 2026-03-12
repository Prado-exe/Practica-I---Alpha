const crypto = require("crypto");

function generateOtpCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

function hashOtpCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

module.exports = {
  generateOtpCode,
  hashOtpCode,
};