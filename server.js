//Set-up
const formidable = require('formidable');
const FileReader = require('filereader');
const path = require(`path`);
const mysql = require('./dbcon.js');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const _ = require("lodash");
const session = require("express-session");
const handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: "thisisapassword1",
  resave: false,
  saveUninitialized: false
}));
session.loggedIn = 0;

/* ******************* Frontend Pages ******************* */
app.use('/static', express.static('public'));
app.use('/admins', express.static(path.join(__dirname, '/admins')));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('mysql', mysql);


/* ******************* Start Server ******************* */
const server = app.listen(process.env.PORT || 8080, () => {
  const port = server.address().port;
  console.log(`App listening on port ${port}`);
});


/* ******************* Login Functions ******************* */

//display login page
app.get('/', function(req, res) {
  var context = {};
  res.render('login', context);
});

app.get("/logOut", function(req, res){
  if (session.loggedIn) {
    session.loggedIn = 0;
  }
  res.redirect("/");
});

const checkUserLogin = (email, password) => {
  var SQL = "SELECT user_id, isAdmin, sig_id FROM users WHERE email = ? AND password = ?";
  var inserts = [email, password];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
      		resolve(results[0]);
      }
      reject(error);
    });
  })
  .catch(() => null);
};

app.post('/', (req, res) => {
  checkUserLogin(req.body.email, req.body.password)
  .then((results) => {
    if (_.isEmpty(results)) {
      res.render('loginError', {});
    }
    else if (results.isAdmin === 0) {
      session.loggedIn = results.user_id;
      session.admin = results.isAdmin;
      session.sig_id = results.sig_id;
      if (results.sig_id !== null) {
      	 res.redirect("/awards");
      }
      else {
      	// prompt user to create a signature
      	res.redirect("/profile");
      }
    }
    else {
      session.loggedIn = results.user_id;
      session.admin = results.isAdmin;
      res.redirect("/admins");
    }
  })
  .catch((err) => {
    console.log("Error in login attempt");
    console.log(err);
    res.render('loginError', {});
  });
});

/* ******************* User Page Functions ***************** */

/* ******************* User Acccount Functions ************ */

const getProfile = (user_id) => {
  var SQL = "SELECT fname, lname, sig_id FROM users.users WHERE user_id = " + user_id;;
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results);
    });
  })
  .catch(() => null);
};

const getSignature = (sig_id) => {
  var SQL = "SELECT * FROM users.signatures WHERE sig_id = " + sig_id;
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, (error, results) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      resolve(results);
    });
  })
  .catch(() => null);
};

const updateProfile = (data, user_id) => {
  var SQL = "UPDATE users.users SET fname=?, lname=?, sig_id=? WHERE user_id=?";
  var sig_id = data.sig_id ? parseInt(data.sig_id, 10) : null;
  var inserts = [data.fname, data.lname, sig_id, user_id];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
        resolve({});
      }
   	  console.log(error);
      reject(error);
    });
  })
  .catch(() => null);
};

const updateSignature = (data, sig_id) => {
  var SQL = "UPDATE users.signatures SET sig=?, sig_name=? WHERE sig_id=?";
  var inserts = [data.sig, data.sig_name, parseInt(sig_id, 10)];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
        resolve({});
      }
      reject(error);
    });
  })
  .catch(() => null);
};

const addSignature = (data) => {
  var SQL = "INSERT INTO signatures (sig, sig_name) VALUES (?, ?)";
  var inserts = [data.sig, data.sig_name];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
      	session.sig_id = results.insertId;
        resolve({insertId: results.insertId});
      }
      reject(error);
    });
  })
  .catch(() => null);
};

app.get("/profile", (req, res) => {
  if (session.loggedIn !== 0 && !session.admin) {
    getProfile(session.loggedIn).then((data) => {
      const pageData = {
        fname: data[0].fname,
        lname: data[0].lname,
        sig_id: data[0].sig_id, // === null ? 0 : data[0].sig_id
        sig_name: "None selected"
      };
      if (data[0].sig_id === null) {
        res.render("profile", pageData);
      }
      else {
        getSignature(data[0].sig_id).then((sigData) => {
          pageData.sig_name = sigData[0].sig_name;
          res.render("profile", pageData);
        });
      }
    });
  }
  else {
    res.render('notLoggedIn', {});
  }
});

