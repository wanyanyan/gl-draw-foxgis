var Feature = require('./feature');
var Polygon = require('./polygon');

var Ellipse = function(ctx, geojson) {
    Feature.call(this, ctx, geojson);
    this.coordinates = this.coordinates.map(function(ring) { return ring.slice(0, -1) });
};

Ellipse.prototype = new Polygon();

//点选圆心c，根据鼠标移动后的位置p计算圆的坐标
Ellipse.prototype.getEllipseVertex = function(ctx, c, p) {
    let p1 = { x: c.x, y: c.y }
    let p2 = { x: c.x, y: p.y }
    let p3 = { x: p.x, y: p.y }
    let p4 = { x: p.x, y: c.y }
    let center = { x: (p1.x + p3.x) / 2, y: (p1.y + p2.y) / 2 }
    var a = Math.sqrt((p1.x - p4.x) * (p1.x - p4.x) + (p1.y - p4.y) * (p1.y - p4.y)) / 2;
    var b = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)) / 2;
    var step = (a > b) ? 1 / a : 1 / b;
    var PI = Math.PI;
    var circleVertex = [];
    for (var i = 0; i < 2 * Math.PI; i += step) {
        var x = center.x + a * Math.cos(i);
        var y = center.y + b * Math.sin(i);
        var lnglat = ctx.map.unproject([x, y]);
        circleVertex.push([lnglat.lng, lnglat.lat]);
    }
    return circleVertex;
};

module.exports = Ellipse;