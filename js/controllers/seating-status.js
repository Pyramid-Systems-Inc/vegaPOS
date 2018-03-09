/*REFERENCE:
Table Status 
0 - Free
1 - Punched Order
2 - Billed
5 - Reserved Table
*/


/*Open/Close Options*/
function openFreeSeatOptions(tableID){
	document.getElementById("freeSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableID+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="punchNewOrder(\''+tableID+'\')">Punch New Order</button>'+ 
                  '<button class="btn btn-success tableOptionsButton" onclick="addToReserveListConsent(\''+tableID+'\')">Reserve this Table</button>'+  
                  '<button class="btn btn-default tableOptionsButton" onclick="hideFreeSeatOptions()">Close</button>';
	document.getElementById("freeSeatOptionsModal").style.display ='block';
}

function hideFreeSeatOptions(){
	document.getElementById("freeSeatOptionsModal").style.display ='none';
}



function openReservedSeatOptions(tableID){
	document.getElementById("reservedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Reserved Table <b>'+tableID+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="punchNewOrder(\''+tableID+'\')">Punch New Order</button>'+ 
                  '<button class="btn btn-primary tableOptionsButton" onclick="removeFromReserveList(\''+tableID+'\')">Free this Table</button>'+  
                  '<button class="btn btn-default tableOptionsButton" onclick="hideReservedSeatOptions()">Close</button>';
	document.getElementById("reservedSeatOptionsModal").style.display ='block';
}

function hideReservedSeatOptions(){
	document.getElementById("reservedSeatOptionsModal").style.display ='none';
}




function openOccuppiedSeatOptions(tableInfo){

	var tableData = JSON.parse(decodeURI(tableInfo));

	if(tableData.status == 1){ /* Not Billed */
		document.getElementById("occuppiedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableData.table+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="editOrderKOT(\''+tableData.KOT+'\')">Edit Order #'+tableData.KOT+'</button> '+
                  '<button class="btn btn-success tableOptionsButton" onclick="generateBillFromKOT(\''+tableData.KOT+'\')">Generate Bill</button> '+
                  '<button class="btn btn-success tableOptionsButton" onclick="mergeDifferentBills(\''+tableData.table+'\')">Merge Orders and Generate Bill</button> '+
                  '<button class="btn btn-danger tableOptionsButton" onclick="cancelOrderKOT(\''+tableData.KOT+'\')">Cancel Order</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hideOccuppiedSeatOptions()">Close</button> ';
	}
	else if(tableData.status == 2){ /* Billed */
		document.getElementById("occuppiedSeatOptionsModalContent").innerHTML = '<h1 class="tableOptionsHeader">Table <b>'+tableData.table+'</b></h1>'+
                  '<button class="btn btn-success tableOptionsButton" onclick="settlePrintedBill(\''+tableData.KOT+'\')">Settle Bill</button> '+ 
                  '<button class="btn btn-default tableOptionsButton" onclick="hideOccuppiedSeatOptions()">Close</button> ';
	}

	document.getElementById("occuppiedSeatOptionsModal").style.display ='block';
}

function hideOccuppiedSeatOptions(){
	document.getElementById("occuppiedSeatOptionsModal").style.display ='none';
}

/*seat options: actions*/
function editOrderKOT(kotID){

}

function confirmBillMergeFromKOT(kotList, mergedCart, mergedExtras, mergingTables){

	var kotID = kotList[0]; //Merge all to first KOT

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

          if(mergedCart && mergedCart.length > 0){
          	kotfile.cart = mergedCart;
          	kotfile.discount = {};
          	kotfile.extras = mergedExtras;
          }


          var json = JSON.stringify(kotfile); //convert it back to json
          var file = './data/KOT/'+kotID+'.json';
          fs.writeFile(file, json, 'utf8', (err) => {
              if(err){
				showToast('System Error: Unable to merge the orders. Please contact Accelerate Support.', '#e74c3c');
              }
              else{
              	showToast('Orders merged Successfully to Table '+mergingTables[0], '#27ae60');
              	cancelBillMerge();
              	generateBillFromKOT(kotID);

              	/*Remove all other KOTs*/
              	removeOtherKOTS(kotList);
              }
              	 
           });          

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	hideOccuppiedSeatOptions();	
}

function removeOtherKOTS(kotList){ /*TWEAK*/
	            var h = 1; //Do not count first KOT
              	while(kotList[h]){
              		if(fs.existsSync('./data/KOT/'+kotList[h]+'.json')) {
	              		fs.unlinkSync('./data/KOT/'+kotList[h]+'.json')
	              	}
              		h++;
              	}




		if(fs.existsSync('./data/static/tablemapping.json')) {
	      fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Failed to update table mapping. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var tableMapping = JSON.parse(data); 

	          for(var i=0; i<tableMapping.length; i++){
	          	var n = 1; //Do not count first KOT
	          	while(kotList[n]){
		          	if(tableMapping[i].KOT == kotList[n]){
		          		tableMapping.splice(i,1);
		          		break;
		          	}
		          	
		          	n++;
		        }
	          }

		       var newjson = JSON.stringify(tableMapping);
		       fs.writeFile('./data/static/tablemapping.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Failed to update table mapping. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	preloadTableStatus();
		          }
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Failed to update table mapping. Please contact Accelerate Support.', '#e74c3c');
	    }

}

function generateBillFromKOT(kotID){
//ask to confirm (display bill preview)
//ask for applying any discounts
//Merge, split bill options
//check for all linked tables (Order clubbed on T1, T2 and T3)

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

          document.getElementById("billPreviewContentTitle").innerHTML = "#"+kotfile.KOTNumber;

          var itemList = '';
          var subTotal = 0;
          var qtySum = 0;
          var grandPayableSum = 0;
          var n = 0;
          while(kotfile.cart[n]){
          	itemList = itemList + '<tr class="success">'+
								' <td class="text-center">'+(n+1)+'</td>'+
								' <td>'+kotfile.cart[n].name+(kotfile.cart[n].isCustom ? ' ('+kotfile.cart[n].variant+')': '')+'</td>'+
								' <td class="text-center"> <span class="text-center sprice"><i class="fa fa-inr"></i>'+kotfile.cart[n].price+'</span></td>'+
								' <td class="text-center">x '+kotfile.cart[n].qty+'</td>'+
								' <td class="text-right"><span class="text-right ssubtotal"><i class="fa fa-rupee"></i>'+(kotfile.cart[n].price*kotfile.cart[n].qty)+'</span></td>'+
								' </tr>';

								subTotal = subTotal + (kotfile.cart[n].price*kotfile.cart[n].qty);
								qtySum = qtySum + kotfile.cart[n].qty;
          	n++;
          }



          /*Other Charges*/ 
          var otherChargesSum = 0;        
          var otherCharges = '';
          var otherChargerRenderCount = 1;
          var i = 0;

          if(kotfile.discount.amount &&  kotfile.discount.amount != 0){
          	otherCharges = '<tr class="info"><td width="25%" class="cartSummaryRow">Discount</td><td class="text-right cartSummaryRow" style="padding-right:10px; color: #e74c3c !important">- <i class="fa fa-inr"></i>'+kotfile.discount.amount+'</td>';
          	otherChargesSum = otherChargesSum - kotfile.discount.amount;
          }
          else{
          	otherCharges = '<tr class="info"><td width="25%" class="cartSummaryRow">Discount</td><td class="text-right cartSummaryRow" style="padding-right:10px;">0</td>';
          }

          if(kotfile.extras.length > 0){

          	for(i = 0; i < kotfile.extras.length; i++){
          		if(i%2 == 1){
          			otherCharges = otherCharges + '</tr><tr class="info">';
          		}

          		otherCharges = otherCharges + '<td width="25%" class="cartSummaryRow">'+kotfile.extras[i].name+' ('+(kotfile.extras[i].unit == 'PERCENTAGE'? kotfile.extras[i].value + '%': '<i class="fa fa-inr"></i>'+kotfile.extras[i].value)+')</td><td class="text-right cartSummaryRow"><i class="fa fa-inr"></i>'+kotfile.extras[i].amount+'</td>';
          		otherChargesSum = otherChargesSum + kotfile.extras[i].amount;
          		
          	}
          }


          otherChargerRenderCount = otherChargerRenderCount + i;

          if(otherChargerRenderCount%2 == 1){
          	otherCharges = otherCharges + '<td class="cartSummaryRow"></td><td class="cartSummaryRow"></td></tr>';
          }
          else{
          	otherCharges = otherCharges + '</tr>';
          }


          grandPayableSum = subTotal + otherChargesSum;

          grandPayableSum = Math.round(grandPayableSum * 100) / 100


          var discountButtonPart = '';
          if(kotfile.discount.amount && kotfile.discount.type != 'COUPON' && kotfile.discount.type != 'NOCOSTBILL' && kotfile.discount.type != 'VOUCHER'){ /*Discount is Applied Already*/
          	discountButtonPart ='                        <div class="">'+
								'                          <button class="btn btn-danger tableOptionsButton" onclick="removeBillDiscountOnKOT(\''+kotfile.KOTNumber+'\')">Remove Discount</button>'+
								'                        </div>';
          } 
          else{         	
          	discountButtonPart ='                        <div class="" id="applyBillDiscountWindow">'+
								'                          <div id="applyBillDiscountWindowActions" style="display: none">'+
								'                             <div class="row">'+
								'                                <div class="col-lg-12">'+
								'                                  <div class="form-group" style="margin-bottom: 5px">'+
								'                                    <label style="font-size: 10px; font-weight: 300">TYPE</label>'+
								'                                    <select name="unit" id="applyBillDiscountWindow_type" class="form-control input-tip select2" style="width:100%;">'+
								'                                       <option value="OTHER" selected="selected">Other</option>'+
								'                                    </select>'+
								'                                 </div>'+
								'                                 <div class="form-group" style="margin-bottom: 5px">'+
								'                                    <label style="font-size: 10px; font-weight: 300">UNIT</label>'+
								'                                    <select name="unit" id="applyBillDiscountWindow_unit" class="form-control input-tip select2" style="width:100%;" onchange="changeDiscountTypeBillingOptions()">'+
								'                                       <option value="PERCENTAGE" selected="selected">Percentage (%)</option>'+
								'                                       <option value="FIXED">Fixed Amount (Rs)</option>'+
								'                                    </select>'+
								'                                 </div>'+
								'                                   <div class="form-group" style="margin-bottom: 2px">'+
								'                                    <label style="font-size: 10px; font-weight: 300">DISCOUNT VALUE</label>'+
								'                                      <input type="number" value="0" placeholder="Value" style="text-align: center; color: #444" class="form-control tip" id="applyBillDiscountWindow_value" onkeyup="roughCalculateDiscount()" required="required" />'+
								'                                   </div>'+
								'                                   <p style="font-size: 11px; color: #2ecc71">Discount Amount: <tag id="applyBillDiscountWindow_amount">0</tag></p>'+
								'                                </div>'+
								'                                '+
								'                             </div> '+
								'                              <button class="btn btn-default tableOptionsButton" onclick="closeApplyBillDiscountWindow(\''+kotfile.KOTNumber+'\')">Cancel</button>                           '+
								'                          </div>'+
								'                          <div id="applyBillDiscountButtonWrap"><button class="btn btn-default tableOptionsButton" id="applyBillDiscountButton" onclick="openApplyBillDiscountWindow(\''+kotfile.KOTNumber+'\')">Apply Discount</button></div>'+
								'                        </div>';
          }


          var couponButtonPart = '';
          if(kotfile.discount.amount && kotfile.discount.type == 'COUPON'){ /*Coupon is Applied Already*/         	
          	couponButtonPart ='                        	 <div class="">'+
								'                          <button class="btn btn-danger tableOptionsButton" onclick="removeBillCouponOnKOT(\''+kotfile.KOTNumber+'\')">Remove Coupon</button>'+
								'                        </div>';
          }   
          else{       	
          	couponButtonPart ='                        <div class="" id="applyBillCouponWindow">'+
								'                          <div id="applyBillCouponWindowActions" style="display: none">'+
								'                             <div class="row">'+
								'                                <div class="col-lg-12">'+
								'                                   <div class="form-group" style="margin-bottom: 2px">'+
								'                                    <label style="font-size: 10px; font-weight: 300">COUPON CODE</label>'+
								'                                      <input type="text" value="" placeholder="Coupon Code" style="text-align: center; color: #444; margin-bottom: 5px; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;" class="form-control tip" id="applyBillCouponWindow_code" required="required" />'+
								'                                   </div>'+
								'                                </div>'+
								'                                '+
								'                             </div> '+
								'                              <button class="btn btn-default tableOptionsButton" onclick="closeApplyBillCouponWindow(\''+kotfile.KOTNumber+'\')">Cancel</button>                           '+
								'                          </div>'+
								'                          <div id="applyBillCouponButtonWrap"><button class="btn btn-default tableOptionsButton" id="applyBillCouponButton" onclick="openApplyBillCouponWindow(\''+kotfile.KOTNumber+'\')">Apply Coupon</button></div>'+
								'                        </div>';
          }


          var noCostButtonPart = '';
          if(kotfile.discount.amount && kotfile.discount.type == 'NOCOSTBILL'){ /*No Cost is Applied Already*/         	
          	noCostButtonPart ='                        	 <div class="">'+
								'                          <button class="btn btn-danger tableOptionsButton" onclick="removeNoCostBillOnKOT(\''+kotfile.KOTNumber+'\')">Remove No Cost Bill</button>'+
								'                        </div>';
          }   
          else{       	
          	noCostButtonPart ='                        <div class="" id="applyNoCostBillWindow">'+
								'                          <div id="applyNoCostBillWindowActions" style="display: none">'+
								'                             <div class="row">'+
								'                                <div class="col-lg-12">'+
								'                                   <div class="form-group" style="margin-bottom: 2px">'+
								'                                    <label style="font-size: 10px; font-weight: 300">COMMENTS</label>'+
								'                                      <input type="text" value="" placeholder="Comments" style="text-align: center; color: #444; margin-bottom: 5px; font-size: 14px;" class="form-control tip" id="applyNoCostBillWindow_comments" required="required" />'+
								'                                   </div>'+
								'                                </div>'+
								'                                '+
								'                             </div> '+
								'                              <button class="btn btn-default tableOptionsButton" onclick="closeApplyNoCostBillWindow(\''+kotfile.KOTNumber+'\')">Cancel</button>                           '+
								'                          </div>'+
								'                          <div id="applyNoCostBillButtonWrap"><button class="btn btn-default tableOptionsButton" id="applyNoCostBillButton" onclick="openMarkNoCostBill(\''+kotfile.KOTNumber+'\')">No Cost Bill</button></div>'+
								'                        </div>';
          }


          document.getElementById("billPreviewContent").innerHTML = '<div class="row">'+
								'                    <div class="col-sm-8">'+
								'                        <h1 style="text-align: center; margin-top: 10px; font-size: 14px; text-transform: uppercase; font-weight: 400; color: #444">Bill Preview</h1>'+
								'                        <table class="table table-striped table-condensed table-hover list-table" style="margin:0px; z-index: 2;">'+
								'                           <colgroup>'+
								'                              <col width="10%">'+
								'                              <col width="40%">'+
								'                              <col width="15%">'+
								'                              <col width="20%">'+
								'                              <col width="15%">'+
								'                           </colgroup>'+
								'                           <thead id="cartTitleHead">'+
								'                              <tr class="success cartTitleRow">'+
								'                                 <th class="satu cartTitleRow"></th>'+
								'                                 <th class="cartTitleRow">Item</th>'+
								'                                 <th class="cartTitleRow">Price</th>'+
								'                                 <th class="cartTitleRow">Qty</th>'+
								'                                 <th class="cartTitleRow">Subtotal</th>'+
								'                              </tr>'+
								'                           </thead>'+
								'                        </table>'+
								'                        <table class="table table-striped table-condensed table-hover list-table" style="margin:0px;">'+
								'                            <colgroup>'+
								'                              <col width="10%">'+
								'                              <col width="40%">'+
								'                              <col width="15%">'+
								'                              <col width="20%">'+
								'                              <col width="15%">'+
								'                            </colgroup>                            '+
								'                            <tbody>'+itemList+
								'                            </tbody>'+
								'                        </table>'+
								'                        <table class="table table-condensed totals" style="margin: 0">'+
								'                           <tbody>'+
								'                              <tr class="info">'+
								'                                 <td width="25%" class="cartSummaryRow">Total Items</td>'+
								'                                 <td class="text-right cartSummaryRow" style="padding-right:10px;"><span id="count">'+qtySum+'</span></td>'+
								'                                 <td width="25%" class="cartSummaryRow">Total</td>'+
								'                                 <td class="text-right cartSummaryRow" colspan="2"><span id="total"><i class="fa fa-inr"></i><tag id="grandSumDisplay">'+subTotal+'</tag></span></td>'+
								'                              </tr>'+otherCharges+
								'                              <tr class="success cartSumRow">'+
								'                                 <td colspan="2" class="cartSumRow" style="font-weight: 400 !important; font-size: 16px;">Total Payable</td>'+
								'                                 <td class="text-right cartSumRow" colspan="2"><span id="total-payable"><i class="fa fa-inr"></i><tag>'+grandPayableSum+'</tag></span></td>'+
								'                              </tr>'+
								'                           </tbody>'+
								'                        </table>                        '+
								'                    </div>'+
								'                    <div class="col-sm-4">'+
								'                        <h1 style="text-align: center; margin-top: 10px; font-size: 14px; text-transform: uppercase; font-weight: 400; color: #444">Options</h1>'+discountButtonPart+couponButtonPart+
								'                        <div class="">'+
								'                          <button class="btn btn-default tableOptionsButton" onclick="redeemPointsIfAny()">Redeem Points</button>'+
								'                        </div>'+noCostButtonPart+
								'                        <div class="">'+
								'                          <button class="btn btn-default tableOptionsButton" onclick="mergeDifferentBills(\''+kotfile.table+'\')">Merge Bills</button>'+
								'                        </div>'+
								'                    </div>'+
								'                </div>';

			document.getElementById("billPreviewContentActions").innerHTML = '<button class="btn btn-success tableOptionsButton" onclick="confirmBillGeneration()">Confirm</button>'+
                        		'<button style="margin: 0" class="btn btn-default tableOptionsButton" onclick="hideBillPreviewModal()">Close</button>'

          document.getElementById("billPreviewModal").style.display = 'block';
	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	hideOccuppiedSeatOptions();
}

/* APPLY COUPON */

function openApplyBillCouponWindow(kotID){

	/*Change apply button action*/
	document.getElementById("applyBillCouponButtonWrap").innerHTML = '<button class="btn btn-success tableOptionsButton" id="applyBillCouponButton" onclick="applyBillCouponOnKOT(\''+kotID+'\')">Apply Discount</button>';

	//minimize all other open windows
	//closeApplyBillDiscountWindow(kotID);
	//closeApplyNoCostBillWindow(kotID);

	document.getElementById("applyBillCouponWindow").classList.add('billOptionWindowFrame');
	document.getElementById("applyBillCouponWindowActions").style.display = 'block';
	document.getElementById("applyBillCouponButton").classList.remove('btn-default');
	document.getElementById("applyBillCouponButton").classList.add('btn-success');

}


function removeBillCouponOnKOT(kotID){

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

			if(kotfile.discount.amount){
				kotfile.discount = {};
			}
		       
		       var newjson = JSON.stringify(kotfile);
		       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Coupon removed', '#27ae60');
		           	generateBillFromKOT(kotID);

		        	}
		       }); 			

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	
}


function applyBillCouponOnKOT(kotID){

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {

          var kotfile = JSON.parse(data);
          
          var userMobile = kotfile.customerMobile;
          var code = document.getElementById("applyBillCouponWindow_code").value;
          var grandSum = 0;

          if(code == ''){
          	return '';
          }

          var n = 0;
          while(kotfile.cart[n]){
          	grandSum = grandSum + (kotfile.cart[n].price * kotfile.cart[n].qty);
          	n++;
          }

          /*Redeem Coupon*/

			var admin_data = {
				"token": window.localStorage.loggedInAdmin,
				"mobile": userMobile,
				"code": code,
				"totalBillAmount": grandSum
			}

			$.ajax({
				type: 'POST',
				url: 'https://www.zaitoon.online/services/posredeemcoupon.php',
				data: JSON.stringify(admin_data),
				contentType: "application/json",
				dataType: 'json',
				success: function(data) {
					if(data.status){

						/*Apply Discount*/
						if(data.isValid){
							totalDiscount = data.discount;

							totalDiscount = Math.round(totalDiscount * 100) / 100;

							kotfile.discount.amount = totalDiscount;
							kotfile.discount.type = 'COUPON';
							kotfile.discount.unit = 'FIXED';
							kotfile.discount.value = totalDiscount;
							kotfile.discount.reference = code;
						       
						       var newjson = JSON.stringify(kotfile);
						       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
						         if(err){
						            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
						           }
						           else{
						           	showToast('Redeemed Succesfully! Discount of <i class="fa fa-inr"></i>'+totalDiscount+' Applied', '#27ae60');
						           	generateBillFromKOT(kotID);

						           }
						       }); 			


						}
						else{
							showToast('Oops! '+data.validityError, '#e67e22');
						}
					}
					else
					{
						if(data.errorCode == 404){
							window.localStorage.loggedInAdmin = "";
							showToast(data.error, '#e74c3c');
						}
						else{
							showToast(data.error, '#e74c3c');
						}
					}


				}
			});	  


	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	
}


function closeApplyBillCouponWindow(kotID){
	
	/*Change apply button action*/
	document.getElementById("applyBillCouponButtonWrap").innerHTML = '<button class="btn btn-default tableOptionsButton" id="applyBillCouponButton" onclick="openApplyBillCouponWindow(\''+kotID+'\')">Apply Coupon</button>';

	document.getElementById("applyBillCouponWindow").classList.remove('billOptionWindowFrame');
	document.getElementById("applyBillCouponWindowActions").style.display = 'none';	

	document.getElementById("applyBillCouponButton").classList.remove('btn-success');
	document.getElementById("applyBillCouponButton").classList.add('btn-remove');
}





/*APPLY DISCOUNT*/

function openApplyBillDiscountWindow(kotID){

    if(fs.existsSync('./data/static/discounttypes.json')) {
        fs.readFile('./data/static/discounttypes.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to read Discount Types data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var modes = JSON.parse(data);
              modes.sort(); //alphabetical sorting 
              var modesTag = '';

	        for (var i=0; i<modes.length; i++){
	        	if(i == 0)
	          		modesTag = '<option value="'+modes[i].name+'" selected="selected">'+modes[i].name+'</option>';
	          	else
	          		modesTag = modesTag + '<option value="'+modes[i].name+'">'+modes[i].name+'</option>';
	        }

	        if(!modesTag)
	          document.getElementById("applyBillDiscountWindow_type").innerHTML = '<option value="OTHER" selected="selected">Other</option>';
	        else
	          document.getElementById("applyBillDiscountWindow_type").innerHTML = modesTag;

	      /*Change apply button action*/
	      document.getElementById("applyBillDiscountButtonWrap").innerHTML = '<button class="btn btn-success tableOptionsButton" id="applyBillDiscountButton" onclick="applyBillDiscountOnKOT(\''+kotID+'\')">Apply Discount</button>';
    }
    });
      } else {
        showToast('System Error: Unable to read Discount Types data. Please contact Accelerate Support.', '#e74c3c');
      } 


	//minimize all other open windows
	//closeApplyBillCouponWindow(kotID);
	//closeApplyNoCostBillWindow(kotID);


	document.getElementById("applyBillDiscountWindow").classList.add('billOptionWindowFrame');
	document.getElementById("applyBillDiscountWindowActions").style.display = 'block';
	document.getElementById("applyBillDiscountButton").classList.remove('btn-default');
	document.getElementById("applyBillDiscountButton").classList.add('btn-success');

}