app.post("/profile", (req, res) => {
  // handle file https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
  if (session.loggedIn !== 0 && !session.admin) {
    // New sig not provided
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (files.sig.size === 0) {
      	console.log(fields.sig_id === "/");
      	fields.sig_id = fields.sig_id === "/" ? null : fields.sig_id;
      	console.log("update profile");
      	console.log(fields);
        updateProfile(fields, session.loggedIn).then(() => {
          getProfile(session.loggedIn).then((data) => {
          	data[0].sig_name = fields.sig_name;
            res.render("profile", data[0]);
          });
        });
      }
      // signature has been added or updated
      else {
      	if (files.sig.type.slice(0, 5) !== 'image') {
      		res.end();
      	}
      	else {
	        const reader = new FileReader();
	        let imgURL;
	        reader.onload = function () {
	          imgURL = reader.result;
			// Apparently handlebars converts null values into '/'
	          if (fields.sig_id !== "/") {
	            const sigData = {
	              sig_name: files.sig.name,
	              sig: imgURL
	            };
	            Promise.all([updateProfile(fields, session.loggedIn), updateSignature(sigData, fields.sig_id)])
	            .then(() => {
	              getProfile(session.loggedIn).then((data) => {
	              	data[0].sig_name = files.sig.name;
	                res.render("profile", data[0]);
	              });
	            });
	          }
	          // is a new signature
	          else {
	            const sigData = {
	              sig_name: files.sig.name,
	              sig: imgURL
	            };
	            addSignature(sigData)
	            .then((data) => {
	              const profileData = {
	                fname: fields.fname,
	                lname: fields.lname,
	                sig_id: data.insertId,
	              };
	              updateProfile(profileData, session.loggedIn).then(() => {
	                getProfile(session.loggedIn).then((data) => {
	                	data[0].sig_name = files.sig.name;
	                    res.render("profile", data[0]);
	                });
	              });
	            });
	          }
	        };
	        reader.readAsDataURL(files.sig);
	      }
      }
    });
  }
  else {
    res.render('notLoggedIn', {});
  }
});

// for test purposes to fetch and display a signature in the browser
app.get("/signature", (req, res) => {
  getSignature("5").then((data) => {
    res.render('testSignature', {data: data[0].sig});
  });
});

/* ******************* Awards Functions ***************** */
const getAwards = (user_id) => {
  var SQL = "SELECT * FROM users.awards WHERE creator_user_id = " + user_id;
  //  	var inserts = [user_id];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results.map((entry) => {
        entry.date_given = entry.date_given.toISOString().slice(0,16);
        return entry;
      }));
    });
  })
  .catch(() => null);
};

const newAward = (data, user_id) => {
  var SQL = "INSERT INTO awards (creator_user_id, type, recip_name, recip_email, date_given) VALUES (?, ?, ?, ?, ?)";
  var inserts = [user_id, data.type, data.recip_name, data.recip_email, data.date_given];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
        resolve({});
      }
      reject(error);
    });
  })
  .catch(() => null);
};

const deleteAward = (award_id, user_id) => {
  var SQL = `DELETE FROM users.awards WHERE award_id = ${award_id} AND creator_user_id = ${user_id}`;
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results);
    });
  })
  .catch(() => null);
};

const updateAward = (data, user_id) => {
  var SQL = "UPDATE users.awards SET type=?, recip_name=?, recip_email=?, date_given=? WHERE award_id=? AND creator_user_id=?";
  var inserts = [data.type, data.recip_name, data.recip_email, data.date_given, parseInt(data.award_id, 10), user_id];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
        resolve({});
      }
      reject(error);
    });
  })
  .catch(() => null);
};

app.get("/awards", (req, res) => {
  if (session.loggedIn !== 0 && !session.admin) {
    const thisUser = session.loggedIn;
    getAwards(thisUser).then((data) => {
      res.render('awards', {
      	"data": data,
      	sig_id: session.sig_id
  	  });
    });
  }
  else {
    res.render('notLoggedIn', {});
  }
});

