//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

var app = new Vue({
  el: '#app',
  data: {
	   admins: {},
  },
  created() {
	  var vm = this;
      fetch("http://localhost:8080/API/admins")
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
      fetch("http://localhost:8080/API/admins")
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

      $.post("http://localhost:8080/API/admins", obj, function(res) {
        vm.refreshAdmins()
      });
  },
    deleteAdmin: function(event) {
      var vm = this;
      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      fetch("http://localhost:8080/API/admins/" + adminId, {
        method: 'DELETE',    })
        .then(response => vm.refreshAdmins())
        .catch(error => console.error('Error:', error));
    },

    // openAdminModal: function(event) {
    //   this.showModal = true;
    //   var vm = this;
    //   var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
    //   var email = event.toElement.parentNode.parentNode.childNodes[2].innerHTML
    //   var password = event.toElement.parentNode.parentNode.childNodes[4].innerHTML
    //   var creation_date = event.toElement.parentNode.parentNode.childNodes[6].innerHTML
    //
    //   console.log(email);
    //   console.log(password);
    //   console.log(creation_date);
    //
    //   obj = {
    //     "email": email,
    //     "password": password,
    //     "creation_date": creation_date
    //   }
    //
    //   fetch("http://localhost:8080/API/admins/" + adminId, {
    //     method: 'PUT',    })
    //     .then(response => vm.refreshAdmins())
    //     .catch(error => console.error('Error:', error));
    // },


    listenEdit: function() {
      

    }
    editAdmin: function(event) {
      var vm = this;
      var adminId = event.toElement.parentNode.parentNode.firstChild.innerHTML
      var email = event.toElement.parentNode.parentNode.childNodes[2].innerHTML
      var password = event.toElement.parentNode.parentNode.childNodes[4].innerHTML
      var creation_date = event.toElement.parentNode.parentNode.childNodes[6].innerHTML
      var rowIndex = event.toElement.parentNode.parentNode.rowIndex

      obj = {
        "admin_id": adminId,
        "email": '<input placeholder=' + email + ' type="text" name="email" value="">',
        "password":  '<input placeholder=' + password + ' type="text" name="password" value="">',
        "creation_date": '<input placeholder=' + creation_date + ' type="text" name="creation_date" value="">'
      }

      Vue.set(this.admins, rowIndex-1, obj);



    },
  }
})
