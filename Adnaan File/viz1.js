function init() {
    var container = d3.select("#viz1_chart");
    var w = parseInt(container.style("width"));  
    var h = parseInt(container.style("height")); 

    // Create sliders for Year and Month dynamically
    createSliders();

    // Load the GeoJSON Map and store it globally
    d3.json("custom.geo.json").then(function(json) {
        window.geoJsonData = json;
        updateVisualization(window.geoJsonData, w, h);
    });
}

// Function to create sliders

//Year Slider 
function createSliders() {
    const yearSliderContainer = d3.select("#viz1").append("div").attr("class", "slider-container");
    yearSliderContainer.append("label").attr("for", "year-slider").text("Year: ");
    const yearSlider = yearSliderContainer.append("input")
        .attr("type", "range")
        .attr("id", "year-slider")
        .attr("min", 2020)
        .attr("max", 2024)
        .attr("value", 2020)
        .attr("step", 1)
        .on("input", function() {
            updateYearValue(this.value);
        });
    yearSliderContainer.append("span").attr("id", "selected-year").text(yearSlider.property("value"));

    // Month Slider 
    const monthSliderContainer = d3.select("#viz1").append("div").attr("class", "slider-container");
    monthSliderContainer.append("label").attr("for", "month-slider").text("Month: ");
    const monthSlider = monthSliderContainer.append("input")
        .attr("type", "range")
        .attr("id", "month-slider")
        .attr("min", 1)
        .attr("max", 12)
        .attr("value", 1)
        .attr("step", 1)
        .on("input", function() {
            updateMonthValue(this.value);
        });
    monthSliderContainer.append("span").attr("id", "selected-month").text("January");

    if (window.geoJsonData) {
        updateVisualization(window.geoJsonData, parseInt(d3.select("#viz1_chart").style("width")), parseInt(d3.select("#viz1_chart").style("height")));
    }
}

// Update selected year text
function updateYearValue(value) {
    d3.select("#selected-year").text(value);
    if (window.geoJsonData) {
        updateVisualization(window.geoJsonData, parseInt(d3.select("#viz1_chart").style("width")), parseInt(d3.select("#viz1_chart").style("height")));
    }
}

// Update selected month text with month names
function updateMonthValue(value) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    d3.select("#selected-month").text(monthNames[value - 1]); // Display month name
    if (window.geoJsonData) {
        updateVisualization(window.geoJsonData, parseInt(d3.select("#viz1_chart").style("width")), parseInt(d3.select("#viz1_chart").style("height")));
    }
}

// Function to update the visualization based on selected year and month
function updateVisualization(json, w, h) {
    const year = d3.select("#year-slider").property("value");
    const month = d3.select("#month-slider").property("value");

    d3.csv("cleaned_data_monthly_deaths.csv").then(function(data) {
        var deathsByCountry = {};
        var expenditureByCountry = {};

        // Filter and map data by year and month
        data.forEach(function(d) {
            const dataYear = d.Year;
            const dataMonth = +d.Month;

            if (dataYear == year && dataMonth == month) {
                const country = d.Country;
                deathsByCountry[country] = +d.Deaths || 0;
                expenditureByCountry[country] = +d.Expenditure || 0;
            }
        });

        var svg = d3.select("#viz1_chart").select("svg");
        if (svg.empty()) {
            svg = d3.select("#viz1_chart")
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%");
        }

        // Clear previous tooltip
        svg.selectAll(".tooltip").remove();

        // Define the Map 
        var projection = d3.geoMercator()
            .center([0, 20])
            .translate([w / 2, h / 2])
            .scale(w / 6.5);

        // Define color scale with dynamic range from white to orange to red
        const deathsExtent = d3.extent(Object.values(deathsByCountry));
        const minColorValue = 1; // Minimum value to highlight
        var color = d3.scaleLinear()
            .domain([0, Math.max(minColorValue, deathsExtent[1] * 0.5), deathsExtent[1]])
            .range(["#ffffff", "#ff9933", "#cc0000"]); // White to orange to red

        // Define geo path
        var path = d3.geoPath().projection(projection);

        // Draw the map with updated color scale
        svg.selectAll("path")
            .data(json.features)
            .join("path")
            .attr("d", path)
            .style("fill", function(d) {
                const deaths = deathsByCountry[d.properties.name] || 0;
                if (deaths > 0) {
                    return color(deaths); // Fill color for affected countries
                } else {
                    return "#f0f0f0"; // Color for countries with zero deaths
                }
            })
            .style("stroke", "darkgrey")
            .on("mouseover", function(event, d) {
                // Blur all other countries
                svg.selectAll("path")
                    .style("filter", "blur(2.5px)"); // Apply blur to all
                d3.select(this)
                    .style("filter", "none"); // Remove blur from hovered country

                // Create tooltip
                const country = d.properties.name;
                const deaths = deathsByCountry[country] || 0;
                const expenditure = expenditureByCountry[country] || 0;

                svg.append("text")
                    .attr("class", "tooltip")
                    .attr("x", event.pageX)
                    .attr("y", event.pageY)
                    .attr("text-anchor", "middle")
                    .attr("fill", "black")
                    .text(`${country}: \n${deaths} deaths \n$${expenditure} expenditure`);
            })
            .on("mouseout", function() {
                // Remove the blur effect from all countries
                svg.selectAll("path")
                    .style("filter", "none");
                // Remove tooltip
                svg.selectAll(".tooltip").remove();
            });

        // Add legend
        addLegend(color, deathsExtent);
    });
}

// Function to create a color legend
function addLegend(color, extent) {
    const legendContainer = d3.select("#viz1").select(".legend");
    if (!legendContainer.empty()) {
        legendContainer.remove();
    }
    
    const legendWidth = 300;
    const legendHeight = 10;

    const legendSvg = d3.select("#viz1").append("svg")
        .attr("class", "legend")
        .attr("width", legendWidth)
        .attr("height", 50);

    const gradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

    const colorRange = color.range();
    const step = 100 / (colorRange.length - 1);

    colorRange.forEach((color, i) => {
        gradient.append("stop")
            .attr("offset", `${i * step}%`) // Fixed string interpolation
            .attr("stop-color", color);
    });

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .attr("transform", "translate(0,20)");

    const scale = d3.scaleLinear()
        .domain(extent)
        .range([0, legendWidth]);

    const axis = d3.axisBottom(scale)
        .ticks(5)
        .tickFormat(d3.format(".0f"));

    legendSvg.append("g")
        .attr("transform", "translate(0,30)")
        .call(axis);
}

// Call init function on window load
window.onload = init;
