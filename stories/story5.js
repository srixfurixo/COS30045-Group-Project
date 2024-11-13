const margin = {top: 60, right: 280, bottom: 60, left: 100},
    width = 2000 - margin.left - margin.right, // Increased width
    height = 800 - margin.top - margin.bottom; // Increased height

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Function to calculate rolling average
function calculateRollingAverage(data, field, windowSize) {
    return data.map((d, i, arr) => {
        const start = Math.max(0, i - windowSize + 1);
        const end = i + 1;
        const subset = arr.slice(start, end);
        const sum = subset.reduce((acc, val) => acc + val[field], 0);
        return {
            ...d,
            [field]: sum / subset.length
        };
    });
}

// Load data
d3.csv("../Datasets/story5_weekly_data_filtered.csv").then(function(data) {
    // Parse date format using d3.timeParse
    const parseDate = d3.timeParse("%Y-%m-%d"); // Adjust the format to match your date strings

    // Define field names to match your CSV headers
    const deathsField = "Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)";
    const vaccinationField = "COVID-19 doses (cumulative, per hundred)";

    data.forEach(d => {
        d[vaccinationField] = +d[vaccinationField] || 0;
        d[deathsField] = +d[deathsField] || 0;
        d.Year = +d.Year; // Parse Year as number

        // Parse the date from the 'Day' field
        d.Date = parseDate(d.Day);

        // Handle cases where date parsing fails
        if (!d.Date) {
            console.warn("Invalid date for entry:", d);
        }
    });

    // Filter out entries with invalid dates
    data = data.filter(d => d.Date);

    // Smooth data using a 7-day rolling average
    data = calculateRollingAverage(data, "COVID-19 doses (cumulative, per hundred)", 7);
    data = calculateRollingAverage(data, "Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)", 7);

    // Get unique countries and years
    const countries = [...new Set(data.map(d => d.Country))];
    const years = [...new Set(data.map(d => d.Year))];
    
    // Get top 5 countries by total deaths
    const topCountries = countries
        .map(country => ({
            country,
            totalDeaths: d3.sum(data.filter(d => d.Country === country), 
                d => d[deathsField])
        }))
        .sort((a, b) => b.totalDeaths - a.totalDeaths)
        .slice(0, 5)
        .map(d => d.country);

    let selectedCountries = [...topCountries];
    let selectedYear = 2021; // Default to 2021

    // Ensure all references to the deaths field use the correct field name
    // const deathsField = "Daily new confirmed deaths per million";
    // const vaccinationField = "COVID-19 doses (cumulative, per hundred)";

    // Get min and max dates from the dataset
    const minDate = d3.min(data, d => d.Date);
    const maxDate = d3.max(data, d => d.Date);

    let selectedDate = minDate; // Start with the earliest date

    // Create scales with padding
    const x = d3.scaleLinear()
        .range([0, width]);

    const y = d3.scaleLinear()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeCategory10);

    // Add axes with labels
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const yAxis = svg.append("g")
        .attr("class", "y-axis");

    // Add axis labels
    svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height + 40)
        .text("COVID-19 Vaccination Doses per Hundred");

    svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height/2)
        .text("Daily New Deaths per Million");

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Create the scatter variable: where both the circles and the brush take place
    const scatter = svg.append('g')
        .attr("clip-path", "url(#clip)");

    // Timeline animation variables
    let playing = false;
    let timer;

    // Create timeline controls
    const slider = d3.select("#date-slider")
        .attr("min", minDate.getTime())
        .attr("max", maxDate.getTime())
        .attr("value", selectedDate.getTime())
        .attr("step", 7 * 24 * 60 * 60 * 1000); // Step by one week in milliseconds

    const dateDisplay = d3.select("#date-display");
    const playButton = d3.select("#play-button");

    function playTimeline() {
        if (selectedDate >= maxDate) {
            stopTimeline();
            return;
        }
        selectedDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Increment by one week
        slider.property("value", selectedDate.getTime());
        dateDisplay.text(selectedDate.toLocaleDateString());
        updateChart();
    }

    function startTimeline() {
        playing = true;
        playButton.text("Pause");
        timer = setInterval(playTimeline, 500);
    }

    function stopTimeline() {
        playing = false;
        playButton.text("Play");
        clearInterval(timer);
    }

    playButton.on("click", function() {
        if (playing) {
            stopTimeline();
        } else {
            startTimeline();
        }
    });

    slider.on("input", function() {
        stopTimeline();
        selectedDate = new Date(+this.value);
        dateDisplay.text(selectedDate.toLocaleDateString());
        updateChart();
    });

    // Create country selection menu
    const countryMenu = d3.select("#country-menu")
        .selectAll("div")
        .data(countries)
        .enter()
        .append("div")
        .attr("class", "checkbox");

    countryMenu.append("input")
        .attr("type", "checkbox")
        .attr("id", d => d)
        .attr("checked", true)
        .on("change", function(event, d) {
            if (this.checked) {
                selectedCountries.push(d);
            } else {
                selectedCountries = selectedCountries.filter(c => c !== d);
            }
            updateChart();
        });

    countryMenu.append("label")
        .attr("for", d => d)
        .text(d => d);

    // Enhanced tooltip
    const tooltip = d3.select("body") // Changed from "#chart" to "body"
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("z-index", "10"); // Ensure tooltip is above other elements

    // Create legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 0)`);

    legend.selectAll("rect")
        .data(countries)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", d => color(d))
        .on("mouseover", function(event, d) {
            svg.selectAll("circle")
                .style("opacity", c => c.Country === d ? 1 : 0.1);
        })
        .on("mouseout", function() {
            svg.selectAll("circle")
                .style("opacity", 0.7);
        });

    legend.selectAll("text")
        .data(countries)
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => d);

    // Add a variable to control the visibility of lines
    let showLines = true;

    // Add event listener to the toggle-lines checkbox in the controls
    d3.select("#toggle-lines").on("change", function() {
        showLines = this.checked;
        // Target only lines within the main scatter plot
        scatter.selectAll(".line")
            .style("display", showLines ? null : "none");
    });

    // Define fixed colors for metrics
    const metricColors = {
        deaths: "red",
        cases: "steelblue",
        doses: "green"
    };

    function updateChart() {
        // Clear existing elements first
        scatter.selectAll(".line").remove();
        scatter.selectAll("circle").remove();

        // Filter data up to the selectedDate
        const filteredData = data.filter(d => 
            selectedCountries.includes(d.Country) && 
            d.Date <= selectedDate &&
            d[vaccinationField] > 0 &&
            d[deathsField] > 0
        );

        // Check if filtered data is empty
        console.log("Filtered Data:", filteredData);
        if (filteredData.length === 0) {
            console.warn("No data available for the selected filters.");
            // Optionally display a message or handle this case
        }

        // Update scales
        x.domain([0, d3.max(filteredData, d => d[vaccinationField]) * 1.1]);
        y.domain([0, d3.max(filteredData, d => d[deathsField]) * 1.1]);

        // Update axes
        xAxis.transition().duration(500).call(d3.axisBottom(x));
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        // Group data by country
        const nestedData = d3.groups(filteredData, d => d.Country);

        // Add lines
        const lines = scatter.selectAll(".line")
            .data(nestedData);

        lines.enter()
            .append("path")
            .attr("class", d => `line metric-${d[0]}`) // Assign correct metric class based on country or metric type
            .attr("fill", "none")
            .attr("stroke", d => color(d[0]))
            .attr("stroke-width", 1.5)
            .style("display", showLines ? null : "none")
            .attr("d", d => d3.line()
                .x(d => x(d[vaccinationField]))
                .y(d => y(d[deathsField]))
                .curve(d3.curveMonotoneX)
                (d[1].sort((a, b) => d3.ascending(a.Date, b.Date)))
            );

        // Update dots - create selection
        const dots = scatter.selectAll("circle")
            .data(filteredData);

        // Remove old dots
        dots.exit().remove();

        // Create new dots
        const newDots = dots.enter()
            .append("circle")
            .attr("r", 5)
            .style("fill", d => color(d.Country))
            .style("opacity", 0.7);

        // Update all dots (new and existing)
        scatter.selectAll("circle")
            .attr("cx", d => x(d[vaccinationField]))
            .attr("cy", d => y(d[deathsField]))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${d.Country}</strong><br/>
                    Date: ${d.Date.toLocaleDateString()}<br/>
                    Doses: ${d[vaccinationField].toFixed(2)}<br/>
                    Deaths: ${d[deathsField].toFixed(2)}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Remove or comment out metric-specific color assignments for the main graph
        /*
        scatter.selectAll(".line")
            .attr("stroke", d => {
                if (d[0] === 'Deaths') return metricColors.deaths;
                else if (d[0] === 'Cases') return metricColors.cases;
                else return metricColors.doses;
            });

        scatter.selectAll("circle")
            .style("fill", d => {
                if (d.type === 'deaths') return metricColors.deaths;
                else if (d.type === 'cases') return metricColors.cases;
                else return metricColors.doses;
            });
        */

        // Apply country-based color scale for the main graph lines
        scatter.selectAll(".line")
            .attr("stroke", d => color(d[0]));

        // Apply country-based color scale for the main graph circles
        scatter.selectAll("circle")
            .style("fill", d => color(d.Country));

        // Change hover line to vertical
        const hoverLine = svg.append("line")
            .attr("class", "hover-line")
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "4 4")
            .style("display", "none");

        scatter.on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            const x0 = x.invert(mouseX);
            hoverLine
                .attr("x1", x(x0))
                .attr("x2", x(x0))
                .style("display", null);

            // Find the closest data point
            const bisect = d3.bisector(d => d.Date).left;
            const i = bisect(filteredData, x0, 1);
            const d0 = filteredData[i - 1];
            const d1 = filteredData[i];
            const dClosest = x0 - d0.Date > d1.Date - x0 ? d1 : d0;

            // Update tooltip position and content
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${dClosest.Country}</strong><br/>
                Date: ${dClosest.Date.toLocaleDateString()}<br/>
                Doses: ${dClosest[vaccinationField].toFixed(2)}<br/>
                Deaths: ${dClosest[deathsField].toFixed(2)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            hoverLine.style("display", "none");
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    }

    // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
    const zoom = d3.zoom()
        .scaleExtent([.5, 20])  // This controls how much you can unzoom (x0.5) and zoom (x20)
        .extent([[0, 0], [width, height]])
        .on("zoom", updateZoom);

    // This adds an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zooms
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .call(zoom);

    // A function that updates the chart when the user zooms and thus new boundaries are available
    function updateZoom(event) {
        // recover the new scale
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        // update axes with these new boundaries
        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));

        // update lines with new scales
        scatter.selectAll(".line")
            .attr("d", d => d3.line()
                .x(d => newX(d[vaccinationField]))
                .y(d => newY(d[deathsField]))
                .curve(d3.curveMonotoneX)
                (d[1].sort((a, b) => d3.ascending(a.Date, b.Date)))
            );

        // update circle positions with new scales
        scatter.selectAll("circle")
            .attr('cx', d => newX(d[vaccinationField]))
            .attr('cy', d => newY(d[deathsField]));
    }

    // Initialize checkboxes with top 5 countries selected
    countryMenu.selectAll("input")
        .property("checked", d => topCountries.includes(d));

    // Initialize chart with default date
    dateDisplay.text(selectedDate.toLocaleDateString());
    updateChart();
});

