/*
----------------------------------------------------
    Utility functions
----------------------------------------------------
*/   

//Lambda that return a list of values that scales from a min to max value, with a specified tick interval in between
const generateRange = (min, max, tick) => {
    // console.log("min: "+min +"\nmax: " + max + "\ntick: " + tick);

    var list = Array.from({ length: Math.ceil((max - min) / tick) + 1 }, (_, i) => min + i * tick);
    console.log("list", list);
    return list;
};

// Function to get the sorted categories based on the mapping
function getSortedCategories(data) {
    return [...new Set(data.map(d => d.weighted_avg_category))] // Get unique categories
        .sort((a, b) => categoryOrder[a] - categoryOrder[b]); // Sort using categoryOrder
}

function categorizeWeightedAvg(weightedAvg) {
    if (weightedAvg < 5) return "0-5";
    if (weightedAvg < 15) return "5-15";
    if (weightedAvg < 25) return "15-25";
    if (weightedAvg < 35) return "25-35";
    if (weightedAvg < 45) return "35-45";
    if (weightedAvg < 55) return "45-55";
    return "55-65"; // Adjust the ranges as needed
}
function dottedLegend() {
    // select the svg area
    var Svg = d3.select("#my_dataviz2")

    // create a list of keys
    var keys = ["Mister A", "Brigitte", "Eleonore", "Another friend", "Batman"]

    // Usually you have a color scale in your chart already
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeSet2);

    // Add one dot in the legend for each name.
    Svg.selectAll("mydots")
        .data(keys)
        .enter()
        .append("circle")
        .attr("cx", 100)
        .attr("cy", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 7)
        .style("fill", function (d) { return color(d) })

    // Add one dot in the legend for each name.
    Svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("x", 120)
        .attr("y", function (d, i) { return 100 + i * 25 }) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function (d) { return color(d) })
        .text(function (d) { return d })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
}

function displayCountries(countries, displayCount = 3) {
    const visibleCountries = countries.slice(0, displayCount);
    const remainingCount = countries.length - displayCount;

    if (countries.length === 2) {
        return `${visibleCountries[0]} and ${visibleCountries[1]}`;
    } else if (remainingCount > 0) {
        return `${visibleCountries.join(", ")}, and other countries`;
    } else {
        return visibleCountries.join(", ");
    }
}

/*
----------------------------------------------------
    Legend functions
----------------------------------------------------
*/   
// Use Susie Legend library
function customLinearVerticalLegend(
    colorScale,
    min,
    max,
    tick,
    margin,
    title,
    id) {

    d3.select(id).selectAll("*").remove(); // Clear previous 

    // Make the min max value nicer
    // min = Math.floor(min);
    // max = Math.ceil(max);

    // Create the legend
    var legendLinear = d3.legendColor()
        .cells(generateRange(min, max, tick))
        .scale(colorScale);

    // Create the SVG container
    var svgLegend = d3.select(id)
        .append("svg")
        .attr("width", 680)
        .attr("height", 300);

    // Append a group for the legend
    var legendGroup = svgLegend.append("g")
        .attr("transform", "translate(0,35)");

    // Add the title
    legendGroup.append("text")
        .attr("x", -1)
        .attr("y", -margin.top / 2) // Adjust the position of the title
        .attr("class", "legend-title") // Optional class for styling
        .text(title);

    // Call the legend
    legendGroup.call(legendLinear);
}

// Kelly
function customLinearVerticalLegend_2(
    colorScale,
    min,
    max,
    tick,
    margin,
    title,
    id) {

    d3.select(id).selectAll("*").remove(); // Clear previous 

    // Create the SVG container
    var svgLegend = d3.select(id)
        .append("svg")
        .attr("width", 680)
        .attr("height", 300);

    // Append a group for the legend
    var legendGroup = svgLegend.append("g")
        .attr("transform", "translate(0,35)");

    // Add the title
    legendGroup.append("text")
        .attr("x", -1)
        .attr("y", -margin.top / 2) // Adjust the position of the title
        .attr("class", "legend-title") // Optional class for styling
        .text(title);

    // Generate ticks
    var ticks = generateRange(min, max, tick);

    // Create rectangles for the legend
    var spaceBetwRect = 23;
    ticks.forEach((d, i) => {
        // Append rectangle for each category
        legendGroup.append("rect")
            .attr("x", 0) // X position
            .attr("y", i * spaceBetwRect) // Y position based on index
            .attr("width", 15) // Fixed width
            .attr("height", 15) // Fixed height
            .attr("fill", colorScale(d)); // Color based on scale

        // Append text label
        legendGroup.append("text")
            // .attr("transform", "translate(25, " + i*30+12.5 + ")") // Positioning the legend
            .attr("x", 25) // Space between rect and text
            .attr("y", i * spaceBetwRect + 13) // Center text vertically
            .text(d.toFixed(1)); // Label text
    });


}

