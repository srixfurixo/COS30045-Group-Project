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

    // Load and process the CSV data directly
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
                    updateChart(data, width, height);
                });
            }

            updateChart(data, width, height);
        })
        .catch(function (error) {
            console.error("Error loading CSV:", error);
            d3.select("#chart").html("Error loading data: " + error.message);
        });
}

function updateChart(data, w, h) {
    const selectedCountry = d3.select("#country-select").property("value");

    // Filter data for selected country
    const filteredData = data.filter(d => d.Country === selectedCountry);

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

function updateAreaChart(data, w, h) {
    const svg = d3.select("#chart svg");
    svg.selectAll("*").remove(); // Clear existing SVG elements

    const margin = { top: 40, right: 80, bottom: 60, left: 80 }; // Increased margins
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.Year, 0))) // Set month to 0 (January)
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
                const selectedData = x0 - new Date(d0.Year, d0.Month - 1) > new Date(d1.Year, d1.Month - 1) - x0 ? d1 : d0;

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                        <strong>Year:</strong> ${selectedData.Year}<br>
                        <strong>Month:</strong> ${getMonthName(selectedData.Month)}<br> 
                        <strong>Deaths:</strong> ${selectedData.Deaths}<br>
                        <strong>Expenditure:</strong> ${selectedData.Expenditure}
                    `)
                    .style("left", (event.pageX + 2) + "px") // Changed from +5 to +2
                    .style("top", (event.pageY - 10) + "px");
            }
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(d3.timeYear.every(1)) // Show ticks for every year
            .tickFormat(d3.timeFormat("%Y")) // Format tick labels as year only
        );

    g.append("g")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Deaths");

    g.append("text")
        .attr("class", "axis-label")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top - 5) + ")")
        .style("text-anchor", "middle")
        .text("Year");
}

function getMonthName(monthNumber) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return monthNames[monthNumber - 1];
}

// Initialize on window load
window.addEventListener('load', init);