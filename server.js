var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var async   = require('async');
var _       = require('underscore');

var blocks = [];
var stats = { pages: 0, total: 0 };

app.get('/go', function(req, res){

	var q = async.queue(function (json, callback) {
		var url = 'http://customization.lego.com/en-US/pab/service/getBrick.aspx?itemid=' + json.id;

		request(url, function(error, response, html){
			if(!error){
				var $ = cheerio.load(html);
				json.elementID = $('#Label6').text();
				json.designID = $('#Label7').text();
				json.category = $('#Label5').text();
				json.exactColor = $('#Label8').text();
				json.familyColor = $('#Label4').text();

				blocks.push(json);
				callback();
			} else {
				console.log('err', error);
				callback();
			}
		});
	}, 20);

	q.drain = function() {
		res.json({
			stats: stats,
			blocks: blocks
		});
	}

	for (var i = 0; i < 6; i++) {
		stats.pages++;

	  var params = {
			sid: 0.29175309650599957, ps: 500, st: 5, sv: 'allbricks', pn: i, cat: 'US'
		};

	  var paramsStr = _.map(params, function(k, v) { return v + '=' + k; });
		url = 'http://customization.lego.com/en-US/pab/service/getBricks.aspx?' + paramsStr.join('&');

		request(url, function(error, response, html){
			if(!error){
				var $ = cheerio.load(html);

				$('#myDataGrid tr').each(function(x, i){
						if (x == 0) return;
					  var th_text = $(this).find("td");

	          var a = $(th_text.get(0));
						var href = $(a.find('a')).attr('href') + '';
						id = href.replace('javascript:getBrick(', '').replace(')','');

						var name  = $(th_text.get(1)).text().trim();
						var price = $(th_text.get(2)).text().trim();
	          var img   = $(a.find('img')).attr('src') + '';

	          var json = { id: id, name: name, price: price, img: img };

            stats.total++;

	          q.push(json, function (err) {
							console.log('Done with another brick.');
						});
		    });
			}
		})
	}
})

app.listen('8081')
console.log('Starting on Port 8081');
exports = module.exports = app;
