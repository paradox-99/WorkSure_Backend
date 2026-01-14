const mailjet = require('node-mailjet');
require('dotenv').config();

const mj = mailjet.connect(
  process.env.MJ_APIKEY_PUBLIC || '2d2b73cf6626c77c29f18ee5d77b04f8',
  process.env.MJ_APIKEY_PRIVATE || '9166a1d106f280cb952b5a8b22096096'
);

module.exports = mj;
