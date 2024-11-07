function init() {
    // Set fixed dimensions for the SVG
    const width = 960;
    const height = 400;

    var container = d3.select("#chart");
    
    // Create the SVG once during initialization
    if (container.select("svg").empty()) {
        container.append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    // Create sliders
    createSliders();

    // Load and process the GeoJSON data
    d3.json("custom.geo.json")
        .then(function(json) {
            if (!json) {
                throw new Error("No GeoJSON data received");
            }
            window.geoJsonData = json;
            updateVisualization(window.geoJsonData, width, height);
        })
        .catch(function(error) {
            console.error("Error loading GeoJSON:", error);
            container.html("Error loading map data: " + error.message);
        });
}

function createSliders() {
    // Create slider container if it doesn't exist
    let sliderContainer = d3.select("#slider-container");
    if (sliderContainer.empty()) {
        sliderContainer = d3.select("#content")
            .insert("div", "#chart")  // Insert before the chart
            .attr("id", "slider-container");
    }

    // Year Slider
    const yearContainer = sliderContainer.append("div")
        .attr("class", "slider-container");
    
    yearContainer.append("label")
        .attr("for", "year-slider")
        .text("Year: ");
    
    const yearSlider = yearContainer.append("input")
        .attr("type", "range")
        .attr("id", "year-slider")
        .attr("min", 2020)
        .attr("max", 2024)
        .attr("value", 2020)
        .attr("step", 1);
    
    yearContainer.append("span")
        .attr("id", "selected-year")
        .text("2020");

    // Month Slider
    const monthContainer = sliderContainer.append("div")
        .attr("class", "slider-container");
    
    monthContainer.append("label")
        .attr("for", "month-slider")
        .text("Month: ");
    
    const monthSlider = monthContainer.append("input")
        .attr("type", "range")
        .attr("id", "month-slider")
        .attr("min", 1)
        .attr("max", 12)
        .attr("value", 1)
        .attr("step", 1);
    
    monthContainer.append("span")
        .attr("id", "selected-month")
        .text("January");

    // Add event listeners
    yearSlider.on("input", function() {
        d3.select("#selected-year").text(this.value);
        if (window.geoJsonData) {
            updateVisualization(window.geoJsonData, 960, 500);
        }
    });

    monthSlider.on("input", function() {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        d3.select("#selected-month").text(monthNames[this.value - 1]);
        if (window.geoJsonData) {
            updateVisualization(window.geoJsonData, 960, 500);
        }
    });
}

function updateVisualization(json, w, h) {
    const year = d3.select("#year-slider").property("value");
    const month = d3.select("#month-slider").property("value");

    d3.csv("monthly_deaths.csv")
        .then(function(data) {
            if (!data) {
                throw new Error("No CSV data received");
            }

            var deathsByCountry = {};
            var expenditureByCountry = {};

            data.forEach(function(d) {
                if (d.Year == year && +d.Month == month) {
                    deathsByCountry[d.Country] = +d.Deaths || 0;
                    expenditureByCountry[d.Country] = +d.Expenditure || 0;
                }
            });

            // Select the existing SVG
            var svg = d3.select("#chart svg");
            
            // Clear existing paths and elements within the SVG
            svg.selectAll("*").remove();

            // Setup projection
            var projection = d3.geoEquirectangular()
                .scale(w / 6.28)
                .center([0, 0])
                .translate([w / 2, h / 2]);

            var path = d3.geoPath().projection(projection);

            // Create color scale
            const deathsExtent = d3.extent(Object.values(deathsByCountry));
            const color = d3.scaleLinear()
                .domain([0, Math.max(1, deathsExtent[1] * 0.5), deathsExtent[1]])
                .range(["#ffffff", "#ff9933", "#cc0000"]);

            // Remove any existing tooltips
            d3.selectAll(".tooltip").remove();

            // Create new tooltip
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none");

            // Draw the map
            svg.selectAll("path")
                .data(json.features)
                .join("path")
                .attr("d", path)
                .style("fill", d => {
                    const deaths = deathsByCountry[d.properties.name] || 0;
                    return deaths > 0 ? color(deaths) : "#f0f0f0";
                })
                .style("stroke", "darkgrey")
                .style("stroke-width", "0.5px")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .style("stroke-width", "2px")
                        .style("stroke", "#333");

                    const country = d.properties.name;
                    const deaths = deathsByCountry[country] || 0;
                    const expenditure = expenditureByCountry[country] || 0;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(
                        `<strong>${country}</strong><br/>` +
                        `Deaths: ${deaths.toLocaleString()}<br/>` +
                        `Expenditure: $${expenditure.toLocaleString()}`
                    )
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("stroke-width", "0.5px")
                        .style("stroke", "darkgrey");

                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Add legend
            addLegend(color, deathsExtent);
        })
        .catch(function(error) {
            console.error("Error loading CSV:", error);
            d3.select("#chart").html("Error loading data: " + error.message);
        });
}

function addLegend() {

    // Remove existing legend
    d3.select(".legend").remove();

    const legendWidth = 400;
    const legendHeight = 10;

    const legendSvg = d3.select("#content")
        .append("svg")
        .attr("class", "legend")
        .attr("width", legendWidth)
        .attr("height", 50)
        .style("position", "absolute")
        .style("bottom", "20px")  // Changed from top to bottom
        .style("right", "20px"); 

    const gradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Define the color stops for the gradient with fixed positions
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white"); 

    gradient.append("stop")
        .attr("offset", "33%") // Adjust this value for color distribution
        .attr("stop-color", "lightyellow");

    gradient.append("stop")
        .attr("offset", "66%") // Adjust this value for color distribution
        .attr("stop-color", "orange");

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "red");

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .attr("transform", "translate(0,20)");

    // Create a scale for the axis (you might need to adjust the domain)
    const scale = d3.scaleLinear()
        .domain([0, 60000]) // Adjust domain as needed
        .range([10, legendWidth - 10]);

    const axis = d3.axisBottom(scale)
        .ticks(5)
        .tickFormat(d3.format(".0f"))
        .tickSizeOuter(0);

    legendSvg.append("g")
        .attr("transform", "translate(0,30)")
        .call(axis);
}

// Initialize on window load
window.addEventListener('load', init);