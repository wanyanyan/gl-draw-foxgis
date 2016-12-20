# API 参考

使用方法

```js
var Draw = mapboxgl.Draw({ options });
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
drawing | boolean | 是否允许绘制和删除要素 - 默认: `true`
keybindings | boolean | 为绘图绑定快捷键 - 默认: `true`
boxSelect | boolean | If true, shift + click to features. If false, click + select zooms to area - default: `true`
clickBuffer | number | 鼠标点击时选取要素的缓冲区 - 默认: `2`
displayControlsDefault | boolean | 设置控制选项的默认值 - default `true`
controls | Object | 自定义控制按钮. 从 `displayControlsDefault` 中获得默认值. 可选的值有: point, line, polygon, trash.
styles | Array | 样式对象的数组. 默认情况Draw会提供一个默认的样式，如果要覆盖默认样式，可参考[Styling Draw](#styling-draw).

## 模式

模式名称作为枚举类存储在 `Draw.modes`中。

### `simple_select`

`Draw.modes.SIMPLE_SELECT === 'simple_select'`

允许选择、删除和移动要素。

In this mode, features can have their active state changed by the user. To control what is active, react to changes as described in the events section below.

每次单个要素绘制完成以后会自动进入 `simple_select` 模式.

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

###`.add(Object: GeoJSON) -> [String]`

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

###`.get(String: featureId) -> Object`

输入id，返回对应的geojson要素

示例:

```js
var id = Draw.add({ type: 'Point', coordinates: [0, 0] });
console.log(Draw.get(id));
//=> { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }
```

### `.getFeatureIdsAt(Object: point) -> [featureId, featuresId]`

给定一个具有x、y属性的点，返回该点范围内所有绘制的要素id。x和y的值为像素坐标，不是经纬度。

```js
var featureIds = Draw.getFeatureIdsAt(20, 20);
console.log(featureIds)
//=> ['top-feature-at-20-20', 'another-feature-at-20-20']
```
### `.getSelectedIds() -> [featureId, featuresId]`

返回所有处于选中状态的要素id，如果没有要素被选中，则返回空数组。

###`.getAll() -> Object`

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

###`.delete(String | Array<String> : id) -> Draw`

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

###`.deleteAll() -> Draw`

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

### `.getMode() -> Draw`

返回当前的模式

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

## Events

Draw fires off a number of events. All of these events are namespaced with `draw.` and are emitted from the map object.

They are all triggered as the result of user interaction.

**If you invoke a function in the Draw API, any event that *directly corresponds with* that function will not be fired.** For example, if you invoke `Draw.delete(..)`, there will be no corresponding `draw.delete` event, since you already know what you've done. Subsequent events may fire, though, that do not directly correspond to the invoked function. For example, if you have a one feature selected and then invoke `Draw.changeMode('draw_polygon')`, you will *not* see a `draw.modechange` event (because that directly corresponds with the invoked function) but you *will* see a `draw.selectionchange` event, since by changing the mode you deselected a feature.

### `draw.create`

Fired when a feature is created. The following will trigger this event:

- Finish drawing a feature. Simply clicking will create a Point. A LineString or Polygon is only created when the user has finished drawing it — i.e. double-clicked the last vertex or hit Enter — and the drawn feature is valid.

The event data is an object with the following shape:

```js
{
  // Array of GeoJSON objects representing the features that were created
  features: Array<Object>
}
```

### `draw.delete`

Fired when one or more features are deleted. The following will trigger this event:

- Click the Trash button when one or more features are selected in `simple_select` mode.
- Hit the Backspace or Delete keys when one or features are selected in `simple_select` mode.
- Invoke `Draw.trash()` when you have a feature selected in `simple_select` mode.

The event data is an object with the following shape:

```js
{
  // Array of GeoJSON objects representing the features that were deleted
  features: Array<Object>
}
```

### `draw.update`

Fired when one or more features are updated. The following will trigger this event, which can be subcategorized by `action`:

- `action: 'move'`
  - Finish moving one or more selected features in `simple_select` mode. The event will only fire when the movement is finished — i.e. when the user releases the mouse button or hits Enter.
- `action: 'change_coordinates'`
  - Finish moving one or more vertices of a selected feature in `direct_select` mode. The event will only fire when the movement is finished — i.e. when the user releases the mouse button or hits Enter, or her mouse leaves the map container.
  - Delete one or more vertices of a selected feature in `direct_select` mode, which can be done by hitting the Backspace or Delete keys, clicking the Trash button, or invoking `Draw.trash()`.
  - Add a vertex to the selected feature by clicking a midpoint on that feature in `direct_select` mode.

This event will not fire when a feature is created or deleted. To track those interactions, listen for `draw.create` and `draw.delete`.

The event data is an object with the following shape:

```js
{
  // Array of GeoJSON objects representing the features that were updated
  features: Array<Object>,
  action: string
}
```

### `draw.selectionchange`

Fired when the selection is changed (one or more features are selected or deselected). The following will trigger this event:

- Click on a feature to select it.
- Create a box-selection that includes at least one feature.
- When a feature is already selected, shift-click on another feature to add it to the selection.
- Click outside the selected feature(s) to deselect.
- Finish drawing a feature (features are selected just after they are created).
- When a feature is already selected, invoke `Draw.changeMode()` such that the feature becomes deselected.
- Use `Draw.changeMode('simple_select', { featureIds: [..] })` to switch to `simple_select` mode and immediately select the specified features.

The event data is an object with the following shape:

```js
{
  // Array of GeoJSON objects representing the features
  // that are selected, after the change
  features: Array<Object>
}
```

### `draw.modechange`

Fired when the mode is changed. The following will trigger this event:

- Click the point, line, or polygon buttons to begin drawing (enter a `draw_*` mode).
- Finish drawing a feature (enter `simple_select` mode).
- While in `simple_select` mode, click on an already selected feature (enter `direct_select` mode).
- While in `direct_select` mode, click outside all features (enter `simple_select` mode).

This event is fired just after the current mode stops and just before the next mode starts. A render will not happen until after all event handlers have been triggered, so you can force a mode redirect by calling `Draw.changeMode()` inside a `draw.modechange` handler.

The event data is an object with the following shape:

```js
{
  // The next mode, i.e. the mode that Draw is changing to
  mode: string
}
```

`simple_select` and `direct_select` modes can be initiated with options specific to that mode (see above).

### `draw.render`

Fired just after Draw calls `setData()` on `mapbox-gl-js`. This does not imply that the set data call has updated the map, just that the map is being updated.

## Styling Draw

Draw is styled by the [Mapbox GL Style Spec](https://www.mapbox.com/mapbox-gl-style-spec/) with a preset list of properties.

**source**

The `GL Style Spec` requires each layer to have a source. **DO NOT PROVIDE THIS** for styling draw.

Draw moves features between sources for performance gains, because of this it is recommended that you **DO NOT** provide a source for a style despite the fact the `GL Style Spec` requires a source. **Draw will provide the source for you automatically**.

If you need to style gl-draw for debugging sources the source names are `mapbox-gl-draw-hot` and `mapbox-gl-draw-cold`.

**id**

The `GL Style Spec` also requires an id. **YOU MUST PROVIDE THIS**.

Draw will add `.hot` and `.cold` to the end of your id.

property | values | function
--- | --- | ---
meta | feature, midpoint, vertex | `midpoint` and `vertex` are used on points added to the map to communicate polygon and line handles. `feature` is used for all features added by the user.
active | true, false | A feature is active when it is 'selected' in the current mode. `true` and `false` are strings.
mode |  simple_select, direct_select, draw_point, draw_line_string, draw_polygon, static | Indicates which mode Draw is currently in.

Draw also provides a few more properties, but they should not be used for styling. For details on them, see `Using Draw with map.queryRenderFeatures`.

### Example Custom Styles

See [EXAMPLES.md](https://github.com/mapbox/mapbox-gl-draw/blob/master/EXAMPLES.md) for examples of custom styles.reference.

## Using Draw with `map.queryRenderFeatures`

property | values | function
--- | --- | ---
id | string | only available when `meta` is `feature`
parent | string | only avaible when `meta` is not `feature`
coord_path | string | a `.` seporated path to one [lon, lat] entity in the parents coordinates
lon | number | the longitude value of a handle. Only available when `meta` is `midpoint`.
lat | number | the latitude value of a handle. Only available when `meta` is `midpoint`.
