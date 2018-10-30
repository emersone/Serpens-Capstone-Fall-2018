//Server-side code for the admins website

//Server set-up
/*eslint-disable no-param-reassign */
const path = require(`path`);
const mysql = require('./dbcon.js');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const _ = require("lodash");
const session = require("express-session"); //for session tracking
const handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('mysql', mysql);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: "thisisapassword1",
  resave: false,
  saveUninitialized: false
          }));
session.loggedIn = 0;

/* ******************* Login Functions ******************* */

//display login page
app.get('/', function(req, res) {
    console.log("in login.js get");
    var context = {};
    res.render('login', context);
});
app.post('/', (req, res) => {
	const context = {};
	const results = checkLogin(res, req.body.email, req.body.password, context);
	if (!_.isEmpty(results)) {
		session.loggedIn = results.user_id || results.admin_id;
	}
//	console.log(context);
	console.log(results);
	res.render('adminLanding', results);
	
	
});

function checkLogin (res, email, password, context) {
  var userQL = "SELECT user_id, password, email, fname FROM users WHERE email = ? AND password = ?";
  var adminSQL = "SELECT admin_id, password, email FROM administrators WHERE email = ? AND password = ?";
  var inserts = [email, password];
  
  mysql.pool.query(userQL, inserts, (error, userResults, fields) => {
//  	console.log(userResults);
      if (error) {
          res.write(JSON.stringify(error));
          res.status(400).end();
      }
      if (!_.isEmpty(userResults)) {
      	context = {id: userResults[0].user_id, name: userResults[0].fname};
      	return context;
//      	return [userResults[0].user_id, userResults[0].fname];
      }
      mysql.pool.query(adminSQL, inserts, (error, adminResults, fields) => {
//      	console.log(adminResults);
        if (error) {
            res.write(JSON.stringify(error));
            res.status(400).end();
        }
        if (_.isEmpty(adminResults)) {
          return {};
        }
        context = {id: adminResults[0].admin_id, email: adminResults[0].email};
        return context;
//        return {adminResults[0].admin_id, adminResults[0].email];
    });         
  });
}


/* ------------- Error Handling Functions ------------- */

//Error handling: 404
app.use(function(req, res) {
	res.status(404);
	res.header('Access-Control-Allow-Origin', '*');
	res.render('404');

});


//Error handling: 500
app.use(function(req, res) {
	res.status(500);
	res.header('Access-Control-Allow-Origin', '*');
	res.render('500');
});


/* ------------- Start Server ------------- */
if (module === require.main) {
  const server = app.listen(process.env.PORT || 8081, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
