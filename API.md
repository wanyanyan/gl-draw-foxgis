# API 参考

使用方法

```js
var Draw = new MapboxDraw({ options });
map.addControl(Draw);
```

只有在地图加载完才能使用Draw，因此最好在mapbox-gl地图的 `load` 事件回调中添加Draw的交互:

```js
map.on('load', function() {
    Draw.add({ ... });
    console.log(Draw.getAll());
    ...
});
```

## Options选项

选项 | 类型 | 功能
--- | --- | ---
keybindings | boolean | 为绘图绑定快捷键 - 默认: `true`
boxSelect | boolean | If true, shift + click to features. If false, click + select zooms to area - default: `true`
clickBuffer | number | 鼠标点击时选取要素的缓冲区 - 默认: `2`
displayControlsDefault | boolean | 设置控制选项的默认值 - default `true`
controls | Object | 自定义控制按钮. 从 `displayControlsDefault` 中获得默认值. 可选的值有: point, line_string, polygon, trash,combine_features,uncombine_features.
styles | Array | 样式对象的数组. 默认情况Draw会提供一个默认的样式，如果要覆盖默认样式，可参考[Styling Draw](#styling-draw).

## 模式

模式名称作为枚举类存储在 `Draw.modes`中。

### `simple_select`

`Draw.modes.SIMPLE_SELECT === 'simple_select'`

允许选择、删除和移动要素。

该模式下，要素处于活动的状态，用户可以控制处于活动状态的要素。每次单个要素绘制完成以后会自动进入 `simple_select` 模式。

### `direct_select`

`Draw.modes.DIRECT_SELECT === 'direct_select'`

该模式下可以选择、删除和移动要素的节点。

点状要素不具有`direct_select` 模式。

### `draw_line_string`

`Draw.modes.DRAW_LINE_STRING === 'draw_line_string'`

绘制普通线状要素

### `draw_polygon`

`Draw.modes.DRAW_POLYGON === 'draw_polygon'`

绘制一个普通面状要素

### `draw_point`

`Draw.modes.DRAW_POINT === 'draw_point'`

绘制一个点状要素

### `draw_arc`

`Draw.modes.DRAW_ARC === 'draw_arc'`

三点画弧

### `draw_arrow`

`Draw.modes.DRAW_ARROW === 'draw_arrow'`

绘制一个趋势箭头

### `draw_bezier`

`Draw.modes.DRAW_BEZIER === 'draw_bezier'`

四点绘制贝塞尔曲线

### `draw_circle`

`Draw.modes.DRAW_CIRCLE === 'draw_circle'`

通过一个点和半径画一个圆

### `draw_rectangle`

`Draw.modes.DRAW_RECTANGLE === 'draw_retangle'`

画一个矩形

### `draw_triangle`

`Draw.modes.DRAW_TRIANGLE === 'draw_triangle'`

画一个三角形

### `static`

`Draw.modes.STATIC === 'static'`

该模式下所有绘制的要素都禁止编辑，该模式不具备任何可传递的参数。

注意：该模式只能通过调用 `.changeMode` 函数进入或退出。

## API 方法

`mapboxgl.Draw()` 返回一个 `Draw` 实例，该实例具有以下API方法:

---

### `.add(Object: GeoJSON) -> [String]`

将一个geojson要素添加到地图上
输入参数：geojson类型的要素(feature)或要素集(featurecollection)
返回值：包含所添加要素id的数组

目前支持的geojson要素类型有 `Point`, `LineString`, `Polygon`, `MultiPoint`,  `MultiLineString`,  `MultiPolygon`.

如果输入的要素id与一个已存在的要素id相同，则会更新已存在的要素。

示例:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var featureId = Draw.add(feature);
console.log(featureId);
//=> '随机生成的字符串'
```

示例（包含id）:

```js
var feature = { type: 'Point', coordinates: [0, 0], id: 'unique-id' };
var featureId = Draw.add(feature);
console.log(featureId)
//=> unique-id
```

---

### `.get(String: featureId) -> Object`

输入id，返回对应的geojson要素

示例:

```js
var id = Draw.add({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }
```

---

### `.getFeatureIdsAt(Object: point) -> [featureId, featuresId]`

给定一个具有x、y属性的点，返回该点范围内所有绘制的要素id。x和y的值为像素坐标，不是经纬度。

```js
var featureIds = Draw.getFeatureIdsAt(20, 20);
console.log(featureIds)
//=> ['top-feature-at-20-20', 'another-feature-at-20-20']
```

---

### `.getSelectedIds() -> [featureId, featuresId]`

返回所有处于选中状态的要素id，如果没有要素被选中，则返回空数组。

---

### `.getSelected() -> Object`

返回一个要素集(FeatureCollection)，包含所有选中的要素，如果没有要素被选中，将返回一个空要素集。

---

### `.getSelectedPoints() -> [Object: GeoJSON]`

以Geojson要素的形式返回当前选中状态下的所有要素节点。

---

### `.getAll() -> Object`

以geojson要素集的形式返回所有绘制的要素。

示例:

```js
Draw.add({ type: 'Point', coordinates: [0, 0] });
Draw.add({ type: 'Point', coordinates: [1, 1] });
Draw.add({ type: 'Point', coordinates: [2, 2] });
console.log(Draw.getAll());
// => {
//  type: 'FeatureCollection',
//  features: [
//    {
//      id: 'random-0'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [0, 0]
//      }
//    },
//    {
//      id: 'random-1'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [1, 1]
//      }
//    },
//    {
//      id: 'random-2'
//      type: 'Feature',
//      geometry: {
//        type: 'Point',
//        coordinates: [2, 2]
//      }
//    }
//  ]
//}
```

---

### `.delete(String | Array<String> : id) -> Draw`

给定一个id或者一个包含多个id的数组，删除对应id的要素。

在 `direct_select` 模式，删除选中的要素会退出该模式，返回到 `simple_select` 模式

示例:

```js
var feature = { type: 'Point', coordinates: [0, 0] };
var id = draw.add(feature)
Draw
  .delete(id)
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

---

### `.deleteAll() -> Draw`

删除绘制的所有要素

示例:

```js
Draw.add({ type: 'Point', coordinates: [0, 0] });
Draw
  .deleteAll()
  .getAll();
// => { type: 'FeatureCollection', features: [] }
```

---

### `.set(Object: featureCollection) -> [featureId, featureId]`

给定一个geojson要素集，将地图上绘制的要素重置为该要素集。从效果上来说，相当于执行 `Draw.deleteAll()` 然后再调用 `Draw.add(featureCollection)`。

示例:

```js
var ids = Draw.set({type: 'FeatureCollection', features: [{
  type: 'Feature',
  properties: {},
  id: 'example-id',
  geometry: { type: 'Point', coordinates: [0, 0] }
}]});
// => ['example-id']
```

---

### `.trash() -> Draw`

触发当前模式下的trash事件，在 `simple_select` 模式下会删除所有选中的要素，在 `direct_select` 模式下会删除所有选中的节点，在绘图模式下会取消当前的绘图进程。

与`delete` 或 `deleteAlll` 不同的是，该方法遵循在不同模式下定义的不同规则。

---

### `.combineFeatures() -> Draw`

在当前模式下执行聚合要素的操作。在 `simple_select` 模式，如果所有选中的要素是同一种几何类型，那么这些要素将会合并成一个多要素集合。例如：

- LineString, LineString => MultiLineString
- MultiLineString, LineString => MultiLineString
- MultiLineString, MultiLineString => MultiLineString

如果选中要素的乐和类型不同，则不会执行任何操作。例如：

- Point, LineString => 不执行
- MultiLineString, MultiPoint => 不执行

如果在 `direct_select` 模式或者绘图模式，同样不会执行任何操作，当前模式也不会退出。

---

### `.uncombineFeatures() -> Draw`

在当前模式下执行分离要素的操作。如果在 `simple_select` 模式下，会将选中的多要素集合分离成各自单独的要素。例如：
  
- MultiLineString (包含两部分) => LineString, LineString 
- MultiLineString (包含三部分) => LineString, LineString, LineString
- MultiLineString (包含两部分), Point => LineString, LineString, Point
- LineString => LineString

如果在 `direct_select` 模式或者绘图模式，同样不会执行任何操作，当前模式也不会退出。

---

### `.getMode() -> Draw`

返回当前的模式

---

### `.changeMode(String: mode, ?Object: options) -> Draw`

`changeMode` 触发模式切换进程， `mode` 只能是指定字符串中的一个， `simple_select` 模式和 `direct_select` 模式可以接受一个 `options` 对象作为参数。

```js
// `simple_select`模式的options参数
{
  // 指定的这些要素将会被初始化选中
  featureIds: Array<string>
}
```

```js
// `direct_select`模式的options参数
{
  // 指定的要素将会在编辑状态下选中
  featureId: string
}
```

---

### `.setFeatureProperty(String: featureId, String: property, Any: value) -> Draw`

设置指定要素的属性值。

## 事件

该对象提供了一系列的事件，所有的事件都是用 `draw.`进行命名D，并且都是通过map对象进行触发。
所有的事件都是用户交互触发的结果。

**如果你通过以上的API引入一个函数，那么他不会触发与这个函数 *直接相关联* 的任何事件。例如，如果你引用了`Draw.delete(..)`，将不会触发相关联的 `draw.delete` 事件，因为你已经知道你做了什么。但是由之引起的其他事件将会被触发，这些事件并不与引用的函数直接相关联。例如，你选中了一个要素，并且调用了`Draw.changeMode('draw_polygon')`，你将 *不会* 看到 `draw.modechange` 事件（因为它与调用的函数直接相关联），但是你 *会* 看到一个 `draw.selectionchange` 事件，因为你的操作引起了选中要素的变化。

### `draw.create`

当要素被创建时触发，下列操作将会触发该事件：

- 要素绘制完成的时候。线和面要素只在用户完成绘制时触发，也就是双击或者按回车，并且绘制的要素有效时。 

事件传递的数据是一个包含以下形状的对象：

```js
{
  // 包含所创建的要素的一个GeoJSON对象数组
  features: Array<Object>
}
```

### `draw.delete`

当一个或多个要素被删除时触发。下列操作将会触发该事件：

- 在 `simple_select` 模式选中了一个或多个要素时，点击“删除”按钮。
- 在 `simple_select` 模式选中了一个或多个要素时，按下退格键或删除键。
- 在 `simple_select` 模式选中了一个要素，调用 `Draw.trash()` 函数。

事件传递的数据是一个包含以下形状的对象：

```js
{
  // 包含所删除的要素的一个GeoJSON对象数组
  features: Array<Object>
}
```

### `draw.combine`

当要素聚合时触发。下列操作将会触发该事件：

- 在 `simple_select` 模式选中了多个要素时，点击聚合按钮。
- 在 `simple_select` 模式选中了多个要素时，调用 `Draw.combineFeatures()` 函数。

事件传递的数据是一个包含以下形状的对象：

```js
{
  deletedFeatures: Array<Object>, // 包含所删除的要素的一个GeoJSON对象数组
  createdFeatures: Array<Object> // 包含所创建的要素的一个GeoJSON对象数组
}
```

### `draw.uncombine`

当要素分离时触发。下列操作将会触发该事件：

- 在 `simple_select` 模式选中了一个或多个要素集合（FeatureCollection）时，点击分离按钮。
- 在 `simple_select` 模式选中了一个或多个要素集合（FeatureCollection）时，调用 `Draw.uncombineFeatures()` 函数。

事件传递的数据是一个包含以下形状的对象：

```js
{
  deletedFeatures: Array<Object>, // 包含所删除的要素的一个GeoJSON对象数组
  createdFeatures: Array<Object> // 包含所创建的要素的一个GeoJSON对象数组
}
```

### `draw.update`

当一个或多个要素更新时触发。下列操作将会触发该事件，可以被归类为 `action` ：

- `action: 'move'`
  - 在 `simple_select` 模式移动一个或多个要素时。事件只会在操作完成时触发——用户释放鼠标或按下回车。
- `action: 'change_coordinates'`
  - 在 `direct_select` 模式移动要素的一个或多个顶点。事件只会在操作完成时触发——用户释放鼠标或按下回车或者鼠标离开地图区域。
  - 在 `direct_select` 模式删除要素的一个或多个顶点，可以通过按下退格键或删除键、点击删除按钮、调用 `Draw.trash()` 触发。
  - 在 `direct_select` 模式通过点击要素的中点添加一个顶点。

当要素被创建或删除时不会触发该事件，如果需要跟踪这些交互，可以监听 `draw.create` 或 `draw.delete`事件。

事件传递的数据是一个包含以下形状的对象：

```js
{
  // 包含所更新的要素的一个GeoJSON对象数组
  features: Array<Object>,
  action: string
}
```

### `draw.selectionchange`

当选中要素发生变更时触发。下列操作将会触发该事件：

- 点击一个要素选中。
- 当一个要素已经被选中，按住shift键选中另一个要素。
- 点击选中一个顶点
- 当一个顶点已经被选中，按住shift键选中另一个顶点。
- 创建一个选择框，至少包含一个要素。
- 在选中要素的外面点击，取消选中。
- 在选中顶点的外面点击，取消选中。
- 一个要素绘制完成时（要素绘制完成以后直接处于选中状态）
- 选中了一个要素以后，调用 `Draw.changeMode()` 导致要素取消选中。
- 使用 `Draw.changeMode('simple_select', { featureIds: [..] })` 切换到 `simple_select` 模式并且指定选中的要素。
- 使用 `Draw.delete`, `Draw.deleteAll` 或者 `Draw.trash` 删除要素。

事件传递的数据是一个包含以下形状的对象：

```js
{
  // 包含选中要素的GeoJSON对象数组
  features: Array<Object>
}
```

### `draw.modechange`

模式发生改变时触发。下列操作将会触发该事件：

- 点击绘图按钮开始绘制时 (进入 `draw_*` 模式)。
- 绘图完成时 (进入 `simple_select` 模式).
- 当处于`simple_select` 模式时，点击一个已经选中的要素(进入 `direct_select` 模式).
- 当处于 `direct_select` 模式时，点击要素外部(进入 `simple_select` 模式)。

该事件仅仅在当前模式结束之后，新的模式开始之前触发。渲染在所有的事件处理函数触发完成后才会开始，因此可以在`draw.modechange` 处理函数中调用 `Draw.changeMode()` 来强制更改模式。

事件传递的数据是一个包含以下形状的对象：

```js
{
  // 接下来的模式，也就是将会切换到该模式下
  mode: string
}
```

`simple_select` 模式 `direct_select` 模式可以通过选项指定要素进行初始化。

### `draw.render`

仅仅在调用 `setData()`时触发。这并不代表已经更新了地图，只是地图将会被更新。


### `draw.actionable`

当Draw的状态发生改变时触发。监听该事件可以获知 `Draw.trash()`, `Draw.combineFeatures()` 和`Draw.uncombineFeatures()` 是否已经生效。

```js
{
  actions: {
    trash: true
    combineFeatures: false,
    uncombineFeatures: false
  }
}
```

## 自定义样式

Draw使用的是 [Mapbox GL Style Spec](https://www.mapbox.com/mapbox-gl-style-spec/)，并且通过预先设定的属性进行过滤来进设置样式。

**source**

 `GL Style Spec` 需要每一个图层都有一个数据源，当你需要自定义样式时，**不需要在图层中提供数据源** 

Draw会在不同的数据源之间移动要素以保证性能，正因为如此，建议你 **不要** 在样式中提供数据源，尽管 `GL Style Spec` 要求必须提供数据源。 **Draw会自动为你提供数据源**.

Draw提供的数据源的名称为 `mapbox-gl-draw-hot` 和 `mapbox-gl-draw-cold`，如果你需要调整数据源，你可以使用该名称。

**id**

 `GL Style Spec` 同样需要提供一个id， **你必须提供这个id**。

Draw将会自动添加`.hot` 和 `.cold` 到你提供的id后面。

属性 | 值 | 功能介绍
--- | --- | ---
meta | feature, midpoint, vertex | `midpoint` 和 `vertex` 被用在连接线和多边形的节点上， `feature` 用于用户添加的所有要素中。
active | true, false | 当要素在当前模式下被选中时处于激活状态。`true` 和 `false` 是字符串类型。
mode |  simple_select, direct_select, draw_point, draw_line_string, draw_polygon, static, ··· | 表示当前所处的模式

Draw还提供一些其他的属性，但是不建议用来进行设置样式。更多详情可查看 `通过map.queryRenderFeatures使用Draw`.

### Example Custom Styles

See [EXAMPLES.md](https://github.com/wanyanyan/gl-draw-foxgis/blob/master/EXAMPLES.md) for examples of custom styles.reference.

## 通过 `map.queryRenderFeatures`使用Draw

属性 | 值类型 | 功能介绍
--- | --- | ---
id | string | 只有当 `meta` 值为 `feature`时才有
parent | string | 只有当 `meta` 值不为 `feature`时才有
coord_path | string | 用 `.` 分隔的 [lon, lat] 实体
lon | number | 经度值，只有当 `meta` 值为 `midpoint`时才有
lat | number | 纬度值，只有当 `meta` 值为 `midpoint`时才有
