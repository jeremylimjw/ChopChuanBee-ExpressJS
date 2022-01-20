const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
    hash: (password) => bcrypt.hash(password, saltRounds),
    compare: (password, hashedPassword) => bcrypt.compare(password, hashedPassword),
}