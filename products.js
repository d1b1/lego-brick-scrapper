// Products

var request = require('request');
var async   = require('async');
var _       = require('underscore');

// Themes for different Product Ids Ranges.
var themes = require('./themes.json');

// This works for Star Wars Only.
var url = 'http://service.lego.com/Views/Service/Pages/BIService.ashx/GetThemeListHtml?searchValue=10000-20056&fromIdx='
var sUrl = 'http://api.legojs.io/product/search?'
var allData = [];
var totalCounter = 0;
var t = 0;
var totalCounterB = 0;
var totalNew = 0;

var n = async.queue(function (json, callback) {
  request.get({ url: sUrl + 'productId=' + json.productId, json: true }, function(err, res) {

    if (err) {
      console.log('Error', json);
      console.log('Error', res.body, res);
      return callback();
    }

    if (res.body.count == 0) {
      totalCounter++;
      console.log('New', json.productId, json.name);
      request.post('http://api.legojs.io/product', callback).form(json);
    } else {
      console.log('  Update', '(' + json.theme + ')', json.productId, json.name);
      var was = res.body.results[0];

      was.pdf_Url.push(json.pdf_Url[0]);
      was.theme.push(json.theme[0]);

      var data = {
        pdf_Url: _.uniq( was.pdf_Url ),
        theme:   _.uniq( was.theme )
      };

      totalCounterB++;
      request.put('http://api.legojs.io/product/' + was._id, callback).form(data);
    }
  });
}, 1);

n.drain = function() {;
  console.log('Finished Product Inserts to the API.');
  console.log('Total Products ' + totalCounter);
  console.log('Total Updates ' + totalCounterB);
}

var q = async.queue(function (page, callback) {
  request(url + page.idx, function(error, res){
    var data = JSON.parse(res.body);
    _.each(data.Content, function(el) {

      var json = {
        productId: el.ProductId,
        name:      el.ProductName,
        image:     el.ImageLocation,
        pdf_Url:   [ el.PdfLocation ],
        theme:     [ page.theme.name ],
        themeCode: page.theme.code
      };

      n.push(json, function (err) {});
    });

    callback();
  });
}, 1);

q.drain = function() {}

// Original Version
//
// request.get(url + '0', function(err, res) {
//   var body = res.body;
//   var data = JSON.parse(body);
//   var pages = parseFloat(data.Count);
//
//   var i = 0;
//   while (i < pages ) {
//     q.push(i, function (err) {});
//     i = i + 10;
//   }
//
// });

// Test Data.
// var themes = [
//   // { "code": "10000-20035", "name": "Sports" },
//   { "code": "10000-20056", "name": "Star Wars TM" }
// ];

_.each(themes, function(theme) {

  var url = 'http://service.lego.com/Views/Service/Pages/BIService.ashx/GetThemeListHtml?searchValue=' + theme.code + '&fromIdx=';

  request.get(url + '0', function(err, res) {
    var body = res.body;
    var data = JSON.parse(body);
    var pages = parseFloat(data.Count);

    var i = 0;
    while (i < pages) {
      q.push({ idx: i, theme: theme }, function (err) {});
      i = i + 10;
    }

  });

});
