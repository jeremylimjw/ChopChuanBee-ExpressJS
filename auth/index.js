const crypto = require('crypto');
const ViewType = require('../common/ViewType');

const TOKEN_NAME = "chocolatechip";
const SESSION_DURATION_MS = 30*60*1000;

/**
 * Keeps a memory mapping of logged in users and their session expiry
 * Date structure: tokens = {
 *      "8da240e7-6fc6-4e2b-84f5-d9a23694514c": {
 *          user: User,
 *          expireOn: Date
 *      },
 *      ...
 * }
 */
const tokens = {};

module.exports = {
    generateToken: (user) => {
        const token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');
        tokens[token] = {
            user: user,
            expireOn: new Date(new Date().getTime() + SESSION_DURATION_MS)
        };
        return token;
    },
    removeToken: (token) => {
        delete tokens[token];
    },
    /**
     * Middleware for authorization between views
     * @param {string} view - the view name matching in the database. E.g. 'HR', 'CRM', 'SCM'
     * @param {boolean} requireWriteAccess - whether the user has write access
     * @returns 
     */
    requireAccess: (viewType, requireWriteAccess) => {
        return (req, res, next) => {
            // Get attached token from cookies
            const token = req.cookies[TOKEN_NAME];

            // Require user to have a token
            if (tokens[token] == null) {
                res.status(401).send("You have to be logged in to access this method.");
                return;
            }

            // Require user to have a non-expired token
            const now = new Date();
            if (tokens[token].expireOn < now) {
                res.status(333).send("Session timed out due to inactivity, please login again.");
                return;
            }
            
            // Assign user to variable to be used further down the pipeline
            res.locals.user = tokens[token].user;

            // Skip checking for access rights if its superadmin user or if view type is GENERAL
            if (tokens[token].user.role.name === 'Admin' || viewType == ViewType.GENERAL) {
                next();
                return;
            }

            // Require user access to this view
            if (tokens[token].user.access_rights[viewType.name] == null) {
                res.status(401).send("You do not have access to this method.");
                return;
            }

            // Require user write access to this view
            if (requireWriteAccess && tokens[token].user.access_rights[viewType.name]?.has_write_access == false) {
                res.status(401).send("You do not have access to this method (write).");
                return;
            }

            next();
        }
    }
}

module.exports.TOKEN_NAME = TOKEN_NAME;