
var map = require('..')
var levelup = require('levelup')
var rimraf  = require('rimraf')
var assert  = require('assert')
var through = require('through')
var mac     = require('macgyver')().autoValidate()

require('tape')('level-map', function (t) {

var path = '/tmp/level-map-test'
rimraf(path, function () {
  levelup(path, {createIfMissing: true}, function (err, db) {

    map(db)

    db.map.add(function test (key, value, emit) {
      console.log('MAP', ''+key, ''+value)
      var n = Number(''+value)
      emit(['numbers', 'square'], Math.pow(n, 2))
      emit(['numbers', 'sqrt'], Math.sqrt(n))
    })

    db.put('a', 1)
    db.put('b', 2)
    db.put('c', 3)

    var deleted = []

    db.once('queue:drain', mac(function () {
      db.put('c', '6')
      db.del('a')
      db.map.view({name: 'test'})
        .on('data', mac(function (data) {
          console.log('view', data.key, ''+data.value)
          t.ok(Array.isArray(data.key))
          if(data.key[2] === 'a' && !data.value){ //deleted
            deleted.push(data.key[1])
            if(deleted.length == 2) {
              t.deepEqual(deleted, ['square', 'sqrt'])
              t.end()
            }
          } else {
            console.log(data.value)
            t.equal(isNaN(Number(data.value)), false)
          }
        }).atLeast(1))
    }).once())
  })
})

})
