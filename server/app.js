// Copyright 2018, Google LLC.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
var express = require('express');
var mysql = require('./dbcon.js');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({secret:'youWouldNeverKnow'}));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static('public'));
/*
const express = require('express');
var mysql = require('./dbcon.js');

const app = express();
var bodyParser = require('body-parser');

const path = require(`path`);
const _ = require("lodash");

const session = require("express-session"); //for session tracking
const handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: "thisisapassword1",
  resave: false,
  saveUninitialized: false
          }));
session.loggedIn = 0;
/*
// [START hello_world]
// Say hello!
app.get('/', (req, res) => {
	var context = {};

	var userSQL = "SELECT Users.user_id, Users.password, Users.email, Users.fname FROM Users WHERE email = ? AND password = ?";
	var adminSQL = "SELECT Administrators.admin_id, Administrators.password, Administrators.email, Administrators.fname FROM Administrators WHERE email = ? AND password = ?";
	var inserts = [email, password];
	
	mysql.pool.query("SELECT * FROM administrators", function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(200).send(err);
			return;
		}
		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send(context);
	});
});
// [END hello_world]
*/

//display login page
app.get('/', function(req, res) {
    console.log("in login.js get");
    var context = {};
    res.render('login', context);
});

app.post('/', (req, res) => {
	const results = checkLogin(res, req.body.email, req.body.password);
	if (!_.isEmpty(results)) {
		session.loggedIn = results.user_id;
	}
	
});

function checkLogin (res, email, password) {
  var userSQL = "SELECT Users.user_id, Users.password, Users.email, Users.fname FROM Users WHERE email = ? AND password = ?";
  var adminSQL = "SELECT Administrators.admin_id, Administrators.password, Administrators.email, Administrators.fname FROM Administrators WHERE email = ? AND password = ?";
  var inserts = [email, password];
  
  mysql.pool.query(userSQL, inserts, (error, results, fields) => {
  	console.log(fields);
      if (error){
          res.write(JSON.stringify(error));
          res.status(400).end();
      }
      if (!_.isEmpty(results)) {
	      mysql.pool.query(adminSQL, inserts, (error, results, fields) => {
	      	console.log(fields);
            if(error){
                res.write(JSON.stringify(error));
                res.status(400).end();
            }
            if(!_.isEmpty(results)) {
              return [results[0].user_id, results[0].fname];
            }
            return [];
        });
      }
  });
}


if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;
