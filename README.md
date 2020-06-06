This is a simple implementation of a microlearning app. It's not yet complete and is still a work in progress. The intent is to allow the user to select a Wikipedia category and the app will automatically email them a page from that category every day. The user can change categories at any time and will receive an extra email notifying them if the category they're currently using is about to run out.

This app uses:

NodeJS/Express

MongoDB (for storing category information)

SendGrid (for sending emails)

Node Schedule (for running recurring tasks)

My personal version uses Jenkins to automatically deploy changes to a DigitalOcean VPS that it's hosted on.