app.post("/awards", (req, res) => {
  if (session.loggedIn !== 0 && !session.admin) {
    const thisUser = session.loggedIn;
    if (Object.keys(req.body).indexOf("delete") > -1) {
      deleteAward(req.body.award_id, thisUser).then(() => {
	    getAwards(thisUser).then((data) => {
	      res.render('awards', {
	      	"data": data,
	      	sig_id: session.sig_id
	  	  });
	    });
      });
    }
    else if (Object.keys(req.body).indexOf("update") > -1) {
      updateAward(req.body, thisUser).then(() => {
	    getAwards(thisUser).then((data) => {
	      res.render('awards', {
	      	"data": data,
	      	sig_id: session.sig_id
	  	  });
	    });
      });
    }
    else if (Object.keys(req.body).indexOf("add") > -1) {
      newAward(req.body, thisUser).then(() => {
	    getAwards(thisUser).then((data) => {
	      res.render('awards', {
	      	"data": data,
	      	sig_id: session.sig_id
	  	  });
	    });
      });
    }
    else if (Object.keys(req.body).indexOf("email") > -1) {
	  	// update in case user made changes
	    Promise.all([updateAward(req.body, thisUser), getProfile(thisUser)]).then((results) => {
        getSignature(results[1].sig_id).then((imageData) => {
          genpdf(req.body.recip_email, `${results[1].fname} ${results[1].lname}`,req.body.recip_name, req.body.type, imageData.sig);
          // re-render page in case user made changes
          getAwards(thisUser).then((data) => {
            res.render('awards', {
              "data": data,
              sig_id: session.sig_id
            });
          });
        });
	    });
	  }
    else {
      console.log("Error invalid");
    }
  }
  else {
    res.render('notLoggedIn', {});
  }

});
/* ******************* Backend Functions ******************* */

/*------------- Create an admin -------------*/
app.post('/API/admins', (req, res) => {
  console.log("POST /API/admins");

	var context = {};

	//Check that email field exists in request
  if(req.body.email === null ||
		 req.body.email === undefined ||
		 req.body.email === "") {
		res.status(400).send('Error: email not found');
		return;
  }

  //Check that password field exists in request
  if(req.body.password === null ||
     req.body.password === undefined ||
     req.body.password === "") {
    res.status(400).send('Error: password not found');
    return;
  }

  //Check that fname field exists in request
  if(req.body.fname === null ||
     req.body.fname === undefined ||
     req.body.fname === "") {
    res.status(400).send('Error: first name not found');
    return;
  }

  //Check that lname field exists in request
  if(req.body.lname === null ||
     req.body.lname === undefined ||
     req.body.lname === "") {
    res.status(400).send('Error: last name not found');
    return;
  }

	//Check that creation_date field exists in request
	if(req.body.creation_date === null ||
		 req.body.creation_date === undefined ||
		 req.body.creation_date === "") {
		res.status(400).send('Error: creation date not found');
		return;
	}

  //Check that isAdmin field exists in request
  if(req.body.isAdmin === null ||
     req.body.isAdmin === undefined ||
     req.body.isAdmin === "") {
    res.status(400).send('Error: administrator status not found');
    return;
  }

  //Check that branch_id field exists in request
  if(req.body.branch_id === null ||
     req.body.branch_id === undefined ||
     req.body.branch_id === "") {
    res.status(400).send('Error: branch not found');
    return;
  }

  //Check that sig_id field exists in request
  // if(req.body.sig_id === null ||
  //    req.body.sig_id === undefined ||
  //    req.body.sig_id === "") {
  //   res.status(400).send('Error: signature not found');
  //   return;
  // }

	//Create variables to prepare data for insertion into table
	var sql = 'INSERT INTO users (email, password, fname, lname, creation_date, isAdmin, branch_id) VALUES (?,?,?,?,?,?,?)';
	var record = [req.body.email, req.body.password, req.body.fname,
                req.body.lname, req.body.creation_date, req.body.isAdmin,
                req.body.branch_id];

	//Insert row into users table
	mysql.pool.query(sql, record, function(err, result) {
			if(err) {
				console.log(err);
				JSON.stringify(err);
				res.status(400).send(err);
				return;
			}
			//TODO return id?
			res.status(200).end();
			return;
		});
});


