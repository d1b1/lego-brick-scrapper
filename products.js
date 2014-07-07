// Products

var request = require('request');
var async   = require('async');
var _       = require('underscore');

// This works for Star Wars Only.
var url = 'http://service.lego.com/Views/Service/Pages/BIService.ashx/GetThemeListHtml?searchValue=10000-20056&fromIdx='

var allData = [];
var totalCounter = 0;

var n = async.queue(function (json, callback) {
  request.post('http://api.legojs.io/product', callback).form(json);
}, 20);

n.drain = function() {
  console.log('Finished Product Inserts to the API.');
}

var q = async.queue(function (page, callback) {
  request(url + page, function(error, res){
    var data = JSON.parse(res.body);
    _.each(data.Content, function(el) {
      var json = {
        productId: el.ProductId,
        name:      el.ProductName,
        image:     el.ImageLocation,
        pdf_Url:   el.PdfLocation
      };
      totalCounter++;
      n.push(json, function (err) {});
    });

    callback();
  });
}, 20);

q.drain = function() {
  console.log('Finished Paging.');
  console.log('Total Products ' + totalCounter);
}

request.get(url + '0', function(err, res) {
  var body = res.body;
  var data = JSON.parse(body);
  var pages = data.Count;

  for (i = 0; i < pages-1; i++) {
    console.log('Page: ' + i);
    q.push(i, function (err) {});
  }

});
