var express = require('express');
const { generateToken, TOKEN_NAME } = require('../auth');
const { compare } = require('../auth/bcrypt');
const db = require('../db');
var router = express.Router();

router.post('/', async function(req, res, next) {
    try {
        const { username, password } = req.body;

        // Query user data by username
        const userQuery = await db.query("SELECT user_id, username, password, name AS role_name FROM users u LEFT JOIN roles r USING(role_id) WHERE username = $1", [username]);
        if (userQuery.length == 0) {
            res.status(400).send("Invalid username or password.");
            return;
        }

        // Verify user credentials
        const match = await compare(password, userQuery.rows[0].password)
        if (!match) {
            res.status(400).send("Invalid username or password2.");
            return;
        }

        const user = userQuery.rows[0];

        // Retrieve access rights
        const accessRightsQuery = await db.query("SELECT v.name AS view_name, write_access FROM access_rights LEFT JOIN views v USING(view_id) WHERE user_id = $1", [user.user_id]);
        user['access_rights'] = accessRightsQuery.rows.reduce((prev, curr) => {
            prev[curr.view_name] = { has_write_access: curr.write_access }
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

module.exports = router;
