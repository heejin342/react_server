const mysql = require("mysql2/promise");

const connection = async () =>
  await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    port: 3306,
  });

module.exports = { connection };
