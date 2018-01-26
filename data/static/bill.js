let fs = require('fs')
var obj = [];
var letterNumber = /^[0-9a-zA-Z]+$/;
var mkdirp = require('mkdirp');


function createBill(custName,custMob,stewName,stewCode,table,cart,spnotes,type,refnum,timePunch,timeKOT,paymentMode,totalPaid,discountOffered,amountSplit) {  
   
   if(!custMob.match(letterNumber)||!stewCode.match(letterNumber)||!table.match(letterNumber)) {
      console.log("Only Alphanumeric Characters allowed")
   }
   else{ 
      var num = 1000;
      var kot;
      //Check if file exists

      fs.readFile('lastBILL.txt', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else{
          num = parseInt(data) + 1;

          var today = new Date();
          var time;
          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();
          var hour = today.getHours();
          var mins = today.getMinutes();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          if(hour<10) {
              hour = '0'+hour;
          } 

          if(mins<10) {
              mins = '0'+mins;
          }

          dirname = dd+mm+yyyy; 
          mkdirp("data/bills/"+dirname, function(err) { 
            if(err)
              console.log(err)
          });

          today = dd + '-' + mm + '-' + yyyy;
          time = hour + mins;
          var cartArr = [];
          cartArr.push(cart);

          obj = {"billNumber": num, "table": table, "referenceNumber": refnum, "isSynced": 0, "paymentMode": paymentMode, "totalPaid": totalPaid, "discountOffered": discountOffered, "amountSplit":amountSplit, "customerName": custName, "customerMobile": custMob, "stewardName": stewName, "stewardCode": stewCode, "date": today, "timePunch": timePunch, "timeKOT": timeKOT, "timeBill": time, "timeSettle": "", "cart": cartArr, "specialNotes": spnotes}; 
          json = JSON.stringify(obj); //convert it back to json
          var file = num+'.json';
          path = "data/bills/"+dirname+"/"+file
          fs.writeFile(path, json, 'utf8', (err) => {
              if(err)
                 console.log(err)
           });
          fs.writeFile("lastBILL.txt", num, 'utf8', (err) => {
              if(err)
                 console.log(err)
           });
       }
       });
}
}
function deleteItem(kot,itemCode) {  
   
   if(fs.existsSync(kot+'.json')) {
        fs.readFile(kot+'.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         obj = JSON.parse(data);
         for (i=0; i<obj.cart.length; i++){
            if(obj.cart[i].code == itemCode){
              var retstr = obj.cart[i].name+"("+obj.cart[i].qty+" qty)"+" added "+" to Table "+obj.cart[i].table+" by "+obj.stewardName;
              //console.log(obj.cart[i].name+"("+obj.cart[i].qty+" qty)"+" deleted "+" from Table "+obj.table+" by "+obj.stewardName)
              obj.cart.splice(i,1);
              break;
            }
         }
         json = JSON.stringify(obj); //convert it back to json
         fs.writeFileSync(kot+'.json', json, 'utf8', (err) => {
            if(err)
             console.log(err)
         });
   }});      
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function editItem(kot,itemCode,qty) {  
   
   if(fs.existsSync(kot+'.json')) {
        fs.readFile(kot+'.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         obj = JSON.parse(data);
         for (i=0; i<obj.cart.length; i++){
            if(obj.cart[i].code == itemCode){
              var retstr = "Quantity of "+obj.cart[i].name+" changed from "+obj.cart[i].qty+" to "+qty+" on Table "+obj.table+" by "+obj.stewardName;
              obj.cart[i].qty = qty;
              break;
            }
         }
         json = JSON.stringify(obj); //convert it back to json
         fs.writeFileSync(kot+'.json', json, 'utf8', (err) => {
            if(err)
             console.log(err)
         });
   }});      
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