function removeBillDiscountOnKOT(kotID){

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

			if(kotfile.discount.amount){
				kotfile.discount = {};
			}
		       
		       var newjson = JSON.stringify(kotfile);
		       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Discount removed', '#27ae60');
		           	generateBillFromKOT(kotID);

		        	}
		       }); 			

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	
}


function applyBillDiscountOnKOT(kotID){

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

          /*Calculate Discount*/
          var type = document.getElementById("applyBillDiscountWindow_type").value;
          var unit = document.getElementById("applyBillDiscountWindow_unit").value;
          var value = document.getElementById("applyBillDiscountWindow_value").value;

          var grandSum = 0;

          var n = 0;
          while(kotfile.cart[n]){
          	grandSum = grandSum + (kotfile.cart[n].price * kotfile.cart[n].qty);
          	n++;
          }

          	var totalDiscount = 0;
			if(unit == 'PERCENTAGE'){
				totalDiscount = grandSum*value/100;
			}
			else if(unit == 'FIXED'){
				totalDiscount = value;
			}

			totalDiscount = Math.round(totalDiscount * 100) / 100;


			kotfile.discount.amount = totalDiscount;
			kotfile.discount.type = type;
			kotfile.discount.unit = unit;
			kotfile.discount.value = value;
			kotfile.discount.reference = '';
		       
		       var newjson = JSON.stringify(kotfile);
		       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Discount of <i class="fa fa-inr"></i>'+totalDiscount+' Applied', '#27ae60');
		        	generateBillFromKOT(kotID);
		        	}
		       }); 			

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

	
}



