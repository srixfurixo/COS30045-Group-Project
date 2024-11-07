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

    // Load and process the GeoJSON data
    d3.json("custom.geo.json")
        .then(function (json) {
            if (!json) {
                throw new Error("No GeoJSON data received");
            }
            window.geoJsonData = json;
            updateVisualization(window.geoJsonData, width, height);
        })
        .catch(function (error) {
            console.error("Error loading GeoJSON:", error);
            container.html("Error loading map data: " + error.message);
        });
}

function updateVisualization(json, w, h) {
    d3.csv("monthly_deaths.csv")
        .then(function (data) {
            if (!data) {
                throw new Error("No CSV data received");
            }

            // Get distinct countries from the data
            const countries = Array.from(new Set(data.map(d => d.Country)));

            // Create dropdown for countries
            let dropdown = d3.select("#country-select");
            if (dropdown.empty()) {
                dropdown = d3.select("#content")
                    .insert("select", "#chart")
                    .attr("id", "country-select");

                dropdown.selectAll("option")
                    .data(countries)
                    .enter()
                    .append("option")
                    .text(d => d)
                    .property("selected", d => d === "Australia");

                dropdown.on("change", function () {
                    updateMapAndChart(data, json, w, h);
                });
            }

            updateMapAndChart(data, json, w, h);
        })
        .catch(function (error) {
            console.error("Error loading CSV:", error);
            d3.select("#chart").html("Error loading data: " + error.message);
        });
}

function updateMapAndChart(data, json, w, h) {
    const selectedCountry = d3.select("#country-select").property("value");

    // Filter data for selected country
    const filteredData = data.filter(d => d.Country === selectedCountry);

    // Update the map (using the first data point for now)
    updateMap(json, filteredData.length > 0 ? [filteredData[0]] : [], w, h); // Pass an empty array if no data

    // Prepare data for the area chart
    const groupedData = groupDataByYearAndMonth(filteredData);

    // Update the area chart
    updateAreaChart(groupedData, w, h);
}

function groupDataByYearAndMonth(data) {
    const grouped = {};
    data.forEach(d => {
        const key = `${d.Year}-${d.Month}`;
        if (!grouped[key]) {
            grouped[key] = {
                Year: +d.Year,
                Month: +d.Month,
                Deaths: 0,
                Expenditure: 0
            };
        }
        grouped[key].Deaths += +d.Deaths;
        grouped[key].Expenditure += +d.Expenditure;
    });
    return Object.values(grouped);
}

function updateMap(json, data, w, h) {
    const svg = d3.select("#chart svg");
    svg.selectAll("*").remove(); // Clear existing SVG elements

    const projection = d3.geoMercator()
        .fitSize([w, h], json);
    const path = d3.geoPath().projection(projection);

    // Create a color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.Deaths)]); // Adjust domain as needed

    // Draw the map features
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const countryData = data.find(item => item.Country === d.properties.ADMIN);
            return countryData ? colorScale(countryData.Deaths) : "lightgray";
        })
        .append("title") // Add tooltip
        .text(d => {
            const countryData = data.find(item => item.Country === d.properties.ADMIN);
            return countryData ? `${d.properties.ADMIN}: ${countryData.Deaths} deaths` : d.properties.ADMIN;
        });
}

function updateAreaChart(data, w, h) {
    const svg = d3.select("#chart svg");
    svg.selectAll("*").remove(); // Clear existing SVG elements

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, d.Month - 1)))
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Deaths)])
        .range([height, 0]);

    const area = d3.area()
        .x(d => xScale(new Date(d.Year, d.Month - 1)))
        .y0(height)
        .y1(d => yScale(d.Deaths));

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    g.append("path")
        .datum(data)
        .attr("fill", "steelblue")
        .attr("d", area)
        .on("mouseover", function (event, d) {
            const bisectDate = d3.bisector(d => new Date(d.Year, d.Month - 1)).left;
            const x0 = xScale.invert(event.offsetX - margin.left);
            const i = bisectDate(d, x0, 1);

            if (i > 0 && i < d.length) {
                const d0 = d[i - 1];
                const d1 = d[i];
                const selectedData = x0 - d0.date > d1.date - x0 ? d1 : d0;

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>Year:</strong> ${selectedData.Year}<br>
                    <strong>Month:</strong> ${getMonthName(selectedData.Month)}<br> 
                    <strong>Deaths:</strong> ${selectedData.Deaths}<br>
                    <strong>Expenditure:</strong> ${selectedData.Expenditure}
                `)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));
}

function getMonthName(monthNumber) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    return monthNames[monthNumber - 1];
}

// Initialize on window load
window.addEventListener('load', init);