function addItem(kot,item) {  
  if(fs.existsSync(kot+'.json')) {
        fs.readFile(kot+'.json', 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
         obj = JSON.parse(data);
         //console.log(obj.cart)
         obj.cart.push(item);
         //var retstr = item.name+" added ";
         var retstr = item.name+"("+item.qty+" qty)"+" added "+" to Table "+obj.table+" by "+obj.stewardName;
         json = JSON.stringify(obj); //convert it back to json
         fs.writeFileSync(kot+'.json', json, 'utf8', (err) => {
            if(err)
             console.log(err)
         });
         
   }
   });
   } else {
      console.log("File Doesn\'t Exist.")
   }   

}

function fetchBILL(bill){
    var today = new Date();
          var time;
          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();
          var hour = today.getHours();
          var mins = today.getMinutes();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          if(hour<10) {
              hour = '0'+hour;
          } 

          if(mins<10) {
              mins = '0'+mins;
          }

          dirname = dd+mm+yyyy;
          time = hour + mins;
         json = JSON.stringify(obj); //convert it back to json
         var file = bill+'.json';
         path = "data/bills/"+dirname+"/"+file
   if(fs.existsSync(path)) {
      fs.readFile(path, 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
          var billfile = JSON.parse(data); //now it an object
          var billfileJSON = JSON.stringify(billfile); //convert it back to json 
          console.log(billfileJSON)
}});
   } else {
      console.log("File Doesn\'t Exist.")
   }  
}

function settleBILL(bill) {  

          var today = new Date();
          var time;
          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();
          var hour = today.getHours();
          var mins = today.getMinutes();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          if(hour<10) {
              hour = '0'+hour;
          } 

          if(mins<10) {
              mins = '0'+mins;
          }

          dirname = dd+mm+yyyy;
          time = hour + mins;
         json = JSON.stringify(obj); //convert it back to json
         var file = bill+'.json';
         path = "data/bills/"+dirname+"/"+file
   
   if(fs.existsSync(path)) {
        fs.readFile(path, 'utf8', function readFileCallback(err, data){
       if (err){
           console.log(err);
       } else {
          obj = JSON.parse(data);
          obj.timeSettle = time;
          var today = new Date();
          var time;
          var dd = today.getDate();
          var mm = today.getMonth()+1; //January is 0!
          var yyyy = today.getFullYear();
          var hour = today.getHours();
          var mins = today.getMinutes();

          if(dd<10) {
              dd = '0'+dd;
          } 

          if(mm<10) {
              mm = '0'+mm;
          } 

          if(hour<10) {
              hour = '0'+hour;
          } 

          if(mins<10) {
              mins = '0'+mins;
          }

          dirname = dd+mm+yyyy;
          time = hour + mins;
         json = JSON.stringify(obj); //convert it back to json
         var file = bill+'.json';
         path = "data/bills/"+dirname+"/"+file
         fs.writeFileSync(path, json, 'utf8', (err) => {
            if(err)
             console.log(err)
         });
   }});      
   } else {
      console.log("File Doesn\'t Exist.")
   }
}

//createKOT("Abhijith C S","9043960876","Maneesh","9848010922","T1",{ "name": "Chicken Shawarma", "code": "1086", "qty": 1, "isCustom": true, "variant": "Paratha Roll", "price": "75", "comments": "" },"Allergic to Tomato")
//addItem("KOT1002",{ "code": "1081", "name": "Boneless BBQ Fish", "qty": 1, "isCustom": false, "price": "220", "comments": "Make it less spicy" })
//deleteItem("KOT1002","1081")
// printKOT("KOT1002")
// fetchKOT("KOT1002")
//createBill("Abhijith C S","9043960876","Maneesh","9848010922","T1",{ "name": "Chicken Shawarma", "code": "1086", "qty": 1, "isCustom": true, "variant": "Paratha Roll", "price": "75", "comments": "" },"Amex Card  declined once.","WALKIN","TO_MAP_RESERVATION_ID","2217","2219","CARD","1700","190",[{ "type": "Sub Total", "unit": "", "value": 1500 }, { "type": "Service Charge", "unit": "12%", "value": 300 }, { "type": "GST", "unit": "5%", "value": 90 }])
//fetchBILL("2001004")
//settleBILL("2001004")