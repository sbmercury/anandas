'use strict';
//Sets up express and loads our static content (css) from the public folder
const express = require('express');
const app = express();
app.use(express.static('public'));

const https = require('https');

//Sets up dotenv which parses .env variables for us
const dotenv = require('dotenv');
dotenv.config();

//Sets up body-parser which helps parse http request bodies
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

//Sets up helmet which deals with some security stuff automatically
const helmet = require('helmet');
app.use(helmet());

//Use mongoose to connect to our mongodb database
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE, {useUnifiedTopology: true, useNewUrlParser: true});

//Creates the schema that's used to store one of our lists
let Schema = mongoose.Schema;

let listSchema = new Schema({
    name: String,
    id: Number,
    pages: Array,
    remaining: Number
});

let list = mongoose.model('list', listSchema);

//Loads node-schedule and uses it create a recurrence rule to send an email every day day at 4am
const schedule = require('node-schedule');

let rule = new schedule.RecurrenceRule();
rule.hour = 12;
rule.minute = 0;
schedule.scheduleJob(rule, function(){
    sendEmail().then();
});

//Simple API endpoint for forcing email sends for testing purposes
app.get("/api/send", function(req, res) {
    sendEmail().then((value) => {
       console.log(value);
    });
    res.send("Hi")
})

//Function for sending an email
async function sendEmail() {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID);

    //This first section grabs the list from our database and grabs the first page from it's list, then updates the remaining count
    let date = new Date();
    const data = await list.findOne({id: 1});

    if (data.remaining > 0) {
        let pages = data.pages;
        let id = pages.pop();
        data.pages = pages;
        data.remaining = data.remaining - 1;
        await data.save();
        console.log(id);

        //Uses the ID retrieved before to generate a wikipedia request URL
        let url = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid=' + id +
            '&prop=text%7Ccategories%7Csections%7Cdisplaytitle%7Cparsewarnings&formatversion=2'
        https.get(url, (resp) => {
          let data = '';


          resp.on('data', (chunk) => {
            data += chunk;
          });

          // The whole response has been received. Generate and send the email
          resp.on('end', () => {
              //This first section does a variety of string manipulation on our email text to clean up some formatting quirks
              let text = JSON.parse(data).parse.text;
              text = JSON.stringify(text);
              text = text.replace(/<span class=\\\"mw-editsection-bracket\\\">.<\/span>/gm, "");
              text = text.replace(/>edit</gm, "><");
              text = text.replace(/<sup.{1,150}<\/sup>/gm, "");
              text = text.slice(text.lastIndexOf("Maintenance template removal") + 86, text.indexOf("id=\\\"References"));

              let html = text.replace(/\\n/g, "<br>");

              console.log(text);

              //Here we do the basic setup for our email and then send it, uses date generated at beginning for subject line
              const msg = {
                  to: process.env.RECIPIENT,
                  from: 'anandas@spencerbartlett.com',
                  subject: 'Knowledge for ' + (date.getMonth() + 1) + "/" + date.getDate(),
                  text: text,
                  html: html,
              };
              sgMail.send(msg);
          });

        }).on("error", (err) => {
          console.log("Error: " + err.message);
        });
        return "Sent";
    }
    else {
        let text = "Unfortunately you've run out of items in your current list, go to Anandas to update the current list";
        let subject = "Out of Items";
        const msg = {
            to: process.env.RECIPIENT,
            from: 'anandas@spencerbartlett.com',
            subject: subject,
            text: text,
        };
        sgMail.send(msg);
        return "Sent OOI";
    }
}

//Simple endpoint for serving homepage content
app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.post('/api/update_list', function(req, res) {
    //Creates a URL using a category name specified in the request body
    let url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&maxlag=5&prop=links%7Ccategories&generator=categorymembers&gcmtitle=Category%3A'
        + req.body.name + '&gcmlimit=25';
    https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Process and update in .
      resp.on('end', () => {
          if(JSON.parse(data).query != null) {
              let arr = JSON.stringify(JSON.parse(data).query.pages).split("},");
              console.log(arr);
              let id_arr = []
              //This loop processed the page IDs returned by the Wikipedia API into a clean, easy to use array
              for (let i = 0; i < arr.length; i++) {
                  let obj = arr.pop()
                  obj = obj.substring(1, obj.indexOf(":") - 1);
                  id_arr.push(obj);
              }
              //Updates the list in Mongo with new pages, name and length
              list.updateOne({id: 1}, {id: 1, name: req.body.name, pages: id_arr, remaining: id_arr.length}, { upsert : true }, function(err, data) {
                  if(err) return console.error(err);
                  res.redirect("/");
            })
          }
          //If we didn't find any JSON return the bad category telling the user to try again
          else {
              res.status(400).sendFile(__dirname + '/bad_category.html');
          }
      });

    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });

});

//Simple endpoint for returning the name of our current list, used by the frontend to display this info
app.get('/api/current_list', function(req, res) {
   list.findOne({}, function(err, data) {
       if(err) return console.error(err);
       res.send(data.name);
   })
});


const listener = app.listen(process.env.PORT || 8073, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = listener;
