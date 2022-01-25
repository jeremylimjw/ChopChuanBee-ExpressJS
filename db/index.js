const { Pool } = require('pg')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { hash } = require('../auth/bcrypt');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
})

init();

async function init() {
  try {
    // Test the database connection
    await pool.query("SELECT NOW()"); 
    console.log("Connection to database established");
  
    // Create db tables if not exists.
    var tables_sql = fs.readFileSync(path.join(__dirname, 'sql', 'tables.sql')).toString();
    await pool.query(tables_sql);
  
    // Data initiation
    const { rows } = await pool.query("SELECT COUNT(1) FROM employees LIMIT 1");
    if (rows[0].count == 0) {
      console.log("First run detected, running data init");

      // Insert default data for some tables
      var init_sql = fs.readFileSync(path.join(__dirname, 'sql', 'data_init.sql')).toString();
      await pool.query(init_sql);

      // Create superadmin
      const adminPassword = await hash('password');
      await pool.query(`
        INSERT INTO employees 
          (emp_id, emp_name, username, password, email, role_id) VALUES($1, $2, $3, $4, $5, $6)`, 
          [uuidv4(), 'Admin', 'admin', adminPassword, 'admin@gmail.com', 1]
      );

      // Create 1 staff
      const alicePassword = await hash('password');
      const aliceUser = await pool.query(`
        INSERT INTO employees 
          (emp_id, emp_name, username, password, email, role_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING emp_id`, 
          [uuidv4(), 'Alice', 'alice', alicePassword, 'alice@gmail.com', 2]
      );
      await pool.query(`INSERT INTO access_rights(emp_id, view_id, write_access) VALUES($1, $2, $3)`, [aliceUser.rows[0].emp_id, 1, true]);
      await pool.query(`INSERT INTO access_rights(emp_id, view_id, write_access) VALUES($1, $2, $3)`, [aliceUser.rows[0].emp_id, 2, false]);
      
    }
  
  } catch (err) {
    console.log("Connection to database failed.");
    console.log(err);
  }
}


module.exports = {
    query: (text, params) => {
      return pool.query(text, params)
    },
    createLog: async (text, emp_id, view_id) => {
      await pool.query(`INSERT INTO logs (text, emp_id, view_id) VALUES ($1, $2, $3)`, [text, emp_id, view_id]);
    }
}