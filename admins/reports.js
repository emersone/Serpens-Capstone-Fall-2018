
//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

//const URL = "https://serpens-cs467.appspot.com/";
const URL = "http://localhost:8080";

var app = new Vue({
  el: '#app',
  data: {
    usersmost: [],
    eotm: [],
    btp: [],
    regionmost: [],
    regioneotm: [],
    regionbtp: [],
    branchmost: [],
    brancheotm: [],
    branchbtp: [],
    showMostAwards: false,
    showEOTMAwards: false,
    showBTPAwards: false,
    showRegionsMost: false,
    showRegionsEOTM: false,
    showRegionsBTP: false,
    showBranch: false,
    showBranchEOTM: false,
    showBranchBTP: false
  },
  created() {

  },
  methods: {
    turnOffShows: function() {
      this.showMostAwards = false
      this.showEOTMAwards = false
      this.showBTPAwards = false
      this.showRegionsMost = false
      this.showRegionsEOTM = false
      this.showRegionsBTP = false
      this.showBranch = false
      this.showBranchEOTM = false
      this.showBranchBTP = false
    },
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
          vm.turnOffShows()
          vm.showMostAwards = true
          for (i in json) {
            vm.usersmost.push(json[i])
          }
    		})
      }else if (entities === "users" && award === "eotm_awards") {
        fetch(URL + "/API/users/mostawards/eotm")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showEOTMAwards = true
          for (i in json) {
            vm.eotm.push(json[i])
          }
    		})
      }else if (entities === "users" && award === "btp_awards") {
        fetch(URL + "/API/users/mostawards/btp")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBTPAwards = true
          for (i in json) {
            vm.btp.push(json[i])
          }
    		})
      }else if (entities === "branches" && award === "awards") {
        fetch(URL + "/API/users/mostawards/branch")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranch = true
          for (i in json) {
            vm.branchmost.push(json[i])
          }
    		})
      }else if (entities === "branches" && award === "eotm_awards") {
        fetch(URL + "/API/users/mostawards/branch/eotm")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranchEOTM = true
          for (i in json) {
            vm.brancheotm.push(json[i])
          }
    		})
      }else if (entities === "branches" && award === "btp_awards") {
        fetch(URL + "/API/users/mostawards/branch/btp")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranchBTP = true
          for (i in json) {
            vm.branchbtp.push(json[i])
          }
    		})
      }else if (entities === "regions" && award === "awards") {
          fetch(URL + "/API/users/mostawards/region")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsMost = true
            for (i in json) {
              vm.regionmost.push(json[i])
            }
            console.log(json);
      		})
        }else if (entities === "regions" && award === "eotm_awards") {
          fetch(URL + "/API/users/mostawards/region/eotm")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsEOTM = true
            for (i in json) {
              vm.regioneotm.push(json[i])
            }
      		})
        }else if (entities === "regions" && award === "btp_awards") {
          fetch(URL + "/API/users/mostawards/region/btp")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsBTP = true
            for (i in json) {
              vm.regionbtp.push(json[i])
            }
      		})
        }
    },
  }


})


/*----------------------------------USERS----------------------------------*/
