// **Main Scatter Chart with Tooltip Fixes**

const margin = {top: 60, right: 280, bottom: 60, left: 100},
      width = 2000 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const mainChartTooltip = d3.select("body")
    .append("div")
    .attr("class", "main-viz-tooltip")
    .style("opacity", 0)
    .style("visibility", "hidden");

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

d3.csv("../Datasets/story5_weekly_data_filtered.csv").then(function(data) {
    const parseDate = d3.timeParse("%d/%m/%Y");

    const deathsField = "Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)";
    const vaccinationField = "COVID-19 doses (cumulative, per hundred)";

    data.forEach(d => {
        d[vaccinationField] = +d[vaccinationField] || 0;
        d[deathsField] = +d[deathsField] || 0;
        d.Year = +d.Year;

        d.Date = parseDate(d.Day);

        if (!d.Date) {
            console.warn("Invalid date for entry:", d);
        }
    });

    data = data.filter(d => d.Date);

    data = calculateRollingAverage(data, vaccinationField, 7);
    data = calculateRollingAverage(data, deathsField, 7);

    const countries = [...new Set(data.map(d => d.Country))];
    const years = [...new Set(data.map(d => d.Year))];
    
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
    let selectedYear = 2021;

    const minDate = d3.min(data, d => d.Date);
    const maxDate = d3.max(data, d => d.Date);

    let selectedDate = minDate;

    const x = d3.scaleLinear()
        .range([0, width]);

    const y = d3.scaleLinear()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeCategory10);

    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const yAxis = svg.append("g")
        .attr("class", "y-axis");

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

    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .extent([[0, 0], [width, height]])
        .on("zoom", updateZoom);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(zoom);

    const clip = svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    const scatter = svg.append('g')
        .attr("clip-path", "url(#clip)");

    let playing = false;
    let timer;

    const slider = d3.select("#date-slider")
        .attr("min", minDate.getTime())
        .attr("max", maxDate.getTime())
        .attr("value", selectedDate.getTime())
        .attr("step", 7 * 24 * 60 * 60 * 1000);

    const dateDisplay = d3.select("#date-display");
    const playButton = d3.select("#play-button");

    function playTimeline() {
        if (selectedDate >= maxDate) {
            stopTimeline();
            return;
        }
        selectedDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
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

    const countryMenu = d3.select("#country-menu")
        .selectAll("div")
        .data(countries)
        .enter()
        .append("div")
        .attr("class", "checkbox");

    countryMenu.append("input")
        .attr("type", "checkbox")
        .attr("id", d => d)
        .property("checked", d => topCountries.includes(d))
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

    let showLines = true;

    d3.select("#toggle-lines").on("change", function() {
        showLines = this.checked;
        scatter.selectAll(".line")
            .style("display", showLines ? null : "none");
    });

    function updateChart() {
        scatter.selectAll(".line").remove();
        scatter.selectAll("circle").remove();

        const filteredData = data.filter(d => 
            selectedCountries.includes(d.Country) && 
            d.Date <= selectedDate &&
            d[vaccinationField] > 0 &&
            d[deathsField] > 0
        );

        x.domain([0, d3.max(filteredData, d => d[vaccinationField]) * 1.1]);
        y.domain([0, d3.max(filteredData, d => d[deathsField]) * 1.1]);

        xAxis.transition().duration(500).call(d3.axisBottom(x));
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        const nestedData = d3.groups(filteredData, d => d.Country);

        const lines = scatter.selectAll(".line")
            .data(nestedData);

        lines.enter()
            .append("path")
            .attr("class", d => `line metric-${d[0]}`)
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

        const dots = scatter.selectAll("circle")
            .data(filteredData);

        dots.exit().remove();

        dots.enter()
            .append("circle")
            .attr("r", 5)
            .style("fill", d => color(d.Country))
            .style("opacity", 0.7)
            .merge(dots)
            .attr("cx", d => x(d[vaccinationField]))
            .attr("cy", d => y(d[deathsField]))
            .on("mouseover", function(event, d) {
                mainChartTooltip
                    .style("opacity", 1)
                    .style("visibility", "visible")
                    .html(`
                        <strong>${d.Country}</strong><br/>
                        Date: ${d.Date.toLocaleDateString()}<br/>
                        Doses: ${d[vaccinationField].toFixed(2)}<br/>
                        Deaths: ${d[deathsField].toFixed(2)}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event) {
                mainChartTooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                mainChartTooltip
                    .style("opacity", 0)
                    .style("visibility", "hidden");
            });
    }

    function updateZoom(event) {
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));

        scatter.selectAll(".line")
            .attr("d", d => d3.line()
                .x(d => newX(d[vaccinationField]))
                .y(d => newY(d[deathsField]))
                .curve(d3.curveMonotoneX)
                (d[1].sort((a, b) => d3.ascending(a.Date, b.Date)))
            );

        scatter.selectAll("circle")
            .attr('cx', d => newX(d[vaccinationField]))
            .attr('cy', d => newY(d[deathsField]));
    }

    dateDisplay.text(selectedDate.toLocaleDateString());
    updateChart();
});

// **Small Multiples with Single Legend**

const smallWidth = 200;
const smallHeight = 150;
const smallMargin = { top: 20, right: 20, bottom: 30, left: 50 };

function createSmallMultiples(selectedYear = 'all', criterion = 'deaths') {
    d3.csv("../Datasets/story5_small_multiple.csv").then(function(data) {
        data.forEach(d => {
            d.Year = +d.Year;
        });

        d3.select("#my_dataviz").html("");

        if (selectedYear !== 'all') {
            data = data.filter(d => d.Year === +selectedYear);
        }

        const countryData = d3.group(data, d => d.Country);

        const metricField = criterion === 'deaths' 
            ? "Daily new confirmed deaths due to COVID-19 per million people (rolling 7-day average, right-aligned)" 
            : "Daily new confirmed cases of COVID-19 per million people (rolling 7-day average, right-aligned)";

        const metricColor = criterion === 'deaths' ? "red" : "steelblue";
        const dosesColor = "#ccc";

        createSmallMultiplesLegend(metricColor, dosesColor, criterion);

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

            const x = d3.scaleTime()
                .domain(d3.extent(processedData, d => d.date))
                .range([0, smallWidth]);

            const yMetric = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d.metric)])
                .range([smallHeight, 0]);

            const yDoses = d3.scaleLinear()
                .domain([0, d3.max(processedData, d => d.doses)])
                .range([smallHeight, 0]);

            svg.append("g")
                .attr("transform", `translate(0,${smallHeight})`)
                .call(d3.axisBottom(x).ticks(3));

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(yMetric).ticks(5));

            const lineMetric = d3.line()
                .x(d => x(d.date))
                .y(d => yMetric(d.metric))
                .curve(d3.curveMonotoneX);

            const lineDoses = d3.line()
                .x(d => x(d.date))
                .y(d => yDoses(d.doses))
                .curve(d3.curveMonotoneX);

            svg.append("path")
                .datum(processedData)
                .attr("class", `line metric-${criterion}`)
                .attr("fill", "none")
                .attr("stroke", metricColor)
                .attr("stroke-width", 2)
                .attr("d", lineMetric);

            svg.append("path")
                .datum(processedData)
                .attr("class", "doses-line")
                .attr("fill", "none")
                .attr("stroke", dosesColor)
                .attr("stroke-width", 2)
                .attr("d", lineDoses);

            svg.append("text")
                .attr("x", smallWidth / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text(country);

            const smallTooltip = d3.select("body")
                .append("div")
                .attr("class", "small-multiple-tooltip")
                .style("opacity", 0)
                .style("visibility", "hidden");

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
                        smallTooltip
                            .style("opacity", 1)
                            .style("visibility", "visible")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px")
                            .html(`
                                <strong>${country}</strong><br/>
                                Date: ${d.date.toLocaleDateString()}<br/>
                                Doses: ${d.doses.toFixed(1)}<br/>
                                ${criterion === 'deaths' ? 'Deaths' : 'Cases'}: ${d.metric.toFixed(2)}
                            `);

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
                    smallTooltip
                        .style("opacity", 0)
                        .style("visibility", "hidden");
                    svg.selectAll(".hover-line").remove();
                });
        });
    });
}

function createSmallMultiplesLegend(metricColor, dosesColor, criterion) {
    d3.select("#small-multiples-legend").remove();

    const legendContainer = d3.select("#small-multiples-container")
        .insert("div", ":first-child")
        .attr("id", "small-multiples-legend")
        .style("text-align", "center")
        .style("margin-bottom", "10px");

    const legendSVG = legendContainer.append("svg")
        .attr("width", 300)
        .attr("height", 40);

    const legendData = [
        { label: criterion === 'deaths' ? 'Deaths' : 'Cases', color: metricColor },
        { label: 'Doses', color: dosesColor }
    ];

    const legendItem = legendSVG.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * 150}, 0)`);

    legendItem.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", d => d.color);

    legendItem.append("text")
        .attr("x", 30)
        .attr("y", 22)
        .text(d => d.label)
        .style("font-size", "14px")
        .style("font-family", "sans-serif");
}

createSmallMultiples();

const criteriaSelect = d3.select("#criteria-select");
criteriaSelect.on("change", function() {
    const selectedCriterion = this.value;
    createSmallMultiples(d3.select("#year-select").property("value"), selectedCriterion);
});

d3.select("#year-select").on("change", function() {
    createSmallMultiples(this.value, d3.select("#criteria-select").property("value"));
});
