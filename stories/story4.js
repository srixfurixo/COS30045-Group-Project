function init() {
    const w = 1000;  // Width of the chart
    const h = 600;  // Height of the chart

    // Create SVG container
    const svg = d3.select("#chartContainer").append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("border", "1px solid black")
        .style("display", "block")
        .style("margin", "0 auto");  // Center horizontally

    // Load CSV data
    d3.csv("Datasets/total_icu_beds.csv").then(function(data) {
        // Log data for debugging
        console.log(data);

        // Convert the columns to appropriate data types
        data.forEach(d => {
            d.Deaths = +d.Deaths;  // Convert to number
            d.Healthcare_Expenditure = +d.Healthcare_Expenditure;
            d.Total_Beds = +d.Total_Beds;
            d.Year = +d.Year;  // Convert to number
        });

        // Log data after conversion
        console.log("Processed Data: ", data);

        // Populate dropdowns with unique countries and years
        populateDropdowns(data);

        // Set up scales for axes
        const x = d3.scaleBand()
            .range([0, w])
            .padding(0.1)
            .domain(data.map(d => d.Year)); // Set domain to years from data

        // Set up logarithmic scale for y-axis
        const y = d3.scaleLog()
            .range([h, 0])
            .domain([1, d3.max(data, d => Math.max(d.Deaths, d.Healthcare_Expenditure, d.Total_Beds))]); // Start from 1 to avoid log(0) issues

        // Create X-axis (Year)
        svg.append("g")
            .attr("transform", `translate(0, ${h})`)  // Move X-axis to the bottom
            .call(d3.axisBottom(x));

        // Create Y-axis
        svg.append("g")
            .call(d3.axisLeft(y));  // Y-axis starts from the left

        // Add axis labels
        svg.append("text")
            .attr("transform", `translate(${w / 2}, ${h - 5})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Year");

        svg.append("text")
            .attr("transform", "rotate(-90)") // Rotate label for Y-axis
            .attr("x", -h / 2)
            .attr("y", 15)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Log Scale Values");

        // Default line graph (deaths)
        let currentCountry = data[0].Country;
        let currentYear = 2020;

        // Function to filter data based on country and year
        function filterData(country, year) {
            return data.filter(d => d.Country === country && d.Year === year);
        }

        // Draw the line graph
        const line = d3.line()
            .x(d => x(d.Year) + x.bandwidth() / 2) // Position on x-axis
            .y(d => y(d.Deaths));  // Position on y-axis based on "Deaths"

        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", 2);

        // Function to populate dropdowns with unique countries and years
        function populateDropdowns(data) {
            const countries = Array.from(new Set(data.map(d => d.Country))).sort();
            const years = Array.from(new Set(data.map(d => d.Year))).sort();

            // Populate Country dropdown
            const countrySelector = d3.select("#countrySelector");
            countrySelector.selectAll("option")
                .data(countries)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);

            // Populate Year dropdown
            const yearSelector = d3.select("#yearSelector");
            yearSelector.selectAll("option")
                .data(years)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);

            // Set default selections
            countrySelector.property("value", currentCountry);
            yearSelector.property("value", currentYear);

            // Update chart when dropdown selection changes
            countrySelector.on("change", function() {
                currentCountry = this.value;
                updateChart();
            });

            yearSelector.on("change", function() {
                currentYear = +this.value;
                updateChart();
            });
        }

        // Function to update the chart based on country and year selection
        function updateChart() {
            const filteredData = filterData(currentCountry, currentYear);

            // Remove the old line
            svg.selectAll(".line").remove();

            // Draw the new line graph with updated data
            const line = d3.line()
                .x(d => x(d.Year) + x.bandwidth() / 2) // Position on x-axis
                .y(d => y(d.Deaths));  // Position on y-axis based on "Deaths"

            svg.append("path")
                .data([filteredData])
                .attr("class", "line")
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "blue")
                .style("stroke-width", 2);
        }
    }).catch(error => {
        console.error("Error loading or processing the CSV file: ", error);
    });
};
window.onload = init;