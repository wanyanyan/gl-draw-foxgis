var Feature = require('./feature');
var Polygon = require('./polygon');

var Rectangle = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function(ring){return ring.slice(0, -1)});
};

Rectangle.prototype = new Polygon();

//绘制p1,p2两个点后，根据鼠标位置p3计算矩形的另外两个点的位置
Rectangle.prototype.getRectVertex = function(p1,p2,p3) {
	if(this.coordinates[0].length < 2){
		return;
	}
	var rectVertex = [];
	rectVertex[0] = p1;
	rectVertex[1] = p2;
	if(p3.x===p2.x&&p3.y===p2.y){
		return false;
	}
	var k = (p1.y-p2.y)/((p1.x-p2.x));
	var y3 = (k*p3.x-p3.y-k*p2.x-k*k*p2.y)/(-k*k-1);
	var x3 = -k*(y3-p2.y)+p2.x;
	rectVertex[2] = {x:x3,y:y3};

	var k2 = (y3-p2.y)/(x3-p2.x);
	if(k === k2){
		rectVertex[3] = {x:x3,y:y3};
	}else{
		var x4 = (p1.y-k2*p1.x+k*x3-y3)/(k-k2);
		var y4 = k*(x4-x3)+y3;
		rectVertex[3] = {x:x4,y:y4};
	}
	return rectVertex;
};

module.exports = Rectangle;