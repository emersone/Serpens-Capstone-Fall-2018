//Set-up
const path = require(`path`);
const http = require(`http`);
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
// app.use('/login/admins', express.static(path.join(__dirname, '/login/admins')));
//app.use('/users', express.static(path.join(__dirname, 'users')));
// app.use('/login/users', express.static(path.join(__dirname, '/login/users')));

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
    console.log("in login.js get");
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
  var SQL = "SELECT user_id, fname, branch_id, isAdmin FROM users WHERE email = ? AND password = ?";
  var inserts = [email, password];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, inserts, (error, results) => {
      if (!_.isEmpty(results)) {
        resolve({id: results[0].user_id, name: results[0].fname, branch: results[0].branch_id, isAdmin: results[0].isAdmin});
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
      session.loggedIn = results.id;
      res.redirect("/awards");
    }
    else {
      session.loggedIn = results.id;
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
const getAwards = (user_id) => {
  var SQL = "SELECT * FROM users.awards WHERE creator_user_id = " + user_id;
  //  	var inserts = [user_id];
  return new Promise((resolve, reject) => {
    mysql.pool.query(SQL, (error, results) => {
      if (error) {
        console.log(error);
        console.log(results);
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
        console.log(error);
        console.log(results);
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
//  console.log(inserts);
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
  const thisUser = session.loggedIn;
  getAwards(thisUser).then((data) => {
    res.render('awards', {"data": data});
  });

});

app.post("/awards", (req, res) => {
  //	console.log(req.body);
  const thisUser = session.loggedIn;
  if (Object.keys(req.body).indexOf("delete") > -1) {
    deleteAward(req.body.award_id, thisUser).then(() => {
      getAwards(thisUser).then((data) => {
        res.render('awards', {"data": data});
      });
    });
  }
  else if (Object.keys(req.body).indexOf("update") > -1) {
    console.log("In update");
    updateAward(req.body, thisUser).then(() => {
      getAwards(thisUser).then((data) => {
        res.render('awards', {"data": data});
      });
    });
  }
  else if (Object.keys(req.body).indexOf("add") > -1) {
    console.log("In add");
      newAward(req.body, thisUser).then(() => {
      getAwards(thisUser).then((data) => {
        res.render('awards', {"data": data});
      });
    });
  }
  else {
    console.log("Error invalid");
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
  if(req.body.sig_id === null ||
     req.body.sig_id === undefined ||
     req.body.sig_id === "") {
    res.status(400).send('Error: signature not found');
    return;
  }

	//Create variables to prepare data for insertion into table
	var sql = 'INSERT INTO users (email, password, fname, lname, creation_date, isAdmin, branch_id, sig_id) VALUES (?,?,?,?,?,?,?,?)';
	var record = [req.body.email, req.body.password, req.body.fname,
                req.body.lname, req.body.creation_date, req.body.isAdmin,
                req.body.branch_id, req.body.sig_id];

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
  if(req.body.sig_id === null ||
     req.body.sig_id === undefined ||
     req.body.sig_id === "") {
    res.status(400).send('Error: signature not found');
    return;
  }

  //Create variables to prepare data for insertion into table
	var sql = 'INSERT INTO users (email, password, fname, lname, creation_date, isAdmin, branch_id, sig_id) VALUES (?,?,?,?,?,?,?,?)';
	var record = [req.body.email, req.body.password, req.body.fname,
                req.body.lname, req.body.creation_date, req.body.isAdmin,
                req.body.branch_id, req.body.sig_id];

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
  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
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
  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where type="Best Team Player"
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
  var sql = `select u.user_id, u.email, u.password, u.fname, u.lname, u.creation_date, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where type="Best Team Player"
   group by u.user_id
   order by \`count\` desc
`;

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

  var sql = `select b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1 AND a.type="Employee of the Month"
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

  var sql = `select b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1 AND a.type="Best Team Player"
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

			res.header('Access-Control-Allow-Origin', '*');
			res.send(results);

		});
});


/*------------- Report Filter: Users who have assigned most Employee of the Month awards BY BRANCH   -------------*/
app.get('/API/users/mostawards/branch/eotm', function(req, res, next) {
console.log("GET /API/users/mostawards/branch/eotm")

  var sql = `select b.branch_id, b.name, b.city, b.state, b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1 AND a.type="Employee of the Month"
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

  var sql = `select b.branch_id, b.name, b.city, b.state, b.region, ifNull(sum(count), 0) as number from
  branches as b left join
  (select u.user_id, u.branch_id, ifNull(uac.awardCount, 0) as \`count\`
   from users as u left join (select user_id, count(award_id) as awardCount from \`user-awards\` group by user_id) as uac on u.user_id=uac.user_id
   left join \`user-awards\` as ua on ua.user_id=u.user_id
   left join awards as a on a.award_id=ua.award_id
   where u.isAdmin!=1 AND a.type="Best Team Player"
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
