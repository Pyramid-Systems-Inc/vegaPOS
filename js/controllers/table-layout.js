var obj = [];

function addTable(name,code,capacity,type) {  
   
   var letterNumber = /^[0-9a-zA-Z]+$/;
   if(!name.match(letterNumber)||!code.match(letterNumber)||!capacity.match(letterNumber)||!type.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('./data/static/tables.json')) {
         fs.readFile('./data/static/tables.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push({"name": name, "code": code, "capacity":capacity, "type": type}); //add some data
             json = JSON.stringify(obj); //convert it back to json
             fs.writeFile('./data/static/tables.json', json, 'utf8', (err) => {
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
                obj.push({"name": name, "code": code, "capacity":capacity, "type": type}); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./data/static/tables.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         obj.push({"name": name, "code": code, "capacity":capacity, "type": type});
         var json = JSON.stringify(obj);
         fs.writeFile('./data/static/tables.json', json, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}

function deleteTable(code) {  
   
   //Check if file exists
   if(fs.existsSync('./data/static/tables.json')) {
       fs.readFile('./data/static/tables.json', 'utf8', function readFileCallback(err, data){
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
       fs.writeFile('./data/static/tables.json', newjson, 'utf8', (err) => {
         if(err)
            console.log(err)
       }); 
      }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function deleteAll(){
   fs.unlinkSync('./data/static/tables.json');
}

function fetchAll(){
   if(fs.existsSync('./data/static/tables.json')) {
      fs.readFile('./data/static/tables.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var tables = JSON.parse(data); //now it an object
          var tablesjson = JSON.stringify(tables); //convert it back to json  
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}

//fetchAll()

//addTable("Table-","T4","4","Normal")