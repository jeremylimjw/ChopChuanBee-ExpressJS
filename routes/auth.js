var express = require('express');
const { generateToken, TOKEN_NAME, removeToken } = require('../auth');
const { compareHash } = require('../auth/bcrypt');
const { Employee, AccessRight, Role } = require('../models/Employee');
const View = require('../models/View');
var router = express.Router();

router.post('/', async function(req, res, next) {
    try {
        const { username, password } = req.body;

        // Validation here
        if (username == null || password == null) {
          res.status(400).send("'username', 'password' are required.", )
          return;
        }

        // Query user data by username
        const employee = await Employee.findOne({ where: { username: username }, include: [{ model: AccessRight, include: View }, Role] });
        if (employee == null) {
            res.status(400).send("Invalid username or password.");
            return;
        }

        const user = employee.toJSON();

        // Verify user credentials
        const match = await compareHash(password, user.password)
        if (!match) {
            res.status(400).send("Invalid username or password.");
            return;
        }

        delete user.password;
        
        user.access_rights = user.access_rights.reduce((prev, curr) => {
            prev[curr.view.name] = { has_write_access: curr.has_write_access }
            return prev;
        }, {});

        const token = generateToken(user);
        res.cookie(TOKEN_NAME, token);

        res.send(user);

    } catch (err) {
        console.log(err);
        res.status(500).send("Unknown error occured. Check server logs for info.");
    }
});

router.get('/logout', async function(req, res, next) {
    // Remove user session token
    removeToken(req.cookies[`${TOKEN_NAME}`]);
    
    res.send({});
});

module.exports = router;
