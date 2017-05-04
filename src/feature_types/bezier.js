var Feature = require('./feature');
var LineString = require('./line_string');
var BezierJs = require('bezier');

var Bezier = function(ctx, geojson) {
	if(ctx && geojson) {
		Feature.call(this, ctx, geojson);
	}  
};

Bezier.prototype = new LineString();

//points_x为x坐标数组，points_y为y坐标数组，数组长度表示曲线的维度
Bezier.prototype.getBezierVertex = function(ctx,points_x,points_y) {
	var bezierVertex = [];
	for (var t = 0; t < 1; t += 0.01) {
		var x = BezierJs(points_x,t);
		var y = BezierJs(points_y,t);
		var lnglat = ctx.map.unproject([x,y]);
	  	bezierVertex.push([lnglat.lng,lnglat.lat]);
	}
	return bezierVertex;
};

module.exports = Bezier;