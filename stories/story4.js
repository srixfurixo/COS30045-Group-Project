const dataFile = "../Datasets/total_icu_beds.csv";

function init() {
    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    // Add fade-in class to chart container
    const chartContainer = document.querySelector('#chartContainer');
    chartContainer.classList.add('fade-in');

    const w = 500;  // Width of the chart
    const h = 400;   // Height of the chart
    const margin = { top: 1, right: 80, bottom: 80, left: 80 };


    // Create SVG container
    const svg = d3.select("#chartContainer").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Variables to store current selections
    let currentCountry;
    let currentData;

    // Load CSV data
    d3.csv(dataFile).then(function(data) {
        // Convert the columns to appropriate data types
        data.forEach(d => {
            d.Deaths = +d.Deaths;  // Convert to number
            d["Total ICU Beds"] = +d["Total ICU Beds"]; // Convert to number
            d.Year = +d.Year;  // Convert to number
            d.Month = +d.Month; // Convert to number
        });

        // Combine Year and Month into a Date object
        data.forEach(d => {
            d.Date = new Date(d.Year, d.Month - 1); // Months are zero-based
        });

        // Log data after conversion
        console.log("Processed Data: ", data);

        // Set default selections
        currentCountry = data[0].Country;
        currentData = data.filter(d => d.Country === currentCountry);

        // Populate dropdowns with unique countries
        populateDropdowns(data);

        // Set up scales for axes
        const x = d3.scaleTime()
            .range([0, w])
            .domain(d3.extent(currentData, d => d.Date));

        const yLeft = d3.scaleLinear()
            .range([h, 0])
            .domain([0, d3.max(currentData, d => d.Deaths)]);

        const yRight = d3.scaleLinear()
            .range([h, 0])
            .domain([0, d3.max(currentData, d => d["Total ICU Beds"])]);

        // Create X-axis (Date)
        const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m"));
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${h})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Create Y-axis for Deaths (Left)
        const yAxisLeft = svg.append("g")
            .attr("class", "y-axis-left")
            .call(d3.axisLeft(yLeft));

        // Create Y-axis for Total ICU Beds (Right)
        const yAxisRight = svg.append("g")
            .attr("class", "y-axis-right")
            .attr("transform", `translate(${w}, 0)`)
            .call(d3.axisRight(yRight));

        // Add axis labels
        svg.append("text")
            .attr("transform", `translate(${w / 2}, ${h + margin.bottom - 20})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Date");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", -margin.left + 40)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "steelblue")
            .text("Deaths");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", w + margin.right - 20)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "red")
            .text("Total ICU Beds");

        // Line generator function for Deaths
        const lineDeaths = d3.line()
            .x(d => x(d.Date))
            .y(d => yLeft(d.Deaths));

        // Line generator function for Total ICU Beds
        const lineICU = d3.line()
            .x(d => x(d.Date))
            .y(d => yRight(d["Total ICU Beds"]));

        // Draw the line for Deaths
        const pathDeaths = svg.append("path")
            .datum(currentData)
            .attr("class", "line-deaths")
            .attr("d", lineDeaths)
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        // Draw the line for Total ICU Beds
        const pathICU = svg.append("path")
            .datum(currentData)
            .attr("class", "line-icu")
            .attr("d", lineICU)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 2);

        // Function to populate dropdowns with unique countries
        function populateDropdowns(data) {
            const countries = Array.from(new Set(data.map(d => d.Country))).sort();

            // Populate Country dropdown
            const countrySelector = d3.select("#countrySelector");
            countrySelector.selectAll("option")
                .data(countries)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);

            // Set default selection
            countrySelector.property("value", currentCountry);

            // Update chart when dropdown selection changes
            countrySelector.on("change", function() {
                currentCountry = this.value;
                updateChart();
            });
        }

        // Function to update the chart based on country selection
        function updateChart() {
            currentData = data.filter(d => d.Country === currentCountry);

            // Update scales
            x.domain(d3.extent(currentData, d => d.Date));
            yLeft.domain([0, d3.max(currentData, d => d.Deaths)]);
            yRight.domain([0, d3.max(currentData, d => d["Total ICU Beds"])]);

            // Update axes
            svg.select(".x-axis")
                .transition()
                .duration(750)
                .call(xAxis);

            svg.select(".y-axis-left")
                .transition()
                .duration(750)
                .call(d3.axisLeft(yLeft));

            svg.select(".y-axis-right")
                .transition()
                .duration(750)
                .call(d3.axisRight(yRight));

            // Update lines
            pathDeaths.datum(currentData)
                .transition()
                .duration(750)
                .attr("d", lineDeaths);

            pathICU.datum(currentData)
                .transition()
                .duration(750)
                .attr("d", lineICU);
        }

        // After data is loaded and visualization is ready
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
            chartContainer.classList.add('visible');
        }, 100);
    }).catch(error => {
        console.error("Error loading or processing the CSV file: ", error);
        loadingOverlay.classList.add('hidden');
    });
}
window.onload = init;
