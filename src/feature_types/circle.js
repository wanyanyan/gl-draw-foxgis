var Feature = require('./feature');
var Polygon = require('./polygon');

var Circle = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function(ring){return ring.slice(0, -1)});
};

Circle.prototype = new Polygon();

//点选圆心c，根据鼠标移动后的位置p计算圆的坐标
Circle.prototype.getCircleVertex = function(ctx,c,p) {
	var radius = Math.sqrt((c.x-p.x)*(c.x-p.x)+(c.y-p.y)*(c.y-p.y));
	var PI = Math.PI;
	var circleVertex = [];
	for(var i=0;i<=100;i++){
		var x = c.x+radius*Math.cos(i*PI/50);
		var y = c.y+radius*Math.sin(i*PI/50);
		var lnglat = ctx.map.unproject([x,y]);
		circleVertex.push([lnglat.lng,lnglat.lat]);
	}
	return circleVertex;
};

module.exports = Circle;