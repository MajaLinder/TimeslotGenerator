const { v4: uuidv4 } = require('uuid');
const moment = require('moment'); 


// get a name of a day
function getDayName(dateStr)
{
    var date = new Date(dateStr);
    return date.toLocaleDateString('en-us', { weekday: 'long' });        
}


// find the opening hours of a specific day of a specifc clinic by day name 
function getOpeningHours(openinghours, day){
   
    switch (day) {

    case 'Monday': return openinghours.monday;  

    case 'Tuesday': return openinghours.tuesday;

    case 'Wednesday': return openinghours.wednesday;

    case 'Thursday': return openinghours.thursday;

    case 'Friday': return openinghours.friday;
    
    case 'Saturday': return '';

    case 'Sunday': return '';

    default: return 'Please chose a working day (monday - friday)';
    }
}


// to exclude the breaks
function isBreak(timeslot){
    let fika = '15:00 - 15:30'; 
    let lunchA = '12:00 - 12:30';
    let lunchB = '12:30 - 13:00'; 

    if (timeslot === fika || 
        timeslot === lunchA ||
        timeslot === lunchB)
    {
        return true;
    }
}

function isPassed(currentTime, slotTime){

    let current_time = moment(currentTime, 'HH:mm');
    let slot_time = moment(slotTime, 'HH:mm');

    if (current_time > slot_time) {return true}
}



// to split the opening and closing hours for each day . 
function splitOpeningClosing(op_cl){
    let opening_closing = op_cl.split('-'); 
    let opening_hours = parseInt(opening_closing[0]); 
    let closing_hours = parseInt(opening_closing[1]); 

    return {op: opening_hours, cl: closing_hours};
}



// split opening hours to times in an array >> used for building Times for timeslots 
function splitOpeningHours(opening_hours, closing_hours) {

    let allSplitedTimes = [];

    let x = {
        slotInterval: 30,
        openTime: opening_hours,
        closeTime: closing_hours
    };
        
    //Format the time
    let startTime = moment(x.openTime, 'HH:mm');
        
    //Format the end time and the next day to it 
    let endTime = moment(x.closeTime, 'HH:mm').add(1, 'days');
        
    //Loop over the times - only pushes time with 30 minutes interval
    while (startTime < endTime) {
        //Push times
        allSplitedTimes.push(startTime.format('HH:mm')); 
        //Add interval of 30 minutes
        startTime.add(x.slotInterval, 'minutes');
            
    }
    return allSplitedTimes;
} 


// build timesllots 
function buildTimesSlots(dentist, newdays_array) {

    let built_times = [];
    
    // add pointers to the array and create an actual timeslot 
    let open_pointer = 0;
    let close_pointer = open_pointer + 1;

    // loop over each day and create it's timeslots 
    for (let i = 0; i < newdays_array.length; i++) {

        // get working hours 
        let w_h = getOpeningHours(dentist.openinghours, newdays_array[i].working_day.day);

        /// split these hours w_h  >>> Op (opening) Cl (cosing)
        let Opning_Closing = splitOpeningClosing(w_h); 

        // split times to array 
        let splited =  splitOpeningHours(Opning_Closing.op, Opning_Closing.cl); 
        
        // keep looping for the amount of working_hours the day has
        while (open_pointer < ((Opning_Closing.cl - Opning_Closing.op) * 2)) { 
            
            // build time 
            let built_time = `${splited[open_pointer]} - ${splited[close_pointer]}`;

            // build timeslot
            let timeSlot = {id: uuidv4(), d_name: newdays_array[i].working_day.day, time: built_time, date: {d_number: newdays_array[i].working_day.date.day, 
                month: newdays_array[i].working_day.date.month, year: newdays_array[i].working_day.date.year}};
            
            // exclude the breaks
            if (!isBreak(built_time)) { 
                built_times.push(timeSlot); 
            }

            // increase the counters while still creating slots for the same day. 
            open_pointer++; 
            close_pointer++;
        }

        // reset the counters for the next day. 
        open_pointer = 0;
        close_pointer = open_pointer + 1;

    }

    return built_times; 
}


// generate new days of any chosen number of days. 
function generateNewDays(num) {

    let counter = 0;

    let new_days = [];
    let today = new Date(); 
    
    do {
        // go to next day 
        let next_day = new Date(today.getFullYear(),today.getMonth(),today.getDate() + counter);
    
        // date string to get back a name of a day
        let dateStr = `${next_day.getMonth()+1}/${next_day.getDate()}/${next_day.getFullYear()}`;
    
        //get the name of the day and exclude it if it's a weeknd day .
        if (getDayName(dateStr) === 'Sunday' || getDayName(dateStr) === 'Saturday') {
        // do nothing
        }else{
        // create a day and add it to the array
            var day = { working_day : {day: getDayName(dateStr), time: 'To be added later', 
                date: {day: next_day.getDate(), month: next_day.getMonth()+1, year: next_day.getFullYear()}}}; 
            new_days.push(day);
        }
        counter++; // take next day

    } while (new_days.length < num);

    return new_days; 

}


///// get number of opened hours 
function getNumberOfHours(working_hours, day) {

    // get working hours 
    let w_h = getOpeningHours(working_hours, day);

    /// split these hours w_h  >>> Op (opening) Cl (cosing)
    let Opning_Closing = splitOpeningClosing(w_h); 

    if (Opning_Closing.cl <= 12) {
        console.log(((Opning_Closing.cl - Opning_Closing.op) * 2));
        return ((Opning_Closing.cl - Opning_Closing.op) * 2); // fix the bug
    }else{
        console.log(((Opning_Closing.cl - Opning_Closing.op) * 2) - 3);
        return ((Opning_Closing.cl - Opning_Closing.op) * 2) - 3; /// fix the bug of cutting the next day. 
    }

}

///// cut the passed timelsots 
function cutToTheMoment(allSlots, dentist) {

    let slots = allSlots; 
    //get current time by hours and minutes 
    let currentTime = getCurrentTime();
    // get the todays date in numbers 
    let today = new Date();
    let today_number = today.getDate();
    let today_month = today.getMonth();
    let today_year = today.getFullYear();

    // convert it to a string 
    let dateStr = `${today_month+1}/${today_number}/${today_year}`;

    // get todays name
    let today_name = getDayName(dateStr); 
  
    // get how many hours the dentistry is open for today
    let number = getNumberOfHours(dentist.openinghours, today_name);
    
    // loop over all timeslots array and exclude the passed ones. 
    for (let i = 0; i < number; i++) {

        let openHour = slots[0].time.split('-'); 
        // compare the times
        if (isPassed(currentTime, openHour[0])) {
            // exclude the timeslots that has passed the current time. 
            slots.shift();
        }
    }
    return slots; 
}

// gives the current time as " hh:mm "
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric'});
}


// export timeslotFactory method so we create the timeslots just on demnand. So we don't need to save them in array in this class and export it. 
function timeslotFactory(dentist, num) {

    let new_days = generateNewDays(num);
    let time_slots = buildTimesSlots(dentist, new_days); 
    let all_time_slots = cutToTheMoment(time_slots, dentist);

    return all_time_slots;
}

module.exports = {timeslotFactory};