// Init
async function initCirclePacking(){
    var diseasesData = await d3.csv("datasets/causes_of_death_diseases.csv");
    var envData = await d3.csv("datasets/causes_of_death_env.csv");

    // Filter the diseases data to include only rows within the selected year range
    diseasesData = diseasesData.filter(row => {
        const year = +row.Year; // Convert the Year string to a number
        return year >= selectedMinYear && year <= selectedMaxYear;
    });

    // Filter the environment data to include only rows within the selected year range
    envData = envData.filter(row => {
        const year = +row.Year; // Convert the Year string to a number
        return year >= selectedMinYear && year <= selectedMaxYear;
    });

    // Countries selection picker
    // Extract countries for dropdown
    const countriesAvailable = [...new Set([...diseasesData.map(d => d.name), ...envData.map(e => e.name)])]; 

    // Sort the countries in ascending order
    countriesAvailable.sort((a, b) => a.localeCompare(b));

    var top3_high_low_countries = highMortalityCountries.concat(lowMortalityCountries)

    const selectpicker = $('#oecd_countries_selectpicker_story2');

    // Populate the country dropdown [Top 3 highest and lowest mortality rate countries by default]
    countriesAvailable.forEach(optionText => {
        // Check if the optionText is in top3_high_low_countries
        const isSelected = top3_high_low_countries.includes(optionText) ? 'selected' : '';
    
        // Append option with selected attribute if applicable
        selectpicker.append(`<option value="${optionText}" title="${optionText}" ${isSelected}>${optionText}</option>`);
    });

    // Populate the country dropdown [all selected by default]
    // countriesAvailable.forEach(optionText => {
    //     selectpicker.append(`<option value="${optionText}" title="${optionText}" selected>${optionText}</option>`);
    // });

    selectpicker.selectpicker('refresh'); // Refresh the selectpicker

    selectpicker.on('change', function () {
        const selectedCountry = $(this).val();
        updateChartForSelectedCountry(selectedCountry, diseasesData, envData);
    });

    // Draw chart
    // Fetch and process CSV data
    const [diseaseDataJSON, envDataJSON] = await csvToJson(diseasesData, envData); 

     // Combine the disease and environmental data into one structure
    const combinedData = {
        name: "Deaths",
        children: [diseaseDataJSON, envDataJSON]
    };

    d3.select("#story2-svg").selectAll("*").remove();

    drawCirclePackingChart(combinedData);
}

// Update chart
async function updateChartForSelectedCountry(selectedCountry, diseasesData, envData) {
    if (selectedCountry==null){
        d3.select("#story2-svg").selectAll("*").remove();
        var story2insight = document.getElementById('story2-insight');
        story2insight.innerHTML = "No data selected.";
        return;
    }

    // Filter data based on the selected country
    const filteredDiseasesData = diseasesData.filter(d => selectedCountry.includes(d.name));
    const filteredEnvData = envData.filter(e => selectedCountry.includes(e.name));

    // Process the filtered data into JSON format
    const [diseaseDataJSON, envDataJSON] = await csvToJson(filteredDiseasesData, filteredEnvData);

    // Combine the filtered disease and environmental data into one structure
    const combinedData = {
        name: "Deaths",
        children: [diseaseDataJSON, envDataJSON]
    };

    console.log(combinedData)
    // Clear the existing SVG content before drawing the new chart
    d3.select("#story2-svg").selectAll("*").remove();

    // Redraw the chart with the filtered data
    drawCirclePackingChart(combinedData);
}

