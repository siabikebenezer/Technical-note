# Technical-note
# Machine learning algorithm for mapping small reservoir using Sentinel-2 satellite imagery in Google Earth Engine

# Background
In Ghana the WP3 of the Aquatic Foods initiative of the CGIAR will pilot in partnership with the Fisheries Commission and the Water Research Institute (CSIR-WRI) the introduction of fish cage culture in small reservoirs. The objective is to support the multi-functionality of the water bodies and strengthen food security, poverty reduction, women and youth empowerment.
Of component of the pilot will use geospatial analysis and machine learning to identify and characterize small reservoirs suitable for aquaculture. A database on small reservoirs will provide quantified and objective information to support the scaling up of approaches and methods. Generic geospatial tools will be developed that can be deployed to other intervention zones of the program.
Between 2020 and 2022 IWMI implemented a study to map small reservoirs in the Upper East Region of Ghana. During six consecutive dry seasons (running from November to April) between 2015 and 2021, the surface areas of small reservoirs were mapped in monthly time steps. The results were validated with ground observation and GoogleEarth interpretation, and accuracy was found to be high. The methodology and the results of the study are published in Ghansah et al, 2022 (https://www.sciencedirect.com/science/article/pii/S147470652100125X?via%3Dihub). 
The algorithm to map small reservoir extent monthly has been improved during 2023 implementation phase to reduce cloud contamination in the monthly composites. This report describes the Google Earth scripts used to generate high quality maps of small reservoir extent for northern Ghana.


# Methodology
Figure 1 illustrates the step-by-step process for mapping small reservoirs, encompassing the datasets used, cloud removal, algorithm development, as well as the classification and extraction of small reservoir extents.
![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/2d012da2-a3ea-49e0-8956-692b622da19f)


Figure 1. Overall methodology for mapping small reservoirs


# Definition of image collection filters and cloud mask conditions
This section is intended to build filters for sentinel 2 image collections over the five northern regions of Ghana (Upper West, Upper East, North East, Northern and Savannah) for the study period (November 2018 to April 2023). Here, the region of interest is the boundary of the Northern Ghana. The study focused on building monthly composites for each dry year. Therefore, the values currently set for the start and end dates represent the first month (November) of the first dry year (2018). We then set maximum cloud probability value where values greater than are identified as cloud. This requires the user to try different threshold values based on their preferences until an optimal threshold is reached. However, a default value of 40% is recommended. For this study, an optimal maximum cloud probability threshold of 30% was used after applying different thresholds. Threshold values lower than our optimal threshold resulted in the removal of portions of the study area and small reservoirs which were detected as clouds or cloud shadows. Conversely, those above our optimal threshold resulted in cloud contaminations. We then added functions to mask clouds based on the maximum cloud probability. In the code snippet below, you will see a function Map.setCenter(). This sets the viewport to a study area and at a zoom level of 7. Again, Map.setOptions (‘satellite) sets a high-resolution satellite image as a basemap imagery. The step-by-step process is shown in the code snippets below.

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/0ba3c7da-35f0-4c96-86b2-15c36e4157d0)

	Import region of interest and center it. Set other options by adding satellite as the base map. 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/f33bc315-a920-44f5-bf77-804cbb1dd61d)

	Define start and end dates for the image collection and determine maximum cloud probability. Maximum cloud probability may vary depending on the desired outcome. We set the maximum cloud probability threshold to 30 for the small reservoir mapping. 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/164e83e6-08a9-4a6d-9774-03615c90ca9e)

	Create a function to mask clouds based on the cloud probability threshold

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/135828b5-4c52-41ee-a4d3-615a12302727)

	The masks for the 10m bands sometimes do not exclude noise at scene edges. Therefore, we apply function to masks from the 20m and 60m bands as well. 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/5dc074ea-42d6-49d3-a784-1052f4e87a0f)

