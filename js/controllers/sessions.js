let $ = require('jquery')
let fs = require('fs')
//let filename = 'tables'
var obj = [];

function addSession(name,startTime,endTime) {  
   
   var letterNumber = /^[0-9a-zA-Z]+$/;
   if(!name.match(letterNumber)||!startTime.match(letterNumber)||!endTime.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('./data/static/sessions.json')) {
         fs.readFile('./data/static/sessions.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push({"name": name, "StartTime": startTime, "EndTime":endTime}); //add some data
             json = JSON.stringify(obj); //convert it back to json
             fs.writeFile('./data/static/sessions.json', json, 'utf8', (err) => {
                  if(err)
                     console.log(err)
               });
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               if (obj[i].name == name){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               console.log("Session Already Exists!!")
             }
             else{
                obj.push({"name": name, "StartTime": startTime, "EndTime":endTime}); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./data/static/sessions.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push({"name": name, "StartTime": startTime, "EndTime":endTime});
         var json = JSON.stringify(obj);
         fs.writeFile('./data/static/sessions.json', json, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}


function editSession(name,startTime,endTime) {  
   
   var letterNumber = /^[0-9a-zA-Z]+$/;
   if(!name.match(letterNumber)||!startTime.match(letterNumber)||!endTime.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('./data/static/sessions.json')) {
         fs.readFile('./data/static/sessions.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            console.log("File Empty.")
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               if (obj[i].name == name){
                  flag=1;
                  obj[i].StartTime = startTime;
                  obj[i].EndTime = endTime;
                  break;
               }
             }
             if(flag==0){
               console.log("No Such Session!!")
             }
             else{
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./data/static/sessions.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist.")
      }
   }
}


function deleteSession(name) {  
   
   //Check if file exists
   if(fs.existsSync('./data/static/sessions.json')) {
       fs.readFile('./data/static/sessions.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object

       for (i=0; i<obj.length; i++) {
         if (obj[i].name == name){
            obj.splice(i,1);
            break;
         }
       }
       //console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/sessions.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function fetchAll(){
   if(fs.existsSync('./data/static/sessions.json')) {
      fs.readFile('./data/static/sessions.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var sessions = JSON.parse(data); //now it an object
          var sessionsjson = JSON.stringify(sessions); //convert it back to json  
          //console.log(sessionsjson)
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}

fetchAll()

//editSession("Brunch","1000","1300")