// Function to convert CSV to JSON format
async function csvToJson(diseasesData, envData) {
    // Convert diseases data to hierarchical JSON
    const diseasesHierarchy = {
        name: "Diseases",
        children: [],
        totalDeaths: 0 // Initialize totalDeaths for the Diseases node
    };

    const diseasesMap = {};

    diseasesData.forEach(row => {
        const { DiseaseCat1, DiseaseCat2, DiseaseCat3, Deaths1,Population } = row;

        // Remove everything in parentheses from DiseaseCat1
        const cleanDiseaseCat1 = DiseaseCat1.replace(/\s*\(.*?\)\s*/g, '');

        // Ensure proper conversion
        const deaths = +Deaths1;
        const population = +Population;

        // Create a hierarchical structure
        if (!diseasesMap[cleanDiseaseCat1]) {
            diseasesMap[cleanDiseaseCat1] = { 
                name: cleanDiseaseCat1, 
                children: [], 
                totalDeaths: 0,
                totalPopulation: 0
            };
            diseasesHierarchy.children.push(diseasesMap[cleanDiseaseCat1]);
        }

        const diseaseCat1Node = diseasesMap[cleanDiseaseCat1];

        if (!diseaseCat1Node.children.some(d => d.name === DiseaseCat2)) {
            const diseaseCat2Node = { 
                name: DiseaseCat2, 
                children: [], 
                totalDeaths: 0,
                totalPopulation: 0
            };
            diseaseCat1Node.children.push(diseaseCat2Node);
        }

        const diseaseCat2Node = diseaseCat1Node.children.find(d => d.name === DiseaseCat2);

        // Handle DiseaseCat3
        if (!diseaseCat2Node.children.some(d => d.name === DiseaseCat3)) {
            diseaseCat2Node.children.push({
                name: DiseaseCat3,
                totalDeaths: 0, // Initialize totalDeaths for DiseaseCat3
                totalPopulation: 0,
                size: 0         // Initialize size for DiseaseCat3
            });
        }

        const diseaseCat3Node = diseaseCat2Node.children.find(d => d.name === DiseaseCat3);

        // Accumulate deaths
        diseaseCat1Node.totalDeaths += deaths;
        diseaseCat2Node.totalDeaths += deaths;
        diseaseCat3Node.totalDeaths += deaths;
        diseaseCat1Node.totalPopulation += population;
        diseaseCat2Node.totalPopulation += population;
        diseaseCat3Node.totalPopulation += population;

        // Accumulate to the Diseases node
        diseasesHierarchy.totalDeaths += deaths;

        // Set size based on accumulated deaths
        // diseaseCat3Node.size = diseaseCat3Node.totalDeaths; // Ensure size reflects totalDeaths
        diseaseCat1Node.totalMortalityRate = (diseaseCat1Node.totalDeaths / diseaseCat1Node.totalPopulation) * 100;
        diseaseCat2Node.totalMortalityRate = (diseaseCat2Node.totalDeaths / diseaseCat2Node.totalPopulation) * 100;
        diseaseCat3Node.totalMortalityRate = (diseaseCat3Node.totalDeaths / diseaseCat3Node.totalPopulation) * 100;
        
        diseaseCat3Node.size = (diseaseCat3Node.totalDeaths / diseaseCat3Node.totalPopulation) * 100;
    });

    // Convert environment data to hierarchical JSON
    const envHierarchy = {
        name: "Environment",
        children: [],
        totalDeaths: 0, // Initialize totalDeaths for the Environment Risk node
        totalPopulation: 0,
        totalMortalityRate:0
    };

    const riskMap = {};

    envData.forEach(row => {
        const { Risk, Deaths, Population } = row;

        const deaths = +Deaths;
        const population = +Population;

        // Check if the risk already exists in the map
        if (!riskMap[Risk]) {
            riskMap[Risk] = {
                name: Risk,
                totalDeaths: 0,
                totalPopulation: 0
            };
        }

        // Accumulate deaths for the risk
        riskMap[Risk].totalDeaths += deaths;
        riskMap[Risk].totalPopulation += population;

        // Accumulate to the Environment Risk node
        envHierarchy.totalDeaths += deaths;
        envHierarchy.totalPopulation += population;
        envHierarchy.totalMortalityRate = (envHierarchy.totalDeaths / envHierarchy.totalPopulation) * 100;

    });

    // Convert the riskMap to the desired structure
    Object.values(riskMap).forEach(risk => {
        const totalMortalityRate = (risk.totalDeaths / risk.totalPopulation) * 100;
        envHierarchy.children.push({
            name: risk.name,
            // size: risk.totalDeaths,
            size: totalMortalityRate,
            totalPopulation:risk.totalPopulation,
            totalDeaths:risk.totalDeaths,
            totalMortalityRate: totalMortalityRate
        });
    });

    return [diseasesHierarchy, envHierarchy];
}


