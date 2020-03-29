# QChat

The project is developed using Node.js, express and non-relational database MongoDB. Users are able to login, add friends
and chat with them in real time, as well as receiving real time notifications. Socket.IO is used for creating custom 
events which are the core of the real time communication.

## Getting Started

You can clone the project on your local machine using the following command: 
```
git clone https://github.com/vas1l3v/qchat-finals.git
```

### Prerequisites

In order to run the project on your local machine you will need to have these installed:

```
Node.js - https://nodejs.org/en/
MongoDB - https://www.mongodb.com/download-center
```

### Installing

You will have to start MongoDB service on port 27017 and then start the node server.
Navigate to the MongoDB folder and run the following command(note that C:\MongoData is the path where databases are created):

```
mongod --dbpath C:\MongoData --port 27017
```

Now, when you have MongoDB running navigate to the root folder of the app and execute the following command:

```
node index.js
```

This will start a local server on port 5000.
You can launch the app in a browser using the following url:

```
http://localhost:5000/
```
