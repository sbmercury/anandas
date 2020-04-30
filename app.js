'use strict';
const express = require('express');
var app = express();
app.use(express.static('public'));

var mongo = require('mongodb');
var mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.DATABASE, {useUnifiedTopology: true, useNewUrlParser: true});

var bodyParser = require('body-parser');

const helmet = require('helmet');
app.use(helmet());

app.use(bodyParser.urlencoded({extended: false}));

var Schema = mongoose.Schema;

var listSchema = new Schema({
    name: String,
    id: Number

});

var list = mongoose.model('list', listSchema);

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/api/update_list', function(req, res) {
    list.updateOne({id: 1}, {id: 1, name: req.body.name}, { upsert : true }, function(err, data) {
        if(err) return console.error(err);
        console.log(data);
        res.redirect("/");
  })
});

app.get('/api/current_list', function(req, res) {
   list.findOne({}, function(err, data) {
       if(err) return console.error(err);
       res.send(data.name);
   })
});


// listen for requests :)
const listener = app.listen(process.env.PORT || 8073, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = listener;
