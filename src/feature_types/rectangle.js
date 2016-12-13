var xtend = require('xtend');
var Feature = require('./feature');
var Polygon = require('./polygon');

var Rectangle = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function(ring){return ring.slice(0, -1)});
};

Rectangle.prototype = new Polygon();

Rectangle.prototype.getRectVertex = function(lnglat) {
	if(this.coordinates[0].length < 2){
		return;
	}
	var rectVertex = [];
	rectVertex[0] = this.coordinates[0][0];
	rectVertex[1] = this.coordinates[0][1];
	if(lnglat.lng===rectVertex[1][0]&&lnglat.lat===rectVertex[1][1]){
		return false;
	}
	var k = (rectVertex[0][1]-rectVertex[1][1])/((rectVertex[0][0]-rectVertex[1][0]));
	var y3 = (k*lnglat.lng-lnglat.lat-k*rectVertex[1][0]-k*k*rectVertex[1][1])/(-k*k-1);
	var x3 = -k*(y3-rectVertex[1][1])+rectVertex[1][0];
	rectVertex[2] = [x3,y3];

	var k2 = (rectVertex[2][1]-rectVertex[1][1])/((rectVertex[2][0]-rectVertex[1][0]));
	var x4 = (rectVertex[0][1]-k2*rectVertex[0][0]+k*rectVertex[2][0]-rectVertex[2][1])/(k-k2);
	var y4 = k*(x4-rectVertex[2][0])+rectVertex[2][1];
	rectVertex[3] = [x4,y4];
	return rectVertex;
};

module.exports = Rectangle;