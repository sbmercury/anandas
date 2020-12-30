const app = require("../app.js");
const request = require('supertest')(app);

describe('GET /', function() {
  it('check for 200 reponse code', function(done) {
    request
		.get('/')
		.expect(200)
        .end(done);
  });
});