//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

const URL = "https://serpens-cs467.appspot.com";

var app = new Vue({
  el: '#app',
  data: {
	   admins: {},
  },
  created() {
	  var vm = this;
      fetch(URL + "/API/admins")
      .then(function(response) {
  			return response.json();
  		})
		.then(function(myJson) {
			vm.admins = myJson
		})
    .catch(function(err){console.log(err)});

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
      fetch(URL + "/API/admins")
  		.then(function(response) {
  			return response.json();
  		})
  		.then(function(json) {
        vm.clearAdmins();
        for(i in json) {
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
      creation_date = document.getElementById("creation_date").value.trim();

      obj = {
        "email": email,
        "password": password,
        "creation_date": creation_date
      }

      fetch(URL + "/API/admins", {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(obj), // data can be `string` or {object}!
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(res => vm.refreshAdmins())
      .catch(error => console.error('Error:', error));

      // $.post("http://localhost:8080/API/admins", obj, function(res) {
      //   vm.refreshAdmins()
      // });
  },
    deleteAdmin: function(event) {
      var vm = this;
      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      fetch(URL + "/API/admins/" + adminId, {
        method: 'DELETE',    })
        .then(response => vm.refreshAdmins())
        .catch(error => console.error('Error:', error));
    },
    editAdmin: function(event) {
      var vm = this;

      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      var email = event.toElement.parentNode.parentNode.childNodes[2].innerHTML
      var password = event.toElement.parentNode.parentNode.childNodes[4].innerHTML
      var creation_date = event.toElement.parentNode.parentNode.childNodes[6].innerHTML
      var rowIndex = event.toElement.parentNode.parentNode.rowIndex

        window.location.href = "edit.html?admin_id=" + adminId +
                               "&email=" + email + "&password=" + password +
                               "&creation_date=" + creation_date;


      //Vue.set(this.admins, rowIndex-1, obj);



    },
  }
})
