var Feature = require('./feature');
var LineString = require('./line_string');
var BezierJs = require('bezier');
var BezierSpline = require('bezier-spline');

var Bezier = function(ctx, geojson) {
	if(ctx && geojson) {
		Feature.call(this, ctx, geojson);
	}
};

Bezier.prototype = new LineString();

//points为坐标数组，长度应为3
Bezier.prototype.getBezierVertex = function(ctx,points) {
	if(points.length !== 3) {
		throw new Error('points数组长度应为3');
		return;
	}
	var controlPoints = BezierSpline.getControlPoints(points);
	var combined = BezierSpline.combinePoints(points, controlPoints);//长度应为7
	var points_x = [], points_y = [];
	for(var i = 0;i < 4;i++) {
		points_x.push(combined[i][0]);
		points_y.push(combined[i][1]);
	}
	var section1 = [];
	for (var t = 0; t < 1; t += 0.02) {
		var x = BezierJs(points_x,t);
		var y = BezierJs(points_y,t);
		var lnglat = ctx.map.unproject([x,y]);
	  section1.push([lnglat.lng,lnglat.lat]);
	}

	var points_x = [], points_y = [];
	for(var i = 3;i < 7;i++) {
		points_x.push(combined[i][0]);
		points_y.push(combined[i][1]);
	}
	var section2 = [];
	for (var t = 0; t < 1; t += 0.02) {
		var x = BezierJs(points_x,t);
		var y = BezierJs(points_y,t);
		var lnglat = ctx.map.unproject([x,y]);
	  section2.push([lnglat.lng,lnglat.lat]);
	}
	return {section1:section1, section2:section2};
};

module.exports = Bezier;