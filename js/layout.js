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