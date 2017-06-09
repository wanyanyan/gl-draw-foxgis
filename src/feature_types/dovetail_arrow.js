var Feature = require('./feature');
var Polygon = require('./polygon');
var old_topOffset1 = 40;
var old_topOffset2 = 50;
var old_topInnerOffset = 8;
var old_topOuterOffset = 25;
var old_bottomOffset = 30;
var old_bottomOuterOffset = 30;
var base = 400;

/*var template = [[0,0],[5,82],[11,82],[0,100],[-11,82],[-5,82],[0,0]];
var base = 100;*/

var DovetailArrow = function(ctx, geojson) {//燕尾箭头
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function(ring){return ring.slice(0, -1)});
};

DovetailArrow.prototype = new Polygon();

//p1为箭头起点，p2为箭头终点
DovetailArrow.prototype.getArrowVertex = function(ctx,p1,p2) {
	var coord = [];//箭头顶点坐标，共8个点，从燕尾中间点开始
	coord[4] = [p2.x, p2.y];//箭头顶点
	var p1_p2 = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));//p1-p2的距离
	if(p1_p2 === 0){
		return;
	}
	var ratio = (p1_p2/base) > 1?1:(p1_p2/base);
	var topOffset1 = old_topOffset1 * ratio;
	var topOffset2 = old_topOffset2 * ratio;
	var topInnerOffset = old_topInnerOffset * ratio;
	var topOuterOffset = old_topOuterOffset * ratio;
	var bottomOffset = old_bottomOffset * ratio;
	var bottomOuterOffset = old_bottomOuterOffset * ratio;
	var sina = -(p2.x-p1.x)/p1_p2;//旋转角度的正弦值
	var cosa = (p2.y-p1.y)/p1_p2;//余弦值
	var innerR = Math.sqrt(topInnerOffset*topInnerOffset+(p1_p2-topOffset1)*(p1_p2-topOffset1));//箭头内转点到起点的距离
	var outerR = Math.sqrt(topOuterOffset*topOuterOffset+(p1_p2-topOffset2)*(p1_p2-topOffset2));//箭头外转点到起点的距离
	//内转点的原始坐标（左边）
	var lInnerx = p1.x+topInnerOffset;
	var lInnery = p1.y+p1_p2-topOffset1;
	//外转点的原始坐标（左边）
	var lOuterx = p1.x+topOuterOffset;
	var lOutery = p1.y+p1_p2-topOffset2;

	var rInnerx = p1.x-topInnerOffset;
	var rInnery = p1.y+p1_p2-topOffset1;
	var rOuterx = p1.x-topOuterOffset;
	var rOutery = p1.y+p1_p2-topOffset2;
	//内外转点旋转角度a后的新坐标
	coord[2] = [p1.x+(lInnerx-p1.x)*cosa-(lInnery-p1.y)*sina,p1.y+(lInnerx-p1.x)*sina+(lInnery-p1.y)*cosa];
	coord[3] = [p1.x+(lOuterx-p1.x)*cosa-(lOutery-p1.y)*sina,p1.y+(lOuterx-p1.x)*sina+(lOutery-p1.y)*cosa];
	coord[5] = [p1.x+(rOuterx-p1.x)*cosa-(rOutery-p1.y)*sina,p1.y+(rOuterx-p1.x)*sina+(rOutery-p1.y)*cosa];
	coord[6] = [p1.x+(rInnerx-p1.x)*cosa-(rInnery-p1.y)*sina,p1.y+(rInnerx-p1.x)*sina+(rInnery-p1.y)*cosa];	

	var bottomx = p1.x;
	var bottomy = p1.y+bottomOffset;
	var rBottomx = p1.x+bottomOuterOffset;
	var rBottomy = p1.y;
	var lBottomx = p1.x - bottomOuterOffset;
	var lBottomy = p1.y;
	coord[0] = [p1.x+(bottomx-p1.x)*cosa-(bottomy-p1.y)*sina,p1.y+(bottomx-p1.x)*sina+(bottomy-p1.y)*cosa];
	coord[1] = [p1.x+(rBottomx-p1.x)*cosa-(rBottomy-p1.y)*sina,p1.y+(rBottomx-p1.x)*sina+(rBottomy-p1.y)*cosa];
	coord[7] = [p1.x+(lBottomx-p1.x)*cosa-(lBottomy-p1.y)*sina,p1.y+(lBottomx-p1.x)*sina+(lBottomy-p1.y)*cosa];
	coord[8] = coord[0];
	//将坐标转为经纬度
	for(var i=0;i<coord.length;i++){
		var lnglat = ctx.map.unproject(coord[i]);
		coord[i] = [lnglat.lng,lnglat.lat];
	}
	return coord;
};

module.exports = DovetailArrow;