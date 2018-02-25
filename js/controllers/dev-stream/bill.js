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

      fs.readFile('./data/static/lastBILL.txt', 'utf8', function readFileCallback(err, data){
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
          path = "./data/bills/"+dirname+"/"+file
          fs.writeFile(path, json, 'utf8', (err) => {
              if(err)
                 console.log(err)
           });
          fs.writeFile("./data/static/lastBILL.txt", num, 'utf8', (err) => {
              if(err)
                 console.log(err)
           });
       }
       });
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
         path = "./data/bills/"+dirname+"/"+file
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
         path = "./data/bills/"+dirname+"/"+file
   
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
         path = "./data/bills/"+dirname+"/"+file
         fs.writeFileSync(path, json, 'utf8', (err) => {
            if(err)
             console.log(err)
         });
   }});      
   } else {
      console.log("File Doesn\'t Exist.")
   }
}