/*------------- Get all admins -------------*/
app.get('/API/admins', (req, res) => {
  console.log("GET /API/admins");

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var sql = 'SELECT user_id, email, fname, lname, creation_date, branch_id, sig_id FROM users WHERE isAdmin = 1';

	mysql.pool.query (sql, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}
		res.header('Access-Control-Allow-Origin', '*');
 		res.status(200).send(rows);
	});
});


/*------------- Get a specific admin -------------*/
app.get('/API/admins/:admin_id', (req, res) => {
  console.log("GET /API/admins/:admin_id");

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = 'SELECT user_id, email, fname, lname, creation_date, branch_id, sig_id FROM users WHERE user_id= ? && isAdmin = 1';

	mysql.pool.query (sql, req.params.user_id, req.params.isAdmin, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send(context);
	});
});


/*------------- Edit an admin -------------*/
app.put('/API/admins/:admin_id', (req, res) => {
  console.log("PUT /API/admins/:admin_id");

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = "";
	var record = [];
  console.log(req.body)

	//Update with or without password
	if(req.body.password === null || req.body.password === undefined || req.body.password === "") {
		sql = 'UPDATE users SET email = ?, fname = ?, lname = ?, creation_date = ?, branch_id = ? WHERE user_id = ?';
		record = [req.body.email, req.body.fname,
              req.body.lname, req.body.creation_date,
              req.body.branch_id, req.params.admin_id];
	} else {
			sql = 'UPDATE users SET email = ?, password = ?, fname = ?, lname = ?, creation_date = ?, branch_id = ?, WHERE user_id = ?';
			record = [req.body.email, req.body.fname, req.body.password,
                req.body.lname, req.body.creation_date,
                req.body.branch_id, req.params.admin_id];
	}

	mysql.pool.query (sql, record, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send('Edit successful');
	});
});


/*------------- Delete an admin -------------*/
app.delete('/API/admins/:admin_id', (req, res) => {
  console.log("DELETE /API/admins/:admin_id");

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = 'DELETE FROM users WHERE user_id = ?';

	mysql.pool.query (sql, req.params.admin_id, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send('Delete successful');
	});
});


/*------------- Create a user -------------*/
app.post('/API/users', (req, res) => {
  console.log("POST /API/users")

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

  var context = {};

	//Check that email field exists in request
  if(req.body.email === null ||
		 req.body.email === undefined ||
		 req.body.email === "") {
		res.status(400).send('Error: email not found');
		return;
  }

  //Check that password field exists in request
  if(req.body.password === null ||
     req.body.password === undefined ||
     req.body.password === "") {
    res.status(400).send('Error: password not found');
    return;
  }

  //Check that fname field exists in request
  if(req.body.fname === null ||
     req.body.fname === undefined ||
     req.body.fname === "") {
    res.status(400).send('Error: first name not found');
    return;
  }

  //Check that lname field exists in request
  if(req.body.lname === null ||
     req.body.lname === undefined ||
     req.body.lname === "") {
    res.status(400).send('Error: last name not found');
    return;
  }

	//Check that creation_date field exists in request
	if(req.body.creation_date === null ||
		 req.body.creation_date === undefined ||
		 req.body.creation_date === "") {
		res.status(400).send('Error: creation date not found');
		return;
	}

  //Check that isAdmin field exists in request
  if(req.body.isAdmin === null ||
     req.body.isAdmin === undefined ||
     req.body.isAdmin === "") {
    res.status(400).send('Error: administrator status not found');
    return;
  }

  //Check that branch_id field exists in request
  if(req.body.branch_id === null ||
     req.body.branch_id === undefined ||
     req.body.branch_id === "") {
    res.status(400).send('Error: branch not found');
    return;
  }

  // //Check that sig_id field exists in request
  // if(req.body.sig_id === null ||
  //    req.body.sig_id === undefined ||
  //    req.body.sig_id === "") {
  //   res.status(400).send('Error: signature not found');
  //   return;
  // }

  //Create variables to prepare data for insertion into table
	var sql = 'INSERT INTO users (email, password, fname, lname, creation_date, isAdmin, branch_id) VALUES (?,?,?,?,?,?,?)';
	var record = [req.body.email, req.body.password, req.body.fname,
                req.body.lname, req.body.creation_date, req.body.isAdmin,
                req.body.branch_id];

  //Insert row into users table
  mysql.pool.query(sql, record, function(err, result) {
      if(err) {
        console.log(err);
        JSON.stringify(err);
        res.status(400).send(err);
        return;
      }
      //TODO return id?
      res.status(200).end();
      return;
    });
});


