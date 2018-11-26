
//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

//const URL = "https://serpens-cs467.appspot.com/";
const URL = "http://localhost:8080";

var app = new Vue({
  el: '#app',
  data: {
    temp: "temp"
  },
  created() {

  },
  methods: {
    submit: function() {
      var vm = this
      var entities = document.getElementById("entities").value.trim()
      var award = document.getElementById("award").value.trim()
      console.log(entities)
      console.log(award)
      if (entities === "users" && award === "awards") {
        fetch(URL + "/API/users/mostawards")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          // TODO display
          vm.temp = JSON.stringify(json)
    		})
      }else if (entities === "users" && award === "eotm_awards") {
        fetch(URL + "/API/users/mostawards/eotm")
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          // TODO display
            console.log(json)
        })
      }else if (entities === "users" && award === "btp_awards") {
        fetch(URL + "/API/users/mostawards/btp")
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          // TODO display
            console.log(json)
        })
      }else if (entities === "branches" && award === "awards") {
        fetch(URL + "/API/users/mostawards/branch")
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          // TODO display
            console.log(json)
        })
      }else if (entities === "branches" && award === "eotm_awards") {
        fetch(URL + "/API/users/mostawards/branch/eotm")
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          // TODO display
            console.log(json)
        })
      }else if (entities === "branches" && award === "btp_awards") {
        fetch(URL + "/API/users/mostawards/branch/btp")
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          // TODO display
            console.log(json)
        })
      }else if (entities === "regions" && award === "awards") {
          fetch(URL + "/API/users/mostawards/region")
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            // TODO display
              console.log(json)
          })
        }else if (entities === "regions" && award === "eotm_awards") {
          fetch(URL + "/API/users/mostawards/region/eotm")
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            // TODO display
              console.log(json)
          })
        }else if (entities === "regions" && award === "btp_awards") {
          fetch(URL + "/API/users/mostawards/region/btp")
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            // TODO display
              console.log(json)
          })
        }
    },
  }


})


/*----------------------------------USERS----------------------------------*/