function changeDiscountTypeBillingOptions(){
	roughCalculateDiscount();
}

function roughCalculateDiscount(){

	var tempTotal = parseFloat(document.getElementById("grandSumDisplay").innerHTML);
	var discValue = parseFloat(document.getElementById("applyBillDiscountWindow_value").value);

	if(document.getElementById("applyBillDiscountWindow_value").value == ''){
		discValue = 0;
	}

	/*Calculations*/
	var roughDiscFigure = 0;
	if(document.getElementById("applyBillDiscountWindow_unit").value == 'PERCENTAGE'){
		roughDiscFigure = tempTotal*discValue/100;
	}
	else{
		roughDiscFigure = discValue;
	}

	roughDiscFigure = Math.round(roughDiscFigure * 100) / 100;

	document.getElementById("applyBillDiscountWindow_amount").innerHTML = roughDiscFigure;
}

function closeApplyBillDiscountWindow(kotID){
	
	/*Change apply button action*/
	document.getElementById("applyBillDiscountButtonWrap").innerHTML = '<button class="btn btn-default tableOptionsButton" id="applyBillDiscountButton" onclick="openApplyBillDiscountWindow(\''+kotID+'\')">Apply Discount</button>';

	document.getElementById("applyBillDiscountWindow").classList.remove('billOptionWindowFrame');
	document.getElementById("applyBillDiscountWindowActions").style.display = 'none';	

	document.getElementById("applyBillDiscountButton").classList.remove('btn-success');
	document.getElementById("applyBillDiscountButton").classList.add('btn-remove');
}


