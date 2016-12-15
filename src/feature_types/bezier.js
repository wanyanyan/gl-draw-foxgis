var Feature = require('./feature');
var LineString = require('./line_string');
var BezierJs = require('bezier');

var Bezier = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Bezier.prototype = new LineString();

//根据p1,p2,p3三个点确定圆弧坐标
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