// story2.js

// Set dimensions for the radial chart
const width = 800; // Increased width for better visibility
const height = 800;
const innerRadius = 100;
const outerRadius = Math.min(width, height) / 2 - 100;

// Load both datasets: story2log.csv for radial chart and story2.csv for tooltip line chart
Promise.all([
  d3.csv("../Datasets/story2log.csv"),
  d3.csv("../Datasets/story2.csv") // Load story2.csv for tooltip data
]).then(([data, tooltipData]) => {

  // Parse numerical values in story2log.csv
  data.forEach(d => {
    d.OBS_VALUE = +d.OBS_VALUE;
    d.TIME_PERIOD = +d.TIME_PERIOD;
  });

  // Extract unique years and price bases
  const years = Array.from(new Set(data.map(d => d.TIME_PERIOD))).sort((a, b) => a - b);
  const priceBases = Array.from(new Set(data.map(d => d["Price base"])));

  // Populate the year dropdown
  const yearDropdown = d3.select("#year-dropdown");
  const filteredYears = years.filter(year => year !== 2023); // Exclude 2023
  yearDropdown.selectAll("option")
    .data(filteredYears)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // Populate the price base dropdown
  const priceDropdown = d3.select("#price-dropdown");
  priceDropdown.selectAll("option")
    .data(priceBases)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // Set initial selections
  let selectedYear = years[0];
  let selectedPrice = priceBases[0];

  // SVG container
  const svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "width: 100%; height: auto; font: 12px sans-serif;");

  // Tooltip container for line chart
  const tooltip = d3.select("body").append("div")
      .attr("id", "line-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "8px")
      .style("padding", "20px") // Increased padding
      .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.2)")
      .style("width", "500px")   // Further increased width
      .style("height", "300px")  // Adjusted height
      .style("z-index", "1100"); // Ensure tooltip is above the legend

  // Append SVG to the tooltip div for line chart
  const tooltipSvg = tooltip.append("svg")
      .attr("id", "tooltip-line-chart")
      .attr("width", 300)  // Further increased width
      .attr("height", 200); // Further increased height

  // Function to update the chart based on selections
  function updateChart() {
    // Filter data based on selected year and price base
    const filteredData = data.filter(d => d.TIME_PERIOD === selectedYear && d["Price base"] === selectedPrice);

    // Aggregate data by REF_AREA and Health function
    const aggregatedData = Array.from(
      d3.rollup(
        filteredData,
        v => d3.sum(v, d => d.OBS_VALUE),
        d => d.REF_AREA,
        d => d["Health function"]
      ),
      ([refArea, healthMap]) => ({
        REF_AREA: refArea,
        ...Object.fromEntries(
          Array.from(healthMap, ([healthFunc, value]) => [healthFunc, value])
        )
      })
    );

    // Extract unique health functions (should be consistent across data)
    const healthFunctions = Array.from(
      new Set(filteredData.map(d => d["Health function"]))
    ).sort();

    // Debugging: Log aggregated data and health functions
    console.log("Aggregated Data:", aggregatedData);
    console.log("Health Functions:", healthFunctions);

    // Create the stack series
    const stack = d3.stack()
      .keys(healthFunctions)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(aggregatedData);

    // Debugging: Log stack series
    console.log("Stack Series:", series);

    // Remove existing chart elements
    svg.selectAll("*").remove();

    // Angular x-scale (countries)
    const x = d3.scaleBand()
        .domain(aggregatedData.map(d => d.REF_AREA))
        .range([0, 2 * Math.PI])
        .align(0);

    // Radial y-scale
    const y = d3.scaleRadial()
        .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
        .range([innerRadius, outerRadius]);

    // Color scale for each health function
    const color = d3.scaleOrdinal()
        .domain(healthFunctions)
        .range(d3.schemeCategory10.slice(0, healthFunctions.length));

    // Define the arc generator
    const arc = d3.arc()
        .innerRadius(d => y(d[0]))
        .outerRadius(d => y(d[1]))
        .startAngle(d => x(d.data.REF_AREA))
        .endAngle(d => x(d.data.REF_AREA) + x.bandwidth())
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Append the stacked bars
    svg.append("g")
      .selectAll("g")
      .data(series)
      .enter().append("g")
        .attr("fill", d => color(d.key))
      .selectAll("path")
      .data(d => d.map(e => ({ ...e, key: d.key }))) // Augment data with key
      .enter().append("path")
        .attr("d", arc)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("fill", d => color(d.key)) 
        .on("mouseover", function(event, d) {
          const refArea = d.data.REF_AREA;
          const healthFunc = d.key;

          // Filter tooltip data for the hovered country and health function
          const filteredTooltipData = tooltipData.filter(item => item.REF_AREA === refArea && item["Health function"] === healthFunc && item["Price base"] === selectedPrice);

          showLineTooltip(event, filteredTooltipData, selectedYear, selectedPrice); // Pass selectedYear and selectedPrice
        })
        .on("mousemove", function(event) {
          const tooltipWidth = 600; // Further increased tooltip width
          const tooltipHeight = 300; // Adjusted tooltip height
          // Remove legendHeight as it's no longer needed for horizontal positioning

          let left = event.pageX + 20; // Position tooltip to the right of the cursor
          let top = event.pageY - (tooltipHeight / 2); // Center tooltip vertically relative to cursor

          // Prevent tooltip from going beyond the right edge of the window
          if (left + tooltipWidth > window.innerWidth) {
            left = event.pageX - tooltipWidth - 20;
          }

          // Prevent tooltip from going beyond the top edge of the window
          if (top < 0) {
            top = 20;
          }

          // Prevent tooltip from going beyond the bottom edge of the window
          if (top + tooltipHeight > window.innerHeight) {
            top = window.innerHeight - tooltipHeight - 20;
          }

          tooltip.style("top", `${top}px`).style("left", `${left}px`);
        })
        .on("mouseout", function() {
          tooltip.style("visibility", "hidden");
        });

    // Update tooltip display logic with reduced offsets
    svg.selectAll('.data-point')
      .on('mouseover', function(event, d) {
          if (d.value) { // Check if data exists
              tooltip
                  .style('visibility', 'visible')
                  .html(`<strong>${d.country}</strong><br/>Value: ${d.value}`);
          } else {
              tooltip.style('visibility', 'hidden'); // Hide tooltip if no data
          }
      })
      .on('mousemove', function(event) {
          tooltip
              .style('left', (event.pageX + 10) + 'px') // Reduced X offset
              .style('top', (event.pageY + 10) + 'px'); // Reduced Y offset
      })
      .on('mouseout', function() {
          tooltip.style('visibility', 'hidden');
      });

    // Function to create and show the line chart in the tooltip
    function showLineTooltip(event, data, year, price) {
      tooltip.style("visibility", "visible");

      // Clear existing content
      tooltip.selectAll("*").remove();

      // Create a container div with flex display
      const tooltipContent = tooltip.append("div")
        .style("display", "flex")
        .style("align-items", "flex-start")
        .style("width", "100%")
        .style("padding", "15px"); // Reduced padding

      // Create a div for the info with fixed width
      const infoDiv = tooltipContent.append("div")
        .style("width", "180px") // Slightly reduced width
        .style("margin-right", "20px") // Reduced margin
        .style("font-size", "13px"); // Slightly smaller font

      // Add information about the hovered data point
      if (data.length > 0) {
        const refArea = data[0].REF_AREA;
        const healthFunc = data[0]["Health function"];
        const totalValue = d3.sum(data, d => d.OBS_VALUE);

        infoDiv.html(`
          <p style="margin: 3px 0"><strong>Country:</strong> ${refArea}</p>
          <p style="margin: 3px 0"><strong>Category:</strong> ${healthFunc}</p>
          <p style="margin: 3px 0"><strong>Total Value:</strong> ${totalValue}</p>
          <p style="margin: 3px 0"><strong>Year:</strong> ${year}</p>
          <p style="margin: 3px 0"><strong>Price Base:</strong> ${price}</p>
        `);
      }

      // Append SVG with adjusted dimensions
      const tooltipSvg = tooltipContent.append("svg")
        .attr("id", "tooltip-line-chart")
        .attr("width", 400)  // Adjusted width
        .attr("height", 200); // Adjusted height

      // Adjust margins for better fit
      const margin = { top: 15, right: 25, bottom: 25, left: 40 };
      const tooltipWidth = +tooltipSvg.attr("width") - margin.left - margin.right;
      const tooltipHeight = +tooltipSvg.attr("height") - margin.top - margin.bottom;

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => +d.TIME_PERIOD))
        .range([0, tooltipWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.OBS_VALUE)])
        .range([tooltipHeight, 0]);

      const g = tooltipSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Add the line
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x(d => xScale(+d.TIME_PERIOD))
          .y(d => yScale(+d.OBS_VALUE))
        );

      // Add x-axis with fewer ticks
      g.append("g")
        .attr("transform", `translate(0,${tooltipHeight})`)
        .call(d3.axisBottom(xScale)
          .ticks(5)
          .tickFormat(d3.format("d")));

      // Add y-axis with fewer ticks
      g.append("g")
        .call(d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => d3.format(".1s")(d))); // Use shorter number format
    }

    // X-axis (country labels)
    svg.append("g")
        .selectAll("g")
        .data(x.domain())
        .enter().append("g")
          .attr("text-anchor", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "start" : "end")
          .attr("transform", d => `
            rotate(${((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
            translate(${outerRadius + 10},0)
          `)
        .append("text")
          .attr("transform", d => (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
              ? "rotate(0)"
              : "rotate(180)")
          .attr("dy", "0.35em")
          .text(d => d);

          // Y-axis (radial scale for expenditures)
          const yAxis = svg.append("g")
              .attr("text-anchor", "end");
      
          const yTicks = y.ticks(5).slice(1);
      
          yAxis.selectAll("circle")
            .data(yTicks)
            .enter().append("circle")
              .attr("r", y)
              .attr("fill", "none")
              .attr("stroke", "#ccc");
      
          yAxis.selectAll("text")
            .data(yTicks)
            .enter().append("text")
              .attr("y", d => -y(d))
              .attr("dy", "0.35em")
              .attr("stroke", "#fff")
              .attr("stroke-width", 3)
              .text(d => d3.format(",.0f")(d))
            .clone(true)
              .attr("fill", "#000")
              .attr("stroke", "none");
      
          // Legend for health function categories
          const legend = svg.append("g")
            .attr("transform", `translate(${-(width / 2) + 20}, ${-(height / 2) + 20})`);
      
          const legendItem = legend.selectAll(".legend-item")
            .data(healthFunctions)
            .enter().append("g")
              .attr("class", "legend-item")
              .attr("transform", (d, i) => `translate(0, ${i * 20})`);
      
          legendItem.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d));
      
          legendItem.append("text")
            .attr("x", 24)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .text(d => d);

          // Add a note to the graph at the bottom of the chart
          svg.append("text")
            .attr("x", 0) // Center horizontally
            .attr("y", outerRadius + 50) // Slightly lower position
            .attr("font-size", "14px")
            .attr("fill", "#555")
            .attr("text-anchor", "middle") // Center the text
            .text("Tooltip chart shows the trend throughout the years");
        }
      
        // Initial chart rendering
        updateChart();
      
        // Event listeners for dropdown changes
        yearDropdown.on("change", function() {
          selectedYear = +this.value;
          updateChart();
        });
      
        priceDropdown.on("change", function() {
          selectedPrice = this.value;
          updateChart();
        });
      });