/* NO COST BILL */

function openMarkNoCostBill(kotID){
	/*Change apply button action*/
	document.getElementById("applyNoCostBillButtonWrap").innerHTML = '<button class="btn btn-success tableOptionsButton" id="applyNoCostBillButton" onclick="markNoCostBill(\''+kotID+'\')">Confirm</button>';

	//minimize all other open windows
	//closeApplyBillCouponWindow(kotID);
	//closeApplyBillDiscountWindow(kotID);

	document.getElementById("applyNoCostBillWindow").classList.add('billOptionWindowFrame');
	document.getElementById("applyNoCostBillWindowActions").style.display = 'block';
	document.getElementById("applyNoCostBillButton").classList.remove('btn-default');
	document.getElementById("applyNoCostBillButton").classList.add('btn-success');

}

function closeApplyNoCostBillWindow(kotID){
	/*Change apply button action*/
	document.getElementById("applyNoCostBillButtonWrap").innerHTML = '<button class="btn btn-default tableOptionsButton" id="applyNoCostBillButton" onclick="openMarkNoCostBill(\''+kotID+'\')">No Cost Bill</button>';

	document.getElementById("applyNoCostBillWindow").classList.remove('billOptionWindowFrame');
	document.getElementById("applyNoCostBillWindowActions").style.display = 'none';	

	document.getElementById("applyNoCostBillButton").classList.remove('btn-success');
	document.getElementById("applyNoCostBillButton").classList.add('btn-remove');

}


