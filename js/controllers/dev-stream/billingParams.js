let $ = require('jquery')
let fs = require('fs')
//let filename = 'tables'
var obj = [];
var letterNumber = /^[0-9a-zA-Z]+$/;

function addParam(id,parameter,percentage,isCompulsary) {  
   
   if(!id.match(letterNumber)||!parameter.match(letterNumber)||!isCompulsary.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('./data/static/billingparameters.json')) {
         fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push({"id": id, "parameter": parameter, "percentage":percentage, "isCompulsary": isCompulsary}); //add some data
             json = JSON.stringify(obj); //convert it back to json
             fs.writeFile('./data/static/billingparameters.json', json, 'utf8', (err) => {
                  if(err)
                     console.log(err)
               });
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               if (obj[i].code == code){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               console.log("Duplicate Entry not Allowed")
             }
             else{
                obj.push({"id": id, "parameter": parameter, "percentage":percentage, "isCompulsary": isCompulsary}); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./data/static/billingparameters.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push({"id": id, "parameter": parameter, "percentage":percentage, "isCompulsary": isCompulsary});
         var json = JSON.stringify(obj);
         fs.writeFile('./data/static/billingparameters.json', json, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}

function deleteParam(id) {  
   
   //Check if file exists
   if(fs.existsSync('./data/static/billingparameters.json')) {
       fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object

       for (i=0; i<obj.length; i++) {
         if (obj[i].id == id){
            obj.splice(i,1);
            break;
         }
       }
       console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/billingparameters.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function editParam(id,percentage,isCompulsary) {  
   
   if(!id.match(letterNumber)||!isCompulsary.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{
      //Check if file exists
   if(fs.existsSync('./data/static/billingparameters.json')) {
       fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object

       for (i=0; i<obj.length; i++) {
         if (obj[i].id == id){
            obj[i].percentage = percentage;
            obj[i].isCompulsary = isCompulsary;
            break;
         }
       }
       console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/billingparameters.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
  }
}


function fetchAllParam(){
   if(fs.existsSync('./data/static/billingparameters.json')) {
      fs.readFile('./data/static/billingparameters.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var billingparameters = JSON.parse(data); //now it an object
          var billingParamsJSON = JSON.stringify(billingparameters); //convert it back to json 
          console.log(billingParamsJSON)
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}


