function openSystemSettings(id){
	
	/*Tweak - Hide all */
	$( "#detailsDisplaySystemSettings" ).children().css( "display", "none" );
	$( "#detailsNewSystemSettings" ).children().css( "display", "none" );

	document.getElementById(id).style.display = "block";

	switch(id){
    case "personalOptions":{
      renderPersonalisations();
      break;
    } 
    case "keyboardShortcuts":{
 
      break;
    } 
    case "systemSecurity":{
 
      break;
    }  
    case "resetOptions":{
 
      break;
    }            
	}
}


/*read personalisation data*/
function renderPersonalisations(){

    if(fs.existsSync('./data/static/personalisations.json')) {
        fs.readFile('./data/static/personalisations.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to read Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var params = JSON.parse(data);

          var isScreenIdleEnabled = false;

          //Render
          for (var i=0; i<params.length; i++){
            if(params[i].name == "theme"){
              /*TWEAK*/
              var themeName = params[i].value;
              themeName = themeName.replace(/skin-/g,"");
              themeName = themeName.replace(/-/g," ");
              if((themeName.split(" ")).length == 1){
                themeName = themeName+' Dark';
              }

              document.getElementById("title_"+params[i].value).innerHTML = themeName+'<tag class="selectThemeTitleDefaulted"> <i style="color: #2ecc71" class="fa fa-check-circle"></i></tag>';
            }
            else if(params[i].name == "menuImages"){
              document.getElementById("personalisationEditImage").value = params[i].value;
            }
            else if(params[i].name == "virtualKeyboard"){
              document.getElementById("personalisationEditKeyboard").value = params[i].value;
            }
            else if(params[i].name == "screenLockOptions"){
              if(params[i].value == 'SCREENSAVER' || params[i].value == 'LOCKSCREEN'){
                document.getElementById("personalisationInactiveScreen").value = params[i].value;
                isScreenIdleEnabled = true;
              }
              else{
                document.getElementById("personalisationInactiveScreen").value = 'NONE';
                isScreenIdleEnabled = false;
              }
              
            }
            else if(params[i].name == "screenLockDuration"){
              if(isScreenIdleEnabled){
                document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
                document.getElementById("personalisationIdleDuration").value = params[i].value;
              }  
              else{
                document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'none';
                document.getElementById("personalisationIdleDuration").value = params[i].value;
              }    
            }                        
          }

    }
    });
      } else {
        showToast('System Error: Unable to read Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      }   
}

function changePersonalisationFile(type, changedValue){

    if(fs.existsSync('./data/static/personalisations.json')) {
        fs.readFile('./data/static/personalisations.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to modify Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var params = JSON.parse(data);


                  for (var i=0; i<params.length; i++){
                    if(params[i].name == type){
                      params[i].value = changedValue;
                      break;
                    }
                  }

           var newjson = JSON.stringify(params);
           fs.writeFile('./data/static/personalisations.json', newjson, 'utf8', (err) => {
             if(err){
                showToast('System Error: Unable to save Personalisations data. Please contact Accelerate Support.', '#e74c3c');
               }
           }); 

    }
    });
      } else {
        showToast('System Error: Unable to modify Personalisations data. Please contact Accelerate Support.', '#e74c3c');
      }   
 
}

/*actions*/
function changePersonalisationTheme(themeName){

  //document.getElementById("mainAppBody").classList;
  var tempList = document.getElementById("mainAppBody").classList.toString();
  tempList = tempList.split(" ");

  tempList[0] = themeName;

  tempList = tempList.toString();
  tempList = tempList.replace (/,/g, " ");

  document.getElementById("mainAppBody").className = tempList;

  //Tweak
  var x = document.getElementsByClassName("selectThemeTitleDefaulted");
  var n = 0;
  while(x[n]){
    $(".selectThemeTitleDefaulted").html("");
    n++;
  }

  document.getElementById("title_"+themeName).innerHTML += '<tag class="selectThemeTitleDefaulted"> <i style="color: #2ecc71" class="fa fa-check-circle"></i></tag>';
            

  //Update
  window.localStorage.appCustomSettings_Theme = themeName;
  changePersonalisationFile("theme", themeName);

  showToast('Theme changed successfully', '#27ae60');
}


function changePersonalisationImage(){
  var optName = document.getElementById("personalisationEditImage").value == 'YES'? true: false;

  if(optName){
    showToast('Photos will be displayed in the Menu', '#27ae60');
  }
  else{
    showToast('Photos has been disabled in the Menu', '#27ae60');
  }

  //Update
  window.localStorage.appCustomSettings_ImageDisplay = optName;
  changePersonalisationFile("menuImages", document.getElementById("personalisationEditImage").value);
}


function changePersonalisationLock(){
  var optName = document.getElementById("personalisationInactiveScreen").value;

  if(optName == 'SCREENSAVER'){
    showToast('Screen Saver will be displayed when the Screen is idle', '#27ae60');
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
  }
  else if(optName == 'LOCKSCREEN'){
    showToast('Screen will be Locked when the Screen is idle', '#27ae60');
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'table-row';
  }
  else{
    optName = '';
    document.getElementById("personalisationInactiveScreen_TimeOptions").style.display = 'none';
  }


  //Update
  window.localStorage.appCustomSettings_InactivityEnabled = optName;
  changePersonalisationFile("screenLockOptions", optName);

  initScreenSaver();
}


function changePersonalisationIdleDuration(){
  var optName = document.getElementById("personalisationIdleDuration").value;

  //Update
  window.localStorage.appCustomSettings_InactivityScreenDelay = optName;
  changePersonalisationFile("screenLockDuration", optName);

  initScreenSaver();
}


function changePersonalisationKeyboard(){
  var optName = parseFloat(document.getElementById("personalisationEditKeyboard").value);


  if(optName == 0){
    showToast('Virtual Keyboard disabled', '#27ae60');
  }
  else if(optName == 1){
    showToast('Virtual Keyboard gets activated on Input only', '#27ae60');
  }
  else if(optName == 2){
    showToast('Virtual Keyboard is enabled', '#27ae60');
  }


  //Update
  window.localStorage.appCustomSettings_Keyboard = optName;
  changePersonalisationFile("virtualKeyboard", optName);
}

