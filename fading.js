var timers=new Array();
var ids=new Array();
function getTimer(element) {
	var i=0;
	for (i=0;i < ids.length;i=i+1) {
		if (ids[i] == element) return i;
	}
	ids[i]=element;
	return i;
}
function fadeStop(element) {
	clearTimeout(timers[getTimer(element)]);
}
function setOpacity(element,opacity) {
	if ((opacity <=1) && (opacity >=0)) {
		//document.getElementById(element).style.opacity = opacity;
		//document.getElementById(element).style.filter="alpha("+opacity*100+")";
		var object = document.getElementById(element).style;
		object.opacity = (opacity);
		object.MozOpacity = (opacity);
		object.KhtmlOpacity = (opacity);
		object.filter = "alpha(opacity=" + (opacity*100) + ")";
	}
	else fadeStop(element);
}
function stepTo(element,opacity,by) {
	timers[getTimer(element)]=setTimeout("stepTo('"+element+"',"+opacity+","+by+")",33);
	var x
	if (document.getElementById(element).style.opacity < opacity) {
		x=parseFloat(document.getElementById(element).style.opacity) + parseFloat(by);
		if (x >= opacity) {
			x=opacity;
			fadeStop(element);
		}
	}
	else if (document.getElementById(element).style.opacity > opacity) {
		x=parseFloat(document.getElementById(element).style.opacity) - parseFloat(by);
		if (x <= opacity) {
			x=opacity;
			fadeStop(element);
		}
	}
	else fadeStop(element);
	setOpacity(element,x);
}
function stepOut(element,by) {
	timers[getTimer(element)]=setTimeout("stepOut('"+element+"',"+by+")",33);
	var x
	if (document.getElementById(element).style.opacity > 0) {
		x=parseFloat(document.getElementById(element).style.opacity) - parseFloat(by);
		if (x <= 0) {
			x=0;
			fadeStop(element);
			document.getElementById(element).style.display="none";
		}
	}
	else {
		fadeStop(element);
		document.getElementById(element).style.display="none";
	}
	setOpacity(element,x);
}
function fadeTo(element,opacity,rate) {
	clearTimeout(timers[getTimer(element)]);
	timers[getTimer(element)]=setTimeout("stepTo('"+element+"',"+opacity+","+parseFloat(rate)+")",33);
}
function fadeIn(element,rate) {
	clearTimeout(timers[getTimer(element)]);
	timers[getTimer(element)]=setTimeout("stepTo('"+element+"',1,"+parseFloat(rate)+")",33);
}
function fadeOut(element,rate) {
	clearTimeout(timers[getTimer(element)]);
	timers[getTimer(element)]=setTimeout("stepTo('"+element+"',0,"+parseFloat(rate)+")",33);
}
function appear(element,rate) {
	document.getElementById(element).style.display="";
	clearTimeout(timers[getTimer(element)]);
	timers[getTimer(element)]=setTimeout("stepTo('"+element+"',1,"+parseFloat(rate)+")",33);
}
function disappear(element,rate) {
	clearTimeout(timers[getTimer(element)]);
	timers[getTimer(element)]=setTimeout("stepOut('"+element+"',"+parseFloat(rate)+")",33);
}