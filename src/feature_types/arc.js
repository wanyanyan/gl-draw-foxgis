var Feature = require('./feature');
var LineString = require('./line_string');

var Arc = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
};

Arc.prototype = new LineString();

//根据p1,p2,p3三个点确定圆弧坐标
Arc.prototype.getArcVertex = function(ctx,p1,p2,p3) {
	if(p3.x===p2.x&&p3.y===p2.y){
		return false;
	}
	var c = {x:0,y:0}//圆心
	var k = (p2.x-p1.x)/(p3.x-p2.x);
	var p1_SS = p1.x*p1.x+p1.y*p1.y;
	var p2_SS = p2.x*p2.x+p2.y*p2.y;
	var p3_SS = p3.x*p3.x+p3.y*p3.y;
	//三个点确定的圆心坐标
	c.y = ((1+k)*p2_SS-p1_SS-k*p3_SS)/(2*(1+k)*p2.y-2*k*p3.y-2*p1.y);
	c.x = (2*(p1.y-p2.y)*c.y+p2_SS-p1_SS)/(2*(p2.x-p1.x));
	//圆的半径
	var radius = Math.sqrt((c.x-p1.x)*(c.x-p1.x)+(c.y-p1.y)*(c.y-p1.y));
	var PI = Math.PI;
	var arcVertex = [];
	for(var i=0;i<=100;i++){
		var x = c.x+(p1.x-c.x)*Math.cos(i*PI/50)-(p1.y-c.y)*Math.sin(i*PI/50);
		var y = c.y+(p1.x-c.x)*Math.sin(i*PI/50)+(p1.y-c.y)*Math.cos(i*PI/50);

		try {
			var lnglat = ctx.map.unproject([x,y]);
			arcVertex.push([lnglat.lng,lnglat.lat]);
			var angle = Math.atan((y-c.y)/(x-c.x))-Math.atan((p3.y-c.y)/(p3.x-c.x));
			if(Math.abs(angle)<PI/50&&(x-c.x)/(p3.x-c.x)>0){
				break;
			}
		} catch (e) {
		}
		
	}
	return arcVertex;
};

module.exports = Arc;