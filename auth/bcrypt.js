const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
    hashPassword: (password) => bcrypt.hash(password, saltRounds),
    compareHash: (password, hashedPassword) => bcrypt.compare(password, hashedPassword),
}