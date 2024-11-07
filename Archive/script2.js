function init() {
  // Set SVG dimensions and margins
  const svgWidth = 960;
  const svgHeight = 500;
  const margin = { top: 20, right: 80, bottom: 50, left: 80 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // Append SVG container
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Initial metric to display
  let chosenMetric = "Deaths";

  // Load the dataset
  d3.csv("merged_data_with_expenditure_corrected.csv").then(function(data) {
    // Parse the week and calculate the start date of each week based on year and week number
    data.forEach(d => {
      d.Week = +d.Week;  // Ensure Week is a number

      // Calculate the starting date of the week using the year and week number
      const startOfYear = new Date(d.Year, 0, 1);  // January 1st of the year
      const weekStartDate = d3.timeWeek.offset(startOfYear, d.Week - 1);  // Offset by the number of weeks
      d.WeekStartDate = weekStartDate;  // Assign the calculated week start date

      d.Deaths = +d.Deaths;
      d.Expenditure = +d.Expenditure;
    });

    // Group data by country
    const countries = Array.from(new Set(data.map(d => d.Country)));
    const dataByCountry = Array.from(d3.group(data, d => d.Country), ([key, value]) => ({key, values: value}));

    // Define scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.WeekStartDate))
      .range([0, width]);

    let yScale = updateYScale(data, chosenMetric);

    // Define color scale for countries
    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(countries);

    // Define axes
    const bottomAxis = d3.axisBottom(xScale).ticks(d3.timeWeek.every(4)).tickFormat(d3.timeFormat("%U %Y")); // Weeks
    const leftAxis = d3.axisLeft(yScale);

    // Append axes
    chartGroup.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    let yAxis = chartGroup.append("g")
      .call(leftAxis);

    // Line generator function
    const line = d3.line()
      .x(d => xScale(d.WeekStartDate))
      .y(d => yScale(d[chosenMetric]));

    // Append lines for each country
    let countryLines = chartGroup.selectAll(".line")
      .data(dataByCountry)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("stroke", d => color(d.key))
      .attr("d", d => line(d.values));

    // Tooltip setup
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip");

    // Add circles for tooltip interactivity
    let circles = chartGroup.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.WeekStartDate))
      .attr("cy", d => yScale(d[chosenMetric]))
      .attr("r", 3)
      .attr("fill", d => color(d.Country))
      .on("mouseover", function(event, d) {
        tooltip.style("visibility", "visible")
          .html(`<strong>Country:</strong> ${d.Country}<br>
                 <strong>Week Start:</strong> ${d3.timeFormat("%B %d, %Y")(d.WeekStartDate)}<br>
                 <strong>${chosenMetric}:</strong> ${d[chosenMetric]}`);
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });

    // Function to update Y scale based on the chosen metric
    function updateYScale(data, metric) {
      return d3.scaleLinear()
        .domain([0, d3.max(data, d => d[metric])])
        .range([height, 0]);
    }

    // Function to update chart based on chosen metric
    function updateChart(metric) {
      chosenMetric = metric;
      yScale = updateYScale(data, chosenMetric);

      // Update Y axis
      yAxis.transition().duration(1000).call(d3.axisLeft(yScale));

      // Update line path for each country
      countryLines.transition()
        .duration(1000)
        .attr("d", d => line(d.values));

      // Update circle positions for tooltips
      circles.transition()
        .duration(1000)
        .attr("cy", d => yScale(d[chosenMetric]));
    }

    // Event listeners for buttons to toggle between Deaths and Expenditure
    d3.select("#deaths-btn").on("click", () => updateChart("Deaths"));
    d3.select("#expenditure-btn").on("click", () => updateChart("Expenditure"));
  }).catch(function(error) {
    console.error('Error loading or processing data:', error);
  });
}

// Call init function on window load
window.onload = init;
