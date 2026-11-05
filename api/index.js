// Vercel Function: every /api/* request is rewritten here (see vercel.json).
const { handler } = require('../lib/app');

module.exports = handler;
