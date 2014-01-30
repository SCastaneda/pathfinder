pathfinder
==========

Project for COP4331

###To Start
To run the server on your local machine, first start the database.
If you installed mongodb correctly, you should be able to run
`mongod`

This will start the mongo server and you will need to leave it open, open up another terminal,
navigate to the project folder and run the following to run the application:
`node app.js`

###Installation
To run this on our local machine, we will need the following:

**Node** can be downloaded from its [offical website](http://nodejs.org/).
Install node for your OS. Along with the installation of node, comes **npm**, which is 
[node's package manager](https://npmjs.org/).

We will be using npm to manage our modules.

**Mongodb** will serve as our database. [Download](http://www.mongodb.org/) and follow the 
[Install and Getting started section](http://docs.mongodb.org/manual/installation/)

The **Express** module will be used as a layer on top of nodejs to make the process of creating and managing pages easier, it comes with several built in functionalities, such as session handling and more.
[Read more about Express](http://expressjs.com/)

Once you have `node`, `npm`, and `mongodb` installed, to install all other modules that are required
for the project (defined in package.json) you can just run
`npm install`
in the terminal. If you get an EACCESS error, try runnning it with 
`sudo npm install` to run it as the superuser (password entry will be required). I'm not sure if there's an equivalent for windows.

Let Sam or **Patrick** know if you need help with any of the installations.