/*###############################################################################
#           
#             _ __ _____  __   Welcome to the      _             
#            | '__/ _ \ \/ / ___ __ ___ ____  _ __| |_ ___ _ __  
#            | | |  __/>  < / -_) _/ _ (_-< || (_-<  _/ -_) '  \ 
#            |_|  \___/_/\_\\___\__\___/__/\_, /__/\__\___|_|_|_|
#                                          |__/                  
#
# The rex-* ecosystem is a collection of like-minded modules for Node.js/NPM
#   that allow developers to reduce their time spent developing by a wide margin. 
#   
#   Header File Version: 0.0.1, 06/08/2013
# 
# The MIT License (MIT)
# 
# Copyright (c) 2013 Pierce Moore <me@prex.io>
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
# 
#######*/ 
var fs = require('fs')
  , path = require('path')
  , os = require('os')
  , _ = require('underscore')._
  , async = require('async')
  , cli = require('rex-shell')
  , exec = require('rex-exec')
  , package = require('../package.json')
  , config = require('../package.json').config
  , optimist = require('optimist')
      .usage("Perform simple operations on local Git repos. \n $0")
      .alias('l','list')
      .describe('l','List all the git repos in the current directory')
      .alias('s','status')
      .describe('s','Get the status of all the git repos in the current directory')
      .alias('p','pull')
      .describe('p','Pull all repos down from their remote counterparts.')
  , argv = optimist.argv

var tree = function(dir, maxDepth) {
  var repos = []
  var files = fs.readdirSync(path.resolve(dir))
  _.each(files, function(file) {
    // @todo: Bring in osPath() function in mixins from rex-utils
    var filePath = path.resolve(dir + path.sep + file)
    if(_.contains(['.DS_Store'], file))
      return false
    // cli("Processing file: "+ filePath +" ("+ typeof file +")")

    var stat = fs.statSync( filePath ) 
    if(stat.isDirectory()) {
      if( fs.existsSync( path.resolve(filePath+"/.git") ) )
        repos.push( filePath )
    }
    if( file == ".git" ) {
      repos.push( dir )
    }
  })

  return repos
}

exports.init = function() {
  if(argv.list)
    list(argv.list)
  else if(argv.status)
    status(argv.status)
  else if(argv.pull)
    pull(argv.pull)
  else
    optimist.showHelp()
}

exports.list = list = function(dir) {
  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = path.resolve(dir)
  cli("Finding all git repos in: "+ dir)
  var repos = tree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {
    cli( repos.length +" git repositories found: ")
    _.each(repos, function(repoPath) {
      var stat = fs.statSync(repoPath)
      var size = parseFloat( stat.size / 1024 ).toFixed(2) + " MiB"
      var current = ""
      if(repoPath == process.cwd()) {
        current = cli.$$.m(" [ YOU ARE HERE ]")
      } else {
        current = ""
      }
      
      console.log( cli.$$.g(" > ")+ cli.$$.b( path.basename(repoPath) ) +" ("+ cli.$$.r(size) +")"+ current )
    })
  }
}

exports.status = status = function(dir) {
  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = path.resolve(dir)
  cli("Displaying status of all git repos in: "+ dir)
  var repos = tree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {
    cli( repos.length +" git repositories found: ")
    _.each(repos, function(repoPath) {
      exec(repoPath,'git fetch && git status -sb', function(stderr, stdout) {
        console.log( cli.$$.g(" > ")+ cli.$$.b( path.basename(repoPath) ) + " - Current Status: \n", stdout.trim() )
      }) 
    })
  }
}

exports.pull = pull = function(dir) {
  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = path.resolve(dir)
  cli("Pulling all git repos in: "+ dir)
  var repos = tree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {
    cli( repos.length +" git repositories found: ")
    _.each(repos, function(repoPath) {
      exec.batch(repoPath,['git pull'], function(stderr, stdout) {
        console.log( cli.$$.g(" > ")+ cli.$$.b( path.basename(repoPath) ) + " - Current Status: \n", stdout )
      }) 
    })
  }
}
