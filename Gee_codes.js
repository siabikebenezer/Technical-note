// Add Region of interest

var region = ee.FeatureCollection('projects/ee-siabikebenezer/assets/ROI_Kom');
Map.centerObject(region,7);
Map.setOptions('satellite')

var START_DATE = ee.Date('2019-11-01');
var END_DATE = ee.Date('2019-11-30');
var MAX_CLOUD_PROBABILITY = 30;

function maskClouds(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(MAX_CLOUD_PROBABILITY);
  return img.updateMask(isNotCloud);
}

// The masks for the 10m bands sometimes do not exclude bad data at
// scene edges, so we apply masks from the 20m and 60m bands as well.
// Example asset that needs this operation:
// COPERNICUS/S2_CLOUD_PROBABILITY

function mask_Edges(Sent2_img) {
  return Sent2_img.updateMask(
      Sent2_img.select('B8A').mask().updateMask(Sent2_img.select('B9').mask()));
}

// import S2 SR and cloud probability datasets

var Sent2 = ee.ImageCollection('COPERNICUS/S2');
var Sent2_Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');

// Filter input image collections by desired data range and region.

var criteria = ee.Filter.and(
    ee.Filter.bounds(region), ee.Filter.date(START_DATE, END_DATE));
Sent2 = Sent2.filter(criteria).map(mask_Edges);
Sent2_Clouds = Sent2_Clouds.filter(criteria);

// Join S2 SR with cloud probability dataset to add cloud mask.

var Sent2WithCloudMask = ee.Join.saveFirst('cloud_mask').apply({
  primary: Sent2,
  secondary: Sent2_Clouds,
  condition:
      ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});

// bulid image collection

var Sent2CloudMasked30 =
    ee.ImageCollection(Sent2WithCloudMask).map(maskClouds);
   
// print(Sent2CloudMasked30)   
    


// --------------------------------------------------------------------------------------------------------------

// This function maps spectral indices to enhance classification accuracy

var addSpec = function(img){
   // MNDWI (Modified Normalized difference water index - Hanqui Xu, 2006)
  var mndwi = img.normalizedDifference(['B3', 'B6']).rename('MNDWI');
  // NDVI
  var ndvi = img.normalizedDifference(['B5','B4']).rename('NDVI');
  return img
    .addBands(mndwi)
    .addBands(ndvi)
};

var Sent2_Spec = Sent2CloudMasked30.map(addSpec)

// Composite the Sentinel 2 image collection


var composite = Sent2_Spec
                //uses the median reducer
                .median()
                // clips the composite to our ROI
                .clip(region)
  print(composite)


//Define visualization parameters for the image collection 

var rgbVis = {min: 0, max: 3000, bands: ['B4', 'B3', 'B2']};

// Add layer to the map

Map.addLayer(composite, rgbVis, 'S2 Image RGB');

  
//Develop RandomForest model
//Generate training samples and predictors
// After Drawing training polygons, merge water and nonwater samples

var classes = Water.merge(nonWater)


// Define the Bands to include in the model

var bands = ['B4','B5','B3', 'MNDWI']

// create a variable called image to select the bands of interest and clip to ROI

var image = composite.select(bands).clip(region)

// Assemble samples for the model
var samples = image.sampleRegions({
    collection: classes, //set of geometries selected for training
    properties: ['water'],
    scale: 10 //make each sample the same size as landsat pixel
    }).randomColumn('random'); //creates a column with random numbers


// split samples into training and testing using the random column created

var split = 0.8; //80% of training, 20% for testing
var training = samples.filter(ee.Filter.lt('random', split)); //subset training
var testing = samples.filter(ee.Filter.gte('random', split)); //subset testing data


// // Print these variables to see how much training and testing data you're using

// print('Overall Samples n =', samples.aggregate_count('.all'));
// print('Training Samples n =', training.aggregate_count('.all'));
// print('Testing Samples n =', testing.aggregate_count('.all'));
  
  
// Begin Random forest classification
// using .smileRandomForest for model with 100 trees
// and 4 randomly selected predictors per split ('(100,4)')


var classifier = ee.Classifier.smileRandomForest(100,4).train({ 
    features: training.select(['B4','B5','B3', 'MNDWI', 'water']), 
    classProperty: 'water', //Pull the water property from classes
    inputProperties: bands
    });
    

// Test the accuracy of the model

var validation = testing.classify(classifier);
var testAccuracy = validation.errorMatrix('water', 'classification');
print('Validation error matrix RF:', testAccuracy);
print('Validation overall accuracy RF:', testAccuracy.accuracy());  


// Classify the merged composite using the randomforest model

var classifiedrf = image.select(bands)// select the predictors
                    .classify(classifier); //.classify applies the random forest



// Remove noise from model results by masking unconnected pixels

var pixelcount = classifiedrf.connectedPixelCount(5,false); 
var countmask = pixelcount.select(0).gt(2);

// Mask the results to only display water extent

var classMask = classifiedrf.select('classification').gt(0)
var classed = classifiedrf.updateMask(countmask).updateMask(classMask);


// Mask all permanent waters to display Small reservoir extent

var SRE = classed
var RiverNet = ee.FeatureCollection('projects/ee-siabikebenezer/assets/Buff_new1')
var mask = ee.Image.constant(1).clip(RiverNet.geometry()).mask().not()
SRE = SRE.updateMask(mask)


// Add the final result to the map

Map.addLayer(SRE, {min: 1, max: 1, palette: 'red, red'}, 'Masked Small Reservoir extent');



// Export Small Reservoir Extent

Export.image.toDrive({
  image: SRE,
  description: 'SREExtent',
  region: region,
  scale: 10,
  maxPixels: 1e13
  });
  
  

