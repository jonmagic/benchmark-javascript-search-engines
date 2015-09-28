console.log("Starting up")

var fs = require("fs")
var Benchmark = require('benchmark')
var lunr = require("lunr")
var si = require("search-index")

var lunrIndexEmpty = lunr(function() {
  this.field("filename", { boost: 10 })
  this.field("body")
})
var searchIndexEmpty = si({
  indexPath: "tmp/empty",
  fieldsToStore: ["filename", "body"]
})
var suite = new Benchmark.Suite

console.log("Loading fixtures")
var filenames = fs.readdirSync(__dirname + "/corpus")
var allFileDetails = {}
var lunrIndex = lunr(function() {
  this.field("filename", { boost: 10 })
  this.field("body")
})
var searchIndex = si({
  indexPath: "tmp/populated",
  fieldsToStore: ["filename", "body"]
})
var batch = []
var batchOptions = {
  fieldOptions: [
    {fieldName: "filename", weight: 10},
    {fieldName: "body", weight: 1}
  ]
}
var indexBatch = function() {
  var batchLength = batch.length
  searchIndex.add(batch, batchOptions, function(err) {
    if(!err) {
      // console.log(batchLength + " documents indexed in batch")
    }
  })
  batch = []
}
filenames.forEach(function(filename) {
  var path = __dirname + "/corpus/" + filename

  allFileDetails[path] = {
    filename: filename,
    id: path,
    body: fs.readFileSync(path),
    modifiedAt: fs.statSync(path).mtime.getTime()
  }

  lunrIndex.add(allFileDetails[path])

  batch.push(allFileDetails[path])

  if(batch.length == 100) {
    indexBatch()
  }
})
indexBatch()
console.log("Fixtures loaded")

var randomPath = function() {
  return __dirname + "/corpus/" + filenames[Math.floor(Math.random() * (641 - 0 + 1))]
}

console.log("Starting benchmark")
suite.add("fs#readdir", function(deferred) {
  fs.readdir(__dirname + "/corpus", function(err, files) {
    if(!err) {
      deferred.resolve()
    }
  })
}, {"defer": true})
.add("fs#readFile", function(deferred) {
  fs.readFile(randomPath(), function(err, contents) {
    if(!err) {
      deferred.resolve()
    }
  })
}, {"defer": true})
.add("fs#stat", function(deferred) {
  fs.stat(randomPath(), function(err, stat) {
    if(!err) {
      stat.mtime.getTime()
      deferred.resolve()
    }
  })
}, {"defer": true})
.add("lunr#add 10 documents", function() {
  [
    randomPath(), randomPath(), randomPath(), randomPath(), randomPath(),
    randomPath(), randomPath(), randomPath(), randomPath(), randomPath()
  ].forEach(function(path) {
     var fileDetails = allFileDetails[path]
     lunrIndexEmpty.add({
       id: fileDetails.id,
       filename: fileDetails.filename,
       body: fileDetails.body
     })
   })
})
.add("search-index#add 10 documents", function(deferred) {
   var documents = [
     randomPath(), randomPath(), randomPath(), randomPath(), randomPath(),
     randomPath(), randomPath(), randomPath(), randomPath(), randomPath()
   ].map(function(path) { return allFileDetails[path] })

  searchIndexEmpty.add(documents, {}, function(err) {
    if(!err) deferred.resolve()
  })
}, {"defer": true})
.add("lunr#search", function() {
  var results = lunrIndex.search("women")
  if(results.length == 0) console.log("NO RESULTS FOUND")
})
.add("search-index#search", function(deferred) {
  searchIndex.search({query: {"*": ["women"]}}, function(err, results) {
    if(!err) {
      if(results.totalHits == 0) console.log("NO RESULTS FOUND")
      deferred.resolve()
    }
  })
}, {"defer": true})
.on("cycle", function(event) {
  console.log(String(event.target))
})
.on("complete", function() {
  console.log("Benchmark of " + Object.keys(allFileDetails).length + " documents complete")
  searchIndexEmpty.empty(function(err) {
    if(!err) {
      searchIndexEmpty.close(function(err) {
        console.log("searchIndexEmpty closed")
      })
    }
  })
  searchIndex.empty(function(err) {
    if(!err) {
      searchIndex.close(function(err) {
        console.log("searchIndex closed")
      })
    }
  })
})
.run({async: true})
