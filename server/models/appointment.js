var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//For testing
var appointmentSchema = new Schema({
    clinic_name: {type: String},
    date: {type: Object},
    time: {type: String},
});

module.exports = mongoose.model('Appointment', appointmentSchema);