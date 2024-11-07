/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////
    
function RadarChart(id, data, options, sortedCountries) {
    var cfg = {
     w: 600,                //Width of the circle
     h: 600,                //Height of the circle
     margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
     levels: 3,             //How many levels or inner circles should there be drawn
     maxValue: 0,           //What is the value that the biggest circle will represent
     labelFactor: 1.25,     //How much farther than the radius of the outer circle should the labels be placed
     wrapWidth: 60,         //The number of pixels after which a label needs to be given a new line
     opacityArea: 0.35,     //The opacity of the area of the blob
     dotRadius: 4,          //The size of the colored circles of each blog
     opacityCircles: 0.1,   //The opacity of the circles of each blob
     strokeWidth: 2,        //The width of the stroke around each blob
     roundStrokes: false,   //If true the area and stroke will follow a round path (cardinal-closed)
     color: d3.scaleOrdinal(d3.schemeCategory10)    //Color function
    };
    
	// Select the parent div
	const parentDiv = d3.select("#radarChart"); // Replace with your actual parent div ID

	// Select all child elements except the inner div you want to keep
	parentDiv.selectAll("*")
		.filter(function() {
			return this !== document.getElementById("mental_legend");
		})
		.remove();


    //Put all of the options into a variable called cfg
    if('undefined' !== typeof options){
      for(var i in options){
        if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
      }//for i
    }//if

    console.log("data", data);
    // console.log("cfg.color", cfg.color);
    // console.log("cfg.color", cfg.color("Australia"));
    
    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i) {
        return d3.max(i.map(function(o) { return o.value; }));
    }));
    
    var allAxis = (data[0].map(function(i, j){return i.axis})), //Names of each axis
        total = allAxis.length,                 //The number of different axes
        radius = Math.min(cfg.w/2, cfg.h/2),    //Radius of the outermost circle
        Format = d3.format('.0%'),              //Percentage formatting
        Format2 = d3.format('.3%'),             //Percentage formatting
        angleSlice = Math.PI * 2 / total;       //The width in radians of each "slice"
    
    //Scale for the radius
    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);
        
    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////

    //Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();
    
    //Initiate the radar chart SVG
    var svg = d3.select(id).append("svg")
            .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
            .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
            .attr("class", "radar"+id);
    //Append a g element        
    // var g = svg.append("g")
    //      .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
    var g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w/2.2) + "," + (cfg.h/2 + cfg.margin.top) + ")");

        
    /////////////////////////////////////////////////////////
    ////////// Glow filter for some extra pizzazz ///////////
    /////////////////////////////////////////////////////////
    
    //Filter for the outside glow
    var filter = g.append('defs').append('filter').attr('id','glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////
    
    //Wrapper for the grid & axes
    var axisGrid = g.append("g").attr("class", "axisWrapper");
    
    //Draw the background circles
    axisGrid.selectAll(".levels")
       .data(d3.range(1,(cfg.levels+1)).reverse())
       .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i){return radius/cfg.levels*d;})
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
       .data(d3.range(1,(cfg.levels+1)).reverse())
       .enter().append("text")
       .attr("class", "axisLabel")
       .attr("x", 4)
       .attr("y", function(d){return -d*radius/cfg.levels;})
       .attr("dy", "0.4em")
       .style("font-size", "12px")
       .attr("fill", "#2a2a2a")
    //    .attr("fill", "#737373")
       .text(function(d,i,j) { 
            // console.log("d", d);
            // console.log("i", i);
            // console.log("j", j);
            // console.log("maxValue", maxValue)
            // return Format(maxValue * d/cfg.levels); 
            return Format(maxValue * d/cfg.levels/100); 
        });

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////
    
    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "15px")
        .attr("text-anchor", "middle")
        .attr("font-weight", 500)
        .attr("fill","#2a2a2a")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
        .text(function(d){return d})
        .call(wrap, cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////
    
    //The radial line function
    var radarLine = d3.lineRadial()
        .curve(d3.curveLinearClosed) //or curveBasisClosed, but they make no difference
        .radius(function(d) { return rScale(d.value); })
        .angle(function(d, i) { return i * angleSlice; });
            
    if(cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed); //Make the stroke round
    }

    //Create a wrapper for the blobs    
    var blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");
            
    //Append the backgrounds    
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("fill", function(d,i) { 
            // console.log("i", i);
            // return cfg.color(i);
            return cfg.color(sortedCountries[i]); //Need to use this, some bugs when passed in colorScale with domain preset
        })
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function (d,i){
            //Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1); 
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.9);    
        })
        .on('mouseout', function(){
            //Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });
        
    //Create the outlines   
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", function(d,i) { return cfg.color(sortedCountries[i]); })
        .style("fill", "none")
        .style("filter" , "url(#glow)");        
    
    //Append the circles
    // This old version has the circle to be yellow instead of matching own data
    // blobWrapper.selectAll(".radarCircle")
    //  .data(function(d,i,j) { 
    //      console.log("d", d);
    //      console.log("i", i);
    //      console.log("j", j);
    //      return d; 
    //  })
    //  .enter().append("circle")
    //  .attr("class", "radarCircle")
    //  .attr("r", cfg.dotRadius)
    //  .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
    //  .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
    //  .style("fill", function(d,i,j) { 
    //      return cfg.color(j); 
    //  })
    //  .style("fill-opacity", 0.8);

    // Working version for D3 v6 & v3.5.6
    blobWrapper.each(function(d, blobIndex) {
        var blob = d3.select(this);
        blob.selectAll(".radarCircle")
            .data(d) // Use the current blob data
            .enter()
            .append("circle")
            .attr("class", "radarCircle")
            .attr("r", cfg.dotRadius)
            .attr("cx", function(d, i) { 
                return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); 
            })
            .attr("cy", function(d, i) { 
                return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); 
            })
            .attr("fill", function(d, i, j) { 
                return cfg.color(sortedCountries[blobIndex]); 
            }) // Use the index of the current blob to get the color
            .style("fill-opacity", 0.8);
        });

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////
    
    //Wrapper for the invisible circles on top
    var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");
    
    
    // Set up the small tooltip for when you hover over a circle
    var tooltipGroup = g.append("g")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Append a rectangle for the background
    // tooltipGroup.append("rect")
    //  .attr("class", "tooltip-bg")
    //  .attr("fill", "#2a2a2a")
    //  // .attr("fill", "rgba(0, 0, 0, 0.7)") // Background color
    //  .attr("rx", 4) // Rounded corners (optional)
    //  .attr("ry", 4); // Rounded corners (optional)
    tooltipGroup.append("rect")
        .attr("class", "tooltip-bg")
        .attr("fill", "white")
        .attr("stroke", "#2a2a2a") // Set the border color
        .attr("stroke-width", "1px") // Set the border width
        .attr("rx", 4) // Rounded corners
        .attr("ry", 4); // Rounded corners

    // Append the text element to the tooltip group
    var tooltip = tooltipGroup.append("text");
        // .attr("fill", "white"); // Text color

    // Helper function to find back the country of each i.value
    var findCountryByValue = function(data, i) {
        // Loop through each country data array
        for (let countryIndex = 0; countryIndex < data.length; countryIndex++) {
            const countryData = data[countryIndex];
    
            // Loop through each axis-value pair in the country's data
            for (let entry of countryData) {
                // Check if the axis and value match
                if (entry.axis === i.axis && entry.value === i.value) {
                    return countryIndex;
                }
            }
        }
        // Return a message if no match is found
        return -1;
    }

    // Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle") 
        .data(function(d, i) { return d; })
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", function(d, i) { return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); })
        .attr("cy", function(d, i) { return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d, i, j) {
            var newX = parseFloat(d3.select(this).attr('cx')) - 10;
            var newY = parseFloat(d3.select(this).attr('cy')) - 10;

            // tooltip
            //  .html(tooltip_text) // Use i.value instead of d.value to fix NaN%
            //  .attr('x', newX)
            //  .attr('y', newY);

            var countryIndex = findCountryByValue(data, i);

            // Use i.value instead of d.value to fix NaN%
            var populationText = "Population with " + i.axis + ": " + Format2(i.value / 100);
        
            // Clear previous tspans
            tooltip.selectAll("*").remove();
        
            // Add the country name
            tooltip.append("tspan")
                .text(sortedCountries[countryIndex])
                .attr("x", newX) // Set x position for the first line
                .attr("dy", 0) // First line
                .attr("fill", "#2a2a2a") // Set font color
                // .attr("text-anchor", "middle")
                .attr("font-weight", "bold"); // Make text bold

            // Add the population line
            tooltip.append("tspan")
                .text(populationText)
                .attr("x", newX) // Keep x position consistent
                .attr("dy", "1.2em") // Move down for the next line
                .attr("fill", "#2a2a2a"); // Set font color

            // Get the bounding box of the text
            var bbox = tooltip.node().getBBox();

            // Update the rectangle size and position to fit the text
            tooltipGroup.select("rect")
                .attr("x", bbox.x - 5) // Add padding
                .attr("y", bbox.y - 5) // Add padding
                .attr("width", bbox.width + 10) // Add padding
                .attr("height", bbox.height + 10); // Add padding

            tooltipGroup.transition().duration(200)
                .style('opacity', 1);
        })
        .on("mouseout", function() {
            // tooltipGroup.transition().duration(200)
            tooltipGroup
                .style("opacity", 0);
        });

    // //Set up the small tooltip for when you hover over a circle
    // var tooltip = g.append("text")
    //  .attr("class", "tooltip")
    //  .style("opacity", 0);

                
    // //Append a set of invisible circles on top for the mouseover pop-up
    // blobCircleWrapper.selectAll(".radarInvisibleCircle") 
    //  .data(function(d,i) { return d; })
    //  .enter().append("circle")
    //  .attr("class", "radarInvisibleCircle")
    //  .attr("r", cfg.dotRadius*1.5)
    //  .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
    //  .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
    //  .style("fill", "none")
    //  .style("pointer-events", "all")
    //  .on("mouseover", function(d,i) {
    //      newX =  parseFloat(d3.select(this).attr('cx')) - 10;
    //      newY =  parseFloat(d3.select(this).attr('cy')) - 10;
        
    //      tooltip
    //          .attr('x', newX)
    //          .attr('y', newY)
    //          .text(Format2(i.value/100)) //use i.value instead of d.value to fix NaN% shown in version 6             
    //          .transition().duration(200)
    //          .style('opacity', 1);
    //  })
    //  .on("mouseout", function(){
    //      tooltip.transition().duration(200)
    //          .style("opacity", 0);
    //  });

    // This method makes dot cover other area/path
    // blobCircleWrapper.each(function(d, blobIndex) {
    //  var blob = d3.select(this);
    //  blob.selectAll(".radarInvisibleCircle")
    //      .data(d) // Use the current blob data
    //      .enter()
    //      .append("circle")
    //      .attr("class", "radarInvisibleCircle")
    //      .attr("r", cfg.dotRadius * 1)
    //      .attr("cx", function(d, i) { 
    //          return rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2); 
    //      })
    //      .attr("cy", function(d, i) { 
    //          return rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2); 
    //      })
    //      // .style("fill", "none")
    //      .style("pointer-events", "all")
    //      .style("z-index", 10000)
    //      .attr("fill", function(d, i, j) { 
    //          return cfg.color(blobIndex); 
    //      }) // Use the index of the current blob to get the color
    //      .style('opacity', .1); //We will notice the original colour of the dot is still yellowish
    //  });

    // blobCircleWrapper.selectAll(".radarInvisibleCircle")
    //  .on("mouseover", function(d,i) {
    //      newX =  parseFloat(d3.select(this).attr('cx')) - 10;
    //      newY =  parseFloat(d3.select(this).attr('cy')) - 10;
                    
    //      tooltip
    //          .attr('x', newX)
    //          .attr('y', newY)
    //          .text(Format(i.value)) //use i.value instead of d.value to fix NaN% shown in version 6              
    //          .transition().duration(200)
    //          .style('opacity', 1);
    //  })
    //  .on("mouseout", function(){
    //      tooltip.transition().duration(200)
    //          .style("opacity", 0);
    //  });
    
    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text    
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.4, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }//wrap 
    
}//RadarChart