function markNoCostBill(kotID){ //APPLY FULL DISCOUNT

	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

          /*Calculate Discount*/
          var comments = document.getElementById("applyNoCostBillWindow_comments").value;

          if(comments == ''){
          	showToast('Warning: Add some comments why you are marking this order as No Cost Bill', '#e67e22');
          	return '';
          }

          var grandSum = 0;

          var n = 0;
          while(kotfile.cart[n]){
          	grandSum = grandSum + (kotfile.cart[n].price * kotfile.cart[n].qty);
          	n++;
          }

          	var totalDiscount = grandSum;

			kotfile.discount.amount = totalDiscount;
			kotfile.discount.type = 'NOCOSTBILL';
			kotfile.discount.unit = 'FIXED';
			kotfile.discount.value = totalDiscount;
			kotfile.discount.reference = comments;
		       
		       var newjson = JSON.stringify(kotfile);
		       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Marked as No Cost Bill with a discount of <i class="fa fa-inr"></i>'+totalDiscount, '#27ae60');
		        	generateBillFromKOT(kotID);
		        	}
		       }); 			

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	
}

function removeNoCostBillOnKOT(kotID){
	/*Read mentioned KOT - kotID*/
   if(fs.existsSync('./data/KOT/'+kotID+'.json')) {
      fs.readFile('./data/KOT/'+kotID+'.json', 'utf8', function readFileCallback(err, data){
    if (err){
        showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
    } else {
          var kotfile = JSON.parse(data);

			if(kotfile.discount.amount){
				kotfile.discount = {};
			}
		       
		       var newjson = JSON.stringify(kotfile);
		       fs.writeFile('./data/KOT/'+kotID+'.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to make changes. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Removed No Cost Bill', '#27ae60');
		           	generateBillFromKOT(kotID);

		        	}
		       }); 			

	}});
   } else {
      showToast('Error: Order was not found. Please contact Accelerate Support.', '#e74c3c');
   }  	

}


