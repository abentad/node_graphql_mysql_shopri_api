const mysql = require('mysql');
const util = require('util');

//local
const conn = mysql.createConnection({
  port: 3306,
  database: 'shopri',
  host: 'localhost',
  user: 'root',
  password: '',
  dateStrings: true
});

//publish
// const conn = mysql.createConnection({
//     port: 3306,
//     database: 'rentochcom_shopri',
//     host: 'localhost',
//     user: 'rentochcom_david',
//     password: 'y]~eHw@E*b$%',
//     dateStrings: true
// });

const dbQuery = util.promisify(conn.query).bind(conn);
module.exports = { dbQuery };