/*
-------------------------------------------
    Average out the chart data into top 
    vs bottom, instead of detail list of 
    top & bottom countries
-------------------------------------------
    */
// Calculate the average for each disorder
function averageOut (chartData_countriesList, countryLabel){

    // console.log("chartData_countriesList.length", chartData_countriesList.length)
    // Calculate the average for each disorder
    var avg = 0;
    chartData_countriesList.forEach(countryData => {
        avg += countryData.average;
    });
    avg /= chartData_countriesList.length;

    // Sum up the values for each disorder
    var Depressive = 0;
    chartData_countriesList.forEach(countryData => {
        Depressive += countryData.data[0].value;
    });
    Depressive /= chartData_countriesList.length;

    var Anxiety = 0;
    chartData_countriesList.forEach(countryData => {
        Anxiety += countryData.data[1].value;
    });

    Anxiety /= chartData_countriesList.length;
    // console.log("Anxiety",Anxiety)
    var Bipolar = 0;
    chartData_countriesList.forEach(countryData => {
        Bipolar += countryData.data[2].value;
    });
    Bipolar /= chartData_countriesList.length;

    var Eating = 0;
    chartData_countriesList.forEach(countryData => {
        Eating += countryData.data[3].value;
    });
    Eating /= chartData_countriesList.length;

    var Schizophrenia = 0;
    chartData_countriesList.forEach(countryData => {
        Schizophrenia += countryData.data[4].value;
    });
    Schizophrenia /= chartData_countriesList.length;

    var countries = [];
    chartData_countriesList.forEach(countryData => {
        countries.push(countryData.country);
    });

    var final = {
        originalCountries: countries,
        country: countryLabel,
        average: avg,
        data: [
            { axis: "Depressive disorders", value: Depressive },
            { axis: "Anxiety disorders", value: Anxiety },
            { axis: "Bipolar disorder", value: Bipolar },
            { axis: "Eating disorders", value: Eating },
            { axis: "Schizophrenia", value: Schizophrenia }
        ]
    }

    // console.log("final", final);
    return final;
}

