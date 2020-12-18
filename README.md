# Anandas

Anandas is a simple microlearning app that allows the user to set a Wikipedia
category then receive a random article from that category emailed to them each day.

## Features

- Select, validate and store a Wikipedia category to get articles from

- Send a formatted version of the Wikipedia page to the specified email
address
  
- Keeps track of articles to send each article once and send through the whole category


## Installation

#### Linux

- Install packages

`npm install`

- Set environment variables

`process.env.PORT: sets what port the app will run on (default 8073)`  
`process.env.RECIPIENT: email address you want to send emails to`  
`process.env.SENDGRID: sendgrid API key (used to send emails)`  
`process.env.DATABASE: a mongoDB connection URL, used to store articles for the current category`


- Start the app

`node app.js`

