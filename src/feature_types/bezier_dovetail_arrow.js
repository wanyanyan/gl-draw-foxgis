var Feature = require('./feature');
var Polygon = require('./polygon');
var Bezier = require('./bezier');
var old_topOffset1 = 40;
var old_topOffset2 = 50;
var old_topInnerOffset = 8;
var old_topOuterOffset = 25;
var old_bottomOffset = 30;
var old_bottomOuterOffset = 30;
var base = 400;
var totalLength = 0;

var BezierDovetailArrow = function(ctx, geojson) {
  Feature.call(this, ctx, geojson);
  this.coordinates = this.coordinates.map(function(ring){return ring.slice(0, -1)});
};

BezierDovetailArrow.prototype = new Polygon();

//p1为箭头起点，p2为箭头终点
BezierDovetailArrow.prototype.getArrowVertex = function(ctx,p1,p2,p3) {
	var coord = [];
	totalLength = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));//p1-p3-p2的距离
	if (p3 === undefined) {
		var p1_geo = ctx.map.unproject([p1.x, p1.y]);
		coord[0] = [p1_geo.lng, p1_geo.lat];
		var head = getHeadVertex(ctx, p1, p2);
		var foot = getFootVertex(ctx, p1, p2);
		coord = foot.concat(head);
		coord.push(foot[0]);
	} else {
		var head = getHeadVertex(ctx, p3, p2);
		var foot = getFootVertex(ctx, p1, p3);
		var head0 = ctx.map.project(head[0]);
		var head4 = ctx.map.project(head[4]);
		var foot0 = ctx.map.project(foot[0]);
		var foot2 = ctx.map.project(foot[2]);
		var points_rx = [foot2.x, p3.x, head0.x];
		var points_ry = [foot2.y, p3.y, head0.y];
		var points_lx = [head4.x, p3.x, foot0.x];
		var points_ly = [head4.y, p3.y, foot0.y];
		var bezier = new Bezier();
		var leftSide = bezier.getBezierVertex(ctx, points_lx, points_ly);
		var rightSide = bezier.getBezierVertex(ctx, points_rx, points_ry);
		coord = foot.concat(rightSide).concat(head).concat(leftSide);
	}
	
	return coord;
};

//已知两个点，将其分别作为起点和终点，计算箭头头部的坐标，依次为左内、左外、顶点、右外、右内，共5个点
function getHeadVertex (ctx, p1, p2) {
	var coord = [];//箭头头部坐标，共5个点，右边内部点开始
	coord[2] = [p2.x, p2.y];//箭头顶点
	var p1_p2 = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));//p1-p2的距离
	if(p1_p2 === 0){
		return;
	}
	var ratio = (totalLength/base) > 1?1:(totalLength/base);
	var topOffset1 = old_topOffset1 * ratio;
	var topOffset2 = old_topOffset2 * ratio;
	var topInnerOffset = old_topInnerOffset * ratio;
	var topOuterOffset = old_topOuterOffset * ratio;
	var bottomOffset = old_bottomOffset * ratio;
	var bottomOuterOffset = old_bottomOuterOffset * ratio;
	var sina = -(p2.x-p1.x)/p1_p2;//旋转角度的正弦值
	var cosa = (p2.y-p1.y)/p1_p2;//余弦值

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
	coord[0] = [p1.x+(lInnerx-p1.x)*cosa-(lInnery-p1.y)*sina,p1.y+(lInnerx-p1.x)*sina+(lInnery-p1.y)*cosa];
	coord[1] = [p1.x+(lOuterx-p1.x)*cosa-(lOutery-p1.y)*sina,p1.y+(lOuterx-p1.x)*sina+(lOutery-p1.y)*cosa];
	coord[3] = [p1.x+(rOuterx-p1.x)*cosa-(rOutery-p1.y)*sina,p1.y+(rOuterx-p1.x)*sina+(rOutery-p1.y)*cosa];
	coord[4] = [p1.x+(rInnerx-p1.x)*cosa-(rInnery-p1.y)*sina,p1.y+(rInnerx-p1.x)*sina+(rInnery-p1.y)*cosa];	
	//将坐标转为经纬度
	for(var i=0;i<coord.length;i++){
		var lnglat = ctx.map.unproject(coord[i]);
		coord[i] = [lnglat.lng,lnglat.lat];
	}
	return coord;
}


//已知两个点，将其分别作为起点和终点，计算箭头头部的坐标，依次为左内、左外、顶点、右外、右内，共5个点
function getFootVertex (ctx, p1, p2) {
	var coord = [];//箭头尾部坐标，共3个点，左边点开始
	var p1_p2 = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));//p1-p2的距离
	if(p1_p2 === 0){
		return;
	}
	var ratio = (totalLength/base) > 1?1:(totalLength/base);
	var topOffset1 = old_topOffset1 * ratio;
	var topOffset2 = old_topOffset2 * ratio;
	var topInnerOffset = old_topInnerOffset * ratio;
	var topOuterOffset = old_topOuterOffset * ratio;
	var bottomOffset = old_bottomOffset * ratio;
	var bottomOuterOffset = old_bottomOuterOffset * ratio;
	var sina = -(p2.x-p1.x)/p1_p2;//旋转角度的正弦值
	var cosa = (p2.y-p1.y)/p1_p2;//余弦值

	var bottomx = p1.x;
	var bottomy = p1.y+bottomOffset;
	var rBottomx = p1.x+bottomOuterOffset;
	var rBottomy = p1.y;
	var lBottomx = p1.x - bottomOuterOffset;
	var lBottomy = p1.y;
	coord[0] = [p1.x+(lBottomx-p1.x)*cosa-(lBottomy-p1.y)*sina,p1.y+(lBottomx-p1.x)*sina+(lBottomy-p1.y)*cosa];
	coord[1] = [p1.x+(bottomx-p1.x)*cosa-(bottomy-p1.y)*sina,p1.y+(bottomx-p1.x)*sina+(bottomy-p1.y)*cosa];
	coord[2] = [p1.x+(rBottomx-p1.x)*cosa-(rBottomy-p1.y)*sina,p1.y+(rBottomx-p1.x)*sina+(rBottomy-p1.y)*cosa];
	//将坐标转为经纬度
	for(var i=0;i<coord.length;i++){
		var lnglat = ctx.map.unproject(coord[i]);
		coord[i] = [lnglat.lng,lnglat.lat];
	}
	return coord;
}
module.exports = BezierDovetailArrow;