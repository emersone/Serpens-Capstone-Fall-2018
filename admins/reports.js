
//Test page for Serpens::WEB3 Project
//shows functionality of administrators table

//const URL = "https://serpens-cs467.appspot.com/";
//const URL = "http://localhost:8080";

var app = new Vue({
  el: '#app',
  data: {
    myPieChart: null,
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
    clearAllCharts: function() {
      var size = this.regionmost.length
      for (i = 0; i < size; i++) {
        this.regionmost.pop()
      }
      var size = this.regioneotm.length
      for (i = 0; i < size; i++) {
        this.regioneotm.pop()
      }
      var size = this.regionbtp.length
      for (i = 0; i < size; i++) {
        this.regionbtp.pop()
      }
      var size = this.branchmost.length
      for (i = 0; i < size; i++) {
        this.branchmost.pop()
      }
      var size = this.brancheotm.length
      for (i = 0; i < size; i++) {
        this.brancheotm.pop()
      }
      var size = this.branchbtp.length
      for (i = 0; i < size; i++) {
        this.branchbtp.pop()
      }
      var size = this.usersmost.length
      for (i = 0; i < size; i++) {
        this.usersmost.pop()
      }
      var size = this.eotm.length
      for (i = 0; i < size; i++) {
        this.eotm.pop()
      }
      var size = this.btp.length
      for (i = 0; i < size; i++) {
        this.btp.pop()
      }
    },
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
      var ctx = document.getElementById('myChart').getContext('2d');

      if (vm.myPieChart !== null) {
        vm.myPieChart.destroy();
      }

      var entities = document.getElementById("entities").value.trim()
      var award = document.getElementById("award").value.trim()
      vm.clearAllCharts()

      if (entities === "users" && award === "awards") {
        fetch("/API/users/mostawards")
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
        fetch("/API/users/mostawards/eotm")
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
        fetch("/API/users/mostawards/btp")
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
        fetch("/API/users/mostawards/branch")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranch = true
          var data = []
          var labels = []
          for (i in json) {
            vm.branchmost.push(json[i])
            data.push(json[i].total)
            labels.push(json[i].name)

          }
          // For a pie chart
          vm.myPieChart = new Chart(ctx,{
            type: 'pie',
            data: {
              datasets: [{
                data: data,
                backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0', '#994c00', '#009900']
              }],
              labels: labels
            },
            options: {
              responsive: false
            }
          })
        })
      }else if (entities === "branches" && award === "eotm_awards") {
        fetch("/API/users/mostawards/branch/eotm")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranchEOTM = true
          var data = []
          var labels = []
          for (i in json) {
            vm.brancheotm.push(json[i])
            data.push(json[i].number)
            labels.push(json[i].name)

          }
          // For a pie chart
          vm.myPieChart = new Chart(ctx,{
            type: 'pie',
            data: {
              datasets: [{
                data: data,
                backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0', '#994c00', '#009900']
              }],
              labels: labels
            },
            options: {
              responsive: false
            }
          })
        })
      }else if (entities === "branches" && award === "btp_awards") {
        fetch("/API/users/mostawards/branch/btp")
        .then(function(response) {
    			return response.json();
    		})
    		.then(function(json) {
          vm.turnOffShows()
          vm.showBranchBTP = true
          var data = []
          var labels = []
          for (i in json) {
            vm.branchbtp.push(json[i])
            data.push(json[i].number)
            labels.push(json[i].name)

          }
          // For a pie chart
          vm.myPieChart = new Chart(ctx,{
            type: 'pie',
            data: {
              datasets: [{
                data: data,
                backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0', '#994c00', '#009900']
              }],
              labels: labels
            },
            options: {
              responsive: false
            }
          })
        })
      }else if (entities === "regions" && award === "awards") {
          fetch("/API/users/mostawards/region")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsMost = true
            var data = []
            var labels = []
            for (i in json) {
              vm.regionmost.push(json[i])
              data.push(json[i].number)
              labels.push(json[i].region)
            }
            // For a pie chart
            vm.myPieChart = new Chart(ctx,{
              type: 'pie',
              data: {
                datasets: [{
                  data: data,
                  backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0'],
                }],
                labels: labels
              },
              options: {
                responsive: false
              }
            })
          })
      }else if (entities === "regions" && award === "eotm_awards") {
          fetch("/API/users/mostawards/region/eotm")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsEOTM = true
            var data = []
            var labels = []
            for (i in json) {
              vm.regioneotm.push(json[i])
              data.push(json[i].number)
              labels.push(json[i].region)
            }
            // For a pie chart
            vm.myPieChart = new Chart(ctx,{
              type: 'pie',
              data: {
                datasets: [{
                  data: data,
                  backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0'],
                }],
                labels: labels
              },
              options: {
                responsive: false
              }
            })
          })
      }else if (entities === "regions" && award === "btp_awards") {
          fetch("/API/users/mostawards/region/btp")
          .then(function(response) {
      			return response.json();
      		})
      		.then(function(json) {
            vm.turnOffShows()
            vm.showRegionsBTP = true
            var data = []
            var labels = []
            for (i in json) {
              vm.regionbtp.push(json[i])
              data.push(json[i].number)
              labels.push(json[i].region)
            }
            // For a pie chart
            vm.myPieChart = new Chart(ctx,{
              type: 'pie',
              data: {
                datasets: [{
                  data: data,
                  backgroundColor: ['#ff9933', '#00cccc', '#cc99ff', '#ff66b2', '#E0E0E0'],
                }],
                labels: labels
              },
              options: {
                responsive: false
              }
            })
          })
    }
  },
}
})