function hideBillPreviewModal(){
	document.getElementById("billPreviewModal").style.display = 'none';
}

function mergeDifferentBills(currentID){
	hideBillPreviewModal();
	hideOccuppiedSeatOptions();

	preloadTableStatus('MERGE_BILLS', currentID);	
}

function settlePrintedBill(kotID){
	//ask for payment mode, reference etc.
	//should release the table finally
}

function punchNewOrder(tableID){

}

function addToReserveListConsent(tableID){
	document.getElementById("addToReservedConsentModal").style.display = 'block';
	document.getElementById("addToReserveListConsentButton").innerHTML = '<button type="button" onclick="addToReserveList(\''+tableID+'\')" class="btn btn-success">Proceed and Reserve</button>';
	document.getElementById("addToReserveListConsentTitle").innerHTML = "Reserve Table #"+tableID;
	document.getElementById("reserve_table_in_the_name_of").value = '';
}

function addToReserveListConsentClose(){
	document.getElementById("addToReservedConsentModal").style.display = 'none';
}


function addToReserveList(tableID){

		addToReserveListConsentClose();
		var comments = document.getElementById("reserve_table_in_the_name_of").value;


		if(fs.existsSync('./data/static/tablemapping.json')) {
	      fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var tableMapping = JSON.parse(data); 

	          var isUpdated = false;

	          for(var i=0; i<tableMapping.length; i++){
	          	if(tableMapping[i].table == tableID){

	          		if(tableMapping[i].status != 0){
	          			return '';
	          		}

	          		tableMapping[i].assigned = comments;
	          		tableMapping[i].KOT = "";
	          		tableMapping[i].status = 5;
	          		tableMapping[i].lastUpdate = "";

	          		isUpdated = true;

	          		break;
	          	}
	          }

	          if(!isUpdated){
	          	tableMapping.push({ "table": tableID, "assigned": comments, "KOT": "", "status": 5, "lastUpdate": "12:00 pm" });
		      }

		       var newjson = JSON.stringify(tableMapping);
		       fs.writeFile('./data/static/tablemapping.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Table '+tableID+' has been marked as Reserved', '#27ae60');
		           	hideFreeSeatOptions();
		           	preloadTableStatus();

		        	}
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to Reserve. Please contact Accelerate Support.', '#e74c3c');
	    }
}

function removeFromReserveList(tableID){
		if(fs.existsSync('./data/static/tablemapping.json')) {
	      fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
	    if (err){
	        showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
	    } else {
	    	if(data == ''){ data = '[]'; }
	          var tableMapping = JSON.parse(data); 

	          for(var i=0; i<tableMapping.length; i++){
	          	if(tableMapping[i].table == tableID){

	          		if(tableMapping[i].status != 5){
	          			return '';
	          		}

	          		tableMapping.splice(i,1);

	          		break;
	          	}
	          }

		       var newjson = JSON.stringify(tableMapping);
		       fs.writeFile('./data/static/tablemapping.json', newjson, 'utf8', (err) => {
		         if(err){
		            showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
		           }
		           else{
		           	showToast('Table '+tableID+' has been marked as Free', '#27ae60');
		           	hideReservedSeatOptions();
		           	preloadTableStatus();
		        	}
		       }); 

		}
		});
	    } else {
	      showToast('System Error: Unable to free the Table. Please contact Accelerate Support.', '#e74c3c');
	    }
}


function getTableStatus(tableID){
	/*returns table occupancy data*/
	if(!window.localStorage.tableMappingData){
		return '';
	}

	var tableMapData = JSON.parse(window.localStorage.tableMappingData);

	var n = 0;
	while(tableMapData[n]){
		if(tableMapData[n].table == tableID){
			return tableMapData[n];
		}
		n++;
	}

	return '';
}



function getTimeLapsed(time){
	var tempTime = moment(time, 'hhmm').fromNow(true);
	tempTime = tempTime.replace("a few seconds", "seconds");
	tempTime = tempTime.replace("seconds", "s");
	tempTime = tempTime.replace("a minute", "1m");
	tempTime = tempTime.replace(" minutes", "m");
	tempTime = tempTime.replace("an hour", "1h");
	tempTime = tempTime.replace(" hours", "h");
	return tempTime;
}

function addToHoldList(id){
	var tempList = window.localStorage.billSelectionMergeHoldList ? JSON.parse(window.localStorage.billSelectionMergeHoldList): [];
	
	/*check if already clicked*/
	var alreadyAdded = false;
	var n = 0;
	while(tempList[n]){
		if(tempList[n] == id){
			tempList.splice(n,1);
			alreadyAdded = true;

			document.getElementById("hold_"+id).innerHTML = 'Order Punched';
			document.getElementById("holdMain_"+id).classList.remove('selectedExtra');	
					
			break;
		}
		n++;
	}

	if(!alreadyAdded){
		tempList.push(id);

		document.getElementById("hold_"+id).innerHTML = '<i class="fa fa-check"></i>';
		document.getElementById("holdMain_"+id).classList.add('selectedExtra');
	}

	if(tempList.length == 1){
		document.getElementById("confirmationRenderArea").innerHTML = '<p style="color: #FFF; margin: 30px; font-size: 21px; text-align: left;">Select Orders to Merge its Bills <button style="font-size: 18px" onclick="cancelBillMerge()" class="btn btn-default">Cancel</button></p>';	
	}
	else{
		document.getElementById("confirmationRenderArea").innerHTML = '<p style="color: #FFF; margin: 0; padding: 10px 120px 10px 30px !important; font-size: 21px; text-align: left;">The orders placed on Tables '+tempList.toString()+' will be merged as a single Bill on Table '+tempList[0]+'. This can not be revered.<br>Are you sure want to Merge Orders? <button class="btn btn-success" onclick="mergeBillsInTheHoldList()" style="font-size: 18px">Merge and Bill</button> <button onclick="cancelBillMerge()" style="font-size: 18px" class="btn btn-default">Cancel</button></p>';
	}

	
	window.localStorage.billSelectionMergeHoldList = JSON.stringify(tempList);

}

