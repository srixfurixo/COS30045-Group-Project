// Refer to 2017 Mike Bostock.
// Immediately Invoked Function Expression (IIFE) to create a local scope
(function(global, factory) {
    // Checks if the code is running in CommonJS (Node.js) or AMD (RequireJS) environments
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    // Otherwise, attaches the factory to the global object
    (global.versor = factory());
  }(this, (function() {
    'use strict';
  
    // Math constants and functions for quaternion calculations
    var acos = Math.acos,
        asin = Math.asin,
        atan2 = Math.atan2,
        cos = Math.cos,
        max = Math.max,
        min = Math.min,
        PI = Math.PI,
        sin = Math.sin,
        sqrt = Math.sqrt,
        radians = PI / 180, // Conversion factor from degrees to radians
        degrees = 180 / PI; // Conversion factor from radians to degrees
  
    // Returns the unit quaternion for the given Euler rotation angles [λ, φ, γ].
    function versor(e) {
        // Calculate half of the angles in radians
        var l = e[0] / 2 * radians, sl = sin(l), cl = cos(l), // λ / 2
            p = e[1] / 2 * radians, sp = sin(p), cp = cos(p), // φ / 2
            g = e[2] / 2 * radians, sg = sin(g), cg = cos(g); // γ / 2
        
        // Returns the quaternion components based on the input angles
        return [
            cl * cp * cg + sl * sp * sg,
            sl * cp * cg - cl * sp * sg,
            cl * sp * cg + sl * cp * sg,
            cl * cp * sg - sl * sp * cg
        ];
    }
  
    // Returns Cartesian coordinates [x, y, z] given spherical coordinates [λ, φ].
    versor.cartesian = function(e) {
        var l = e[0] * radians, p = e[1] * radians, cp = cos(p);
        // Calculate Cartesian coordinates from spherical coordinates
        return [cp * cos(l), cp * sin(l), sin(p)];
    };
  
    // Returns the Euler rotation angles [λ, φ, γ] for the given quaternion.
    versor.rotation = function(q) {
        // Calculate and return the Euler angles from the quaternion
        return [
            atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees,
            asin(max(-1, min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
            atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
        ];
    };
  
    // Returns the quaternion to rotate between two Cartesian points on the sphere.
    versor.delta = function(v0, v1) {
        var w = cross(v0, v1), l = sqrt(dot(w, w)); // Calculate the cross product and its length
        if (!l) return [1, 0, 0, 0]; // If the length is 0, return identity quaternion
        var t = acos(max(-1, min(1, dot(v0, v1)))) / 2, s = sin(t); // t = θ / 2
        // Return the quaternion representing the rotation
        return [cos(t), w[2] / l * s, -w[1] / l * s, w[0] / l * s];
    };
  
    // Returns the quaternion that represents q0 * q1.
    versor.multiply = function(q0, q1) {
        // Calculate and return the product of two quaternions
        return [
            q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2] - q0[3] * q1[3],
            q0[0] * q1[1] + q0[1] * q1[0] + q0[2] * q1[3] - q0[3] * q1[2],
            q0[0] * q1[2] - q0[1] * q1[3] + q0[2] * q1[0] + q0[3] * q1[1],
            q0[0] * q1[3] + q0[1] * q1[2] - q0[2] * q1[1] + q0[3] * q1[0]
        ];
    };
  
    // Function to calculate the cross product of two 3D vectors
    function cross(v0, v1) {
        return [
            v0[1] * v1[2] - v0[2] * v1[1],
            v0[2] * v1[0] - v0[0] * v1[2],
            v0[0] * v1[1] - v0[1] * v1[0]
        ];
    }
  
    // Function to calculate the dot product of two 3D vectors
    function dot(v0, v1) {
        return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
    }
  
    return versor; // Return the versor object for external use
  })));
  
(function() {

    // Setting up canvas
    var canvas = d3.select("#story1-canvas")
        .attr("width", document.querySelector(".chart1-container").clientWidth)
        .attr("height", document.querySelector(".chart1-container").clientWidth * 0.55); // Set aspect ratio

    var width = canvas.property("width");
    var height = canvas.property("height");
    var context = canvas.node().getContext("2d");

    // Tooltip
    var tooltip = d3.select("#story1-tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "8px")
        .style("font-size", "12px")
        // .style("color", COLORS.webTheme.midGrey)
        .style("pointer-events", "none")
        .style("box-shadow", "0px 0px 8px rgba(0, 0, 0, 0.15)");

    // Projection
    var projection = d3.geoOrthographic()
        .scale((height - 10) / 2)
        .translate([width / 2, height / 2])
        .rotate([30, -55])
        .precision(0.1);

    var path = d3.geoPath().projection(projection).context(context);

    // Year range slider
    var yearSlider = document.getElementById('year-slider');
    var render;

    d3.csv("datasets/Countries_mortality_rate.csv").then(function (data) {
        // Take year 2000 and after.
        data = data.filter(d => +d.Year >= 2000 && +d.Year <= 2019);


        let years = data.map(d => +d.Year);
        let minYear = d3.min(years);
        let maxYear = d3.max(years);

        // Year range slider with pips (tick labels)
        noUiSlider.create(yearSlider, {
            start: [minYear, maxYear],
            connect: true,
            range: {
                'min': minYear,
                'max': maxYear
            },
            step: 1,
            pips: {
                mode: 'steps',
                density: 2,  // Adjust this to control spacing
                filter: function (value) {
                    // Return 1 for even years to make them large, -1 for odd years to make them small
                    return value % 2 === 0 ? 1 : -1;
                },
                format: {
                    to: function (value) {
                        // Only show the year label for even years
                        return value % 2 === 0 ? Math.round(value) : '';
                    }
                }
            }
        });
        

        // Update the year range when the slider is moved
        yearSlider.noUiSlider.on('update', function (values) {
            minYear = Math.round(values[0]);
            maxYear = Math.round(values[1]);
            // document.getElementById('yearrange-label').innerHTML = 'Year Range: ' + minYear + ' - ' + maxYear;

            // Global variables
            selectedMinYear = minYear;
            selectedMaxYear = maxYear;

            // Call render if required
            if (render) {
                render(minYear, maxYear);
            }
        });

        d3.json("https://unpkg.com/world-atlas@1/world/110m.json").then(function (world) {
            var sphere = { type: "Sphere" },
                land = topojson.feature(world, world.objects.countries);

            d3.json("datasets/countries_code_story1.json").then(function (countryCodes) {
                var countryCodeMap = {};
                countryCodes.forEach(function (d) {
                    countryCodeMap[d['country-code']] = d.name;
                });

                // Set up the mortality map here using the data
                var mortalityMap = {};
                data.forEach(d => {
                    var country = d.name;
                    var year = parseInt(d.Year);
                    var rate = +d.Mortality_Rate1;

                    if (!mortalityMap[country]) {
                        mortalityMap[country] = {};
                    }
                    mortalityMap[country][year] = rate;
                });

                // Max Mortality calculation and color scale setup
                let maxMortalityRate = 0;
                for (const country in mortalityMap) {
                    for (const year in mortalityMap[country]) {
                        const rate = mortalityMap[country][year];
                        maxMortalityRate = Math.max(maxMortalityRate, rate);
                    }
                }
                const roundedMaxMortality = Math.ceil(maxMortalityRate);

                var colorScale = d3.scaleLinear()
                    .range([COLORS.lightPink, COLORS.darkPink])
                    .domain([0, roundedMaxMortality]);

                // Color legend
                customLinearHorizontalLegend(
                    colorScale,
                    0,
                    roundedMaxMortality, //Else when data is null, no legend is display at all
                    .5, //tick
                    margin = { top: 30, right: 0, bottom: 70, left: 70 }, //margin
                    "Mortality Rate (%)",
                    "#story1-legend" //id
                );

                render = function (minYear, maxYear) {
                    context.clearRect(0, 0, width, height);
                    context.beginPath(), path(sphere), context.fillStyle = "#fff", context.fill();
                    context.beginPath(), path(land);

                    let countryMortality = [];
                    // Initialize an array to hold the label positions
                    let labelPositions = [];

                    land.features.forEach(function (feature) {
                        var countryId = feature.id;
                        var countryName = countryCodeMap[countryId];

                        // Calculate average mortality rate of each country within the selected year
                        var totalMortality = 0;
                        var count = 0;
                        for (var year = minYear; year <= maxYear; year++) {
                            if (mortalityMap[countryName] && mortalityMap[countryName][year] !== undefined) {
                                totalMortality += mortalityMap[countryName][year];
                                count++;
                            }
                        }
                        var averageMortality = count > 0 ? totalMortality / count : null;

                        if (averageMortality !== null) {
                            countryMortality.push({ country: countryName, mortality: averageMortality });
                        }

                        // Draw Chart
                        context.fillStyle = averageMortality ? colorScale(averageMortality) : "#ccc";
                        context.beginPath();
                        path(feature);
                        context.fill();

                        context.strokeStyle = "#000";
                        context.lineWidth = 0.5;
                        context.stroke();

                        //Country Labelling
                        // var oecd = [
                        //     "Australia", "Austria", "Belgium", "Canada", "Chile", "Colombia", "Costa Rica", 
                        //     "Czechia", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", 
                        //     "Iceland", "Ireland", "Israel", "Italy", "Japan", "Korea", "Latvia", "Lithuania", 
                        //     "Luxembourg", "Mexico", "Netherlands", "New Zealand", "Norway", "Poland", "Portugal", 
                        //     "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Turkey", 
                        //     "United Kingdom", "United States of America"
                        // ];
                        var oecd = [
                            "Australia", "Austria", "Belgium", "Canada", "Chile", "Colombia",
                            "Costa Rica", "Czechia", "Denmark", "Estonia", "Finland", "France",
                            "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Israel",
                            "Italy", "Japan", "Korea", "Latvia", "Lithuania", "Luxembourg",
                            "Mexico", "Netherlands", "New Zealand", "Norway", "Poland",
                            "Portugal", "Slovak Republic", "Slovenia", "Spain", "Sweden",
                            "Switzerland", "Turkey", "United Kingdom", "United States of America"
                        ]
                
                        if (oecd.includes(countryName)) {
                          let maxArea = 0;
                          let largestPolygonCentroid = null;
                      
                          if (feature.geometry.type === "MultiPolygon") {
                              feature.geometry.coordinates.forEach(polygon => {
                                  polygon.forEach(ring => {
                                      const projectedPolygon = { type: "Polygon", coordinates: [ring] };
                                      const area = d3.geoArea(projectedPolygon);
                                      if (area > maxArea) {
                                          maxArea = area;
                                          largestPolygonCentroid = d3.geoCentroid(projectedPolygon);
                                      }
                                  });
                              });
                          } else {
                              largestPolygonCentroid = d3.geoCentroid(feature);
                          }
                      
                          if (largestPolygonCentroid) {
                            const projected = projection(largestPolygonCentroid);

                            // Calculate vectors for the centroid and the center of the globe
                            const centroidVector = versor.cartesian(largestPolygonCentroid);
                            const centerVector = versor.cartesian(projection.invert([width / 2, height / 2]));
                    
                            // Calculate the dot product between the vectors
                            const dotProduct = centroidVector[0] * centerVector[0] + centroidVector[1] * centerVector[1] + centroidVector[2] * centerVector[2];
                
                            // Determine if the centroid is on the visible hemisphere (dot product > 0)
                            if (dotProduct > 0 && projected) {
                                const [x, y] = projected;
                                const textWidth = context.measureText(countryName).width;
                                const textHeight = 10; // Approximate text height for font-size of 10px
                
                                // Create a bounding box for the label
                                const labelBox = {
                                    x: x - textWidth / 2,
                                    y: y - textHeight / 2,
                                    width: textWidth,
                                    height: textHeight
                                };
                
                                // Check for overlap with existing label positions
                                const overlaps = labelPositions.some(position => {
                                    return !(labelBox.x + labelBox.width < position.x || 
                                             labelBox.x > position.x + position.width || 
                                             labelBox.y + labelBox.height < position.y || 
                                             labelBox.y > position.y + position.height);
                                });
                
                                // Only draw label if no overlap
                                if (!overlaps) {
                                    // context.font = "10px Arial";
                                    context.fillStyle = "#000";
                                    context.textAlign = "center";
                                    context.textBaseline = "middle";
                
                                    context.fillText(countryName, x, y);
                
                                    // Store the position of this label
                                    labelPositions.push(labelBox);
                                }
                            }
                        }
                    }
                });

                    // Update global variables
                    countryMortality.sort((a, b) => b.mortality - a.mortality);

                    var highMortalityCountriesData = countryMortality.slice(0, 3); // Get top 3 countries by mortality
                    var lowMortalityCountriesData = countryMortality.slice(-3).sort((a, b) => a.mortality - b.mortality); // Get bottom 3 (lowest), and sort in ascending order

                    highMortalityCountries = highMortalityCountriesData.map(country => country.country);
                    lowMortalityCountries = lowMortalityCountriesData.map(country => country.country);

                    // console.log(highMortalityCountries)
                    // console.log(lowMortalityCountries)

                    // Displaying Insight
                    // Map both country and mortality rates for the high and low mortality countries as list items
                    var highMortalityInsight = highMortalityCountriesData.map(country => `<li>&#8226; ${country.country} (${country.mortality.toFixed(3)}%)</li>`).join('');
                    var lowMortalityInsight= lowMortalityCountriesData.map(country => `<li>&#8226; ${country.country} (${country.mortality.toFixed(3)}%)</li>`).join('');

                    // Create the full HTML with bullet points for each country list
                    var story1insight = document.getElementById('story1-insight');

                    if (minYear != maxYear){
                        story1insight.innerHTML = `During year from <strong>${minYear} to ${maxYear}</strong>, the following countries have the <strong>highest</strong> average mortality rates:
                            <ul>${highMortalityInsight}</ul>
                            In contrast, the countries with the <strong>lowest</strong> average mortality rates are:
                            <ul>${lowMortalityInsight}</ul>`;
                    }
                    else{
                        story1insight.innerHTML = `During year <strong>${minYear}</strong>, the following countries have the <strong>highest</strong> average mortality rates:
                            <ul>${highMortalityInsight}</ul>
                            In contrast, the countries with the <strong>lowest</strong> average mortality rates are:
                            <ul>${lowMortalityInsight}</ul>`;
                    }


                   
                    context.beginPath(), path(sphere), context.stroke();

                };

                // Event listeners for the canvas tooltips, etc.
                canvas.on("mousemove", function (event) {
                    const [mouseX, mouseY] = d3.pointer(event, canvas.node());
                    let found = false;

                    land.features.forEach(function (feature) {
                        context.beginPath();
                        path(feature);

                        if (context.isPointInPath(mouseX, mouseY)) {
                            const countryId = feature.id;
                            const countryName = countryCodeMap[countryId];
                            const mortalityData = mortalityMap[countryName];
                            let totalMortality = 0;
                            let count = 0;
                            for (let year = minYear; year <= maxYear ; year++) {
                                if (mortalityData && mortalityData[year] !== undefined) {
                                    totalMortality += mortalityData[year];
                                    count++;
                                }
                            }
                            const averageMortality = count > 0 ? totalMortality / count : null;

                            tooltip.style("opacity", 1)
                                // .style("left",   (event.pageX+40) + "px")
                                // .style("top", (event.pageY+20) + "px")
                                .style("left",   (mouseX+40) + "px")
                                .style("top", (mouseY+20) + "px")
                                .html(`
                                    <strong>${countryName}</strong><br>
                                    Mortality Rate: ${averageMortality ? averageMortality.toFixed(3)+"%" : "N/A"}
                                `);

                            found = true;
                        }
                    });

                    if (!found) tooltip.style("opacity", 0);
                });

                canvas.on("mouseout", function () {
                    tooltip.style("opacity", 0);
                });

                // Zoom functionality
                d3.geoZoom()
                    .projection(projection)
                    .onMove(function () {
                        render(minYear, maxYear);
                    })
                    (canvas.node());

                render(minYear, maxYear);
            });
        });
    });
  
})();
