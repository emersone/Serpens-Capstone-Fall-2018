var _ = require("lodash");

export const checkLogin (email, password) => {
  var userSQL = "SELECT Users.user_id, Users.password, Users.email, Users.fname FROM Users WHERE email = ? AND password = ?";
  var adminSQL = "SELECT Administrators.admin_id, Administrators.password, Administrators.email, Administrators.fname FROM Administrators WHERE email = ? AND password = ?";
  var inserts = [email, password];
  mysql.pool.query(userSQL, inserts, (error, results, fields) => {
      if(error){
          res.write(JSON.stringify(error));
          res.end();
      }
      if(!_.isEmpty(results)) {
        return [results[0].user_id, results[0].fname];
      }
      else {
        mysql.pool.query(adminSQL, inserts, (error, results, fields) => {
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            if(!_.isEmpty(results)) {
              return [results[0].user_id, results[0].fname];
            }
            else { return []; }
      }
  });
}
