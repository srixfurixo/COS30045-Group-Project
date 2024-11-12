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
    // Parse data
    data.forEach(d => {
        d["COVID-19 doses (cumulative, per hundred)"] = +d["COVID-19 doses (cumulative, per hundred)"] || 0;
        d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"] = +d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"] || 0;
        d.Year = +d.Year;
        d.Date = new Date(d.Date); // Parse the Date field
    });

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
                d => d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"])
        }))
        .sort((a, b) => b.totalDeaths - a.totalDeaths)
        .slice(0, 5)
        .map(d => d.country);

    let selectedCountries = [...topCountries];
    let selectedYear = 2021; // Default to 2021

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
    const slider = d3.select("#year-slider");
    const yearDisplay = d3.select("#year-display");
    const playButton = d3.select("#play-button");

    function playTimeline() {
        if (selectedYear >= 2023) {
            selectedYear = 2020;
        }
        selectedYear++;
        slider.property("value", selectedYear);
        yearDisplay.text(selectedYear);
        updateChart();
        
        if (selectedYear >= 2023) {
            stopTimeline();
        }
    }

    function startTimeline() {
        playing = true;
        playButton.text("Pause");
        timer = setInterval(playTimeline, 1000);
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
        selectedYear = +this.value;
        yearDisplay.text(selectedYear);
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
        d3.selectAll(".line")
            .style("display", showLines ? null : "none");
    });

    function updateChart() {
        const filteredData = data.filter(d => 
            selectedCountries.includes(d.Country) && 
            d["COVID-19 doses (cumulative, per hundred)"] > 0 &&
            d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"] > 0);

        // Update scales
        x.domain([0, d3.max(filteredData, d => d["COVID-19 doses (cumulative, per hundred)"]) * 1.1]);
        y.domain([0, d3.max(filteredData, d => d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"]) * 1.1]);

        // Update axes
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        yAxis.transition().duration(1000).call(d3.axisLeft(y));

        // Group data by country
        const nestedData = d3.groups(filteredData, d => d.Country);

        // Add lines to show the flow of time without any fill
        scatter.selectAll(".line")
            .data(nestedData)
            .join("path")
            .attr("class", "line")
            .attr("fill", "none") // Ensure no fill under the lines
            .attr("stroke", d => color(d[0])) // Match line color to circle color
            .attr("stroke-width", 1.5)
            .style("display", showLines ? null : "none") // Control visibility based on toggle
            .attr("d", d => d3.line()
                .x(d => x(d["COVID-19 doses (cumulative, per hundred)"]))
                .y(d => y(d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"]))
                .curve(d3.curveMonotoneX)
                (d[1].sort((a, b) => d3.ascending(a.Date, b.Date)))
            );

        // Update dots
        const dots = scatter.selectAll("circle")
            .data(filteredData, d => d.Country + d.Date);

        // Enter + Update
        dots.enter()
            .append("circle")
            .merge(dots)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d["COVID-19 doses (cumulative, per hundred)"]))
            .attr("cy", d => y(d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"]))
            .attr("r", 5)
            .style("fill", d => color(d.Country))
            .style("opacity", 0.7)
            .on("mouseenter", function(event, d) { // Changed from "mouseover" to "mouseenter"
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${d.Country}</strong><br/>
                    Date: ${d.Date.toLocaleDateString()}<br/>
                    Doses: ${d["COVID-19 doses (cumulative, per hundred)"].toFixed(2)}<br/>
                    Deaths: ${d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"].toFixed(2)}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseleave", function() { // Changed from "mouseout" to "mouseleave"
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        dots.exit().remove();
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
                .x(d => newX(d["COVID-19 doses (cumulative, per hundred)"]))
                .y(d => newY(d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"]))
                .curve(d3.curveMonotoneX)
                (d[1].sort((a, b) => d3.ascending(a.Date, b.Date)))
            );

        // update circle positions with new scales
        scatter.selectAll("circle")
            .attr('cx', d => newX(d["COVID-19 doses (cumulative, per hundred)"]))
            .attr('cy', d => newY(d["Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)"]));
    }

    // Initialize checkboxes with top 5 countries selected
    countryMenu.selectAll("input")
        .property("checked", d => topCountries.includes(d));

    // Initialize chart with default year
    yearDisplay.text(selectedYear);
    slider.property("value", selectedYear);
    updateChart();
});
