let $ = require('jquery')
let fs = require('fs')
//let filename = 'tables'
var obj = [];

function addCategory(name) {  
   
   var letterNumber = /^[0-9a-zA-Z]+$/;
   if(!name.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('menuCategories.json')) {
         fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push(name); //add some data
            fs.writeFile('menuCategories.json', obj, 'utf8', (err) => {
                if(err)
                  console.log(err)
            });
         }
         else{
             flag=0;
             obj = JSON.parse(data);
             for (i=0; i<obj.length; i++) {
               if (obj[i] == name){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               console.log("Duplicate Entry not Allowed")
             }
             else{
                console.log(obj)
                obj.push(name);
                json = JSON.stringify(obj);
                fs.writeFile('menuCategories.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push(name);
         fs.writeFile('menuCategories.json', obj, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}

function deleteCategory(name) {  
   
   //Check if file exists
   if(fs.existsSync('menuCategories.json')) {
       fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
       obj = JSON.parse(data); //now it an object
       //console.log(obj.length)
       for (i=0; i<obj.length; i++) {  
         if (obj[i] == name){
            obj.splice(i,1);
            break;
         }
       }
       console.log(obj)
       var newjson = JSON.stringify(obj);
       fs.writeFile('menuCategories.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function fetchAll(){
   if(fs.existsSync('menuCategories.json')) {
      fs.readFile('menuCategories.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var menuCategories = JSON.parse(data); //now it an object
          var menuCategoriesJSON = JSON.stringify(menuCategories); //convert it back to json  
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}

fetchAll()