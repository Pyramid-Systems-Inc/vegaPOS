let fs = require('fs')
var obj = [];
var letterNumber = /^[0-9a-zA-Z]+$/;

function addUser(code,name,role,password) {  
   
   if(!code.match(letterNumber)||!role.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      if(fs.existsSync('./data/static/userprofiles.json')) {
         fs.readFile('./data/static/userprofiles.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push({"code": code, "name": name, "role":role, "password": password}); //add some data
             json = JSON.stringify(obj); //convert it back to json
             fs.writeFile('./data/static/userprofiles.json', json, 'utf8', (err) => {
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
               console.log("User Already Exists!!!")
             }
             else{
                obj.push({"code": code, "name": name, "role":role, "password": password}); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./data/static/userprofiles.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push({"code": code, "name": name, "role":role, "password": password});
         var json = JSON.stringify(obj);
         fs.writeFile('./data/static/userprofiles.json', json, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}

function deleteUser(code) {  
   
   if(fs.existsSync('./data/static/userprofiles.json')) {
       fs.readFile('./data/static/userprofiles.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object

       for (i=0; i<obj.length; i++) {
         if (obj[i].code == code){
            obj.splice(i,1);
            break;
         }
       }
       console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('./data/static/userprofiles.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function changePass(code,currpass,newpass,confpass) {  
   
   if(fs.existsSync('./data/static/userprofiles.json')) {
       fs.readFile('./data/static/userprofiles.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object
       var flag=0;
       for (i=0; i<obj.length; i++) {
         if (obj[i].code == code){
            if(obj[i].password==currpass){
              flag = 1;
              break;
            }
            break;
         }
       }
       //console.log(obj)
       if(flag==0){
        console.log("Incorrect Current Password");
       }
       else{
           if(newpass==confpass){
               obj[i].password = newpass;
               var newjson = JSON.stringify(obj);
               fs.writeFile('./data/static/userprofiles.json', newjson, 'utf8', (err) => {
                 if(err)
                    console.log(err)
               }); 
           }
           else{
              console.log("New Password and Confirm Password Do not Match");
           }
            
       }
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

//addUser("9043960876","Abhijith C S","ADMIN","password")
changePass("9043960876","password","newpass","newpass")
