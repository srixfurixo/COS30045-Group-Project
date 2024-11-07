function init() {
  // Set margins and dimensions
  const margin = { top: 40, right: 30, bottom: 50, left: 150 };
  const width = 960 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  const barPadding = 0.1;
  const n = 12; // Number of top bars to show

  // Create an SVG container
  const svg = d3.select("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]);

  // Set up scales
  const x = d3.scaleLinear()
      .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
      .rangeRound([margin.top, height - margin.bottom])
      .padding(barPadding);

  // Set color scale
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // Load the dataset
  d3.csv("merged_data_with_expenditure_corrected.csv").then(function(data) {
    
    // Preprocess the data
    data.forEach(function(d) {
      d.Year = +d.Year;  // Convert Year to number
      d.Month = +d.Month;  // Convert Month to number
      d.Deaths = +d.Deaths;  // Convert Deaths to numeric type
    });

    // Group the data by Year, Month, and Country, summing Deaths
    const dataByTime = Array.from(
      d3.rollup(data, 
        function(v) { 
          return d3.sum(v, function(d) { 
            return d.Deaths; 
          }); 
        },
        function(d) { 
          return `${d.Year}-${d.Month}`; 
        },
        function(d) { 
          return d.Country; 
        }
      ),
      function([time, countries]) { 
        return [time, countries]; 
      }
    );

    // Prepare keyframes by iterating over the years and months
    const keyframes = [];
    const timeSteps = Array.from(new Set(data.map(function(d) { 
      return `${d.Year}-${d.Month}`; 
    }))).sort(function(a, b) { 
      return new Date(a) - new Date(b); 
    });

    for (let i = 0; i < timeSteps.length; i++) {
      const timeStep = timeSteps[i];
      const [year, month] = timeStep.split("-");
      const date = new Date(year, month - 1);  // Create a proper Date object

      const countryData = Array.from(dataByTime[i][1], function([country, deaths]) {
        return {
          name: country,
          value: deaths
        };
      });

      countryData.sort(function(a, b) { 
        return b.value - a.value; 
      });
      countryData.forEach(function(d, i) { 
        d.rank = i; 
      });

      keyframes.push([date, countryData]);
    }

    // Set x domain based on maximum Deaths
    x.domain([0, d3.max(keyframes.flatMap(function([, data]) { 
      return data; 
    }), function(d) { 
      return d.value; 
    })]);

    // Set y domain
    y.domain(d3.range(n));

    // Initialize bars, labels, and axis elements
    const barGroup = svg.append("g");
    const labelGroup = svg.append("g");
    const axisGroup = svg.append("g").attr("transform", `translate(0,${margin.top})`);

    // Function to update bars
    function updateBars([date, data]) {
      const t = svg.transition().duration(500).ease(d3.easeLinear);

      // Update bars
      const bars = barGroup.selectAll("rect")
        .data(data.slice(0, n), function(d) { 
          return d.name; 
        });

      bars.enter()
        .append("rect")
        .attr("fill", function(d) { 
          return color(d.name); 
        })
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("y", function(d) { 
          return y(d.rank); 
        })
        .attr("width", function(d) { 
          return x(d.value) - x(0); 
        })
        .merge(bars)
        .transition(t)
        .attr("y", function(d) { 
          return y(d.rank); 
        })
        .attr("width", function(d) { 
          return x(d.value) - x(0); 
        });

      bars.exit().transition(t).attr("width", 0).remove();

      // Update labels
      const labels = labelGroup.selectAll("text")
        .data(data.slice(0, n), function(d) { 
          return d.name; 
        });

      labels.enter()
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", function(d) { 
          return x(d.value) - 5; 
        })
        .attr("y", function(d) { 
          return y(d.rank) + y.bandwidth() / 2 + 5; 
        })
        .text(function(d) { 
          return d.name; 
        })
        .merge(labels)
        .transition(t)
        .attr("x", function(d) { 
          return x(d.value) - 5; 
        })
        .attr("y", function(d) { 
          return y(d.rank) + y.bandwidth() / 2 + 5; 
        });

      labels.exit().transition(t).attr("x", x(0)).remove();

      // Update axis
      const axis = d3.axisTop(x).ticks(width / 160);
      axisGroup.transition(t).call(axis);
      axisGroup.selectAll(".tick").filter(function(d) { 
        return d === 0; 
      }).remove();

      // Update ticker
      ticker.text(d3.timeFormat("%B %Y")(date));
    }

    // Ticker showing the year and month
    const ticker = svg.append("text")
        .style("font", "bold 48px sans-serif")
        .attr("text-anchor", "end")
        .attr("x", width - 20)
        .attr("y", height - 10)
        .text("");

    // Start the animation
    let i = 0;
    function animate() {
      updateBars(keyframes[i]);
      i = (i + 1) % keyframes.length; // Loop back to the start
      setTimeout(animate, 1000); // Adjust the speed as needed
    }

    animate();

  }).catch(function(error) {
    console.error('Error loading or processing data:', error);
  });
}

window.onload = init;