/*------------- Get all users -------------*/
app.get('/API/users', (req, res) => {
  console.log("GET /API/users")

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var sql = 'SELECT user_id, email, fname, lname, creation_date, isAdmin, branch_id, sig_id FROM users WHERE isAdmin = 0';

	mysql.pool.query (sql, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}
    res.header('Access-Control-Allow-Origin', '*');
 		res.status(200).send(rows);
	});
});


/*------------- Report Filter: Users who have given Most Awards  -------------*/
app.get('/API/users/mostawards', function(req, res, next) {
console.log("GET /API/users/mostawards")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where isAdmin = 0
   group by u.user_id
   order by \`count\` desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have given Most Awards: Employee of the Month  -------------*/
app.get('/API/users/mostawards/eotm', function(req, res, next) {
console.log("GET /API/users/mostawards/eotm")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
		left join awards as a on a.award_id=ua.award_id
		where type="Employee of the Month"
	group by user_id
   ) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where not u.isAdmin
   group by u.user_id
   order by \`count\` desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have given Most Awards: Best Team Player  -------------*/
app.get('/API/users/mostawards/btp', function(req, res, next) {
console.log("GET /API/users/mostawards/btp")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
		left join awards as a on a.award_id=ua.award_id
		where type="Best Team Player"
        group by user_id
   ) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where not u.isAdmin
   group by u.user_id
   order by \`count\` desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Get a specific user -------------*/
app.get('/API/users/:user_id', (req, res) => {
  console.log("GET /API/users/:user_id")

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = 'SELECT user_id, email, password, fname, lname, creation_date, isAdmin, branch_id, sig_id FROM users WHERE user_id = ? && isAdmin = 0';

	mysql.pool.query (sql, req.params.user_id, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send(context);
	});
});


/*------------- Edit a user -------------*/
app.put('/API/users/:user_id', (req, res) => {
  console.log("PUT /API/users/:user_id")

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = "";
	var record = [];

  //Update with or without password
	if(req.body.password === null || req.body.password === undefined || req.body.password === "") {
		sql = 'UPDATE users SET email = ?, fname = ?, lname = ?, creation_date = ?, branch_id = ?, sig_id = ? WHERE user_id = ?';
		record = [req.body.email, req.body.fname,
              req.body.lname, req.body.creation_date,
              req.body.branch_id, req.body.sig_id, req.params.user_id];
	} else {
			sql = 'UPDATE users SET email = ?, password = ?, fname = ?, lname = ?, creation_date = ?, branch_id = ?, sig_id = ? WHERE user_id = ?';
			record = [req.body.email, req.body.fname, req.body.password,
                req.body.lname, req.body.creation_date,
                req.body.branch_id, req.body.sig_id, req.params.user_id];
	}

	mysql.pool.query (sql, record, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send('Edit successful');
	});
});


/*------------- Delete a user -------------*/
app.delete('/API/users/:user_id', (req, res) => {
  console.log("DELETE /API/users/:user_id")

  if (session.loggedIn === 0) {
    res.status(403).end()
    return
  }

	var context = {};
	var sql = 'DELETE FROM users WHERE user_id = ?';

	mysql.pool.query (sql, req.params.user_id, function(err, rows, fields){
		if(err){
			console.log(err);
			JSON.stringify(err);
			res.status(400).send(err);
			return;
		}

		context.results = JSON.stringify(rows);
		console.log(context);
 		res.status(200).send('Delete successful');
	});
});



/*------------- Report Filter: Users who have assigned most awards BY REGION   -------------*/
app.get('/API/users/mostawards/region', function(req, res, next) {
console.log("GET /API/users/mostawards/region")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1
   group by u.user_id, u.branch_id
   order by \`count\` desc) as ac
   on b.branch_id=ac.branch_id
  group by b.region
  order by number desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most Employee of the Month awards BY REGION   -------------*/
app.get('/API/users/mostawards/region/eotm', function(req, res, next) {
console.log("GET /API/users/mostawards/region/eotm")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
      left join awards as a on a.award_id=ua.award_id
   where a.type="Employee of the Month"
   group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1
   group by u.user_id, u.branch_id
   order by \`count\` desc) as ac
   on b.branch_id=ac.branch_id
  group by b.region
  order by number desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most Best Team Player awards BY REGION   -------------*/
app.get('/API/users/mostawards/region/btp', function(req, res, next) {
console.log("GET /API/users/mostawards/region/btp")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
      left join awards as a on a.award_id=ua.award_id
   where a.type="Best Team Player"
   group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1
   group by u.user_id, u.branch_id
   order by \`count\` desc) as ac
   on b.branch_id=ac.branch_id
  group by b.region
  order by number desc`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most mosts BY BRANCH   -------------*/
app.get('/API/users/mostawards/branch', function(req, res, next) {
console.log("GET /API/users/mostawards/branch")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select branch_id, name, city, state, region, sum(\`count\`) as total from
  (select b.branch_id, b.name, b.city, b.state, b.region, ifNull(uac.awardCount, 0) as \`count\`
  from branches as b
  left join users as u on b.branch_id=u.branch_id
  left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on uac.user_id= u.user_id) as b
  group by branch_id;`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);
      console.log(results);
			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most Employee of the Month awards BY BRANCH   -------------*/
app.get('/API/users/mostawards/branch/eotm', function(req, res, next) {
console.log("GET /API/users/mostawards/branch/eotm")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select b.branch_id, b.name, b.city, b.state, b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
      left join awards as a on a.award_id=ua.award_id
	  where a.type="Employee of the Month"
   group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1
   group by u.user_id, u.branch_id
   order by \`count\` desc) as ac
   on b.branch_id=ac.branch_id
  group by branch_id`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most Best Team Player awards BY BRANCH   -------------*/
app.get('/API/users/mostawards/branch/btp', function(req, res, next) {
console.log("GET /API/users/mostawards/branch/btp")

if (session.loggedIn === 0) {
  res.status(403).end()
  return
}

  var sql = `select b.branch_id, b.name, b.city, b.state, b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select ua.user_id, count(ua.award_id) as awardCount from \`user-awards\` as ua
      left join awards as a on a.award_id=ua.award_id
	  where a.type="Best Team Player"
      group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1
   group by u.user_id, u.branch_id
   order by \`count\` desc) as ac
   on b.branch_id=ac.branch_id
  group by branch_id`;

		mysql.pool.query(sql, function(err, rows, fields) {
			if(err) {
        console.log(err);
  			JSON.stringify(err);
  			res.status(400).send(err);
  			return;
			}

			var results = JSON.stringify(rows);

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});

/* ******************* Generate PDF Certificate Functions ******************* */
function genpdf(userEmail, from, to, type, date, image){
	//const input = fs.createReadStream('./emp.tex');
	const path = './award/' + userEmail + 'out.pdf';
	const output = fs.createWriteStream(path);
	//const pdf = latex(input);
	const pdf = require("latex")(["\\documentclass[tikz, landscape]{slides}",
		"\\usepackage{graphicx,pstricks,tikz}",
		"\\usepackage[T1]{fontenc}",
		"\\usepackage[margin=0in]{geometry}",
		"\\linespread{1.3}",
		//"\\includegraphics[width=1.0\\linewidth]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/award/back}",
		"\\title{" + type + "\\\\}",
		"\\author{\\textbf{\\LARGE{CONGRATULATIONS!\\\\\\\\Awarded to " + to + "}}}",
		"\\date{Awarded on " + date + "}",
		"\\noindent\\begin{document}",
		"\\noindent\\begin{tikzpicture}",
			"\\draw (0,0) node[inner sep=0]{\\centered\\includegraphics[width=0.95\\textwidth]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/award/back}};",
			"\\noindent\\draw (0,3) node[text width=30em]{\\maketitle};",
			`\\write18{wget http://flip3.engr.oregonstate.edu:30444/${image}};`, //Theoretically, if you put your url here
			`\\draw (0,-3) node{\\includegraphics[width=6cm,height=3cm]{${image}}};`, //and the name it gets once it's written, the image should show up from a url
			"\\draw (0,-3) node{\\includegraphics[width=6cm,height=3cm]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/sig}};", // But idk how to test that so please try it out
			"\\draw (0, -5) node{\\large{Awarded By: " + from + "}};",
		"\\end{tikzpicture}",
		/*"\\begin{picture}(100,100)",
		"\\includegraphics[width=1.0\\linewidth,height=1.0\\linewidth]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/award/back}",
		"\\put(50,50){hello}",
		//"\\put(50, 50){\\maketitle}",
		//"\\put(30,40){includegraphics[width=0.1\\linewidth]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/sig}}",
		"\\end{picture}",*/
		//"\\maketitle",
		//"\\includegraphics{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/sig}",
		"\\end{document}"]).pipe(output);
/*const pdf = require("latex")(["\\documentclass[16pt, landscape]{article}",
"\\usepackage[a4paper,left=2cm,right=2cm,top=2cm,bottom=2cm]{geometry}",
"\\usepackage{pdflscape,setspace,amsmath,amssymb}",
"\\usepackage[utf8]{inputenc}",
"\\usepackage[T1]{fontenc}",
"\\usepackage{tgschola}",
"\\usepackage{graphicx}",
"\\usepackage[normalem]{ulem}",
"\\usepackage{charter}",
"\\usepackage{microtype}",
"\\hyphenpenalty 100000",
/*"\\def\\signature#1#2{\\parbox[b]{1in}{\\smash{#1}\\vskip12pt}",
"\\hfill \\parbox[t]{2.8in}{\\shortstack{\\vrule width 2.8in height 0.4pt\\\\small#2}}}",
"\\def\\sigskip{\\vskip0.4in plus 0.1in}",
        "\\def\\beginskip{\\vskip0.5875in plus 0.1in}",*/
/*"\\begin{document}",
"\\begin{center}",
	"\\noindent\\makebox[\\textwidth]{\\includegraphics[width=\\paperwidth,height=\\paperheight]{/nfs/stak/users/mcguganr/Serpens-Capstone-Fall-2018/award/back},",
		"\\title{" + type + "},",
		"\\author{" + from + "},",
		"\\date{\\today},}",
"\\end{center}",
/*"\\begin{minipage}[c]{6.5in}",
"{\\centering",
	"{\\onehalfspacing",
		"{\\LARGE\\bfseries {\\color{other}{{ Pondicherry  Engineering College}}}}\\\\%\\initfamily",
		"\\vskip0.4em",
		"{\\large ISTE Short Term Training Program on\\\\}",
		"{\\Large\\bfseries{NANO ENGINEERING MATERIALS}}}\\\\",
	"\\par}",
"\\end{minipage}",
"\\hfill",
"\\begin{minipage}[l]{1.5in}",
"\\end{minipage}",
"\\hfill",
"\\begin{minipage}[c]{6.5in}",
"{\\centering",
	"{\\onehalfspacing",
		"{\\Large\\bfseries \\color{title}{Certificate of Participation}}\\par",
		"\\vskip0.5em",
		"{\\Large\\decofourleft\\quad{\\color{blue}\\decoone}\\quad\\decofourright}",
	"\\par}}",
"\\end{minipage}",
"\\hfill",
"\\begin{minipage}[r]{1.5in}",
"\\end{minipage}",
"\\vskip1.8em",
"{\\doublespacing",
"This is to certify that \\uuline{{\\large\\sffamily\\bfseries\\color{name}{\\dg. \\MakeUppercase{\\name}}}}, { \\dgn}",
"of {\\sub}, {\\inst}, {\\place},",
"has successfully participated in the two week  Short  Term   Training  Program",
"on  ``\\emph{\\color{phd}{Nano   Engineering   Materials}}''   sponsored   by  ISTE  and  organized  by  Department of  Physics, Pondicherry  Engineering   College,  Puducherry,  from",
"13$^{\\text{th}}$ December to 23$^{\\text{rd}}$ December 2010.}",
"\\noindent",
"{\\singlespacing",
"\\vfil",
"\\begin{minipage}[l]{2.8in}",
"\\sigskip \\signature{}{Dr. Harish Kumar \\\\ Co-ordinator }",
"\\end{minipage}",
"\\hfill",
"\\begin{minipage}[c]{2.8in}",
"\\sigskip \\signature{}{Dr. Harish Kumar \\\\ Co-ordinator }",
"\\end{minipage}",
"\\hfill",
"\\begin{minipage}[r]{2.8in}",
"\\sigskip \\signature{}{Dr. Harish Kumar \\\\ Principal }",
"\\end{minipage}} ",
"\\pagebreak}",*/
/*"\\end{document}"]).pipe(output);*/
	//Watch the write stream for it to finish, then send the email to the user
	pdf.on('error', err => console.error(err));
	pdf.on('finish', () => emailpdf(userEmail));
};

function emailpdf(userEmail) {
	console.log('PDF generated!');
	//Generate body of email that will be sent
	const output = `
		<p color='blue'>Congratulations!</p>
		<p>Someone has given you an award!</p>
	`;

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'noreplyserpens@gmail.com', // generated ethereal user
			pass: 'serpens467' // generated ethereal password
		},
		tls:{
			rejectUnauthorized:false //Accept untrustworthy stuff like us :)
		}
	});

	// setup email data with unicode symbols
	let mailOptions = {
		from: '"Serpens Project" <noreplyserpens@gmail.com>', // sender address
		to: userEmail, // list of receivers
		subject: 'You Received an Award!', // Subject line
		text: 'Hello world?', // plain text body
		attachments: [{
			filename: userEmail + 'out.pdf',
			path: './award/' + userEmail + 'out.pdf',
			contentType: 'application/pdf'
		}],
		html: output // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: %s', info.messageId);
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		res.status(200).render('recover', {msg:'Email sent'})
	});
};

/* ******************* Recovery Functions ******************* */
app.get('/forgotPassword', function(req, res) {
	res.status(200).render('recover');
});

/* ------------- Recover Password Using Email --------- */
app.post('/forgotPassword', (req, res) => {
	var sql = 'SELECT fname, lname, password FROM users WHERE email = ?';
	var context = {};

	mysql.pool.query (sql, [req.body.email], function(err, rows, fields){
		if(err || rows.length == 0){ //If there was an error or no entries were returned
			console.log(err);
			JSON.stringify(err);
			res.status(400).render('recover', {msg:'Account does not exist'});
			return;
		}

		//Generate body of email that will be sent
		const output = `
			<p>Hello, ${rows[0].fname} ${rows[0].lname}</p>
			<p>Your account password has been requested on our website. If you did not request your password, please consider changing your account information on our website.</p>
			<h3>Your account password: ${rows[0].password}</h3>
		`;

		// create reusable transporter object using the default SMTP transport
	    let transporter = nodemailer.createTransport({
	    	service: 'gmail',
	        auth: {
	            user: 'noreplyserpens@gmail.com', // generated ethereal user
	            pass: 'serpens467' // generated ethereal password
	        },
	        tls:{
	        	rejectUnauthorized:false //Accept untrustworthy stuff like us :)
	        }
	    });

	    // setup email data with unicode symbols
	    let mailOptions = {
	        from: '"Serpens Project" <noreplyserpens@gmail.com>', // sender address
	        to: req.body.email, // list of receivers
	        subject: 'Recover Your Employee Recognition Account', // Subject line
	        text: 'Hello world?', // plain text body
	        /*attachments: [{
		    filename: 'output.pdf',
		    path: './output.pdf',
		    contentType: 'application/pdf'
		  	}],*/
	        html: output // html body
	    };

	    // send mail with defined transport object
	    transporter.sendMail(mailOptions, (error, info) => {
	        if (error) {
	            return console.log(error);
	        }
	        console.log('Message sent: %s', info.messageId);
	        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
			res.status(200).render('recover', {msg:'Email sent'})
	    });
	});
});

/* ------------- Error Handling Functions ------------- */

//Error handling: 404
app.use(function(req, res) {
	res.status(404);
	res.header('Access-Control-Allow-Origin', '*');
	res.send('404');

});


//Error handling: 500
app.use(function(req, res) {
	console.error(err.stack);
	res.status(500);
	res.header('Access-Control-Allow-Origin', '*');
	res.send('500');
});
