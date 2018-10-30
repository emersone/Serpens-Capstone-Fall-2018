//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

var app = new Vue({
  el: '#app',
  data: {
	admins: {},
    message: 'Hello Vue!'
  },
  created() {
	  var vm = this;
      fetch("http://localhost:8080/admins")
		.then(function(response) {
			return response.json();
		})
		.then(function(myJson) {
			vm.admins = myJson
		});

  },

  methods: {
    clearAdmins: function() {
      for (i in this.admins) {
        this.admins.pop();
      }
    },
    refreshAdmins: function() {
      var vm = this;
      vm.clearAdmins();
      fetch("http://localhost:8080/admins")
  		.then(function(response) {
  			return response.json();
  		})
  		.then(function(json) {
        for(i in json) {
          vm.admins.push(json[i]);
        }
  		});
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

      $.post("http://localhost:8080/admins", obj, function(res) {
        // TODO
        vm.refreshAdmins()
      });
    //   fetch("http://localhost:8080/admins", {
    //     method: 'POST',
    //     body: JSON.stringify(obj),
    //     mode: "no-cors",
    //     credentials: 'same-origin',
    //     headers:{
    //
    //     }
    // })
    // .then(response => console.log('Success:', JSON.stringify(response)))
    // .catch(error => console.error('Error:', error));
    }
  },

})
