var featuresAt = require('./features_at');
var Constants = require('../constants');

module.exports = function getFeatureAtAndSetCursors(event, ctx) {
  var features = featuresAt(event, null, ctx);
  var classes = { mouse: Constants.cursors.NONE };

  if (features[0]) {
    if(features[0].properties.meta !== Constants.meta.CONTROL){
      classes.mouse = (features[0].properties.active === Constants.activeStates.ACTIVE)
        ? Constants.cursors.MOVE
        : Constants.cursors.POINTER;
      classes.feature = features[0].properties.meta;
    }else{
      var location = features[0].properties.location;
      classes.mouse = Constants.cursors[location];
    } 
  }

  if (ctx.events.currentModeName().indexOf('draw') !== -1) {
    classes.mouse = Constants.cursors.ADD;
  }

  ctx.ui.queueMapClasses(classes);
  ctx.ui.updateMapClasses();

  return features[0];
};