function cancelBillMerge(){
	window.localStorage.billSelectionMergeHoldList = '';
	preloadTableStatus();


	document.getElementById("confirmationRenderArea").style.display = 'none';
	document.getElementById("confirmationRenderArea").innerHTML = '';

}


function mergeBillsInTheHoldListAfterProcess(kotList, tableList) {

    var mergedCart = [];
    var mergedExtras = [];
    var kotCount = kotList.length;
    var kotCounter = 0;

    var n = 0;
    while (n < kotCount) {

        /*Read mentioned KOT hold list*/
        if (fs.existsSync('./data/KOT/' + kotList[n] + '.json')) {
            fs.readFile('./data/KOT/' + kotList[n] + '.json', 'utf8', function readFileCallback(err, data) {
                if (err) {
                    showToast('Operation Aborted! Order ' + kotList[n] + ' was not found. Please contact Accelerate Support.', '#e74c3c');
                    return '';
                } else {
                	if(!data){ data = []}

                	kotCounter++;

                    var kotfile = JSON.parse(data);

                    /*Generate MERGED EXTRAS*/
                    var extraDuplicateFlag = false;
                    for (var g = 0; g < kotfile.extras.length; g++) {

                        var t = 0;
                        extraDuplicateFlag = false;

                        while (mergedExtras[t]) {
                                if (mergedExtras[t].name == kotfile.extras[g].name) {
                                    mergedExtras[t].amount += kotfile.extras[g].amount;
                                    extraDuplicateFlag = true;
                                    break;
                                }
                                t++
                        }

                        if (!extraDuplicateFlag) { //No duplicate, push the extra wholely.
                            mergedExtras.push(kotfile.extras[g]);
                        }        
                    }

                    /*Generate MERGED CART*/
                    var itemDuplicateFlag = false;

                    for (var f = 0; f < kotfile.cart.length; f++) {

                        var m = 0;
                        itemDuplicateFlag = false;

                        if (kotfile.cart[f].isCustom) {
                            while (mergedCart[m]) {
                                if (mergedCart[m].code == kotfile.cart[f].code && mergedCart[m].variant == kotfile.cart[f].variant) {
                                    mergedCart[m].qty += kotfile.cart[f].qty;
                                    itemDuplicateFlag = true;
                                    break;
                                }
                                m++
                            }
                        } else {
                            while (mergedCart[m]) {
                                if (mergedCart[m].code == kotfile.cart[f].code) {
                                    mergedCart[m].qty += kotfile.cart[f].qty;
                                    itemDuplicateFlag = true;
                                    break;
                                }
                                m++
                            }
                        }

                        if (!itemDuplicateFlag) { //No duplicate, push the item wholely.
                            mergedCart.push(kotfile.cart[f]);
                        }   


                        //End of iteration
                        if(kotCount == kotCounter){
                        	confirmBillMergeFromKOT(kotList, mergedCart, mergedExtras, tableList)
                        }           
                    }
                }
            });
        } else {
            showToast('Operation Aborted! Order ' + kotList[n] + ' was not found. Please contact Accelerate Support.', '#e74c3c');
        }


     n++;    
    }

}


function mergeBillsInTheHoldList(){
	var holdList = window.localStorage.billSelectionMergeHoldList ? JSON.parse(window.localStorage.billSelectionMergeHoldList): [];

	var KOTList = [];

			/*to find KOT IDs mapped against these tables*/
		    if(fs.existsSync('./data/static/tablemapping.json')) {
		        fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
		      if (err){
		          showToast('System Error: Unable to read Table Mapping data. Please contact Accelerate Support.', '#e74c3c');
		      } else {

		          if(data == ''){ data = '[]'; }

		              var tableMapping = JSON.parse(data);
		              tableMapping.sort(); //alphabetical sorting 

		              for (var i =0; i < holdList.length; i++){
			              var m = 0;
			              while(tableMapping[m]){
			              	if(holdList[i] == tableMapping[m].table){
			              		KOTList.push(tableMapping[m].KOT);
			              		break;
			              	}
			              	m++;
			              }		              	
		              }

		              mergeBillsInTheHoldListAfterProcess(KOTList, holdList); /* Merge KOTs*/


		    }
		    });
		      } else {
		        showToast('System Error: Unable to read Table Mapping. Please contact Accelerate Support.', '#e74c3c');
		      } 	
}

function preloadTableStatus(mode, currentTableID){
		    if(fs.existsSync('./data/static/tablemapping.json')) {
		        fs.readFile('./data/static/tablemapping.json', 'utf8', function readFileCallback(err, data){
		      if (err){
		          showToast('System Error: Unable to read Table Mapping data. Please contact Accelerate Support.', '#e74c3c');
		      } else {

		          if(data == ''){ data = '[]'; }

		              var tableMapping = JSON.parse(data);
		              tableMapping.sort(); //alphabetical sorting 

		              window.localStorage.tableMappingData = JSON.stringify(tableMapping);

		              renderCurrentPlan(mode, currentTableID);
		    }
		    });
		      } else {
		        showToast('System Error: Unable to read Table Mapping. Please contact Accelerate Support.', '#e74c3c');
		      } 	
}

