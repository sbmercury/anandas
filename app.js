'use strict';
const express = require('express');
const app = express();
app.use(express.static('public'));

const mongoose = require('mongoose');

const https = require('https');

const dotenv = require('dotenv');
dotenv.config();

mongoose.connect('mongodb://sbmercury:UD8DBNjhVaPC6GsG@cluster0-shard-00-00-a3eel.mongodb.net:27017,cluster0-shard-00-01-a3eel.mongodb.net:27017,cluster0-shard-00-02-a3eel.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority' || process.env.DATABASE, {useUnifiedTopology: true, useNewUrlParser: true});

const bodyParser = require('body-parser');

const schedule = require('node-schedule');

const helmet = require('helmet');
app.use(helmet());

app.use(bodyParser.urlencoded({extended: false}));

let Schema = mongoose.Schema;

let listSchema = new Schema({
    name: String,
    id: Number,
    pages: Array,
    remaining: Number
});

let list = mongoose.model('list', listSchema);

let rule = new schedule.RecurrenceRule();
rule.hour = 4;
schedule.scheduleJob(rule, function() {
    sendEmail().then();
});

app.get("/api/send", function(req, res) {
    sendEmail().then()
    res.send("Hi")
})

async function sendEmail() {
    let date = new Date();
    const data = await list.findOne({id: 1});
    let pages = data.pages;
    let id = pages.pop();
    data.pages = pages;
    data.remaining = data.remaining - 1;
    await data.save();
    console.log(id);

    let url = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid=' + id +
        '&prop=text%7Ccategories%7Csections%7Cdisplaytitle%7Cparsewarnings&formatversion=2'
    https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
          let text = JSON.parse(data).parse.text;
          text = JSON.stringify(text);
          text = text.replace("/\[edit\]", "");
          text = text.substring(0, text.nth_index_of("References", 1));
          let html = text.replace("/\n/g", "<br>");
          //html = html.replace("/\[edit\]/g", "");
          //html = html.replace("", "");

          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID);
          console.log(html);
          const msg = {
              to: process.env.RECIPIENT,
              from: 'anandas@spencerbartlett.com',
              subject: 'Knowledge for ' + (date.getMonth() + 1) + "/" + date.getDate(),
              text: text,
              html: html,
          };
          sgMail.send(msg);
          return "Sent";
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/api/update_list', function(req, res) {
    let url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&maxlag=5&prop=links%7Ccategories&generator=categorymembers&gcmtitle=Category%3A'
        + req.body.name + '&gcmlimit=25';
    https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
          if(JSON.parse(data).query != null) {
              let arr = JSON.stringify(JSON.parse(data).query.pages).split("},");
              console.log(arr);
              let id_arr = []
              for (let i = 0; i < arr.length; i++) {
                  let obj = arr.pop()
                  obj = obj.substring(1, obj.indexOf(":") - 1);
                  id_arr.push(obj);
              }
              console.log(id_arr);
              console.log(id_arr.length);
              list.updateOne({id: 1}, {id: 1, name: req.body.name, pages: id_arr, remaining: id_arr.length}, { upsert : true }, function(err, data) {
                  if(err) return console.error(err);
                  res.redirect("/");
            })
          }
          else {
              res.send("Invalid category")
          }
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });

});

app.get('/api/current_list', function(req, res) {
   list.findOne({}, function(err, data) {
       if(err) return console.error(err);
       res.send(data.name);
   })
});


String.prototype.nth_index_of = function(pattern, n) {
    let i = -1;

    while (n-- && i++ < this.length) {
        i = this.indexOf(pattern, i);
        if (i < 0) break;
    }
}


// listen for requests :)
const listener = app.listen(process.env.PORT || 8073, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = listener;
