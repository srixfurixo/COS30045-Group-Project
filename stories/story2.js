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

    // Load and process the data
    d3.csv("monthly_deaths.csv")
        .then(function(data) {
            if (!data) {
                throw new Error("No CSV data received");
            }
            updateVisualization(data, width, height); 
        })
        .catch(function(error) {
            console.error("Error loading CSV:", error);
            container.html("Error loading data: " + error.message);
        });
}

function parseData(data) {
    const dataByCountryDate = {};
    data.forEach(d => {
        // Set the day to the 1st of the month
        const date = new Date(d.Year, d.Month - 1, 1); 
        const country = d.Country;
        const deaths = +d.Deaths;
        const expenditure = +d.Expenditure;

        if (!dataByCountryDate[country]) {
            dataByCountryDate[country] = [];
        }
        dataByCountryDate[country].push({ date, deaths, expenditure });
    });
    return dataByCountryDate;
}

function updateVisualization(data, w, h) {
    const parsedData = parseData(data);

    // Countries to display
    const countries = ["Canada", "Turkiye"];

    // Filter data for selected countries
    const filteredData = {};
    countries.forEach(country => {
        filteredData[country] = parsedData[country];
    });

    // Select the existing SVG
    var svg = d3.select("#chart svg");

    // Clear existing paths and elements within the SVG
    svg.selectAll("*").remove();

    // Normalize data for each country
    const normalizedData = {};
    countries.forEach(country => {
        const maxDeaths = d3.max(filteredData[country], d => d.deaths);
        const maxExpenditure = d3.max(filteredData[country], d => d.expenditure);
        normalizedData[country] = filteredData[country].map(d => ({
            date: d.date,
            deaths: maxDeaths > 0 ? d.deaths / maxDeaths : 0,
            expenditure: maxExpenditure > 0 ? d.expenditure / maxExpenditure : 0
        }));
    });

    // Combine normalized deaths and expenditure
    const combinedData = {};
    countries.forEach(country => {
        combinedData[country] = normalizedData[country].map(d => ({
            date: d.date,
            combined: (d.deaths + d.expenditure) / 2
        }));
    });

    // Set up scales
    const x = d3.scaleTime()
        .domain([
            d3.min(countries, country => d3.min(combinedData[country], d => d.date)),
            d3.max(countries, country => d3.max(combinedData[country], d => d.date))
        ])
        .range([40, w - 30]);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([h - 30, 20]);

    // Create area generators for each country
    const areaGenerators = {};
    countries.forEach(country => {
        areaGenerators[country] = d3.area()
            .x(d => x(d.date))
            .y0(y(0))
            .y1(d => y(d.combined));
    });

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    // Append paths for each country's area with tooltip functionality
    countries.forEach((country, i) => {
        svg.append("path")
            .attr("fill", d3.schemeCategory10[i])
            .attr("d", areaGenerators[country](combinedData[country]))
            .on("mouseover", function(event, d) {
                // Get the date corresponding to the mouse position
                const date = x.invert(event.offsetX);

                // Find the closest data point to the mouse position
                const closestDataPoint = combinedData[country].reduce((a, b) => {
                    return Math.abs(a.date - date) < Math.abs(b.date - date) ? a : b;
                });

                // Display the tooltip with raw data
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(
                        `<strong>${country}</strong><br/>` +
                        `Date: ${closestDataPoint.date.toLocaleDateString()}<br/>` +
                        `Deaths: ${filteredData[country].find(item => item.date.getTime() === closestDataPoint.date.getTime()).deaths}<br/>` + 
                        `Expenditure: ${filteredData[country].find(item => item.date.getTime() === closestDataPoint.date.getTime()).expenditure}` 
                    )
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Hide the tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${h - 30})`)
        .call(d3.axisBottom(x).ticks(w / 80).tickSizeOuter(0));

    // Add the y-axis, remove the domain line, and add a label.
    svg.append("g")
        .attr("transform", `translate(40,0)`)
        .call(d3.axisLeft(y).ticks(h / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -40)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Combined Metric (Normalized)"));
}

// ... (your addLegend function - adjust as needed)

// Initialize on window load
window.addEventListener('load', init);