# Building image collection and masking clouds
There are two main datasets need to build a cloudless image collection. These are Sentinel 2 surface reflectance and Sentinel 2 cloud probability datasets. These are two different image collections and must be filtered individual by date and region of interest. The filtered collections are joined afterwards. Here, we defined a function to filter the sentinel 2 and sentinel 2 cloud probability collections based on our study area (Northern Ghana) and date parameters (i.e.  start date and end date). We then joined the two datasets on the system:index property. This generated a copy of sentinel 2 image collection for the Northern Ghana where each image has a new Sentinel 2 cloud probability property whose value is the corresponding Sentinel 2 cloud probability image. Here we can set visualization parameters to add the result to the map layer to explore the data for cloud contamination. If the result is fully corrected as desired, users may proceed to the next step. However, if there are cloud contaminations such as cloud footprints and shadows, users may change the maximum cloud probability threshold until a desired outcome is achieved. As stated above, a maximum cloud probability threshold of 30% was found good for the study. The step-by-step process is shown in the code snippets below.

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/7f1479b0-cce0-48c1-9266-6ad0dc6dd4d5)

	Sentinel-2 surface reflectance and Sentinel-2 cloud probability are distinct image collections. Each collection needs to undergo similar filtering processes (e.g., based on date and ROI), followed by joining the filtered collections.


	Import Sentinel 2 collection and cloud probability datasets

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/114622a7-d3ea-4e0e-9e36-6200b6322f76)


	Filter input image collections by desired data range and region

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/fdfc28eb-50cd-4989-a034-d01841a1069a)


	Join the sentinel 2 collection with the cloud probability dataset on the ‘system:index’ property and add cloud mask. The outcome is a new sentinel 2 collection where each image has a new ‘cloud probability’ property whose value is the corresponding cloud probability image. 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/e25524aa-905a-4a35-b9d4-c43ad5176e01)

	Comment out to print the image collection

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/e8d54320-a040-4671-9c47-75daf014bec5)


# Spectral indices and image collection compositing
We can add some spectral indices to our image collection. This will improve the image collection and prediction accuracy of predictive models when applied. For this study, we estimated two spectral indices using a function; the Normalized Difference Vegetation Index (NDVI) and Modified Normalized Difference Water Index (MNDWI) using the normalizedDifference() function. This function estimates normalized difference between two bands. For NDVI, the NIR (B8) and RED (B4) were used for the estimation. For MNDWI, we used the GREEN (B3) and SWIR1 (B11) for the estimation. The two spectral indices were mapped across all images in the image collection. We then created a composite image using a selection criterion to each pixel from all the pixels in the image collection. Here, we employed the median() function to generate a composite where each pixel value is the median of all pixels from the image collection. Finally, we set visualization parameters to add the composited map to layer (see Figure 2). We used the Band 4, Band 3 and Band 2 as our visualization bands as well as a minimum and maximum values of 0 and 3000 respectively. The step-by-step process is shown in the code snippets below.

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/b06b1652-8dc8-4392-b672-211c6781e9ac)

	Define function to maps spectral indices to enhance classification accuracy


![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/6b82c283-9cda-4107-aaf9-5117533ffdd4)

	Composite the Sentinel 2 image collection

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/42e2e3c9-1f4f-4ed8-8347-4789960a54b5)

	Define visualization parameters for the image collection

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/dad20fdc-7caf-4b0b-8ee5-acf29ded5b69)

	Add layer to the map

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/0fb174eb-fc68-4144-9a9c-8786c78d3f80)

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/bacee5ff-625d-45b4-a4a4-4344d72b782c)

Figure 2.  Sentinel 2 image over the five northern regions of Ghana