function renderCurrentPlan(mode, currentTableID){

    if(fs.existsSync('./data/static/tables.json')) {
        fs.readFile('./data/static/tables.json', 'utf8', function readFileCallback(err, data){
      if (err){
          showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
      } else {

          if(data == ''){ data = '[]'; }

              var tables = JSON.parse(data);
              tables.sort(); //alphabetical sorting 


		    if(fs.existsSync('./data/static/tablesections.json')) {
		        fs.readFile('./data/static/tablesections.json', 'utf8', function readFileCallback(err, data){
		      if (err){
		          showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
		      } else {

		          if(data == ''){ data = '[]'; }

		              var tableSections = JSON.parse(data);
		              tableSections.sort(); //alphabetical sorting 


		            if(mode == 'MERGE_BILLS'){

		            	if(currentTableID){
		            		window.localStorage.billSelectionMergeHoldList = JSON.stringify([currentTableID]);
		            	}
		            	else{
		            		window.localStorage.billSelectionMergeHoldList = JSON.stringify([]);
		            	}

		              var renderSectionArea = '';
		              
		              var totalTablesToMerge = 0;

		              var n = 0;
		              while(tableSections[n]){
		        
		              	var renderTableArea = ''
		              	for(var i = 0; i<tables.length; i++){
		              		if(tables[i].type == tableSections[n]){

		              			var tableOccupancyData = getTableStatus(tables[i].name);

		              			if(tableOccupancyData){ /*Occuppied*/
									if(tableOccupancyData.status == 1){

										if(tables[i].name == currentTableID){

											totalTablesToMerge++;

											renderTableArea = renderTableArea + '<tag class="tableTileRed selected">'+
																	            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
																	            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
																	            '<tag class="tableInfo" style="color: #fff"><i class="fa fa-check"></i></tag>'+
																	        	'</tag>';	
										}
										else{

											totalTablesToMerge++;

				              				renderTableArea = renderTableArea + '<tag id="holdMain_'+tables[i].name+'" onclick="addToHoldList(\''+tables[i].name+'\')" class="tableTileRed">'+
																	            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
																	            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
																	            '<tag class="tableInfo" id="hold_'+tables[i].name+'" style="color: #fff">Punched '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
																	        	'</tag>';												
										}

									}	
									else if(tableOccupancyData.status == 2){
		              				renderTableArea = renderTableArea + '<tag class="tableTileOther">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
															            '<tag class="tableInfo">Billed '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';	
									}	
									else if(tableOccupancyData.status == 5){
		              				renderTableArea = renderTableArea + '<tag class="tableTileOther">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ""? "For "+tableOccupancyData.assigned : "-")+'</tag>'+
															            '<tag class="tableInfo">Reserved</tag>'+
															        	'</tag>';	
									}																									
									else{
		              				renderTableArea = renderTableArea + '<tag class="tableTileOther">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
															            '<tag class="tableInfo">Updated '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';											
									}


		              			}
		              			else{

		              				renderTableArea = renderTableArea + '<tag class="tableTileOther">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tables[i].capacity+' Seater</tag>'+
															            '<tag class="tableInfo">Free</tag>'+
															        	'</tag>';		              				
		              			}

		              		}
		              	}

		              	renderSectionArea = renderSectionArea + '<div class="row" style="margin-top: 25px">'+
												   '<h1 class="seatingPlanHead">'+tableSections[n]+'</h1>'+
												   '<div class="col-lg-12" style="text-align: center;">'+renderTableArea+
												    '</div>'+
												'</div>'

		              	n++;
		              }

		              if(totalTablesToMerge < 2){
		              	showToast('Warning: Atleast two live orders need to perform Merge Operation', '#e67e22');
		              	cancelBillMerge();
		              	return '';
		              }

		              document.getElementById("fullSeatingRenderArea").innerHTML = renderSectionArea;

		              document.getElementById("confirmationRenderArea").style.display = 'block';
		              document.getElementById("confirmationRenderArea").style.background = '#3498db';
		              document.getElementById("confirmationRenderArea").innerHTML = '<p style="color: #FFF; margin: 30px; font-size: 21px; text-align: left;">Select Orders to Merge Bills <button style="font-size: 18px" class="btn btn-default" onclick="cancelBillMerge()">Cancel</button></p>';

		            }
		            else{
		              var renderSectionArea = '';

		              var n = 0;
		              while(tableSections[n]){
		        
		              	var renderTableArea = ''
		              	for(var i = 0; i<tables.length; i++){
		              		if(tables[i].type == tableSections[n]){

		              			var tableOccupancyData = getTableStatus(tables[i].name);

		              			if(tableOccupancyData){ /*Occuppied*/
									if(tableOccupancyData.status == 1){
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileRed">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
															            '<tag class="tableInfo">Punched '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';	
									}
									else if(tableOccupancyData.status == 2){
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileYellow">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
															            '<tag class="tableInfo">Billed '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';	
									}
									else if(tableOccupancyData.status == 5){
		              				renderTableArea = renderTableArea + '<tag onclick="openReservedSeatOptions(\''+tables[i].name+'\')" class="tableReserved">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ""? "For "+tableOccupancyData.assigned : "-")+'</tag>'+
															            '<tag class="tableInfo">Reserved</tag>'+
															        	'</tag>';	
									}									
									else{
		              				renderTableArea = renderTableArea + '<tag onclick="openOccuppiedSeatOptions(\''+encodeURI(JSON.stringify(tableOccupancyData))+'\')" class="tableTileRed">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+(tableOccupancyData.assigned != ''? tableOccupancyData.assigned: '-')+'</tag>'+
															            '<tag class="tableInfo">Updated '+getTimeLapsed(tableOccupancyData.lastUpdate)+' ago</tag>'+
															        	'</tag>';											
									}


		              			}
		              			else{

		              				renderTableArea = renderTableArea + '<tag onclick="openFreeSeatOptions(\''+tables[i].name+'\')" class="tableTileGreen">'+
															            '<tag class="tableTitle">'+tables[i].name+'</tag>'+
															            '<tag class="tableCapacity">'+tables[i].capacity+' Seater</tag>'+
															            '<tag class="tableInfo">Free</tag>'+
															        	'</tag>';		              				
		              			}

		              		}
		              	}

		              	renderSectionArea = renderSectionArea + '<div class="row" style="margin-top: 25px">'+
												   '<h1 class="seatingPlanHead">'+tableSections[n]+'</h1>'+
												   '<div class="col-lg-12" style="text-align: center;">'+renderTableArea+
												    '</div>'+
												'</div>'

		              	n++;
		              }
		              document.getElementById("fullSeatingRenderArea").innerHTML = renderSectionArea;		            	
		            }
		    }
		    });
		      } else {
		        showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
		      } 

    }
    });
      } else {
        showToast('System Error: Unable to read Tables data. Please contact Accelerate Support.', '#e74c3c');
      } 

}