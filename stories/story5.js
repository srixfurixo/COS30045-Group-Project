const margin = {top: 60, right: 200, bottom: 60, left: 70},
    width = 900 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data
d3.csv("../Datasets/story5_with_year.csv").then(function(data) {
    // Parse data
    data.forEach(d => {
        d["COVID-19 doses (cumulative, per hundred)"] = +d["COVID-19 doses (cumulative, per hundred)"] || 0;
        d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"] = +d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"] || 0;
        d.Year = +d.Year;
    });

    // Get unique countries and years
    const countries = [...new Set(data.map(d => d.Country))];
    const years = [...new Set(data.map(d => d.Year))];
    
    // Get top 5 countries by total cases
    const topCountries = countries
        .map(country => ({
            country,
            totalCases: d3.sum(data.filter(d => d.Country === country), 
                d => d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"])
        }))
        .sort((a, b) => b.totalCases - a.totalCases)
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
        .text("Daily New Cases per Million");

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
    const tooltip = d3.select("#chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")
        .style("pointer-events", "none");

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

    function updateChart() {
        const filteredData = data.filter(d => 
            selectedCountries.includes(d.Country) && 
            d.Year === selectedYear);

        // Update scales
        x.domain([0, d3.max(filteredData, d => d["COVID-19 doses (cumulative, per hundred)"]) * 1.1]);
        y.domain([0, d3.max(filteredData, d => d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"]) * 1.1]);

        // Update axes
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        yAxis.transition().duration(1000).call(d3.axisLeft(y));

        // Update dots
        const dots = svg.selectAll("circle")
            .data(filteredData, d => d.Country);

        // Enter + Update
        dots.enter()
            .append("circle")
            .merge(dots)
            .transition()
            .duration(1000)
            .attr("cx", d => x(d["COVID-19 doses (cumulative, per hundred)"]))
            .attr("cy", d => y(d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"]))
            .attr("r", 5)
            .style("fill", d => color(d.Country))
            .style("opacity", 0.7);

        // Add tooltip events
        svg.selectAll("circle")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    <strong>${d.Country}</strong><br/>
                    Doses: ${d["COVID-19 doses (cumulative, per hundred)"].toFixed(2)}<br/>
                    Cases: ${d["Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)"].toFixed(2)}<br/>
                    Year: ${d.Year}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        dots.exit().remove();
    }

    // Initialize checkboxes with top 5 countries selected
    countryMenu.selectAll("input")
        .property("checked", d => topCountries.includes(d));

    // Initialize chart with default year
    yearDisplay.text(selectedYear);
    slider.property("value", selectedYear);
    updateChart();
});
