function init() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    const chartContainer = document.querySelector('#chartContainer');
    chartContainer.classList.add('fade-in');

    const w = 800;  // Increased Chart width
    const h = 500;  // Increased Chart height
    const margin = { top: 20, right: 100, bottom: 100, left: 100 };  // Increased margins

    const svg = d3.select("#chartContainer").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .style("opacity", 0);  // Initially hidden for fade-in

    let currentCountry, currentYear;
    let currentData;

    // Default year set to 2020
    currentYear = 2020;

    // Tooltip CSS injected into the head of the document
    const style = document.createElement("style");
    style.innerHTML = `
        .tooltip {
            position: absolute;
            background: white;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
    `;
    document.head.appendChild(style);

    d3.csv(dataFile).then(function(data) {
        data.forEach(d => {
            const dateParts = d.Date.split('/');
            d.Deaths = +d.Mortality;  // Assuming Mortality is the correct column
            d["Weekly new ICU admissions"] = +d["Weekly new ICU admissions"];  // ICU admissions column
            d.Mortality = +d.Mortality; // Mortality column
            d.Year = +dateParts[2];  // Year is now extracted from the date string
            d.Date = new Date(d.Year, dateParts[0] - 1, dateParts[1]);  // Ensure proper date parsing
        });

        currentCountry = data[0].Country;
        currentData = data.filter(d => d.Country === currentCountry && d.Year === currentYear);

        populateDropdowns(data);
        populateYearDropdown(data);

        const x = d3.scaleTime()
            .range([0, w])
            .domain(d3.extent(currentData, d => d.Date));

        const yLeft = d3.scaleLinear()
            .range([h, 0])
            .domain([0, d3.max(currentData, d => d.Mortality)]);  // Mortality on left y-axis

        const yRight = d3.scaleLinear()
            .range([h, 0])
            .domain([0, d3.max(currentData, d => d["Weekly new ICU admissions"])]);  // ICU admissions on right y-axis

        const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m"));
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${h})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const yAxisLeft = svg.append("g")
            .attr("class", "y-axis-left")
            .call(d3.axisLeft(yLeft));

        const yAxisRight = svg.append("g")
            .attr("class", "y-axis-right")
            .attr("transform", `translate(${w}, 0)`)
            .call(d3.axisRight(yRight));

        // Add axis labels
        svg.append("text")
            .attr("transform", `translate(${w / 2}, ${h + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .text("Date");

        svg.append("text")
            .attr("transform", `translate(-50, ${h / 2}) rotate(-90)`)
            .style("text-anchor", "middle")
            .text("Mortality");

        svg.append("text")
            .attr("transform", `translate(${w + 50}, ${h / 2}) rotate(-90)`)
            .style("text-anchor", "middle")
            .text("Weekly ICU Admissions");

        const lineMortality = d3.line()
            .x(d => x(d.Date))
            .y(d => yLeft(d.Mortality));

        const lineICUAdmissions = d3.line()
            .x(d => x(d.Date))
            .y(d => yRight(d["Weekly new ICU admissions"]));

        const pathMortality = svg.append("path")
            .datum(currentData)
            .attr("class", "line-mortality")
            .attr("d", lineMortality)
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        const pathICU = svg.append("path")
            .datum(currentData)
            .attr("class", "line-icu")
            .attr("d", lineICUAdmissions)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 2);

        // Fade in chart container
        svg.transition().duration(1000).style("opacity", 1);

        function populateDropdowns(data) {
            const countries = Array.from(new Set(data.map(d => d.Country))).sort();
            const countrySelector = d3.select("#countrySelector");
            countrySelector.selectAll("option")
                .data(countries)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);
            countrySelector.property("value", currentCountry);
            countrySelector.on("change", function() {
                currentCountry = this.value;
                updateChart();
            });
        }

        function populateYearDropdown(data) {
            const years = Array.from(new Set(data.map(d => d.Year))).sort();
            const yearSelector = d3.select("#yearSelector");
            yearSelector.selectAll("option")
                .data(years)
                .enter()
                .append("option")
                .attr("value", d => d)
                .text(d => d);
            yearSelector.property("value", currentYear);  // Default year set to 2020
            yearSelector.on("change", function() {
                currentYear = +this.value;
                updateChart();
            });
        }

        function updateChart() {
            currentData = data.filter(d => d.Country === currentCountry && d.Year === currentYear);

            x.domain(d3.extent(currentData, d => d.Date));
            yLeft.domain([0, d3.max(currentData, d => d.Mortality)]);
            yRight.domain([0, d3.max(currentData, d => d["Weekly new ICU admissions"])]);

            svg.select(".x-axis").transition().duration(750).call(xAxis);
            svg.select(".y-axis-left").transition().duration(750).call(d3.axisLeft(yLeft));
            svg.select(".y-axis-right").transition().duration(750).call(d3.axisRight(yRight));

            pathMortality.datum(currentData).transition().duration(750).attr("d", lineMortality);
            pathICU.datum(currentData).transition().duration(750).attr("d", lineICUAdmissions);

            // Remove any existing tooltip
            d3.selectAll(".tooltip").remove();

            // Create a new tooltip
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none");

            // Add mouseover and mouseout for the mortality path
            pathMortality.on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9); // Make tooltip visible
                tooltip.html("Date: " + d3.timeFormat("%Y-%m-%d")(d.Date) + "<br>Mortality: " + d.Mortality)
                    .style("left", (event.pageX + 5) + "px") // Position tooltip horizontally
                    .style("top", (event.pageY - 28) + "px"); // Position tooltip vertically
            })
            .on("mouseout", function() {
                tooltip.transition().duration(200).style("opacity", 0); // Fade out tooltip
            });

            // Add mouseover and mouseout for the ICU admissions path
            pathICU.on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9); // Make tooltip visible
                tooltip.html("Date: " + d3.timeFormat("%Y-%m-%d")(d.Date) + "<br>ICU Admissions: " + d["Weekly new ICU admissions"])
                    .style("left", (event.pageX + 5) + "px") // Position tooltip horizontally
                    .style("top", (event.pageY - 28) + "px"); // Position tooltip vertically
            })
            .on("mouseout", function() {
                tooltip.transition().duration(200).style("opacity", 0); // Fade out tooltip
            });
        }
    });
}

// Ensure the init function is called when the window has fully loaded
window.onload = init;
