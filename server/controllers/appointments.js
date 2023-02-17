var Appointment = require('../models/appointment');
const mqtt = require('../mqttClient/mqtt');
const subscriber = require('../mqttClient/sub');
const publisher = require('../mqttClient/pub');
var TimeSlotsUtility = require("./allTimeslots");


var chosenClinic; //a

function exitHandler(options, exitCode) {

    if (options.exit) 

    {   console.log(exitCode)
        subscriber.unSubToTopic('clinicData'); 
        console.log('Unsubscribed and ended the client');
        process.exit();
    }
}

//when app is closing
process.on('exit', exitHandler.bind(null,{exit:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));



async function subscribeAndHandleResponse() {
    subscriber.subToTopic('/clinicData', 1);  //Send the clinic and want update list
    mqtt.on('message', function(topic, message) {
        if(topic === '/clinicData') {
            chosenClinic = JSON.parse(message);
            findAppointments(chosenClinic.name); 
        }
    });
}


// Get all booked appointments from database in an ascending order of start time for a given clinic as input
async function findAppointments(name) {
    await Appointment.find({ clinic_name: name }, function(error, appointments) {
        if(error) {
            console.log(error);
        }
        if(appointments===null) {
            console.log('Something went wrong');
        }
        let excludedAppointments = excludeOldAppointments(appointments);
        let bookedMap = map_booked_list(excludedAppointments);
        let availableTimeSlots = produceAvalailableTS(TimeSlotsUtility.timeslotFactory(chosenClinic, 7), bookedMap)
        publisher.pubToTopic(`/availableTimeslots/${name}`, JSON.stringify(availableTimeSlots), 1);
    });
}


function excludeOldAppointments(bookedAppointments) {

    let filteredAppoFromCurrentDate = [];

    for(let i=0; i<bookedAppointments.length;i++) {

        let time = bookedAppointments[i].time;
        let splited = time.split('-');
        let parseDate = JSON.parse(bookedAppointments[i].date); // TODO: can be fixed where we store the appointment. 
        let timeSlotDate = parseDate.year + ' ' + parseDate.month +
                           ' ' + parseDate.d_number + " " + splited[0]+ ":00";
        if(!isPassed(timeSlotDate)) {
            filteredAppoFromCurrentDate.push(bookedAppointments[i]);
        }
    }
    return filteredAppoFromCurrentDate;
}

function isExceeded_dentists_number(dentists_num, t_s_booked_n) {
    return dentists_num - t_s_booked_n <= 0; 
}

function isPassed(timeSlotDate) {
    let current_date = new Date();
    let time_slot= new Date(timeSlotDate);
   
     if (current_date > time_slot) {
         return true;
     }
}

function map_booked_list(list){

    let booked_map = new Map(); // 

    for (let i = 0; i<list.length; i++) {

        let t_s_date = JSON.parse(list[i].date);  // TODO: date needs to be sent as object. 
        let key = {date: t_s_date, time: list[i].time}
        let keyToString = JSON.stringify(key);

        // used ternary operator onstead of classic if statement // for less code
        booked_map.has(keyToString) ? booked_map.set( keyToString ,booked_map.get(keyToString)+1): booked_map.set(keyToString, 1);
       
    }
    return booked_map;
}

function produceAvalailableTS(allTS_list , booked_list){
    let available_T_S = [];

    for(let t_s of allTS_list){

        let all_t_s_key = {date: t_s.date, time: t_s.time};
        let keyToString = JSON.stringify(all_t_s_key);

        !isExceeded_dentists_number(chosenClinic.dentists, booked_list.get(keyToString)) ? available_T_S.push(t_s): console.log('should be removed', t_s);
    }
    return available_T_S;
}

module.exports = {subscribeAndHandleResponse}
