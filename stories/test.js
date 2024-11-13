function differenceChart(data, country1, country2) {
  // Filter the data for the selected countries
  const filteredData = data.filter(d => d.Country === country1 || d.Country === country2);

  // Group the data by date and country
  const groupedData = d3.group(filteredData, d => d3.timeMonth(d.Date));

  // Create an array of data objects with value0 and value1 for each date
  const chartData = Array.from(groupedData, ([date, countries]) => {
    const countryValues = new Map(countries.map(d => [d.Country, d.Deaths]));
    return {
      Date: date,
      value0: countryValues.get(country1) || 0,
      value1: countryValues.get(country2) || 0
    };
  });

  // Specify the chart's dimensions.
  const width = 928;
  const height = 600;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 30;

  // Create the positional and color scales.
  const x = d3.scaleTime()
    .domain(d3.extent(chartData, d => d.Date))
    .range([marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(chartData, d => Math.min(d.value0, d.value1)),
      d3.max(chartData, d => Math.max(d.value0, d.value1))
    ])
    .range([height - marginBottom, marginTop]);

  const colors = [d3.schemeRdYlBu[3][2], d3.schemeRdYlBu[3][0]]; // Blue and red colors

  // Create the SVG container.
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
    .datum(chartData);

  // Create the axes.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x)
      .ticks(width / 80)
      .tickSizeOuter(0))
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.select(".tick:last-of-type text").clone()
      .attr("x", -marginLeft)
      .attr("y", -30)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("↑ Deaths"));

  // Create the area generators for country1 and country2.
  const area1 = d3.area()
    .curve(d3.curveStep)
    .x(d => x(d.Date))
    .y0(d => y(d.value1))
    .y1(d => y(d.value0));

  // Draw the areas with blue color for country1.
  svg.append("path")
    .attr("fill", colors[0]) // Blue for country1
    .attr("d", area1);

  // Draw the line with orange color for country2
  svg.append("path")
    .attr("fill", "none")
    .attr("stroke", colors[1]) // Orange for country2
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .curve(d3.curveStep)
      .x(d => x(d.Date))
      .y(d => y(d.value1)));function differenceChart(data, country1, country2) {
        // Filter the data for the selected countries
        const filteredData = data.filter(d => d.Country === country1 || d.Country === country2);
      
        // Group the data by date and country
        const groupedData = d3.group(filteredData, d => d3.timeMonth(d.Date));
      
        // Create an array of data objects with value0 and value1 for each date
        const chartData = Array.from(groupedData, ([date, countries]) => {
          const countryValues = new Map(countries.map(d => [d.Country, d.Deaths]));
          return {
            Date: date,
            value0: countryValues.get(country1) || 0,
            value1: countryValues.get(country2) || 0
          };
        });
      
        // Specify the chart's dimensions.
        const width = 928;
        const height = 600;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 30;
      
        // Create the positional and color scales.
        const x = d3.scaleTime()
          .domain(d3.extent(chartData, d => d.Date))
          .range([marginLeft, width - marginRight]);
      
        const y = d3.scaleLinear()
          .domain([
            d3.min(chartData, d => Math.min(d.value0, d.value1)),
            d3.max(chartData, d => Math.max(d.value0, d.value1))
          ])
          .range([height - marginBottom, marginTop]);
      
        const colors = [d3.schemeRdYlBu[3][2], d3.schemeRdYlBu[3][0]]; // Blue and red colors
      
        // Create the SVG container.
        const svg = d3.create("svg")
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
          .datum(chartData);
      
        // Create the axes.
        svg.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(d3.axisBottom(x)
            .ticks(width / 80)
            .tickSizeOuter(0))
          .call(g => g.select(".domain").remove());
      
        svg.append("g")
          .attr("transform", `translate(${marginLeft},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
          .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", -marginLeft)
            .attr("y", -30)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Deaths"));
      
        // Create the area generators for country1 and country2.
        const area1 = d3.area()
          .curve(d3.curveStep)
          .x(d => x(d.Date))
          .y0(d => y(d.value1))
          .y1(d => y(d.value0));
      
        // Draw the areas with blue color for country1.
        svg.append("path")
          .attr("fill", colors[0]) // Blue for country1
          .attr("d", area1);
      
        // Draw the line with orange color for country2
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", colors[1]) // Orange for country2
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
            .curve(d3.curveStep)
            .x(d => x(d.Date))
            .y(d => y(d.value1)));
      
        return svg.node();
      }
      
      // Load the CSV data and create the chart
      d3.csv("../Datasets/monthly_deaths.csv").then(data => {
        // Convert 'Year' and 'Month' to Date objects and 'Deaths' to numbers
        data.forEach(d => {
          d.Date = new Date(d.Year, d.Month - 1);
          d.Deaths = +d.Deaths;
        });
      
        // Get unique countries for the dropdown
        const countries = Array.from(new Set(data.map(d => d.Country)));
      
        // Create dropdown options
        const countryDropdown1 = d3.select("#country1");
        const countryDropdown2 = d3.select("#country2");
        countries.forEach(country => {
          countryDropdown1.append("option").text(country).attr("value", country);
          countryDropdown2.append("option").text(country).attr("value", country);
        });
      
        // Function to update the chart based on dropdown selections
        function updateChart() {
          const selectedCountry1 = countryDropdown1.node().value;
          const selectedCountry2 = countryDropdown2.node().value;
      
          // Select the div with id 'chart'
          const chartDiv = d3.select("#chart");
          chartDiv.html(""); // Clear existing chart
      
          // Create the chart within the chartDiv
          chartDiv.node().appendChild(differenceChart(data, selectedCountry1, selectedCountry2));
        }
      
        // Initial chart rendering
        updateChart();
      
        // Event listeners for dropdown changes
        countryDropdown1.on("change", updateChart);
        countryDropdown2.on("change", updateChart);
      });

  return svg.node();
}

// Load the CSV data and create the chart
d3.csv("../Datasets/monthly_deaths.csv").then(data => {
  // Convert 'Year' and 'Month' to Date objects and 'Deaths' to numbers
  data.forEach(d => {
    d.Date = new Date(d.Year, d.Month - 1);
    d.Deaths = +d.Deaths;
  });

  // Get unique countries for the dropdown
  const countries = Array.from(new Set(data.map(d => d.Country)));

  // Create dropdown options
  const countryDropdown1 = d3.select("#country1");
  const countryDropdown2 = d3.select("#country2");
  countries.forEach(country => {
    countryDropdown1.append("option").text(country).attr("value", country);
    countryDropdown2.append("option").text(country).attr("value", country);
  });

  // Function to update the chart based on dropdown selections
  function updateChart() {
    const selectedCountry1 = countryDropdown1.node().value;
    const selectedCountry2 = countryDropdown2.node().value;

    // Select the div with id 'chart'
    const chartDiv = d3.select("#chart");
    chartDiv.html(""); // Clear existing chart

    // Create the chart within the chartDiv
    chartDiv.node().appendChild(differenceChart(data, selectedCountry1, selectedCountry2));
  }

  // Initial chart rendering
  updateChart();

  // Event listeners for dropdown changes
  countryDropdown1.on("change", updateChart);
  countryDropdown2.on("change", updateChart);
});