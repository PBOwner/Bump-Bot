const { v4: uuidv4 } = require('uuid');

const premiumCodes = new Map();

module.exports = {
    premiumCodes,
    generateCode: (userId, time) => {
        const code = uuidv4();
        const expirationDate = time === -1 ? null : Date.now() + time * 24 * 60 * 60 * 1000;
        premiumCodes.set(code, { userId, expirationDate, redeemed: false });
        return code;
    }
};
