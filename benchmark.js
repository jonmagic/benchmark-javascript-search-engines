var fs = require("fs")
var Benchmark = require('benchmark')

var suite = new Benchmark.Suite
var filenames = fs.readdirSync(__dirname + "/corpus")

// fs#readdir
suite.add('fs#readdir', function(deferred) {
  fs.readdir(__dirname + "/corpus", function(err, files) {
    if(!err) {
      deferred.resolve()
    }
  })
}, {'defer': true})
// fs#
.add('fs#readFile', function(deferred) {
  fs.readFile(__dirname + "/corpus/" + filenames[Math.floor(Math.random() * (641 - 0 + 1))], function(err, contents) {
    if(!err) {
      deferred.resolve()
    }
  })
}, {'defer': true})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log("Benchmark complete")
})
// run async
.run()
console.log("Starting benchmark")
