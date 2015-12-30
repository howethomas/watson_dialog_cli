/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

var express = require('express')
var app = express()
var bluemix = require('./config/bluemix')
var extend = require('util')._extend
var watson = require('watson-developer-cloud')

// Bootstrap application settings
require('./config/express')(app)

// if bluemix credentials exists, then override local
var credentials = extend({
  'password': 'XS4cXl6EHC0q',
  'url': 'https://gateway.watsonplatform.net/dialog/api',
  'username': '4a53486a-4df2-49a5-a92a-91efad480192',
  version: 'v1'
}, bluemix.getServiceCreds('dialog'))

var dialog_id = process.env.DIALOG_ID || '<dialog-id>'

// Create the service wrapper
var dialog = watson.dialog(credentials)

app.post('/conversation', function (req, res, next) {
  var params = extend({ dialog_id: dialog_id }, req.body)
  dialog.conversation(params, function (err, results) {
    if (err) {
      return next(err)
    } else {
      res.json({
        dialog_id: dialog_id,
        conversation: results
      })
    }
  })
})

app.post('/profile', function (req, res, next) {
  var params = extend({ dialog_id: dialog_id }, req.body)
  dialog.getProfile(params, function (err, results) {
    if (err) {
      return next(err)
    } else {
      res.json(results)
    }
  })
})

// error-handler settings
require('./config/error-handler')(app)

var port = process.env.VCAP_APP_PORT || 3000
app.listen(port)
console.log('listening at:', port)

// Also, let's hook into the stdin and get a command line
// version working

var conversation_id
process.stdin.on('data', function (data) {
  var params = {
    dialog_id: dialog_id,
    conversation_id: conversation_id,
    input: data
  }
  dialog.conversation(params, function (err, results) {
    if (err) {
      console.log('Dialog error' + JSON.stringify(err))
      return
    } else {
      conversation_id = results['conversation_id']
      var arrayLength = results.response.length
      for (var i = 0; i < arrayLength; i++) {
        process.stdout.write(results.response[i] + '\n')
      }
    }
  })
})
