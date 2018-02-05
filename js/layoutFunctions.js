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