This server is built using NodeJS v16.13.2
# How to use
## Setting up the database
1. Download PostgreSQL 14.1.1 here https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Install PostgreSQL. Password is for default database superuser named "postgres", it will be used for connection later. 
3. Add postgres to your PATH https://sqlbackupandftp.com/blog/setting-windows-path-for-postgres-tools
4. Access database in cmd with `psql -U postgres`. Tip: `\q` to quit.
5. Create database with `CREATE DATABASE chopchuanbee;`
6. Run `\c chopchuanbee` to check that its created.

## Setting up the express server
Note: Server is running on NodeJS v16, outdated versions may be incompatible.
1. Run `npm install`
2. Create a file `.env` in the root folder
3. Copy the following variables:
```
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=<yourpassword>
PGDATABASE=chopchuanbee
PGPORT=5432
PORT=3000
REACT_URL=http://localhost:3001
EMAIL_USERNAME=nuschopchuanbee@gmail.com
EMAIL_PASSWORD=Nuschopchuanbee1
GOOGLE_API_KEY=<API_KEY>
```
4. Start the server with `npm start` or `npm run dev`
5. Ensure that `Connected to database` appears in the server logs

## Unit Testing
Powered by Mocha. Unit test files can be found in the `/test` directory.
1. Run server with `npm start` or `npm run dev`
2. Open another terminal and run `npm test`

# Resetting the database
When there is a change in database schema, you must drop all tables so it can recreate again. Heres how:
1. In cmd run `psql -U postgres` and login.
2. Run `DROP DATABASE chopchuanbee;`.
3. Run `CREATE DATABASE chopchuanbee;`.