// Function to display the circle packing visualization
async function drawCirclePackingChart(combinedData) {
    // Select the SVG element
    var svg = d3.select("#story2-svg");

    // Set the margin
    var margin = 20;

    // Get the width of the container dynamically
    var containerWidth = document.querySelector(".chart2-container").offsetWidth;

    // Set the diameter based on the container's width
    var diameter = containerWidth - margin * 2;

    // Set the viewBox to make it responsive
    svg.attr("viewBox", `0 0 ${diameter} ${diameter}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

    // Create the g element and center it
    var g = svg.append("g")
           .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


    // Create a color scale for the depth of the nodes
    var color = d3.scaleLinear()
        .domain([-1, 5])
        // .range(["#FFF4DF", COLORS.darkPink])
        // .range([COLORS.lightPink, "#ba025e"])
        .range([COLORS.lightPink, COLORS.darkPink])
        .interpolate(d3.interpolateHcl);

    // Define the packing layout
    var pack = d3.pack()
        .size([diameter - margin, diameter - margin])
        .padding(2); // Set padding between circles

    // Create a hierarchy from the combined data
    var root = d3.hierarchy(combinedData)
        .sum(function (d) { return d.size; }) // Sum the sizes for the hierarchy
        .sort(function (a, b) { return b.value - a.value; }); // Sort nodes by value

    var focus = root, // Set the initial focus to the root
        nodes = pack(root).descendants(), // Generate the packed layout
        view; // Viewport for zooming

    // Create a tooltip for displaying information on hover
    var tooltip = d3.select("#story2-tooltip");

    // Format the mortality rate to be shown depending on its value
    Format_6dp = d3.format('.6');
    Format_5dp = d3.format('.5');
    Format_4dp = d3.format('.4');
    Format_3dp = d3.format('.3');
    
    // Create circles for each node in the hierarchy
    var circle = g.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function (d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
        .style("fill", function (d) { return d.children ? color(d.depth) : null; })
        // Zoom functionality
        .on("click", function (event, d) { 
            // Check if the node is not a leaf node
            if (focus !== d && d.children) {
                zoom(d); 
                event.stopPropagation(); 
            }
        })
        // Tooltip mouse events
        .on("mouseover", function (event, d) {
            var rateShown = d.data.totalMortalityRate;

            if (rateShown < 0.000001){
                rateShown = Format_6dp(rateShown);
            }
            else if (rateShown < 0.00001){
                rateShown = Format_5dp(rateShown);
            }
            else if (rateShown < 0.0001){
                rateShown = Format_4dp(rateShown);
            }
            else {
                rateShown = Format_3dp(rateShown);
            }

            tooltip.transition().duration(20).style("opacity", 1);
            tooltip .style("left",   (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html(`
                        <strong>${(d.data.name)}</strong><br>
                        Total Mortality Rate: ${rateShown}%
                    `);
        })
        .on("mousemove", function (event, d) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    
    
 
    // Create labels for each node
    var text = g.selectAll("text.chart2-label")
        .data(nodes)
        .enter().append("text")
        .attr("class", "chart2-label")
        .style("fill-opacity", function (d) { return d.parent === root ? 1 : 0; })
        .style("display", function (d) { return d.parent === root ? "inline" : "none"; })
        .style("font-size", function (d) {
            return d.data.name === 'Diseases' ? "36px" : "12px"; // Set font size based on depth
        })
        .text(function (d) {
            const scaledRadius = d.r * (diameter / (focus.r * 2 + margin));
            var maxLength = 25;  // Truncate long labels

            if (scaledRadius<1){
                return "";
            } else if (scaledRadius<10){
                maxLength=10;
            }
            const name =  d.data.name;
            return name.length > maxLength ? name.substring(0, maxLength) + "..." : name;
        })


    var node = g.selectAll("circle,text"); // Select all circles and text for zoom functionality

    displayInsightStory2(nodes) // Display Insight

    svg.on("click", function () { zoom(root); }); // Zoom out to root on SVG click

    zoomTo([root.x, root.y, root.r * 2 + margin]); // Initial zoom to root

    // Function to handle zooming
    function zoom(d) {
        var focus0 = focus; 
        focus = d;
        console.log(d) // have data
    
        var transition = d3.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", function () {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) { zoomTo(i(t)); };
            });
    
        // Get the children of the current focus
        const children = focus.children || [];
        
        // Sort children by totalDeaths (or size, whichever is appropriate)
        const sortedChildren = children.sort((a, b) => b.totalMortalityRate - a.totalMortalityRate);
    
        // Select top 5 children
        const top5Children = sortedChildren.slice(0, 5);

            
        // Update text visibility
        transition.selectAll("text.chart2-label")
            .filter(function (d) { 
                return d.parent === focus || this.style.display === "inline"; 
            })
            .style("fill-opacity", function (d) {
                // Check if the current node is one of the top 5 children
                const isTop5 = top5Children.includes(d);
                return isTop5  ? 1 : 0;
            })
            .style("display", function (d) {
                const isTop5 = top5Children.includes(d);
                return isTop5 ? "inline" : "none";
            });
    
    }
         
    // Function to apply zoom transformation
    function zoomTo(v) {
        var k = diameter / v[2]; view = v;
        node.attr("transform", function (d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
        circle.attr("r", function (d) { return d.r * k; });
    }
}

// Display insight
function displayInsightStory2(nodes) {
    // Calculate top 5 causes of death
    const topCauses = nodes
        .filter(d => d.data.size) // Only consider nodes that have a size (not the root)
        .sort((a, b) => b.data.totalMortalityRate - a.data.totalMortalityRate) // Sort by totalDeaths
        .slice(0, 5) // Take the top 5
        .map(d => `<li>&#8226; ${d.data.name}: ${d.data.totalMortalityRate.toLocaleString()}</li>`); // Format for display   

    // Update the #story2-insight paragraph with the top causes
    d3.select("#story2-insight")
        .html(`Within the years <strong>${selectedMinYear} and ${selectedMaxYear}</strong>, the top causes of death are:</strong><br><ul>${topCauses.join('')}</ul>`);
}




window.onload = initCirclePacking;
