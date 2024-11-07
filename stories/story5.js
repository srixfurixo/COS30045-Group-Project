function init() {
    // Set fixed dimensions for the SVG
    const width = 960;
    const height = 500;

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
            .append("div")  // Append the div
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

    // Load the Afghanistan COVID-19 data
    d3.csv("afghanistan_covid_data.csv")
        .then(function(data) {
            if (!data) {
                throw new Error("No CSV data received");
            }

            let cumulativeDeathsByMonth = {};

            // Calculate cumulative deaths for each month
            data.forEach(function(d) {
                let date = new Date(d.Date_reported);
                let dataYear = date.getFullYear();
                let dataMonth = date.getMonth() + 1; // Month is 0-indexed

                if (dataYear == year) {
                    cumulativeDeathsByMonth[dataMonth] = 
                        (cumulativeDeathsByMonth[dataMonth] || 0) + (+d.New_deaths);
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

            // Create color scale (adjust domain as needed)
            const color = d3.scaleLinear()
                .domain([0, 10000, 20000]) // Example domain, adjust as needed
                .range(["white", "lightyellow", "red"]);

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
                    // Assuming your GeoJSON has a property for month
                    let month = d.properties.month; 

                    if (month in cumulativeDeathsByMonth) {
                        let deaths = cumulativeDeathsByMonth[month];
                        return color(deaths); 
                    } else {
                        return "#f0f0f0"; // Default color for no data
                    }
                })
                .style("stroke", "darkgrey")
                .style("stroke-width", "0.5px")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .style("stroke-width", "2px")
                        .style("stroke", "#333");

                    let country = d.properties.name;
                    let deaths = cumulativeDeathsByMonth[d.properties.month] || 0;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(
                            `<strong>${country}</strong><br/>` +
                            `Cumulative Deaths: ${deaths.toLocaleString()}`
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

            // Add legend (using the previous gradient style)
            addLegend(color, [0, 100000]); // Adjust domain as needed
        })
        .catch(function(error) {
            console.error("Error loading CSV:", error);
            d3.select("#chart").html("Error loading data: " + error.message);
        });
}

function addLegend(color, extent) {
    // ... (Your addLegend function with the gradient and axis)
}

// Initialize on window load
window.addEventListener('load', init);