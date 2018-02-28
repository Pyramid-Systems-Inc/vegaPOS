let fs = require('fs');

/* Expand/Contract Sidebar */
function activateSidebarElement(barID){

	if (document.getElementById(barID).classList.contains('active')){
		document.getElementById(barID).classList.remove('active');
	}
	else{
		document.getElementById(barID).classList.add('active');
	}
}


function activateSidebar(){

	if (document.getElementsByTagName("body")[0].classList.contains('sidebar-collapse')){
		document.getElementsByTagName("body")[0].classList.remove('sidebar-collapse');
	}
	else{
		document.getElementsByTagName("body")[0].classList.add('sidebar-collapse');
	}
}


/* Open KOT Modal */
function viewKOTModal(){
	console.log('Viewing Modal')
}


/* KOTs */
function checkOverflow(element){
	if(element.scrollHeight > element.clientHeight){
		element.getElementsByClassName("more")[0].style.display = 'block';
	}
}

/*Toast*/
function showToast(message, color){
        var x = document.getElementById("infobar")
        if(color){
        	x.style.background = color;
        }
		x.innerHTML = message;
		x.className = "show";
		setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);   	
}

/* Virtual Keyboard */
$(function () {
    "use strict";
    jqKeyboard.init();
});



/* Time Display */

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function getCurrentTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  // add a zero in front of numbers<10
  h = checkTime(h);
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('globalTimeDisplay').innerHTML = h + ":" + m + ":" + s;
  t = setTimeout(function() {
    getCurrentTime()
  }, 500);
}

getCurrentTime();

/* Apply Personalisations */
function applyPersonalisations(){

    console.log('Applying Personalisations...')
  

    //Read from File, apply changes, and save to LocalStorage

    if(fs.existsSync('./data/static/personalisations.json')) {
        fs.readFile('./data/static/personalisations.json', 'utf8', function readFileCallback(err, data){
      if (err){
      } else {

          if(data == ''){ data = '[]'; }

          var params = JSON.parse(data);

          //Render
          for (var i=0; i<params.length; i++){
            if(params[i].name == "theme"){

              /*Change Theme*/
              var tempList = document.getElementById("mainAppBody").classList.toString();
              tempList = tempList.split(" ");

              tempList[0] = params[i].value;

              tempList = tempList.toString();
              tempList = tempList.replace (/,/g, " ");

              document.getElementById("mainAppBody").className = tempList; 

              /*update localstorage*/             
              window.localStorage.appCustomSettings_Theme = params[i].value;
            }
            else if(params[i].name == "menuImages"){

              var tempVal = params[i].value == 'YES'? true: false;

              /*update localstorage*/             
              window.localStorage.appCustomSettings_ImageDisplay = tempVal;
            }
            else if(params[i].name == "virtualKeyboard"){
              var tempVal = params[i].value;
              tempVal = parseFloat(tempVal);
              
              /*update localstorage*/             
              window.localStorage.appCustomSettings_Keyboard = tempVal;
            }
          }

    }
    });
  }
  
}

applyPersonalisations();