function defaultChartData (data, numEleShown = 1){
    // Get data of top 3 countries by mortality 
    let chartData_highestCountriesList = highMortalityCountries.map(country => {
        let countryData = data.find(d => d.Entity == country);
        // console.log("countryData", countryData);

        // Create an array of disorder values
        let disorderValues = [
            countryData.Prevalence_Depressive_disorders,
            countryData.Prevalence_Anxiety_disorders,
            countryData.Prevalence_Bipolar_disorder,
            countryData.Prevalence_Eating_disorders,
            countryData.Prevalence_Schizophrenia
        ];

        // Calculate the average
        let average = disorderValues.reduce((sum, value) => sum + parseFloat(value || 0), 0) / disorderValues.length;

        return {
            country: country,
            average: average,
            data: [
                { axis: "Depressive disorders", value: countryData.Prevalence_Depressive_disorders },
                { axis: "Anxiety disorders", value: countryData.Prevalence_Anxiety_disorders },
                { axis: "Bipolar disorder", value: countryData.Prevalence_Bipolar_disorder },
                { axis: "Eating disorders", value: countryData.Prevalence_Eating_disorders },
                { axis: "Schizophrenia", value: countryData.Prevalence_Schizophrenia }
            ]
        };
    });

    // Get data of bottom 3 countries by mortality 
    let chartData_lowestCountriesList = lowMortalityCountries.map(country => {
        let countryData = data.find(d => d.Entity == country);
        // console.log(countryData);

        // Create an array of disorder values
        let disorderValues = [
            countryData.Prevalence_Depressive_disorders,
            countryData.Prevalence_Anxiety_disorders,
            countryData.Prevalence_Bipolar_disorder,
            countryData.Prevalence_Eating_disorders,
            countryData.Prevalence_Schizophrenia
        ];

        // Calculate the average
        let average = disorderValues.reduce((sum, value) => sum + parseFloat(value || 0), 0) / disorderValues.length;

        return {
            country: country,
            average: average,
            data: [
                { axis: "Depressive disorders", value: countryData.Prevalence_Depressive_disorders },
                { axis: "Anxiety disorders", value: countryData.Prevalence_Anxiety_disorders },
                { axis: "Bipolar disorder", value: countryData.Prevalence_Bipolar_disorder },
                { axis: "Eating disorders", value: countryData.Prevalence_Eating_disorders },
                { axis: "Schizophrenia", value: countryData.Prevalence_Schizophrenia }
            ]
        };
    });
    // console.log("chartData_lowestCountriesList", chartData_lowestCountriesList)

    var msg = " Countries";
    if (numEleShown == 1){
        msg = " Country";
    }
    averageData_high = averageOut(chartData_highestCountriesList.slice(0, numEleShown), "Top "+numEleShown+ msg);
    averageData_low = averageOut(chartData_lowestCountriesList.slice(0, numEleShown), "Bottom "+numEleShown+ msg);

    
    var chartData = [averageData_high, averageData_low]
    
    // Sort the chartData based on average in descending order, so when plot the data, biggest are at the back
    chartData.sort((a, b) => b.average - a.average);

    // Extract sorted data for the radar chart
    let sortedChartData = chartData.map(item => item.data);
    let sortedCountries = chartData.map(item => item.country);

    // console.log("averageData_high.originalCountries", averageData_high.originalCountries)

    return {
		chartData: chartData,
        sortedChartData: sortedChartData,
        sortedCountries: sortedCountries,
        highMortalityCountries: averageData_high.originalCountries,
        lowMortalityCountries: averageData_low.originalCountries,
    };
}

