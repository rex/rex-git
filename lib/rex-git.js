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
  , async = require('async')
  , cli = require('rex-shell')
  , exec = require('rex-exec')
  , utils = require('rex-utils')
  , _ = require('rex-utils')._
  , package = require('../package')
  , config = require('../package').config
  , git_commands = _.rex_commands().git

exports.version = package.version
exports.package = package

exports.init = function() {
  var operation = process.argv[2] || 'help'
  var dir = process.argv[3] || null

  switch(operation) {
    case 'list':
      list(dir)
      break;
    case 'status':
      status(dir)
      break;
    case 'pull':
      pull(dir)
      break;
    case 'dirty':
      dirty(dir)
      break;
    case 'version':
      _.displayVersion(package, {
        "rex-exec" : exec.version,
        "rex-utils" : utils.version,
        "rex-shell" : cli.version
      })
      break;
    case 'help':
    default:
      _.showHelp(package)   
  }
}

exports.branch = branch = function(dir) {
  exec(_.osPath(dir), git_commands.branch, function(err, currentBranch) {      
    cli.$.blue( path.basename(dir) +" is on branch "+ currentBranch)
  })
}

exports.list = list = function(dir) {
  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = _.osPath(dir)
  cli("Finding all git repos in: "+ dir)
  var repos = _.gitTree(dir)
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
    dir = _.osPath(dir)
  cli("Displaying status of all git repos in: "+ dir)
  var repos = _.gitTree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {
    cli( repos.length +" git repositories found: ")
    _.each(repos, function(repoPath) {
      exec(repoPath, git_commands.status_quiet, function(stderr, stdout) {
        if( _.isString(stderr) )
          stderr = stderr.trim()
        if( _.isString(stdout) )
          stdout = stdout.trim()

        if( stderr ) {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (ERROR)\n"), stderr )
        } else if( stdout ) {
          console.log( cli.$$.g(" > ")+ cli.$$.b( path.basename(repoPath) +"\n"), stdout )
        } else {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (ERROR) - Unable to Retrieve Status"), stderr, stdout )
        }
      }) 
    })
  }
}

exports.pull = pull = function(dir, callback) {
  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = _.osPath(dir)
  cli("Pulling all git repos in: "+ dir)
  var repos = _.gitTree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {

    cli( repos.length +" git repositories found: ")
    if(process.platform == 'win32') {
      cli.error( cli.$$.r("DANGER: Checks for a clean working tree before pulling are not currently available on Windows. Please ensure that all files are committed or stashed to avoid merge conflicts!") )
      var cmd = 'git pull'
    } else {
      var cmd = git_commands.prePull
    }

    var after = _.after(repos.length, function() {
      if(_.isFunction(callback))
        callback(null, repos.length +' repositories updated.')
    })

    _.each(repos, function(repoPath) {

      exec(repoPath,cmd, function(stderr, stdout) {
        if( _.isString(stderr) )
          stderr = stderr.trim()
        if( _.isString(stdout) )
          stdout = stdout.trim()

        if( stderr ) {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (ERROR)\n"+ cli.$$.r(stderr) ) )
        } else if( stdout ) {
          console.log( cli.$$.g(" > ")+ cli.$$.B( path.basename(repoPath) +"\n") + cli.$$.b(stdout ) )
        } else {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (ERROR) - Unable to Retrieve Status"), stderr, stdout )
        }

        after()
      }) 
    })
  }
}

/**
 * Lists only the git repos found in the path provided that are in a dirty state.
 */
exports.dirty = dirty = function(dir) {
  // Sorry, Windows guys.
  _.killWindows()

  if(typeof dir !== 'string')
    dir = process.cwd()
  else
    dir = _.osPath(dir)
  cli("Finding dirty git repos in: "+ dir)
  var repos = _.gitTree(dir)
  if(repos.length == 0) {
    cli.error("There are no git repos in the specified path.")
  } else {
    var totalDirty = 0
    var after = _.after(repos.length, function() {
      if(totalDirty == 0) {
        cli.success("All repos in '"+ dir +"' are in a clean, working state!")
      } else {
        cli.error( totalDirty +" dirty git repos were found in '"+ dir +"'.")
      }
    })

    _.each(repos, function(repoPath) {
      exec(repoPath, git_commands.porcelain, function(stderr, stdout) {
        if( stderr ) {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (DIRTY)\n"), stderr )
          totalDirty++
        } else if( stdout ) {
          // Intentionally ignore successful, clean output
        } else {
          console.log( cli.$$.g(" > ")+ cli.$$.R( path.basename(repoPath) +" (ERROR) - Unable to Retrieve Status"), stderr, stdout )
          totalDirty++
        }
        after()
      }) 
    })
  }
}