// Use Susie Legend library
function customLinearHorizontalLegend(
    colorScale,
    min,
    max,
    tick,
    margin,
    title,
    id) {


    // Make the min max value nicer
    // min = Math.floor(min);
    // max = Math.ceil(max);


    d3.select(id).selectAll("*").remove(); // Clear previous heatmap
    

    // Create svg
    var svg = d3.select(id)
        .append("svg")
        .attr("height", 100)

    // Append a group for the legend
    var legendGroup = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(0," + 35 + ")");

    // Add the title
    legendGroup.append("text")
        .attr("x", -1)
        .attr("y", (-margin.top / 2))
        .attr("class", "legend-title") // Optional class for styling
        .text(title);

    var legendLinear = d3.legendColor()
        .shapeWidth(30)
        .cells(generateRange(min, max, tick))
        .orient('horizontal')
        .scale(colorScale);

    // Call the legend
    legendGroup.call(legendLinear);
}

// Use Susie Legend library
function customCategoryVerticalLegend(
    margin,
    title,
    id,
    domain,
    colorRange
) {

    d3.select(id).selectAll("*").remove(); // Clear previous heatmap

    var svg = d3.select(id)
        .append("svg")
        .attr("width", 170)
        .attr("height", domain.length * 30 + 15);

    var ordinal = d3.scaleOrdinal()
        .domain(domain)
        .range(colorRange);

    // Append a group for the legend
    var legendGroup = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(0," + 35 + ")");

    // Add the title
    legendGroup.append("text")
        .attr("x", -1)
        .attr("y", (-margin.top / 2))
        .attr("class", "legend-title") // Optional class for styling
        .text(title);

    svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,20)");

    var legendOrdinal = d3.legendColor()
        .scale(ordinal);

    // Call the legend
    legendGroup.call(legendOrdinal);
}

// Use Susie Legend library
function customCategoryVerticalLegend_2(
    margin,
    title,
    id,
    domain1,
    colorRange1,
    domain2,
    colorRange2
) {
    d3.select(id).selectAll("*").remove(); // Clear previous heatmap

    var svg = d3.select(id)
        .append("svg")
        .attr("width", 170)
        .attr("height", (domain1.length + domain2.length) * 30);

    // Create the first ordinal scale for the first domain
    var ordinal1 = d3.scaleOrdinal()
        .domain(domain1)
        .range(colorRange1);

    // Create the second ordinal scale for the second domain
    var ordinal2 = d3.scaleOrdinal()
        .domain(domain2)
        .range(colorRange2);

    // Append a group for the first legend
    var legendGroup1 = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(0," + 35 + ")");

    // Add the title for the first legend
    legendGroup1.append("text")
        .attr("x", -1)
        .attr("y", (-margin.top / 2))
        .attr("class", "legend-title") // Optional class for styling
        .text(title + " (Domain 1)");

    var legendOrdinal1 = d3.legendColor()
        .scale(ordinal1);

    // Call the first legend
    legendGroup1.call(legendOrdinal1);

    // Append a group for the second legend
    var legendGroup2 = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(0," + (35 + domain1.length * 38) + ")");

    // Add the title for the second legend
    legendGroup2.append("text")
        .attr("x", -1)
        .attr("y", (-margin.top / 2))
        .attr("class", "legend-title") // Optional class for styling
        .text(title + " (Domain 2)");

    var legendOrdinal2 = d3.legendColor()
        .scale(ordinal2);

    // Call the second legend
    legendGroup2.call(legendOrdinal2);
}

// Function to calculate Pearson correlation
function pearsonCorrelation(x, y) {
    const n = x.length;
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumX2 = d3.sum(x.map(val => val * val));
    const sumY2 = d3.sum(y.map(val => val * val));
    const sumXY = d3.sum(x.map((val, i) => val * y[i]));

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

// Kelly
function CustomCategoryVerticalLegend_3(
    margin, title, id, domain, colorRange
) {
    // Clear previous content
    d3.select(id).selectAll("*").remove();

    // Create the SVG container
    var svg = d3.select(id)
        .append("svg")
        .attr("width", 170)
        .attr("height", domain.length * 30 + 35); // Adjust height for the title

    // Create an ordinal scale for the colors
    var ordinal = d3.scaleOrdinal()
        .domain(domain)
        .range(colorRange);

    // Append a group for the legend
    var legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(0," + 35 + ")"); // Adjust for title height

    // Add the title
    legendGroup.append("text")
        .attr("x", -1)
        .attr("y", (-margin.top / 2))
        .attr("class", "legend-title") // Optional class for styling
        .text(title);

    var spaceBetwRect = 23;
    // Create legend items
    domain.forEach((d, i) => {
        // Append rectangle for each category
        legendGroup.append("rect")
            .attr("x", 0) // X position
            .attr("y", i * spaceBetwRect) // Y position based on index
            .attr("width", 15) // Fixed width
            .attr("height", 15) // Fixed height
            .attr("fill", ordinal(d)); // Color based on scale

        // Append text label
        legendGroup.append("text")
            // .attr("transform", "translate(25, " + i*30+12.5 + ")") // Positioning the legend
            .attr("x", 25) // Space between rect and text
            .attr("y", i * spaceBetwRect + 13) // Center text vertically
            .text(d); // Label text
    });
}