function insight_mental(chartData, highestCountry, lowestCountry){
	// Initialize an object to hold the maximum values for each axis
	const maxValues = {};
	
	// Iterate through each country's data
	chartData.forEach(countryData => {
		countryData.data.forEach(disorder => {
			const { axis, value } = disorder;
	
			// If the axis is not in maxValues or the current value is greater, update it
			if (!maxValues[axis] || value > maxValues[axis].value) {
				maxValues[axis] = { ...disorder, country: countryData.country }; // Also store the country
			}
		});
	});
	
	console.log("maxValues", maxValues);

	const countryDisorders = {};
		
	// Group disorders by country
	for (const axis in maxValues) {
		const country = maxValues[axis].country;
		if (!countryDisorders[country]) {
			countryDisorders[country] = [];
		}
		countryDisorders[country].push(axis);
	}

	console.log("countryDisorders", countryDisorders);

	var insights = ``;
	if (selectedMaxYear == selectedMinYear){
		insights = `In ${selectedMaxYear}, `;
	}
	else{
		insights = `During year from ${selectedMinYear} to ${selectedMaxYear},`;
	}

	if (chartData.length/2 == 1){
		// var insights = `Among the top 
		// ${chartData.length/2} (i.e., ${highestCountry}) 
		// and bottom ${chartData.length/2} countries 
		// (i.e., ${lowestCountry}) by mortality rates, the actual country with the largest populations suffering from various mental disorders are as follows: `;
		// Construct the final insights string
		const parts = [];
		for (const country in countryDisorders) {
			const disordersList = countryDisorders[country].join(', ');
			parts.push(`<strong>${country}</strong> by mortality rate has a higher female populations on <strong>${disordersList}</strong>`);
		}
		insights += parts.join(', ') + '.';

	}
	else{
		insights += ` among the top ${chartData.length/2} (i.e., ${highestCountry}) and bottom ${chartData.length/2} countries (i.e., ${lowestCountry}) by mortality rates, the actual country with the largest populations suffering from various mental disorders are as follows: `;


		
		// Construct the final insights string
		const parts = [];
		for (const country in countryDisorders) {
			const disordersList = countryDisorders[country].join(', ');
			parts.push(`<strong>${country}</strong> has the highest populations for <strong>${disordersList}</strong>`);
			// insights += (`<strong>${disordersList}: ${country}</strong>`);
		}
		
		// Join all parts and create the final insights
		insights += parts.join(', ') + '.';
	}
	

	return insights;
}
function insight_mental_v1(chartData){
	console.log(chartData);
	var insights = "";
	const results = [];
	var threshold = .5;
	var axis_with_no_diff = [];

	for (let i = 0; i < chartData.length; i++) {
		for (let j = i + 1; j < chartData.length; j++) {
			const country1 = chartData[i];
			const country2 = chartData[j];
			
			country1.data.forEach((item1, index) => {
				const item2 = country2.data[index];
				const difference = Math.abs(item1.value - item2.value);
				
				if (difference >= threshold) {
					results.push({
						axis: item1.axis,
						countries: [country1.country, country2.country],
						difference: difference,
						morePopulation: item1.value > item2.value ? country1.country : country2.country
					});
				}
			});
		}
	}

	// Find out the comparison for each country and their mental disorders
	// results.forEach(result => {
	// 	console.log(`For ${result.axis}: There is quite a difference. ${result.morePopulation} has a higher value than ${result.countries.find(c => c !== result.morePopulation)}.`);
	// });

	const summary = {};

	results.forEach(result => {
		const { axis, morePopulation, countries } = result;

		// Initialize summary for the axis if it doesn't exist
		if (!summary[axis]) {
			summary[axis] = {
				countries: new Set(),
				higherValue: morePopulation
			};
		}

		summary[axis].countries.add(morePopulation);
	});
	 console.log("summary", summary)
	
	var insights = `Among the 
		top 3 & bottom 3 countries by mortality rates, 
		the actual countries with the largest populations suffering from various mental disorders are as follows:`;
	for (const [axis, data] of Object.entries(summary)) {
		const higherCountries = Array.from(data.countries).join(' and ');
		console.log(`For ${axis}: ${higherCountries} has a higher value.`);
	}
	
	// console.log(`For ${axis_with_no_diff.join(", ")}: there is not much differences between the top & bottom mortality countries.`);
	
	console.log("insights",insights);
	return insights;
}


