# 示例

## 样式

可以从 [API.md](https://github.com/wanyanyan/gl-draw-foxgis/blob/master/API.md) 中获得完整的样式参考.

### 点状要素

在该样式中，所有点状要素都是蓝色，当选中时会添加黑色光晕，其他的所有要素即使存在也不会被渲染。

```js
mapbox.Draw({
  styles: [
    {
      'id': 'highlight-active-points',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'true']],
      'paint': {
        'circle-radius': 7,
        'circle-color': '#000000'
      },
      'interactive': true
    },
    {
      'id': 'points-are-blue',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['==', 'active', 'true']],
      'paint': {
        'circle-radius': 5,
        'circle-color': '#000088'
      },
      'interactive': true
    }
  ]
});
```

### 线状要素和面状要素

在该样式中，所有的点、线和面要素都具有红色虚线边框，填充色为透明。当绘图模式设为 'static'时, 这些要素将会变成黑色实线边框，填充色仍为透明。顶点都是用同样的过滤器，并且每个点会被渲染两次：一次是半径较大的光晕，另一次为实心点。.

```js
mapbox.Draw({
  styles: [
    // 选中状态
    // 线边框
    {
        "id": "gl-draw-line",
        "type": "line",
        "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "#D20C0C",
          "line-dasharray": [0.2, 2],
          "line-width": 2
        },
        "interactive": true
    },
    // 面填充
    {
      "id": "gl-draw-polygon-fill",
      "type": "fill",
      "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
      "paint": {
        "fill-color": "#D20C0C",
        "fill-outline-color": "#D20C0C",
        "fill-opacity": 0.1
      },
      "interactive": true
    },
    // 面边框
    // 绘制面的第一个线段的样式没有在此定义，而是使用线要素的样式
    {
      "id": "gl-draw-polygon-stroke-active",
      "type": "line",
      "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#D20C0C",
        "line-dasharray": [0.2, 2],
        "line-width": 2
      },
      "interactive": true
    },
    // 顶点的光晕
    {
      "id": "gl-draw-polygon-and-line-vertex-halo-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
      "paint": {
        "circle-radius": 5,
        "circle-color": "#FFF"
      },
      "interactive": true
    },
    // 顶点
    {
      "id": "gl-draw-polygon-and-line-vertex-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
      "paint": {
        "circle-radius": 3,
        "circle-color": "#D20C0C",
      },
      "interactive": true
    },

    // 非选中状态，静态模式
    // 线边框
    {
        "id": "gl-draw-line-static",
        "type": "line",
        "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "#000",
          "line-width": 3
        },
        "interactive": true
    },
    // 面填充
    {
      "id": "gl-draw-polygon-fill-static",
      "type": "fill",
      "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
      "paint": {
        "fill-color": "#000",
        "fill-outline-color": "#000",
        "fill-opacity": 0.1
      },
      "interactive": true
    },
    // 面边框
    {
      "id": "gl-draw-polygon-stroke-static",
      "type": "line",
      "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#000",
        "line-width": 3
      },
      "interactive": true
    }
  ]
});
```
