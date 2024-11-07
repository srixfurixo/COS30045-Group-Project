var top5DataFile = "../Datasets/log_scaled_vaccine_data_top_5.csv";
var bottom5DataFile = "../Datasets/log_scaled_vaccine_data_bottom_5.csv";

var radarConfig = {
  containerClass: 'radar-chart',
  w: 700,
  h: 400,
  factor: 0.85,
  factorLegend: 1,
  levels: 5,
  levelTick: true,
  TickLength: 10,
  maxValue: 1.0, // Adjust based on your data's maximum value
  minValue: 0,
  radians: 2 * Math.PI,
  color: function(d, i) {
    return d.color; // Use the color assigned in the data
  },
  axisLine: true,
  axisText: true,
  circles: true,
  radius: 5,
  open: false,
  backgroundTooltipColor: "#555",
  backgroundTooltipOpacity: "0.7",
  tooltipColor: "white",
  axisJoin: function(d, i) {
    return d.className || i;
  },
  tooltipFormatValue: function(d) {
    return d;
  },
  tooltipFormatClass: function(d) {
    return d;
  },
  transitionDuration: 300
};

// RadarChart module (your provided template)
var RadarChart = {
  defaultConfig: {
    containerClass: 'radar-chart',
    w: 400,
    h: 400,
    factor: 0.95,
    factorLegend: 1,
    levels: 3,
    levelTick: false,
    TickLength: 10,
    maxValue: 0,
    minValue: 0,
    radians: 2 * Math.PI,
    color: d3.scale.category10(),
    axisLine: true,
    axisText: true,
    circles: true,
    radius: 5,
    open: false,
    backgroundTooltipColor: "#555",
    backgroundTooltipOpacity: "0.7",
    tooltipColor: "white",
    axisJoin: function(d, i) {
      return d.className || i;
    },
    tooltipFormatValue: function(d) {
      return d;
    },
    tooltipFormatClass: function(d) {
      return d;
    },
    transitionDuration: 300
  },
  chart: function() {
    // default config
    var cfg = Object.create(RadarChart.defaultConfig);
    function setTooltip(tooltip, msg, data) {
      if(msg === false || msg == undefined) {
        tooltip.classed("visible", 0);
        tooltip.select("rect").classed("visible", 0);
      } else {
        tooltip.classed("visible", 1);
    
        var container = tooltip.node().parentNode;
        var coords = d3.mouse(container);
    
        // Format tooltip text with multiple lines if data is provided
        var tooltipText = data ? 
          "Country: " + msg + "\n" + 
          "Vaccine: " + data.axis + "\n" +
          "Value: " + d3.format(".2f")(data.value) :
          msg;
    
        var tooltipLines = tooltipText.split('\n');
        
        tooltip.select("text")
          .classed('visible', 1)
          .style("fill", cfg.tooltipColor)
          .selectAll('tspan')
          .data(tooltipLines)
          .enter()
          .append('tspan')
          .attr('x', 0)
          .attr('dy', function(d, i) { return i * 1.2 + 'em'; })
          .text(function(d) { return d; });
    
        var bbox = tooltip.select("text").node().getBBox();
        var padding = 5;
    
        tooltip.select("rect")
          .classed('visible', 1)
          .attr("x", bbox.x - padding)
          .attr("y", bbox.y - padding)
          .attr("width", bbox.width + (padding*2))
          .attr("height", bbox.height + (padding*2))
          .attr("rx", "5").attr("ry", "5")
          .style("fill", cfg.backgroundTooltipColor)
          .style("opacity", cfg.backgroundTooltipOpacity);
    
        tooltip.attr("transform", "translate(" + (coords[0]+10) + "," + (coords[1]-10) + ")");
      }
    }
    function radar(selection) {
      selection.each(function(data) {
        var container = d3.select(this);
        var tooltip = container.selectAll('g.tooltip').data([data[0]]);

        var tt = tooltip.enter()
        .append('g')
        .classed('tooltip', true);

        tt.append('rect').classed("tooltip", true);
        tt.append('text').classed("tooltip", true);

        // allow simple notation
        data = data.map(function(datum) {
          if(datum instanceof Array) {
            datum = {axes: datum};
          }
          return datum;
        });

        var maxValue = Math.max(cfg.maxValue, d3.max(data, function(d) {
          return d3.max(d.axes, function(o){ return o.value; });
        }));
        maxValue -= cfg.minValue;

        var allAxis = data[0].axes.map(function(i, j){ return {name: i.axis, xOffset: (i.xOffset)?i.xOffset:0, yOffset: (i.yOffset)?i.yOffset:0}; });
        var total = allAxis.length;
        var radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
        var radius2 = Math.min(cfg.w / 2, cfg.h / 2);

        container.classed(cfg.containerClass, 1);

        function getPosition(i, range, factor, func){
          factor = typeof factor !== 'undefined' ? factor : 1;
          return range * (1 - factor * func(i * cfg.radians / total));
        }
        function getHorizontalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.sin);
        }
        function getVerticalPosition(i, range, factor){
          return getPosition(i, range, factor, Math.cos);
        }

        // levels & axes
        var levelFactors = d3.range(0, cfg.levels).map(function(level) {
          return radius * ((level + 1) / cfg.levels);
        });

        var levelGroups = container.selectAll('g.level-group').data(levelFactors);

        levelGroups.enter().append('g');
        levelGroups.exit().remove();

        levelGroups.attr('class', function(d, i) {
          return 'level-group level-group-' + i;
        });

        var levelLine = levelGroups.selectAll('.level').data(function(levelFactor) {
          return d3.range(0, total).map(function() { return levelFactor; });
        });

        levelLine.enter().append('line');
        levelLine.exit().remove();

        if (cfg.levelTick){
          levelLine
          .attr('class', 'level')
          .attr('x1', function(levelFactor, i){
            if (radius == levelFactor) {
              return getHorizontalPosition(i, levelFactor);
            } else {
              return getHorizontalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y1', function(levelFactor, i){
            if (radius == levelFactor) {
              return getVerticalPosition(i, levelFactor);
            } else {
              return getVerticalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('x2', function(levelFactor, i){
            if (radius == levelFactor) {
              return getHorizontalPosition(i+1, levelFactor);
            } else {
              return getHorizontalPosition(i, levelFactor) - (cfg.TickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y2', function(levelFactor, i){
            if (radius == levelFactor) {
              return getVerticalPosition(i+1, levelFactor);
            } else {
              return getVerticalPosition(i, levelFactor) + (cfg.TickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('transform', function(levelFactor) {
            return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
          });
        }
        else{
          levelLine
          .attr('class', 'level')
          .attr('x1', function(levelFactor, i){ return getHorizontalPosition(i, levelFactor); })
          .attr('y1', function(levelFactor, i){ return getVerticalPosition(i, levelFactor); })
          .attr('x2', function(levelFactor, i){ return getHorizontalPosition(i+1, levelFactor); })
          .attr('y2', function(levelFactor, i){ return getVerticalPosition(i+1, levelFactor); })
          .attr('transform', function(levelFactor) {
            return 'translate(' + (cfg.w/2-levelFactor) + ', ' + (cfg.h/2-levelFactor) + ')';
          });
        }
        if(cfg.axisLine || cfg.axisText) {
          var axis = container.selectAll('.axis').data(allAxis);

          var newAxis = axis.enter().append('g');
          if(cfg.axisLine) {
            newAxis.append('line');
          }
          if(cfg.axisText) {
            newAxis.append('text');
          }

          axis.exit().remove();

          axis.attr('class', 'axis');

          if(cfg.axisLine) {
            axis.select('line')
            .attr('x1', cfg.w/2)
            .attr('y1', cfg.h/2)
            .attr('x2', function(d, i) { return (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factor); })
            .attr('y2', function(d, i) { return (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factor); });
          }

          if(cfg.axisText) {
            axis.select('text')
            .attr('class', function(d, i){
              var p = getHorizontalPosition(i, 0.5);

              return 'legend ' +
              ((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
            })
            .attr('dy', function(d, i) {
              var p = getVerticalPosition(i, 0.5);
              return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
            })
            .text(function(d) { return d.name; })
            .attr('x', function(d, i){ return d.xOffset+ (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, cfg.factorLegend); })
            .attr('y', function(d, i){ return d.yOffset+ (cfg.h/2-radius2)+getVerticalPosition(i, radius2, cfg.factorLegend); });
          }
        }

        // content
        data.forEach(function(d){
          d.axes.forEach(function(axis, i) {
            axis.x = (cfg.w/2-radius2)+getHorizontalPosition(i, radius2, (parseFloat(Math.max(axis.value - cfg.minValue, 0))/maxValue)*cfg.factor);
            axis.y = (cfg.h/2-radius2)+getVerticalPosition(i, radius2, (parseFloat(Math.max(axis.value - cfg.minValue, 0))/maxValue)*cfg.factor);
          });
        });
        var polygon = container.selectAll(".area").data(data, cfg.axisJoin);

        var polygonType = 'polygon';
        if (cfg.open) {
          polygonType = 'polyline';
        }

        polygon.enter().append(polygonType)
        .classed({area: 1, 'd3-enter': 1})
        .on('mouseover', function (dd){
          d3.event.stopPropagation();
          container.classed('focus', 1);
          d3.select(this).classed('focused', 1);
          setTooltip(tooltip, dd.className);
        })
        .on('mouseout', function(){
          d3.event.stopPropagation();
          container.classed('focus', 0);
          d3.select(this).classed('focused', 0);
          setTooltip(tooltip, false);
        });

        polygon.exit()
        .classed('d3-exit', 1) // trigger css transition
        .transition().duration(cfg.transitionDuration)
        .remove();

        polygon
        .each(function(d, i) {
          var classed = {'d3-exit': 0}; // if exiting element is being reused
          classed['radar-chart-serie' + i] = 1;
          if(d.className) {
            classed[d.className] = 1;
          }
          d3.select(this).classed(classed);
        })
        // styles should only be transitioned with css
        .style('stroke', function(d, i) { return cfg.color(d, i); })
        .style('fill', function(d, i) { return cfg.color(d, i); })
        .transition().duration(cfg.transitionDuration)
        // svg attrs with js
        .attr('points',function(d) {
          return d.axes.map(function(p) {
            return [p.x, p.y].join(',');
          }).join(' ');
        })
        .each('start', function() {
          d3.select(this).classed('d3-enter', 0); // trigger css transition
        });

        if(cfg.circles && cfg.radius) {

          var circleGroups = container.selectAll('g.circle-group').data(data, cfg.axisJoin);

          circleGroups.enter().append('g').classed({'circle-group': 1, 'd3-enter': 1});
          circleGroups.exit()
          .classed('d3-exit', 1) // trigger css transition
          .transition().duration(cfg.transitionDuration).remove();

          circleGroups
          .each(function(d) {
            var classed = {'d3-exit': 0}; // if exiting element is being reused
            if(d.className) {
              classed[d.className] = 1;
            }
            d3.select(this).classed(classed);
          })
          .transition().duration(cfg.transitionDuration)
          .each('start', function() {
            d3.select(this).classed('d3-enter', 0); // trigger css transition
          });

          var circle = circleGroups.selectAll('.circle').data(function(datum, i) {
            return datum.axes.map(function(d) { return [d, i]; });
          });

          circle.enter().append('circle')
          .classed({circle: 1, 'd3-enter': 1})
          .on('mouseover', function(dd){
            d3.event.stopPropagation();
            var countryData = data[dd[1]];
            setTooltip(tooltip, countryData.className, dd[0]);
          })
          .on('mouseout', function(dd){
            d3.event.stopPropagation();
            setTooltip(tooltip, false);
            container.classed('focus', 0);
          });

          circle.exit()
          .classed('d3-exit', 1) // trigger css transition
          .transition().duration(cfg.transitionDuration).remove();

          circle
          .each(function(d) {
            var classed = {'d3-exit': 0}; // if exit element reused
            classed['radar-chart-serie'+d[1]] = 1;
            d3.select(this).classed(classed);
          })
          // styles should only be transitioned with css
          .style('fill', function(d) { return cfg.color(data[d[1]], d[1]); })
          .transition().duration(cfg.transitionDuration)
          // svg attrs with js
          .attr('r', cfg.radius)
          .attr('cx', function(d) {
            return d[0].x;
          })
          .attr('cy', function(d) {
            return d[0].y;
          })
          .each('start', function() {
            d3.select(this).classed('d3-enter', 0); // trigger css transition
          });

          //Make sure layer order is correct
          var poly_node = polygon.node();
          if (poly_node) {
            poly_node.parentNode.appendChild(poly_node);
          }

          var cg_node = circleGroups.node();
          if (cg_node) {
            cg_node.parentNode.appendChild(cg_node);
          }

          // ensure tooltip is upmost layer
          var tooltipEl = tooltip.node();
          if (tooltipEl) {
            tooltipEl.parentNode.appendChild(tooltipEl);
          }
        }
      });
    }

    radar.config = function(value) {
      if(!arguments.length) {
        return cfg;
      }
      if(arguments.length > 1) {
        cfg[arguments[0]] = arguments[1];
      }
      else {
        d3.entries(value || {}).forEach(function(option) {
          cfg[option.key] = option.value;
        });
      }
      return radar;
    };

    return radar;
  },
  draw: function(id, d, options) {
    var chart = RadarChart.chart().config(options);
    var cfg = chart.config();

    d3.select(id).select('svg').remove();
    d3.select(id)
    .append("svg")
    .attr("width", cfg.w)
    .attr("height", cfg.h)
    .datum(d)
    .call(chart);
  }
};

// Initialization function
function init() {
  // Load both CSV files using D3 v3's csv function with callbacks
  d3.csv(top5DataFile, function(errorTop5, top5Data) {
    if (errorTop5) {
      console.error("Error loading top 5 data:", errorTop5);
      return;
    }

    d3.csv(bottom5DataFile, function(errorBottom5, bottom5Data) {
      if (errorBottom5) {
        console.error("Error loading bottom 5 data:", errorBottom5);
        return;
      }

      // Prepare data for radar chart
      var processedData = prepareRadarData(top5Data, bottom5Data);

      // Create the radar chart
      RadarChart.draw("#radarChart", processedData, radarConfig);

      // Add Legend
      createLegend(processedData);
    });
  });
}

// Function to transform data for radar chart input format
function prepareRadarData(top5Data, bottom5Data) {
  var vaccines = ["Pfizer/BioNTech", "Moderna", "Oxford/AstraZeneca", "Johnson&Johnson", "Sputnik V"];

  // Define color arrays
  var topColors = ["#006400", "#228B22", "#32CD32", "#7CFC00", "#ADFF2F"]; // Green shades
  var bottomColors = ["#00008B", "#0000CD", "#4169E1", "#1E90FF", "#87CEFA"]; // Blue shades

  // Process top countries
  var top5 = top5Data.map(function(country, index) {
    return {
      className: country.country, // Use 'country' from CSV
      axes: vaccines.map(function(vaccine) {
        return {
          axis: vaccine,
          value: parseFloat(country[vaccine]) || 0
        };
      }),
      color: topColors[index % topColors.length] // Assign color from topColors
    };
  });

  // Process bottom countries
  var bottom5 = bottom5Data.map(function(country, index) {
    return {
      className: country.country, // Use 'country' from CSV
      axes: vaccines.map(function(vaccine) {
        return {
          axis: vaccine,
          value: parseFloat(country[vaccine]) || 0
        };
      }),
      color: bottomColors[index % bottomColors.length] // Assign color from bottomColors
    };
  });

  // Combine top5 and bottom5 data
  return top5.concat(bottom5);
}

// Function to create the legend
function createLegend(data) {
  var svg = d3.select("#radarChart svg");

  var legend = svg.append("g")
    .attr("class", "legend")
    .attr("height", 200)
    .attr("width", 200)
    .attr('transform', 'translate(20,70)');

  legend.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', radarConfig.w - 100)
    .attr('y', function(d, i){ return i * 20;})
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function(d){ return d.color; });

  legend.selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', radarConfig.w - 85)
    .attr('y', function(d, i){ return i * 20 + 9;})
    .attr('font-size', '11px')
    .attr('fill', '#737373')
    .text(function(d) { return d.className; });
}

// Load the radar chart on window load
window.onload = init;
