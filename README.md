# gl-draw-foxgis.js

基于 [mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) 0.16.0版本修改，支持在 [mapbox-gl.js](https://www.mapbox.com/mapbox-gl-js/) 地图中添加和编辑要素，除了添加点、线、面以外，支持在地图上绘制Bezier曲线、圆弧、圆、矩形、三角形、箭头、弯曲箭头等形状.

### 安装

```
npm install wanyanyan/gl-draw-foxgis
```

在 `mapbox-gl` 之后添加或包含 `gl-draw-foxgis` .

同时也需要添加 [gl-draw-foxgis.css](https://github.com/wanyanyan/gl-draw-foxgis/blob/master/dist/mapbox-gl-draw.css)的引用

```html
<link href="gl-draw-foxgis.css" rel="stylesheet" />
```

### 在应用程序中使用

```js
mapboxgl.accessToken = 'YOUR_ACCESS_TOKEN';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v8',
  center: [40, -74.50],
  zoom: 9
});

var Draw = new MapboxDraw();

map.addControl(Draw)
```

### 可以从 [API.md](https://github.com/wanyanyan/gl-draw-foxgis/blob/master/API.md) 获得完整的API参考.

### 开发或测试

安装所有依赖项, 编译源文件并启动测试服务:

```
git clone git@github.com:wanyanyan/gl-draw-foxgis.git
npm install
npm start & open http://localhost:9966/debug/?access_token=<token>
```

### 运行测试

```
npm run test
```