function insight_mental_v2(chartData){
	const groupAData = chartData[0].data;
	const groupBData = chartData[1].data;
	var noDifferenceAtAll = [];

	const results = [];
	if (selectedMaxYear == selectedMinYear){
		results.push(`In ${selectedMaxYear}, the notable difference of female population affected various mental mental disorders are as follows: `);
	}
	else{
		results.push(`During year from ${selectedMinYear} to ${selectedMaxYear}, the notable difference of female population affected various mental mental disorders are as follows: `);
	}

	// const results = [
	// 	`The notable difference of female population affected various mental mental disorders are as follows: `
	// ];
    // (i.e., ${highMortalityCountries.join(", ")})
    
	groupAData.forEach(groupA => {
		const groupB = groupBData.find(g => g.axis === groupA.axis);
		
		if (groupB) {
			const difference = groupA.value - groupB.value;
			if (Math.abs(difference) > 0.5) {
				// const higherGroup = difference > 0 ? chartData[0].country : chartData[1].country;
				// const lowerGroup = difference > 0 ? chartData[1].country : chartData[0].country;
                
				const higherGroup = difference > 0 ? chartData[0] : chartData[1];
				const lowerGroup = difference > 0 ? chartData[1] : chartData[0];
                console.log("higherGroup", higherGroup)
				// results.push(
				// 	// `There is a notable female population difference: Within the ${higherGroup} and bottom 3 countries (i.e., Costa Rica, Turkey, Israel) by mortality rates, the actual country with the largest populations suffering from various mental disorders are as follows:`
				// );
				// results.push(`There is a notable difference of female population affected 
				// 	by ${groupA.axis} where ${higherGroup} 
				// 	has higher population than ${lowerGroup} by mortality rate .`);
				// results.push(`${higherGroup} has higher female population of ${groupA.axis} than ${lowerGroup},`);
				results.push(`${higherGroup.country} (i.e., ${higherGroup.originalCountries.join(", ")}) by mortality rate has higher female population of ${groupA.axis} than ${lowerGroup.country} (i.e., ${lowerGroup.originalCountries.join(", ")}).`);

				// results.push(`There is a notable female population difference: ${higherGroup} has higher ${groupA.axis} (${groupA.value.toFixed(2)}) than ${lowerGroup} (${groupB.value.toFixed(2)}).`);
			} 
			else{
				noDifferenceAtAll.push(true);
			}
			// else {
			// 	results.push(`No significant difference in ${groupA.axis}.`);
			// }
		}
	});

	if (noDifferenceAtAll.length == groupAData.length){
		if (selectedMaxYear == selectedMinYear){
			return (`In ${selectedMaxYear}, the difference in 
			female populations affected by 
			various mental disorders, 
			is minimal between <strong>${chartData[0].country}</strong> and <strong>${chartData[1].country}</strong> by mortality rate .
			`);
		}
		else{
			return (`During year from ${selectedMinYear} to ${selectedMaxYear}, 
				the difference in female populations affected by 
				various mental disorders, is minimal between <strong>${chartData[0].country}</strong> and <strong>${chartData[1].country}</strong> by mortality rate .
			`);
		}
	}

	return results.join('\n');

}

