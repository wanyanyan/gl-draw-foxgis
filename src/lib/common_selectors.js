const Constants = require('../constants');

module.exports = {
  //判断元数据类型是不是指定的类型（feature,midpoint,vertex)
  isOfMetaType: function(type) {
    return function(e) {
      var featureTarget = e.featureTarget;
      if (!featureTarget) return false;
      if (!featureTarget.properties) return false;
      return featureTarget.properties.meta === type;
    };
  },
  //判断是否按下了shift键
  isShiftMousedown:function(e) {
    if (!e.originalEvent) return false;
    if (!e.originalEvent.shiftKey) return false;
    return e.originalEvent.button === 0;
  },
  //判断要素是否被选中
  isActiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.ACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  //判断要素是否未被选中
  isInactiveFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.active === Constants.activeStates.INACTIVE &&
      e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  //没有任何要素
  noTarget: function(e) {
    return e.featureTarget === undefined;
  },
  //是要素
  isFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.meta === Constants.meta.FEATURE;
  },
  //是自定义的要素（除去普通点、线、面）
  isCustomFeature: function(e) {
    if (!e.featureTarget) return false;
    if (!e.featureTarget.properties) return false;
    return e.featureTarget.properties.type !== Constants.featureTypes.POINT&&e.featureTarget.properties.type !== Constants.featureTypes.LINE&&e.featureTarget.properties.type !== Constants.featureTypes.POLYGON;
  },
  //判断是否为顶点
  isVertex: function(e) {
    var featureTarget = e.featureTarget;
    if (!featureTarget) return false;
    if (!featureTarget.properties) return false;
    return featureTarget.properties.meta === Constants.meta.VERTEX;
  },
  //判断是否按下了shift键
  isShiftDown: function(e) {
    if (!e.originalEvent) return false;
    return e.originalEvent.shiftKey === true;
  },
  //判断是否按下了Esc键
  isEscapeKey: function(e) {
    return e.keyCode === 27;
  },
  //判断是否按下了Enter键
  isEnterKey: function(e) {
    return e.keyCode === 13;
  },
  true: function() {
    return true;
  }
};
