'use strict';
var app = express();
app.use(express.static('public'));

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
}



// listen for requests :)
const listener = app.listen(process.env.PORT || 8070, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = listener;
