document.addEventListener('DOMContentLoaded', function() {
    fetch('monthly_deaths.csv')
      .then(response => response.text())
      .then(text => {
        const data = d3.csvParse(text, d => {
          d.Year = +d.Year;
          d.Expenditure = +d.Expenditure;
          return d;
        });
  
        // Find all unique years and countries
        const years = [...new Set(data.map(d => d.Year))];
        const countries = [...new Set(data.map(d => d.Country))];
  
        // Create a nested array for the stack function
        const formattedData = years.map(year => {
          const yearData = { Year: year };
          countries.forEach(country => {
            const sum = d3.sum(data.filter(d => d.Year === year && d.Country === country), d => d.Expenditure);
            yearData[country] = isNaN(sum) ? 0 : sum;
          });
          return yearData;
        });
  
        const chart = () => {
          const width = 928;
          const height = 600;
          const marginTop = 80;
          const marginRight = 10;
          const marginBottom = 20;
          const marginLeft = 40;
  
          const series = d3.stack()
            .keys(countries)
            .value((d, key) => d[key])
            (formattedData);
  
          const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([marginLeft, width - marginRight]);
  
          const y = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
            .range([height - marginBottom, marginTop]);
  
          const color = d3.scaleOrdinal(d3.schemeCategory10);
  
          const area = d3.area()
            .x(d => x(d.data.Year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));
  
          const svg = d3.select("#chart")
            .append("svg")
            .attr("viewBox", [0, 0, width * 1.8 , height * 1]);
  
          svg.append("g")
            .selectAll("path")
            .data(series)
            .join("path")
              .attr("fill", ({key}) => color(key))
              .attr("d", area)
            .append("title")
              .text(({key}) => key);
  
          svg.append("g")
              .attr("transform", `translate(${marginLeft},0)`)
              .call(d3.axisLeft(y))
              .call(g => g.select(".domain").remove())
              .call(g => g.selectAll(".tick line").clone()
                  .attr("x2", width - marginLeft - marginRight)
                  .attr("stroke-opacity", 0.1))
              .call(g => g.append("text")
                  .attr("x", -marginLeft)
                  .attr("y", +60)
                  .attr("fill", "currentColor")
                  .attr("text-anchor", "start")
                  .text("Expenditure($)"));
  
          svg.append("g")
              .attr("transform", `translate(0,${height - marginBottom})`)
              .call(d3.axisBottom(x)
                .tickValues([2020, 2021, 2022, 2023, 2024]) // Set x-axis ticks explicitly
                .tickFormat(d3.format("d")) // Format tick labels as integers
              );
        };
  
        chart();
      })
      .catch(error => {
        console.error("Error loading or processing the data:", error);
      });
  });