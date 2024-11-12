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

function parseData(data) {
    const dataByCountryDate = {};
    data.forEach(d => {
        const [year, month, day] = d.Date_reported.split('-').map(Number);
        const date = new Date(year, month - 1, day); // Month is 0-indexed
        const country = d.Country;
        const deaths = +d.New_deaths; // Changed to New_deaths

        if (!dataByCountryDate[country]) {
            dataByCountryDate[country] = {};
        }
        dataByCountryDate[country][date] = deaths;
    });
    return dataByCountryDate;
}

function updateVisualization(json, w, h) {
    const year = +d3.select("#year-slider").property("value");
    const month = +d3.select("#month-slider").property("value");

    d3.csv("WHO-COVID-19-global-data.csv")
        .then(function(data) {
            if (!data) {
                throw new Error("No CSV data received");
            }

            const parsedData = parseData(data);

            // Accumulate deaths up to the selected year and month
            const accumulatedDeaths = {};
            for (const country in parsedData) {
                let cumulativeDeaths = 0;
                const countryData = parsedData[country];
                for (const date in countryData) {
                    const dataDate = new Date(date);
                    if (dataDate.getFullYear() <= year &&
                        (dataDate.getFullYear() < year || dataDate.getMonth() + 1 <= month)) {
                        cumulativeDeaths += countryData[date];
                    }
                }
                accumulatedDeaths[country] = cumulativeDeaths;
            }

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

            // Fixed thresholds for color scale (adjusted for COVID-19 death counts)
            const color = d3.scaleThreshold()
                .domain([40000, 80000, 120000, 160000, 200000, 600000, 1000000])
                .range([ "#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"]);

            // Remove any existing tooltips
            d3.selectAll(".tooltip").remove();

            // Create new tooltip
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "white")
                .style("padding", "10px")
                .style("border", "1px solid #ccc")
                .style("border-radius", "5px");

            // Draw the map
            svg.selectAll("path")
                .data(json.features)
                .join("path")
                .attr("d", path)
                .style("fill", d => {
                    const deaths = accumulatedDeaths[d.properties.name] || 0;
                    return color(deaths);
                })
                .style("stroke", "darkgrey")
                .style("stroke-width", "0.5px")
                .on("mouseover", function(event, d) {
                    // Get mouse position relative to the map container
                    const mouseX = event.offsetX;
                    const mouseY = event.offsetY;

                    // Calculate the transform-origin based on the mouse position
                    const transformOrigin = mouseX + "px " + mouseY + "px";

                    d3.selectAll("path")
                        .style("filter", "blur(2px)") // Blur all paths
                        .style("opacity", 0.6); // Reduce opacity of all paths
                    
                    d3.select(this)
                        .style("filter", "none") // Remove blur on hovered path
                        .style("opacity", 1) // Restore full opacity
                        .style("stroke-width", "3px") // Increase stroke width
                        .style("stroke", "#333")
                        .style("transform", "scale(0.9)") // Adjust the scale
                        .style("transform-origin", transformOrigin) // Dynamically set the transform-origin to the mouse position
                        .style("transition", "transform 0.3s ease"); // Smooth transition
                    
                    const country = d.properties.name;
                    const deaths = accumulatedDeaths[country] || 0;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(
                        `<strong>${country}</strong><br/>` +
                        `Accumulated Deaths: ${deaths.toLocaleString()}`
                    )
                        .style("left", (event.pageX + 20) + "px") // Move tooltip further from pointer
                        .style("top", (event.pageY - 50) + "px"); // Adjust vertical position too
                })
                .on("mouseout", function() {
                    d3.selectAll("path")
                        .style("filter", "none") // Remove blur on all paths
                        .style("opacity", 1); // Restore full opacity on all paths
                    
                    d3.select(this)
                        .style("stroke-width", "0.5px")
                        .style("stroke", "darkgrey")
                        .style("transform", "scale(1)") // Reset the scale
                        .style("transform-origin", "center");

                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Add legend with fixed thresholds
            addLegend(color);
        })
        .catch(function(error) {
            console.error("Error loading CSV:", error);
            d3.select("#chart").html("Error loading data: " + error.message);
        });
}



// Updated legend function to work with threshold scale
function addLegend(color) {
    // Remove existing legend
    d3.select(".legend").remove();

    const legendWidth = 400;
    const legendHeight = 50;
    const legendMargin = { top: 10, right: 20, bottom: 20, left: 20 };

    const legendSvg = d3.select("#content")
        .append("svg")
        .attr("class", "legend")
        .attr("width", legendWidth + legendMargin.left + legendMargin.right)
        .attr("height", legendHeight + legendMargin.top + legendMargin.bottom)
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("right", "20px");

    const thresholds = color.domain();
    const legendScale = d3.scaleLinear()
        .domain([0, 1000000])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .tickValues([0, ...thresholds])
        .tickFormat(d3.format(","));
}

// Initialize on window load
window.addEventListener('load', init);