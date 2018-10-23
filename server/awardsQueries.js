var _ = require("lodash");

export const getAwards (user_id) => {
  var sql = "SELECT * FROM Awards WHERE user_id_fk = ?";
  var inserts = [user_id];
  mysql.pool.query(sql, inserts, (error, results, fields) => {
      if(error){
          res.write(JSON.stringify(error));
          res.end();
      }
      if(!_.isEmpty(results)) {
        return results[0];
      }
      return [];
  });
}

export const newAward (user_id, data) => {
  var sql = "INSERT INTO Awards (user_id_fk, type, recip_name, recip_email, time_given, date_given) VALUES (?, ?, ?, ?, ?, ?)";
  var inserts = [user_id].concat(data);
  sql = mysql.pool.query(sql,inserts,function(error, results, fields) {
    if(error){
        res.write(JSON.stringify(error));
        res.end();
    } else {
      res.redirect("/awards");
      res.end();
    }
  });
});
