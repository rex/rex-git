var scli = require('supercli')
  , _ = require('underscore')._
  , fs = require('fs')
  , path = require('path')
  , os = require('os')
  , package = require('./package.json')
  , app = require('./package.json').app
  , optimist = require('optimist')
  ;

scli("Welcome to rex-git")
