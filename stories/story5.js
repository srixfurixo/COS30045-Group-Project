// story5.js

const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
document.body.appendChild(loadingOverlay);

const dataFile = "../Datasets/story5.csv"; 

// Add fade-in class to chart container
const chartContainer = document.querySelector('#chart');
chartContainer.classList.add('fade-in');

// Load the CSV data and create the bubble chart
d3.csv(dataFile).then(function(data) {
    // Parse the data
    data.forEach(function(d) {
        d.Population = +d.Population;
        d.Cumulative_Vaccinations = +d.Cumulative_Vaccinations;
        d.Year = +d.Year;
    });

    // Set the dimensions and margins of the graph
    const margin = {top: 80, right: 200, bottom: 50, left: 70},
        width = 900 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    // Append the svg object to the div called 'chart'
    const svg = d3.select("#chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom + 5)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d.Population; }) * 1.1])
      .range([ 0, width ]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format(".2s")));

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("font-size", "16px")
        .text("Population");

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return d.Cumulative_Vaccinations; }) * 1.1])
      .range([ height, 0]);

    svg.append("g")
      .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(".2s")));

    // Add Y axis label:
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("transform", "rotate(-90)")
        .style("font-size", "16px")
        .text("Cumulative Vaccinations");

    // Add a scale for bubble size (Year)
    const z = d3.scaleLinear()
      .domain([d3.min(data, function(d) { return d.Year; }), d3.max(data, function(d) { return d.Year; })])
      .range([5, 20]);

    // Add a scale for bubble color (Country)
    const myColor = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.Country))])
      .range(d3.schemeCategory10);

    // Create a tooltip div that is hidden by default:
    const tooltip = d3.select("#chart")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "rgba(255, 255, 255, 0.8)")
      .style("border", "solid 1px black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("position", "absolute")
      .style("pointer-events", "none");

    // Create functions to show / update / hide the tooltip
    const showTooltip = function(event, d) {
      tooltip
        .style("opacity", 1)
        .html("<b>Country:</b> " + d.Country + "<br><b>Year:</b> " + d.Year + "<br><b>Population:</b> " + d3.format(",")(d.Population) + "<br><b>Cumulative Vaccinations:</b> " + d3.format(",")(d.Cumulative_Vaccinations))
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 200) + "px");
    };
    const moveTooltip = function(event, d) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 200) + "px");
    };
    const hideTooltip = function(event, d) {
      tooltip
        .style("opacity", 0);
    };

    // Add bubbles
    svg.append('g')
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
        .attr("cx", function (d) { return x(d.Population); } )
        .attr("cy", function (d) { return y(d.Cumulative_Vaccinations); } )
        .attr("r", function (d) { return z(d.Year); } )
        .style("fill", function (d) { return myColor(d.Country); } )
        .style("opacity", "0.7")
        .attr("stroke", "black")
      // Trigger the tooltip functions
      .on("mouseover", showTooltip )
      .on("mousemove", moveTooltip )
      .on("mouseleave", hideTooltip );

    // Add title
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", -30)
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .style("text-decoration", "underline")  
        .text("Population vs. Cumulative Vaccinations");

    // Add legend
    const size = 10;
    const allCountries = [...new Set(data.map(d => d.Country))];

    svg.selectAll("legendDots")
      .data(allCountries)
      .enter()
      .append("rect")
        .attr("x", width + 40)
        .attr("y", function(d,i){ return i*(size+5); })
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return myColor(d); });

    svg.selectAll("legendLabels")
      .data(allCountries)
      .enter()
      .append("text")
        .attr("x", width + 55)
        .attr("y", function(d,i){ return i*(size+5) + (size/2); })
        .style("fill", function(d){ return myColor(d); })
        .text(function(d){ return d; })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

    // Add legend title
    svg.append("text")
      .attr("x", width + 20)
      .attr("y", -10)
      .attr("text-anchor", "left")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .text("Countries");

    // After data is loaded and visualization is ready
    loadingOverlay.classList.add('hidden');
    setTimeout(() => {
        chartContainer.classList.add('visible');
    }, 100);

}).catch(function(error){
    console.error("Error loading or processing the CSV file:", error);
    loadingOverlay.classList.add('hidden');
});