(function() {
	/*
    ------------------------------------
        Event listeners for buttons
    -------------------------------------
    */
    //Show detail top & bottom list of countries
    document.getElementById('btn_mental_top_bottom').addEventListener('click', function() {
		if (originalData == {}){
            return;
        }

		// Update & filter the data based on the year selected on story 1
		var filteredData = originalData.filter(d => +d.Year >= selectedMinYear && +d.Year <= selectedMaxYear);


        var defaultData = defaultChartData(filteredData, 3);
        // console.log("defaultData", defaultData);
        
        var color = d3.scaleOrdinal()
            .domain(defaultData.sortedCountries)
            .range(COLORS.categoryRange);

        var radarChartOptions = {
            w: width,
            h: height,
            margin: margin,
            maxValue: 7,
            // maxValue: 12,
            levels: 7,
            // levels: 6,
            labelFactor: 1.35,
            roundStrokes: true,
            color: color
        };
        // Call RadarChart function with the prepared data
        RadarChart(".radarChart", defaultData.sortedChartData, radarChartOptions, defaultData.sortedCountries);

		// var insights = insight_mental(defaultData.chartData, 
		// 	defaultData.highMortalityCountries.join(", "),
		// 	defaultData.lowMortalityCountries.join(", "));
		console.log("defaultData.chartData", defaultData.chartData)
		// var insights = insight_mental_v1(defaultData.chartData);
        // var insights = `The percentage of female population of XXXX disorders within Top 1 country 
        //     (i.e., ${defaultData.highMortalityCountries.join(', ')}) is higher than 
        //     Bottom 1 country (i.e., ${defaultData.lowMortalityCountries.join(", ")}).`
        document.getElementById("story3_mental_insight").innerHTML = insight_mental_v2(defaultData.chartData);

        // Create legend
        CustomCategoryVerticalLegend_3(
            { top: 30, right: 0, bottom: 70, left: 70 },
            "Countries",
            "#mental_legend",
            defaultData.sortedCountries,
            COLORS.categoryRange
        );

    });

    //Show detail list of top & bottom countries
    document.getElementById('btn_mental_detail').addEventListener('click', function() {
		if (originalData == {}){
            return;
        }

		// Update & filter the data based on the year selected on story 1
		var filteredData = originalData.filter(d => +d.Year >= selectedMinYear && +d.Year <= selectedMaxYear);

		// Get data of top 3 countries by mortality 
		let chartData_highestCountriesList = highMortalityCountries.map(country => {
			let countryData = filteredData.find(d => d.Entity == country);
			// console.log("countryData", countryData);

			// Create an array of disorder values
			let disorderValues = [
				countryData.Prevalence_Depressive_disorders,
				countryData.Prevalence_Anxiety_disorders,
				countryData.Prevalence_Bipolar_disorder,
				countryData.Prevalence_Eating_disorders,
				countryData.Prevalence_Schizophrenia
			];

			// Calculate the average
			let average = disorderValues.reduce((sum, value) => sum + parseFloat(value || 0), 0) / disorderValues.length;

			return {
				country: country,
				average: average,
				data: [
					{ axis: "Depressive disorders", value: countryData.Prevalence_Depressive_disorders },
					{ axis: "Anxiety disorders", value: countryData.Prevalence_Anxiety_disorders },
					{ axis: "Bipolar disorder", value: countryData.Prevalence_Bipolar_disorder },
					{ axis: "Eating disorders", value: countryData.Prevalence_Eating_disorders },
					{ axis: "Schizophrenia", value: countryData.Prevalence_Schizophrenia }
				]
			};
		});

		// Get data of bottom 3 countries by mortality 
		let chartData_lowestCountriesList = lowMortalityCountries.map(country => {
			let countryData = filteredData.find(d => d.Entity == country);
			// console.log(countryData);

			// Create an array of disorder values
			let disorderValues = [
				countryData.Prevalence_Depressive_disorders,
				countryData.Prevalence_Anxiety_disorders,
				countryData.Prevalence_Bipolar_disorder,
				countryData.Prevalence_Eating_disorders,
				countryData.Prevalence_Schizophrenia
			];

			// Calculate the average
			let average = disorderValues.reduce((sum, value) => sum + parseFloat(value || 0), 0) / disorderValues.length;

			return {
				country: country,
				average: average,
				data: [
					{ axis: "Depressive disorders", value: countryData.Prevalence_Depressive_disorders },
					{ axis: "Anxiety disorders", value: countryData.Prevalence_Anxiety_disorders },
					{ axis: "Bipolar disorder", value: countryData.Prevalence_Bipolar_disorder },
					{ axis: "Eating disorders", value: countryData.Prevalence_Eating_disorders },
					{ axis: "Schizophrenia", value: countryData.Prevalence_Schizophrenia }
				]
			};
		});
		
		// console.log("chartData_highestCountriesList", chartData_highestCountriesList)

		// Merge lowest & highest into a single list
		var chartData = Array.from(chartData_lowestCountriesList);

		chartData_highestCountriesList.forEach((item) => {
			chartData.push(item);
		});

		// Sort the chartData based on average in descending order, so when plot the data, biggest are at the back
		chartData.sort((a, b) => b.average - a.average);

		// console.log("chartData", chartData)

		// Extract sorted data for the radar chart
		let sortedChartData = chartData.map(item => item.data);
		let sortedCountries = chartData.map(item => item.country);

		// console.log("sortedChartData", sortedChartData);

		// Decide the colour for each country based on their top & bottom mortality rate
		var colors = ["#FFF4DF", "#FFD380", "#FFA600", "#FFC0CB", "#E5669D", "#CA0C6E"];
		var counter_high = 3;
		var counter_low = 0;
		var colorRange = new Array(sortedCountries.length); // Initialize based on sortedCountries length
		
		for (let i = 0; i < sortedCountries.length; i++) {
			// Check if the country is in lowMortalityCountries
			if (lowMortalityCountries.includes(sortedCountries[i]) && counter_low < colors.length) {
				colorRange[i] = colors[counter_low];
				counter_low += 1; // Track which color is taken
			}
			// Check if the country is in highMortalityCountries
			else if (highMortalityCountries.includes(sortedCountries[i]) && counter_high < colors.length) {
				colorRange[i] = colors[counter_high];
				counter_high += 1; // Track which color is taken
			}
			// You may want to add a default case if the country is in neither list
		}
		
		var color = d3.scaleOrdinal()
			.domain(sortedCountries)
			.range(colorRange);

		var radarChartOptions = {
			w: width,
			h: height,
			margin: margin,
			maxValue: 7,
			// maxValue: 12,
			levels: 7,
			// levels: 6,
			labelFactor: 1.35,
			roundStrokes: true,
			color: color
		};
		// Call RadarChart function with the prepared data
		RadarChart(".radarChart", sortedChartData, radarChartOptions, sortedCountries);

		// Update the insights
		var insights = insight_mental(chartData, 
			chartData_highestCountriesList.map(item => item.country).join(', '), 
			chartData_lowestCountriesList.map(item => item.country).join(", "));

		// var insights = `The percentage of female population of XXXX disorders within Top 1 country 
		// 	(i.e., ${chartData_highestCountriesList.map(item => item.country).join(', ')}) is higher than 
		// 	Bottom 1 country (i.e., ${chartData_lowestCountriesList.map(item => item.country).join(", ")}).`
		document.getElementById("story3_mental_insight").innerHTML = insights;

        // document.getElementById("story3_mental_insight").innerHTML = `<b>insights</b>`;
		
		// Create legend
		CustomCategoryVerticalLegend_3(
			{ top: 30, right: 0, bottom: 70, left: 70 },
			"Countries",
			"#mental_legend",
			sortedCountries,
			colorRange
		);

    });

    //Show detail averaged of top vs bottom
    document.getElementById('btn_mental_reset').addEventListener('click', function() {
        if (originalData == {}){
            return;
        }
		
		// Update & filter the data based on the year selected on story 1
		var filteredData = originalData.filter(d => +d.Year >= selectedMinYear && +d.Year <= selectedMaxYear);

        var defaultData = defaultChartData(filteredData);
        // console.log("defaultData", defaultData);
        
        var color = d3.scaleOrdinal()
            .domain(defaultData.sortedCountries)
            .range(COLORS.categoryRange);

        var radarChartOptions = {
            w: width,
            h: height,
            margin: margin,
            maxValue: 7,
            // maxValue: 12,
            levels: 7,
            // levels: 6,
            labelFactor: 1.35,
            roundStrokes: true,
            color: color
        };
        // Call RadarChart function with the prepared data
        RadarChart(".radarChart", defaultData.sortedChartData, radarChartOptions, defaultData.sortedCountries);

        // var insights = `The percentage of female population of XXXX disorders within Top 1 country 
        //     (i.e., ${defaultData.highMortalityCountries.join(', ')}) is higher than 
        //     Bottom 1 country (i.e., ${defaultData.lowMortalityCountries.join(", ")}).`
        document.getElementById("story3_mental_insight").textContent = insight_mental_v2(defaultData.chartData);

        // Create legend
        CustomCategoryVerticalLegend_3(
            { top: 30, right: 0, bottom: 70, left: 70 },
            "Countries",
            "#mental_legend",
            defaultData.sortedCountries,
            COLORS.categoryRange
        );
    });

    /* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */
      
    ////////////////////////////////////////////////////////////// 
    //////////////////////// Set-Up ////////////////////////////// 
    ////////////////////////////////////////////////////////////// 
    var margin = {top: 100, right: 100, bottom: 100, left: 100},
        width = 800,
        height = 484;

            
    ////////////////////////////////////////////////////////////// 
    ////////////////////////// Data ////////////////////////////// 
    ////////////////////////////////////////////////////////////// 

    // console.log("highMortalityCountries", highMortalityCountries)
    var originalData = {};

    d3.csv("datasets/mental_health.csv").then(function(data) {
        // Take year 2000-2022.
        data = data.filter(d => +d.Year >= selectedMinYear && +d.Year <= selectedMaxYear);

        // Make sure it is number
        data.forEach(function (d) {
            d.Prevalence_Depressive_disorders = +d.Prevalence_Depressive_disorders; 
            d.Prevalence_Anxiety_disorders = +d.Prevalence_Anxiety_disorders;
            d.Prevalence_Bipolar_disorder = +d.Prevalence_Bipolar_disorder;
            d.Prevalence_Eating_disorders = +d.Prevalence_Eating_disorders;
            d.Prevalence_Schizophrenia = +d.Prevalence_Schizophrenia;
        });
        
        originalData = data;
		document.getElementById('btn_mental_reset').click();

    })
    .catch(function (error) {
        console.error('Error loading the CSV file:', error);
    });

})();

