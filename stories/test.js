// Define chart dimensions
const width = 1000;
const height = 500;
const marginTop = 20;
const marginRight = 10;
const marginBottom = 20;
const marginLeft = 40;

// Define keys (health functions) from the dataset
const keys = ["COVID-19 related costs for vaccination", "COVID-19 related costs for medical goods", "COVID-19 related treatment costs", "COVID-19 related investment costs"];

// Load data
d3.csv("../Datasets/story2.csv").then(data => {

  // Map each health function to a linear scale
  const x = new Map();
  keys.forEach(key => {
    x.set(key, d3.scaleLinear()
      .domain(d3.extent(data.filter(d => d["Health function"] === key), d => +d.OBS_VALUE))
      .range([marginLeft, width - marginRight]));
  });

  // Define the vertical y scale as a point scale for each health function
  const y = d3.scalePoint(keys, [marginTop, height - marginBottom]);

  // Define color scale for each country
  const color = d3.scaleOrdinal(d3.schemeCategory10)
                  .domain([...new Set(data.map(d => d.REF_AREA))]);

  // Create the SVG container
  const svg = d3.select("#chart").append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height);

  // Define line generator for each path
  const line = d3.line()
    .defined(([, value]) => value != null)
    .x(([key, value]) => x.get(key)(value))
    .y(([key]) => y(key));

  // Nest data by REF_AREA to create paths per region
  const nestedData = d3.groups(data, d => d.REF_AREA);

  // Append paths for each REF_AREA
  svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.6)
    .selectAll("path")
    .data(nestedData)
    .join("path")
    .attr("stroke", d => color(d[0]))  // color by country
    .attr("d", d => line(keys.map(key => [key, d[1].find(e => e["Health function"] === key)?.OBS_VALUE || null])))
    .append("title")
    .text(d => d[0]);

  // Append axes for each key
  svg.append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
    .attr("transform", d => `translate(0,${y(d)})`)
    .each(function(d) { d3.select(this).call(d3.axisBottom(x.get(d))); })
    .call(g => g.append("text")
      .attr("x", marginLeft)
      .attr("y", -6)
      .attr("text-anchor", "start")
      .attr("fill", "currentColor")
      .text(d => d))
    .call(g => g.selectAll("text")
      .clone(true).lower()
      .attr("fill", "none")
      .attr("stroke-width", 5)
      .attr("stroke-linejoin", "round")
      .attr("stroke", "white"));
});
