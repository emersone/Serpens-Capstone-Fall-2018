const URL = "http://localhost:8080";

var app = new Vue({
  el: '#app',
  data: {
	   params: [],
     email: "",
     creation_date: "",
     fname: "",
     lname: ""
  },
  created() {
    //Arguments sent in through the URL
    var paramsString = window.location.search.substring(1);
    var params = [];
    var name = "";
    var value = "";
    var start = 0;
    var end = 0;

    //Parse the URL string into the params array
    for (i = 0; i < paramsString.length; i++) {

      //Loops through the URL string until = sign is found (meaning a field name
      //is found)
      if(paramsString[i] === "=") {

        //Takes substring up until the = sign and saves it into name
        name = paramsString.substring(start, end);

        //Creates a field in the params object using name
        params[name] = "";

        //Moves the start to the next variable
        start = end+1;
      }

      //Loops through the URL string until the & symbol is found (meaning a value
      //is found)
      else if (paramsString[i] === "&") {

        //Takes substring up until the & symbol and saves it into value
        value = paramsString.substring(start, end);

        //Saves value into name field
        params[name] = value;

        //Moves the start to the next variable
        start = end+1;
      }

      //Otherwise loops through the URL string to reach the end of the URL string
      //(meaning a value is found)
      else if (i === paramsString.length-1) {

        //Takes substring up until the end of the URl string and saves into value
        value = paramsString.substring(start, end+1);

        //Saves value into name field
        params[name] = value;
      }

      //Increments end
      end++;
    }
    this.email = params.email;
    this.creation_date = params.creation_date;
    this.fname = params.fname;
    this.lname = params.lname;
    this.params = params
  },
  methods: {
    submitEdit: function() {
      //Gets the new values out of the HTML document
      var userId = this.params.user_id;
      var email = document.getElementById("email").value;
      var password = document.getElementById("password").value;
      var creation_date = document.getElementById("creation_date").value;
      var fname = document.getElementById("fname").value;
      var lname = document.getElementById("lname").value;


      var obj = {
        "email": email,
        "password": password,
        "creation_date":creation_date,
        "fname": fname,
        "lname": lname
      }

      //Opens a new async GET request to update the mySQL table
      fetch(URL + "/API/users/" + userId, {
        method: 'PUT',
        body: JSON.stringify(obj),
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(response => console.log(response))
      .catch(error => console.error('Error:', error));

      window.location.href = "index.html";
    },

    }

})
