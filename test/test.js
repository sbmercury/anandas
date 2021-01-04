const app = require("../app.js");
const request = require('supertest');

describe('GET /', function() {
    it('check for 200 reponse code', function(done) {
        request(app)
		    .get('/')
		    .expect(200, done);
  });
});

describe('POST /api/update_list', function() {
    it('check category validation', function(done) {
        request(app)
            .post('/api/update_list')
            .expect(400, done);
    })
})