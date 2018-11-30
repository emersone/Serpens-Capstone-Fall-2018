//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

//const URL = "https://serpens-cs467.appspot.com/";
//const URL = "http://localhost:8080";

var app = new Vue({
  el: '#app',
  data: {
	   admins: [],
     users: []
  },
  created() {
    this.refreshAdmins();
	  this.refreshUsers();
  },
  methods: {
    clearAdmins: function() {
      var length = this.admins.length;
      for (var i = 0; i < length; i++) {
        this.admins.pop();
      }
    },
    refreshAdmins: function() {
      var vm = this;
      fetch("/API/admins")
  		.then(function(response) {
  			return response.json();
  		})
  		.then(function(json) {
        console.log(json)
        vm.clearAdmins();
        for(i in json) {
          json[i].creation_date = moment(unescape(json[i].creation_date), ["YYYY-MM-DDTHH:mm:ssZ","YYYY-MM-DD HH:mm:ss"]).format("YYYY-MM-DD HH:mm:ss").toString();
          vm.admins.push(json[i]);
        }
  		})
      .catch(function(err){
        console.log(err);
      })
    },
    addAdmin: function(event) {
      var vm = this;
      email = document.getElementById("email").value.trim();
      password = document.getElementById("password").value.trim();
      fname = document.getElementById("fname").value.trim();
      lname  = document.getElementById("lname").value.trim();
      creation_date = document.getElementById("creation_date").value.trim();
      branch_id = document.getElementById("branch_id").value.trim();
      sig_id = document.getElementById("sig_id").value.trim();

      obj = {
        "email": email,
        "password": password,
        "fname": fname,
        "lname": lname,
        "creation_date": creation_date,
        "isAdmin": 1,
        "branch_id": branch_id,
        "sig_id": sig_id
      }

      fetch("/API/admins", {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(obj), // data can be `string` or {object}!
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(res => vm.refreshAdmins())
      .catch(error => console.error('Error:', error));

  },
    deleteAdmin: function(event) {
      var vm1 = this;
      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      fetch("/API/admins/" + adminId, {
        method: 'DELETE',    })
        .then(response => vm1.refreshAdmins())
        .catch(error => console.error('Error:', error));
    },
    editAdmin: function(event) {
      var vm1 = this;

      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      var email = event.toElement.parentNode.parentNode.childNodes[2].innerHTML
      var fname = event.toElement.parentNode.parentNode.childNodes[4].innerHTML
      var lname = event.toElement.parentNode.parentNode.childNodes[6].innerHTML
      var creation_date = event.toElement.parentNode.parentNode.childNodes[8].innerHTML
      var branch_id = event.toElement.parentNode.parentNode.childNodes[10].innerHTML
      var sig_id = event.toElement.parentNode.parentNode.childNodes[12].innerHTML
      var rowIndex = event.toElement.parentNode.parentNode.rowIndex

        window.location.href = "edit.html?user_id=" + adminId +
                               "&email=" + email +
                               "&fname=" + fname +
                               "&lname=" + lname +
                               "&creation_date=" + creation_date +
                               "&branch_id=" + branch_id +
                               "&sig_id=" + sig_id;
    },
    clearUsers: function() {
        var length = this.users.length;
        for (var i = 0; i < length; i++) {
          this.users.pop();
        }
      },
    refreshUsers: function() {
        var vm = this;
        fetch("/API/users")
    		.then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          console.log(json)
          vm.clearUsers();
          for(i in json) {
            json[i].creation_date = moment(unescape(json[i].creation_date), ["YYYY-MM-DDTHH:mm:ssZ","YYYY-MM-DD HH:mm:ss"]).format("YYYY-MM-DD HH:mm:ss").toString();
            vm.users.push(json[i]);
          }
    		})
        .catch(function(err){
          console.log(err);
        })
      },
    addUser: function(event) {
      var vm = this;
      email = document.getElementById("user_email").value.trim();
      password = document.getElementById("user_password").value.trim();
      fname = document.getElementById("user_fname").value.trim();
      lname  = document.getElementById("user_lname").value.trim();
      creation_date = document.getElementById("user_creation_date").value.trim();
      branch_id = document.getElementById("user_branch_id").value.trim();
      sig_id = document.getElementById("user_sig_id").value.trim();

      obj = {
        "email": email,
        "password": password,
        "fname": fname,
        "lname": lname,
        "creation_date": creation_date,
        "isAdmin": 0,
        "branch_id": branch_id,
        "sig_id": sig_id
      }

      console.log(obj)

      fetch("/API/users", {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(obj), // data can be `string` or {object}!
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(res => vm.refreshUsers())
      .catch(error => console.error('Error:', error));

    },
      deleteUser: function(event) {
        var vm = this;
        var userId = event.toElement.parentNode.parentNode.firstChild.innerHTML
        fetch("/API/users/" + userId, {
          method: 'DELETE',    })
          .then(response => vm.refreshUsers())
          .catch(error => console.error('Error:', error));
      },
      editUser: function(event) {
        var vm = this;

        var userId = event.toElement.parentNode.parentNode.firstChild.innerHTML
        var email = event.toElement.parentNode.parentNode.childNodes[2].innerHTML
        var fname = event.toElement.parentNode.parentNode.childNodes[4].innerHTML
        var lname = event.toElement.parentNode.parentNode.childNodes[6].innerHTML
        var creation_date = event.toElement.parentNode.parentNode.childNodes[8].innerHTML
        var branch_id = event.toElement.parentNode.parentNode.childNodes[10].innerHTML
        var sig_id = event.toElement.parentNode.parentNode.childNodes[12].innerHTML
        var rowIndex = event.toElement.parentNode.parentNode.rowIndex

          window.location.href = "edit_user.html?user_id=" + userId +
          "&email=" + email +
          "&fname=" + fname +
          "&lname=" + lname +
          "&creation_date=" + creation_date +
          "&branch_id=" + branch_id +
          "&sig_id=" + sig_id;

      },
    }

})


/*----------------------------------USERS----------------------------------*/
