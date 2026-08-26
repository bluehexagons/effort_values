var timers={};

function fadeStop(element) {
	if (timers[element]) {
		clearTimeout(timers[element]);
		delete timers[element];
	}
}

function setOpacity(element,opacity) {
	var object=document.getElementById(element);
	if (!object || opacity < 0 || opacity > 1) return;
	object.style.opacity=opacity;
}

function animateOpacity(element,target,rate,hideWhenDone) {
	var object=document.getElementById(element);
	if (!object) return;
	fadeStop(element);
	var current=parseFloat(getComputedStyle(object).opacity);
	if (!isFinite(current)) current=target == 0 ? 1 : 0;
	var amount=Math.max(0.01,Math.abs(parseFloat(rate) || 0.1));

	function step() {
		var difference=target-current;
		if (Math.abs(difference) <= amount) {
			setOpacity(element,target);
			if (hideWhenDone) object.style.display="none";
			fadeStop(element);
			return;
		}
		current+=difference > 0 ? amount : -amount;
		setOpacity(element,current);
		timers[element]=setTimeout(step,33);
	}
	step();
}

function fadeTo(element,opacity,rate) {
	animateOpacity(element,opacity,rate,false);
}
function fadeIn(element,rate) {
	animateOpacity(element,1,rate,false);
}
function fadeOut(element,rate) {
	animateOpacity(element,0,rate,true);
}
function appear(element,rate) {
	var object=document.getElementById(element);
	if (!object) return;
	object.style.display="";
	animateOpacity(element,1,rate,false);
}
function disappear(element,rate) {
	animateOpacity(element,0,rate,true);
}