# Developing Random Forest model for mapping
We developed a predictive model to map small reservoirs in the study area. There are several machine learning algorithms for mapping, however, we utilized the Random Forest algorithm for our study. We generated training samples from the high resolution basemap imagery provided by Google maps. The aim is to classify each source pixel into the two classes – water and non-water. We generated at least 80-100 feature collections (encompassing points and polygons) for each class using the drawing tool in the code editor. Each feature collection was given a property called ‘water’ with values of 0 and 1 showing whether the feature collection is non-water or water respectively. Here, we merged the water and non-water samples and divided it into training (80%) and testing (20%) datasets. Four bands (B3, B4, and B5 and MNDWI) were utilized as predictors. Subsequently, we used the .smileRandomForest classifier for the algorithm development with 100 trees and 4 randomly selected predictors per split. The term "smile" pertains to the Statistical Machine Intelligence and Learning Engine (SMILE), a JAVA library utilized by Google Earth Engine for implementing these algorithms. The model was built using the training set and applied to all pixels of the image to generate two class image. 
Obtaining a quantitative estimation of the classification's accuracy is crucial. We used the test dataset to validate our predictions. This is done once our model has been trained and applied to the entire image. In validating the model, the classified values were compared with the test set. We used the ee.Classifier.confusionMatrix function to estimate the confusion matrix representing the expected accuracy. Figure 4 shows an example of the validation error matrix and validation overall accuracy.
In obtaining a good overall accuracy score, the next step is to clean the classified image from noise. Here, we used the .connectedPixelCount function to mask unconnected pixels. Also, we masked all permanent waters using a 100m buffered stream network vector. The final result is then added to the map layer (see Figure 5). The step-by-step process is shown in the code snippets below. 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/1632101a-7156-4736-ba29-6e72380ceb8b)


	Generate training samples and predictors. After drawing training points and polygons, merge water and nonwater samples

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/183eb030-15a9-471b-8f82-9c70380785b1)


![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/ac79c393-0d1e-4eab-8853-2d39f5de8204)

Figure 3. Sample points and polygons for training and testing


	Define the Bands to include in the model

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/160b72a1-32b6-4fbd-adfe-2d85fbe32dad)

	Declare a variable called image to select the bands of interest and clip to ROI

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/2e3a2467-1062-4956-abbe-d4384d9c9af5)

	Assemble samples for the RandomForest model

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/a599b245-16b1-4dc9-b425-30dd98306019)

	Split samples into training and testing 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/1dea8f45-33a1-4db0-aab9-b161a3524b9f)

	Comment out to print these variables to see how much training and testing data you're using

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/98d3b65e-4337-4199-9021-59462e2e9481)

	Begin Random forest classification using .smileRandomForest for model with 100 trees and 4 randomly selected predictors per split 

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/f40badf9-b58e-46da-b26b-5f53b983d2b2)

	Test the accuracy of the model

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/f76eabcd-77ce-4883-b3ee-cddfaec47845)



![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/b12f9b67-075e-4fcb-bfa6-373e6c35852a)

Figure 4. Validation error matrix and the overall accuracy of the RandomForest model 


	Classify the merged composite using the randomforest model

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/e0cb3314-604f-4057-a13b-67302f26e1b4)

	Remove noise from model results by masking unconnected pixels

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/78494159-325d-4099-8535-357e1d2d1a9a)


	Mask the results to only display water extent

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/6fc5f5e8-645f-481f-907e-a624bbcce0c9)

	Mask all permanent waters to display small reservoir extent

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/6f651c5a-3c39-4721-a9c6-d733f7b21cc0)

	Add the final result to the map

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/cdf7e2e3-9f92-4f0c-88ad-261ee42d6874)


![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/fd22aa02-0ff8-4df6-b8ea-8f43d13726c5)

Figure 5. Small Reservoir extent classified by the RandomForest model

# Exporting Small Reservoir Extent
The Export.image.toDrive function is used to export the classified Small reservoir extent in a raster format after defining the required parameters. Here, the image is the classified small reservoir extent. The description represents the file name. The region represents the region of interest (Northern Ghana). We set a scale for Earth Engine to estimate a crsTransform parameter. Finally, the maxPixels parameter is designed to avoid the unintended creation of excessively large exports. If the default value doesn't align with a user’s desired output image, it can be adjusted by increasing maxPixels. Our maxPixels was set to 1e13 for the export.

	Define parameters to export small reservoir extent to drive.

![image](https://github.com/siabikebenezer/Technical-note/assets/69909609/250153b2-6bb5-44e4-aeab-f5fcb1cde46a)






























