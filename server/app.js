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

const express = require('express');
var mysql = require('./dbcon.js');

const app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// [START hello_world]
// Say hello!
app.get('/', (req, res) => {
	var context = {};
	
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