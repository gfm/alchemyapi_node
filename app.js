/**
   Copyright 2013 AlchemyAPI

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


var express = require('express');
var consolidate = require('consolidate');

var app = express();
var server = require('http').createServer(app);

//Create the AlchemyAPI object
var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI();

// all environments
app.engine('dust',consolidate.dust);
app.set('views',__dirname + '/views');
app.set('view engine', 'dust');
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

var fs = require('fs');
var _ = require('underscore');
var results = {};

var file = __dirname + '/cancelling_messages_test_weekly_v3.json';
var buildMonthlyMessages = function (allMessages) {
	clientIds = _(allMessages).keys();
	// clientIds = new Array('1758700');
	_(clientIds).each(function(clientId){
		results[clientId] = new Array;
	});
	clientMessages(clientIds.shift(), allMessages, clientIds);
};
 
fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
 
  var messageData = JSON.parse(data);
  buildMonthlyMessages(messageData);
});

function clientMessages(clientId, allMessages, clientIds) {
	if (clientId) {
		clientMessagesByMonth = allMessages[clientId];
		concatenatedMessages = _(clientMessagesByMonth).map(function(allClientMessagesForMonth) {
			messageTexts = _(allClientMessagesForMonth).map(function(message) {
				return message.message;
			});
			return '<html><body><p>' + messageTexts.join('</p><p>') + '</p></body></html>';
		});
		monthlySentiment = _(concatenatedMessages).map(function(monthlyMessages) {
			alchemyapi.sentiment("html", monthlyMessages, {}, function(response) {
				if (response.docSentiment) {
					results[clientId].push(response.docSentiment);
					if (response.docSentiment.type == 'neutral' || parseFloat(response.docSentiment.score) < 0.1) {
						console.log('*****************');
						console.log(monthlyMessages);
					}
				} else {
					console.log(response);
				}
				return clientMessages(clientIds.shift(), allMessages, clientIds);
			});
		});
	} else {
		console.log(results);
		return null;
	}
};
