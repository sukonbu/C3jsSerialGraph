var select = null; //セレクトボックスの選択肢を格納するもの
var connectionId = 0;
var selctedPort = null;
var reading = false;
var data = "";
var id = 0;
var CORRECTION = 0.5;

var dataBuf  =[];
var stringBuf = [];
var arrayReceived = [];

var graphArray = [];

var column = [];

var timeArray =[];
var nowDay;

var chart = c3.generate({
    bindto: '#chart',
    data: {
    	x: 'x',
    	columns:[
    	    
    	    ['x',[]],
    	    ['serial',[]]
        ],
        type: 'line'
    },
    axis:{
    	x:{
    		type:'timeseries',
    		tick: {
    			format: function(x){return x.getHours()+':'+x.getMinutes()+':'+x.getSeconds()+' '+x.getMilliseconds();},
    			outer: false
    		},
    		//height: 20
    	},
    	y:{
    		max: 95,
    		min: 5
    	},

    }

});



d3.select('#reload').on('click', function () {
    // 更新用のデータ生成
    var columns = [['serial']], i;
    columns.forEach(function (c) {
        for (i = 0; i < 10; i++) {
            c.push(Math.random() * 100);
        }
    });
    // 更新
    chart.load({
        columns: columns
    });
});

d3.select('#add').on('click', function () {
  // 追加データの生成
  var columns = [['serial']], i;
  columns.forEach(function (c) {
    for (i = 0; i < 3; i++) {
      c.push(Math.random() * 100);
    }
  });
  // データを追加し、同じ長さ分左へ流す
  chart.flow({
    columns: columns
  });
});

function convertArrayBufferToString(buf){
	var bufView = new Uint8Array(buf);
	var encodedString = String.fromCharCode.apply(null,bufView);
	return decodeURIComponent(escape(encodedString));
}

function init(){
	select = document.getElementById('ports');

	document.getElementById('open').addEventListener('click',openPort);
	document.getElementById('close').addEventListener('click',closePort);

	chrome.serial.getDevices(function(devices){
		devices.forEach(function(port){	

		//select menuに追加
			var option = document.createElement('option');
			option.value = port.path;
			option.text = port.displayName ? port.displayName : port.path;
			select.appendChild(option);
		});
	});
	
}

var onConnectCallback = function(connectionInfo){
	connectionId = connectionInfo.connectionId;
}

function openPort(){
	selectedPort = select.childNodes[select.selectedIndex].value;
	var baudRate = parseInt(document.getElementById('baud').value);
	var options = {
		"bitrate":baudRate,
		"receiveTimeout":1000
	};

	chrome.serial.connect(selectedPort,options,onConnectCallback);

}

var onDisconnectionCallback = function(result){
	if(result){
		console.log('disconeccted');
	}else{
		console.log('error');
	}
}


function closePort(){

	var disconnect = chrome.serial.disconnect(connectionId,onDisconnectionCallback);
	console.log(stringBuf);
}


function getTimeHMS(){
	//めんどいのでコピペ（ありがたや）
	//http://yut.hatenablog.com/entry/20111015/1318633937
	var d = new Date();
	//var year  = d.getFullYear();
	//var month = d.getMonth() + 1;
	//var day   = d.getDate();
	var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
	var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
	var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
	var msec  = ( d.getMilliseconds() < 10 ) ? '0' + d.getMilliseconds() : d.getMilliseconds();
	//print( year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec );
    var timeString = hour +':' + min + ':' + sec + ':' + msec;

	return timeString;
}


var onReceiveCallback = function(info){
	if(info.connectionId == connectionId && info.data){
		var str = convertArrayBufferToString(info.data);

		console.log(str);
		//シリアル通信はちゃんと数字列でデータが飛んで来るとは限らない（空白とか、数字のみとかの可能性がある）
		for(var i = 0; i < str.length;i++){
			if(str[i] == ','){
				var str2 = dataBuf.join('');

				//--グラフに値を追加する部分---
				//var time = getTimeHMS();
                var time = new Date();

				var value = parseInt(str2);

                //timeArray.push(getTimeHMS());
                timeArray.push(time);
                //console.log(time;
	            
	            graphArray.push(value);
	            //console.log(graphArray);

	            //もとのやりかた
	            //var columns = [['serial']], j;

	            //必要な構造→  [['x',,,,,,],['serial',値0,値1,値2,値3,,,]]
	            var timeSerial = ['x'];
	            var columnSerial = ['serial'];
	            
	            var columns = [];
	            //ここではcolumnsの中身に、先頭に'serial'を置いた配列columnをpushする


				if(graphArray.length >= 100){
				    chart.flow({
					    columns: [
					        ['x',time],
					        ['serial',value]
					        
					    ]
				    });

			    }else{
			    	//もとのやりかた
			    	//columns.forEach(function (c) {
	            	//   for (j = 0; j < graphArray.length-[j]);
	            	//   }
	                //});

	                graphArray.forEach(function(c){
	                	columnSerial.push(c);
	                });

	                timeArray.forEach(function(c){
	                	timeSerial.push(c);
	                });
	                //console.log(timeArray);

	                columns.push(timeSerial);
	                columns.push(columnSerial);
	                //console.log(columns);

			    	chart.load({
					    columns: columns   
				    });
			    }
				//----------------------


				dataBuf = [];
			}else{
				dataBuf.push(str[i]);
			}
		}
	}
};
chrome.serial.onReceive.addListener(onReceiveCallback);



var onReceiveErrorCallback = function(info){
	console.log('onReceiveErrorCallback');
}
chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);


window.onload = init;