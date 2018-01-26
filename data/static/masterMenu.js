let fs = require('fs')
var obj = [];
var letterNumber = /^[0-9a-zA-Z]+$/;

function addItem(category,item) {  
   
   if(!category.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      //Check if file exists
      if(fs.existsSync('mastermenu.json')) {
         fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            obj = []
            obj.push({"category": category, "items": item}); //add some data
             json = JSON.stringify(obj); //convert it back to json
             fs.writeFile('mastermenu.json', json, 'utf8', (err) => {
                  if(err)
                     console.log(err)
               });
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               if (obj[i].category == category){
                  flag=1;
                  break;
               }
             }
             if(flag==1){
               var dupflag = 0;
               //var sub = obj[i].items;
               //console.log(sub.length)
               for (j=0; j<obj[i].items.length; j++){
                 if(obj[i].items[j].code==item.code){
                    dupflag=1;
                    break;
                 }
               }
               if(dupflag==1){
                 console.log("Duplicate Entry!!!")
               }       
               else{
                 obj[i].items[j] = item
                 json = JSON.stringify(obj); //convert it back to json
                 fs.writeFileSync('mastermenu.json', json, 'utf8', (err) => {
                      if(err)
                         console.log(err)
                   }); 
               }

             }
             else{
                var menuitem = []
                menuitem.push(item)
                obj.push({"category": category, "items": menuitem}); //add some data
                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('mastermenu.json', json, 'utf8', (err) => {
                     if(err)
                        console.log(err)
                  });  
             }
                 
         }
          
   }});
      } else {
         console.log("File Doesn\'t Exist. Creating new file.")
         //var itemjson = JSON.stringify(item);
         var menuitem = []
         menuitem.push(item)
         obj.push({"category": category, "items": menuitem});
         var json = JSON.stringify(obj);
         fs.writeFile('mastermenu.json', json, 'utf8', (err) => {
            if(err)
               console.log(err)
         });
      }
   }
}

function deleteItem(item) {  
   
   
   if(fs.existsSync('mastermenu.json')) {
        fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            console.log("No Data Exist.")
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               var flag = 0;
               //var sub = obj[i].items;
               for(j=0; j<obj[i].items.length; j++){
                  if(obj[i].items[j].code==item.code){
                    flag=1;
                    obj[i].items.splice(j,1);
                    break;
                 }
               }
               if(flag==1){
                  break;
               }  
             }
             if(flag==1){
                 json = JSON.stringify(obj); //convert it back to json
                 fs.writeFileSync('mastermenu.json', json, 'utf8', (err) => {
                      if(err)
                         console.log(err)
                   }); 

             }
             else{
                console.log("No such Product Exists!!!")
             }
                 
         }
          
   }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function editItem(item) {  
   
   if(fs.existsSync('mastermenu.json')) {
        fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            console.log("No Data Exist.")
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               var flag = 0;
               //var sub = obj[i].items;
               for(j=0; j<obj[i].items.length; j++){
                  if(obj[i].items[j].code==item.code){
                    flag=1;
                    obj[i].items[j]=item;
                    break;
                 }
               }
               if(flag==1){
                  break;
               }
             }
             if(flag==1){
                 json = JSON.stringify(obj); //convert it back to json
                 fs.writeFileSync('mastermenu.json', json, 'utf8', (err) => {
                      if(err)
                         console.log(err)
                   }); 

             }
             else{
                console.log("No such Product Exists!!!")
             }
                 
         }
          
   }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function markAvailability(code) {  
   
   if(fs.existsSync('mastermenu.json')) {
        fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         if(data==""){
            console.log("No Data Exist.")
         }
         else{
             flag=0;
             obj = JSON.parse(data); //now it an object
             for (i=0; i<obj.length; i++) {
               var flag = 0;
               //var sub = obj[i].items;
               for(j=0; j<obj[i].items.length; j++){
                  if(obj[i].items[j].code==code){
                    flag=1;
                    obj[i].items[j].isAvailable=!obj[i].items[j].isAvailable;
                    break;
                 }
               }
               if(flag==1){
                  break;
               }
             }
             if(flag==1){
                 json = JSON.stringify(obj); //convert it back to json
                 fs.writeFileSync('mastermenu.json', json, 'utf8', (err) => {
                      if(err)
                         console.log(err)
                   }); 

             }
             else{
                console.log("No such Product Exists!!!")
             }
                 
         }
          
   }});
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function fetchAllItems(){
   if(fs.existsSync('mastermenu.json')) {
      fs.readFile('mastermenu.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var mastermenu = JSON.parse(data); //now it an object
          var mastermenuJSON = JSON.stringify(mastermenu); //convert it back to json 
          console.log(mastermenuJSON)
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}

markAvailability(1000)
