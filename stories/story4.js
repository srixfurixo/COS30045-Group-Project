const dataFile = "../AdnanDataProcessing/weekly_combined_admissions_mortality.csv";

function init() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingOverlay);

    const chartContainer = document.querySelector('#chartContainer');
    chartContainer.classList.add('fade-in');

    const w = 1000;  // Increased Chart width
    const h = 850;  // Increased Chart height
    const margin = { top: 20, right: 100, bottom: 100, left: 100 };  // Increased margins

    const svg = d3.select("#chartContainer").append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .style("opacity", 0);  // Initially hidden for fade-in

    let currentCountry, currentYear, currentAdmissionType;
    currentAdmissionType = "icu"; // Default to ICU admissions

    // Default year set to 2020
    currentYear = 2020;

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
            .attr("class", "y-axis-right-label")
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

        // Tooltip logic
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.9)")
            .style("padding", "10px")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Add vertical line for tooltip
        const verticalLine = svg.append("line")
            .attr("class", "vertical-line")
            .style("stroke", "gray")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "5,5")
            .style("opacity", 0);

        // Add overlay for mouse tracking
        const overlay = svg.append("rect")
            .attr("class", "overlay")
            .attr("width", w)
            .attr("height", h)
            .style("fill", "none")
            .style("pointer-events", "all");

        pathMortality.on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html("Mortality: " + d.Mortality);
        }).on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        }).on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

        pathICU.on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html("ICU Admissions: " + d["Weekly new ICU admissions"]);
        }).on("mousemove", function(event) {
            tooltip.style("top", (event.pageY + 5) + "px")
                .style("left", (event.pageX + 5) + "px");
        }).on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

        // Add admission type selector handler
        d3.select("#admissionTypeSelector").on("change", function() {
            currentAdmissionType = this.value;
            updateChart();
        });

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

        function mousemove(event) {
            const [mouseX] = d3.pointer(event);
            const x0 = x.invert(mouseX);
            const bisect = d3.bisector(d => d.Date).left;
            const index = bisect(currentData, x0, 1);
            const d0 = currentData[index - 1];
            const d1 = currentData[index];
            const d = x0 - d0.Date > d1.Date - x0 ? d1 : d0;

            verticalLine
                .attr("x1", x(d.Date))
                .attr("x2", x(d.Date))
                .attr("y1", 0)
                .attr("y2", h)
                .style("opacity", 1);

            tooltip
                .style("opacity", 1)
                .html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.Date)}<br/>
                      Mortality: ${d.Mortality}<br/>
                      ${currentAdmissionType === "icu" ? "ICU" : "Hospital"} Admissions: ${
                        currentAdmissionType === "icu" ? d["Weekly new ICU admissions"] : d["Weekly new hospital admissions"]
                      }`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function mouseout() {
            verticalLine.style("opacity", 0);
            tooltip.style("opacity", 0);
        }

        function updateChart() {
            currentData = data.filter(d => d.Country === currentCountry && d.Year === currentYear);

            x.domain(d3.extent(currentData, d => d.Date));
            yLeft.domain([0, d3.max(currentData, d => d.Mortality)]);
            yRight.domain([0, d3.max(currentData, d => 
                currentAdmissionType === "icu" ? d["Weekly new ICU admissions"] : d["Weekly new hospital admissions"]
            )]);

            // Update axes
            svg.select(".x-axis").transition().duration(750).call(xAxis);
            svg.select(".y-axis-left").transition().duration(750).call(d3.axisLeft(yLeft));
            svg.select(".y-axis-right").transition().duration(750).call(d3.axisRight(yRight));

            // Update right y-axis label
            svg.select(".y-axis-right-label")
                .text(currentAdmissionType === "icu" ? "Weekly ICU Admissions" : "Weekly Hospital Admissions");

            // Update lines
            pathMortality.datum(currentData).transition().duration(750)
                .attr("d", lineMortality);

            pathICU.datum(currentData).transition().duration(750)
                .attr("d", d3.line()
                    .x(d => x(d.Date))
                    .y(d => yRight(currentAdmissionType === "icu" ? 
                        d["Weekly new ICU admissions"] : d["Weekly new hospital admissions"])));
        }

        // Add mouse event listeners
        overlay
            .on("mouseover", () => {
                verticalLine.style("opacity", 1);
                tooltip.style("opacity", 1);
            })
            .on("mouseout", mouseout)
            .on("mousemove", mousemove);

        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
            chartContainer.classList.add('visible');
        }, 100);
    }).catch(error => {
        console.error("Error loading or processing the CSV file: ", error);
        loadingOverlay.classList.add('hidden');
    });
}

// Call the init function when the window has fully loaded
window.onload = init;