// Set the dimensions and margins for small multiples
const smallMargin = {top: 30, right: 10, bottom: 30, left: 50},
      smallWidth = 210 - smallMargin.left - smallMargin.right,
      smallHeight = 210 - smallMargin.top - smallMargin.bottom;

// Add dropdown selection for criteria
const criteriaSelect = d3.select("#criteria-select");

// Create small multiples
function createSmallMultiples(selectedYear = 'all', criterion = 'deaths') {
    d3.csv("../Datasets/story5_weekly_data_filtered.csv").then(function(data) {
        // Parse 'Year' as number
        data.forEach(d => {
            d.Year = +d.Year;
        });

        // Clear existing charts
        d3.select("#my_dataviz").html("");

        // Filter data by year if selected
        if (selectedYear !== 'all') {
            data = data.filter(d => d.Year === +selectedYear);
        }

        // Group data by country
        const countryData = d3.group(data, d => d.Country);

        // Define the field based on the selected criterion with exact CSV header names
        const metricField = criterion === 'deaths' 
            ? "Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)" 
            : "Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)";

        // Check if metricField exists in data
        if (!data.length || !Object.keys(data[0]).includes(metricField)) {
            console.error(`Metric field "${metricField}" not found in data.`);
            d3.select("#my_dataviz").append("p").text("Error: Selected metric not found.");
            return;
        }

        // Update color scheme based on criterion
        const metricColor = criterion === 'deaths' ? "red" : "steelblue";
        const dosesColor = "green";

        // Create SVG for each country
        countryData.forEach((values, country) => {
            const countryContainer = d3.select("#my_dataviz")
                .append("div")
                .attr("class", "country-container")
                .style("display", "inline-block")
                .style("margin", "10px");

            const svg = countryContainer.append("svg")
                .attr("width", smallWidth + smallMargin.left + smallMargin.right)
                .attr("height", smallHeight + smallMargin.top + smallMargin.bottom)
                .append("g")
                .attr("transform", `translate(${smallMargin.left},${smallMargin.top})`);

            // Process data
            const processedData = values.map(d => ({
                doses: +d['COVID-19 doses (cumulative, per hundred)'],
                metric: +d[metricField],
                date: d3.timeParse("%Y-%m-%d")(d.Day)
            })).filter(d => !isNaN(d.doses) && !isNaN(d.metric));

            if (processedData.length === 0) {
                console.warn(`No data for ${country} with selected metric.`);
                countryContainer.append("p").text(`No data available for ${country}.`);
                return;
            }

            // Create scales
            const x = d3.scaleTime()
                .domain(d3.extent(processedData, d => d.date))
                .range([0, smallWidth]);

            const yMetric = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d.metric)])
                .range([smallHeight, 0]);

            const yDoses = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d.doses)])
                .range([smallHeight, 0]);

            // Add axes
            svg.append("g")
                .attr("transform", `translate(0,${smallHeight})`)
                .call(d3.axisBottom(x).ticks(3));

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(yMetric).ticks(5));

            // Add lines
            const lineMetric = d3.line()
                .x(d => x(d.date))
                .y(d => yMetric(d.metric))
                .curve(d3.curveMonotoneX);

            const lineDoses = d3.line()
                .x(d => x(d.date))
                .y(d => yDoses(d.doses))
                .curve(d3.curveMonotoneX);

            // Clear any existing paths first
            svg.selectAll("path").remove();

            // Add metric line (deaths/cases) with correct color and no fill
            svg.append("path")
                .datum(processedData)
                .attr("class", `line metric-${criterion}`) // Assign metric-specific class
                .attr("fill", "none")  // Explicitly set fill to none
                .attr("stroke", metricColor)  // Use red for deaths, blue for cases
                .attr("stroke-width", 2)
                .attr("d", lineMetric);

            // Add doses line with green color and no fill
            svg.append("path")
                .datum(processedData)
                .attr("class", "doses-line")
                .attr("fill", "none")  // Explicitly set fill to none
                .attr("stroke", dosesColor)  // Always green for doses
                .attr("stroke-width", 2)
                .attr("d", lineDoses);

            // Add title
            svg.append("text")
                .attr("x", smallWidth / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text(country);

            // Add tooltip
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            // Add invisible overlay for tooltip
            svg.append("rect")
                .attr("width", smallWidth)
                .attr("height", smallHeight)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mousemove", function(event) {
                    const [mouseX] = d3.pointer(event);
                    const bisect = d3.bisector(d => d.date).left;
                    const x0 = x.invert(mouseX);
                    const i = bisect(processedData, x0);
                    const d = processedData[i];

                    if (d) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`
                            Date: ${d.date.toLocaleDateString()}<br/>
                            Doses: ${d.doses.toFixed(1)}<br/>
                            ${criterion === 'deaths' ? 'Deaths' : 'Cases'}: ${d.metric.toFixed(2)}
                        `)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");

                        // Add vertical line
                        svg.selectAll(".hover-line").remove();
                        svg.append("line")
                            .attr("class", "hover-line")
                            .attr("x1", x(d.date))
                            .attr("x2", x(d.date))
                            .attr("y1", 0)
                            .attr("y2", smallHeight)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .attr("stroke-dasharray", "4 4");
                    }
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                    svg.selectAll(".hover-line").remove();
                });
        });
    }).catch(function(error) {
        console.error("Error loading small multiples data:", error);
        d3.select("#my_dataviz").append("p").text("Failed to load small multiples.");
    });
}

// Update event listener for criteria selection
criteriaSelect.on("change", function() {
    const selectedCriterion = this.value;
    createSmallMultiples(d3.select("#year-select").property("value"), selectedCriterion);
});

// Initialize small multiples with default criterion
createSmallMultiples();

// Add event listener for year selection
d3.select("#year-select").on("change", function() {
    createSmallMultiples(this.value, d3.select("#criteria-select").property("value"));
});
