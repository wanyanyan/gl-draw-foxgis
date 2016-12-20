const createVertex = require('./create_vertex');
const Constants = require('../constants');

function createControlFeature(ctx,bbox,featureId) {
  if(bbox === undefined){return;}

  var controlFeatures = [];
  var p1 = [(bbox[0]+bbox[2])/2,bbox[3]];
  var p2 = [bbox[0],bbox[3]];
  var p3 = [bbox[0],(bbox[1]+bbox[3])/2];
  var p4 = [bbox[0],bbox[1]];
  var p5 = [(bbox[0]+bbox[2])/2,bbox[1]];
  var p6 = [bbox[2],bbox[1]];
  var p7 = [bbox[2],(bbox[1]+bbox[3])/2];
  var p8 = [bbox[2],bbox[3]];
  var coordinates = [
    {N:p1},{NW:p2},{W:p3},{SW:p4},{S:p5},{SE:p6},{E:p7},{NE:p8}
  ];

  coordinates.forEach(function(point){
    var location = Object.keys(point)[0];
    const vertex = {
      type: Constants.geojsonTypes.FEATURE,
      properties: {
        meta: Constants.meta.CONTROL,
        parent: featureId,
        active: Constants.activeStates.ACTIVE,
        location:location
      },
      geometry: {
        type: Constants.geojsonTypes.POINT,
        coordinates: point[location]
      }
    };
    controlFeatures.push(vertex);
  });

  coordinates.push({N:p1});
  var line = [];
  for(var i = 0;i<coordinates.length;i++){
    var location = Object.keys(coordinates[i])[0];
    line.push(coordinates[i][location]);
  }
  const controlLine = {
    type: Constants.geojsonTypes.FEATURE,
    properties: {
      meta: Constants.meta.CONTROL,
      parent: featureId,
      active: Constants.activeStates.ACTIVE
    },
    geometry: {
      type: Constants.geojsonTypes.LINE_STRING,
      coordinates: line
    }
  }
  controlFeatures.push(controlLine);

  return controlFeatures;
}

module.exports = createControlFeature;
