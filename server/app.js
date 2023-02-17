var mongoose = require('mongoose');
const method = require('../server/controllers/appointments');

// Variables
var mongoURI = process.env.MONGODB_URI || 'mongodb+srv://team4:basili@cluster0.l4eth.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
var port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, function(err) {
    if (err) {
        console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
        console.error(err.stack);
        process.exit(1);
    }
    console.log(`Connected to MongoDB with URI: ${mongoURI} on port: ${port}`);
});


method.subscribeAndHandleResponse();
