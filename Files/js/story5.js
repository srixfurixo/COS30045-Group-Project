function create_heatmap_mort(data, margin, width, height, first = false){
    var svg = d3.select("#story5_mort")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*
    --------------------------
        Ensure data from csv are all numbers
    --------------------------
    */
    data.forEach(function (d) {
        d.MEAN_Percentage_of_population_in_the_same_sex_and_age = +d.MEAN_Percentage_of_population_in_the_same_sex_and_age;
        d.mortality_rate_percent_allAge = +d.mortality_rate_percent_allAge;
        d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank = +d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank;

        // Categorize weighted average
        d.weighted_avg_category = categorizeWeightedAvg(d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);
    });

    if (first){

        /*
        ----------------------------------------------------
            Extract unique values from a specific column
        ----------------------------------------------------
        */   

        // Extract unique values from a specific column (e.g., Education_Level)
        // Extract the "name" field from the data
        const names = originaldata_mort.map(d => d.name);

        // Create a Set to store unique names
        const uniqueNames = new Set(names);

        // Convert the Set back to an array
        countriesAvailable_story5_mort = Array.from(uniqueNames);
        countriesAvailable_story5_mort.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

        /*
        -------------------------------------------------------
            Map the available countries to the selectpicker
            - the selectpicker' options are added here, because
                countriesAvailable_story5_mort scope is within this block.
        -------------------------------------------------------
        */   
        // console.log("countriesAvailable_story5_mort 1: ", countriesAvailable_story5_mort);

        const selectElement = $('#story5_picker_mort');

        // Define the countries you want to be pre-selected
        selectedCountries_mort = Array.from(countriesAvailable_story5_mort).sort();
    
        countriesAvailable_story5_mort.forEach(optionText => {
            // Check if the current option should be pre-selected
            var isSelected = selectedCountries_mort.includes(optionText);
            
            if (isSelected){
                selectElement.append(`<option value="${optionText}" title="${optionText}" selected>${optionText}</option>`);
            }
            else{
                selectElement.append(`<option value="${optionText}" title="${optionText}">${optionText}</option>`);
            }
        });
    
        // Refresh the select picker to show the new options
        selectElement.selectpicker("refresh");
    }

    
    /*
    --------------------------
        Define scales
    --------------------------
    */
    var xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.Year).sort(d3.ascending)) // Use Year for x-axis
        .padding(0.01);

    // Get sorted categories
    var sortedCategories = getSortedCategories(data);

    var yScale = d3.scaleBand()
        .range([height, 0])
        .domain(sortedCategories) // Use categorized weighted average for y-axis
        .padding(0.01);

    // Color scale based on mortality percentage from original dataset
    var minMortality = d3.min(originaldata_mort, d => d.mortality_rate_percent_allAge);
    var maxMortality = d3.max(originaldata_mort, d => d.mortality_rate_percent_allAge);

    var myColor = d3.scaleLinear()
        .range([COLORS.lightPink, COLORS.darkPink])
        .domain([Math.floor(minMortality), Math.ceil(maxMortality)]);


    /*
    ------------------------------
        Create axis & its titles
    ------------------------------
    */
    // x-axis  
    svg.append("g")
        .attr("class", "axis-label")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    // y-axis  
    svg.append("g")
        .attr("class", "axis-label")
        .call(d3.axisLeft(yScale));

    // x-axis titles
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", "translate(" + (width - margin.right / 4 - 10) + " ," + (height + 45) + ")")
        // .style("text-anchor", "middle")
        .text("Year"); // Change to your desired title

    // y-axis title
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", "translate(" + (0 - margin.left) + " ," + (-margin.top / 2) + ")")
        // .style("text-anchor", "middle")
        .text("Population of Educated Women, % (WA)"); // Change to your desired title


    /*
    --------------------------
        Create tooltip
    --------------------------
    */
    // create a tooltip
    var Tooltip = d3.select("#story5_mort")
        .append("div");
    Tooltip.style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        // .style("border-color", COLORS.webTheme.midGrey)
        .style("border-width", "1px")
        .style("border-radius", "5px")
        // .style("color", "#585858 !important")
        .style("box-shadow", "0px 0px 8px rgba(0, 0, 0, 0.15)")
        .style("padding", "5px")
        .style("width", "120px");
        
        // .style("z-index", 1000);

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function (d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", COLORS.webTheme.darkGrey)
            .style("opacity", 1)
    }
    var mousemove = function(event, d) {
        var [mouseX, mouseY] = d3.pointer(event, svg.node()); //Using both have blinking, not sure why yet.

        // Make it integer
        mouseX = Math.floor(mouseX);
        mouseY = Math.floor(mouseY);
        // console.log("mouse coord: (" + (event.pageX) +"," + event.pageY + ")")
        Tooltip
            .html("Mortality rate: <b>" + d.mortality_rate_percent_allAge.toFixed(3) + "%</b>")
            .style("color", COLORS.webTheme.darkGrey)
            .style("left", (event.pageX - 80) + "px") // Add a small offset for better visibility
            .style("top", (mouseY + 10) + "px");
            // .style("left", (Math.abs(event.pageX-width/12)) + "px") // Adjust position
            // .style("top", (Math.abs(event.pageY-height*2.8)) + "px"); // Adjust position
    };
    var mouseleave = function (d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1)
    }


    /*
    --------------------------
        Create the heatmap  
    --------------------------
    */
    // Add all rect
    svg.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) { return xScale(d.Year); })
        .attr("y", function (d) { return yScale(d.weighted_avg_category); })
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", function (d) {
            return myColor(d.mortality_rate_percent_allAge); // Use mortality percentage for color
        })
        // .style("opacity", 0) // Initial opacity
        // .transition() // Start the transition
        // .duration(3400) // Duration of the transition in milliseconds
        // .style("opacity", 1) // Final opacity after transition
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    /*
    --------------------------
        Create legend
    --------------------------
    */    
    var tick = .5;
    if (first){
        customLinearHorizontalLegend(
            myColor,
            Math.floor(minMortality),
            Math.ceil(maxMortality), //Else when data is null, no legend is display at all
            tick,
            margin,
            "Mortality Rate, %",
            "#story5_legend_mort"
        );
    }
}

let originaldata_mort = [];
let selectedCountries_mort;

function insight_mort(correlation, countries, positive = true){
    var text = "higher";
    var insights = "";
    if (positive !== true){
        text = "lower";
    }

    if (Math.abs(correlation) < 0.2){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)}
        have almost no effect on their average mortality rate.
        `;
    }
    else if (Math.abs(correlation) < 0.4){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)} have 
        a slightly ${text} average mortality rate.
        `;
    }
    else if (Math.abs(correlation) < 0.7){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)}
        have a ${text} average mortality rate.
        `;
    }
    else{
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)} 
        have an average mortality rate significantly ${text}.
        `;
    }

    return insights;
}

function init_mort() {
    /*
    --------------------------------------
        Create heatmap for mortality rate
    --------------------------------------
    */       
    var margin = { top: 30, right: 0, bottom: 70, left: 70 },
        width = 1050 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    // Update visualisation' insights
    var insights = "No countries are selected.";
    var insights_p = document.getElementById('story5_insight_mort');  
    const selectElement = $('#story5_picker_mort');

        
    d3.csv("datasets/Morticd10_1-5_mortality_rate_merged_education.csv")
        .then(function (data) {   
            // Take year 2000 and after.
            data = data.filter(d => +d.Year >= 2000 && +d.Year <= 2019);
            
            originaldata_mort = data;
            create_heatmap_mort(data, margin, width, height, true);

            
            /*
            -------------------------------------------------------------
                Initial Compute Pearson correlation & update the insight
            -------------------------------------------------------------
            */
            // Extract values for correlation
            var avgMortality = data.map(d => d.mortality_rate_percent_allAge);
            var weightedAvg = data.map(d => d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);

            // Calculate correlation
            var correlation = pearsonCorrelation(weightedAvg, avgMortality);
            var defaultCountries = selectElement.val();
            // console.log("defaultCountries", defaultCountries);

            // Negative correlation
            if (correlation < 0){
                insights = insight_mort(correlation, defaultCountries, false);
            }
            else{ //Positive correlation
                insights = insight_mort(correlation, defaultCountries);
            }

            insights_p.textContent = insights;
        })        
        .catch(function (error) {
            console.error('Error loading the CSV file:', error);
        });

    /*
    ------------------------------------
        Event listeners for selectpicker
    -------------------------------------
    */
    // when the selection changes, filter the heatmap
    selectElement.on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        selectedCountries_mort = $(this).val(); // Get the selected values
        // console.log("Hi", selectedCountries_mort); // Print "Hi" followed by the selected items
        // Filter the original data based on selected countries
        d3.select("#story5_mort").selectAll("*").remove(); // Clear previous heatmap
       
        if (selectedCountries_mort == null){
            create_heatmap_mort([], margin, width, height);
            insights = "No countries are selected.";

        }else{
            const filteredData = originaldata_mort.filter(d => selectedCountries_mort.includes(d.name));
            // console.log("originaldata_mort", filteredData)
            
            // Redraw the heatmap with the filtered data
            create_heatmap_mort(filteredData, margin, width, height);

            /*
            -----------------------------------------------------
                Compute Pearson correlation & update the insight
            -----------------------------------------------------
            */
            // Extract values for correlation
            var avgMortality = filteredData.map(d => d.mortality_rate_percent_allAge);
            var weightedAvg = filteredData.map(d => d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);

            // Calculate correlation
            var correlation = pearsonCorrelation(weightedAvg, avgMortality);

            // Negative correlation
            if (correlation < 0){
                insights = insight_mort(correlation, selectedCountries_mort, false);
            }
            else{ //Positive correlation
                insights = insight_mort(correlation, selectedCountries_mort);
            }
        }

        // Update the insights
        insights_p.textContent = insights;

    });    
}

function create_heatmap_life(data, margin, width, height, first = false){
    var svg = d3.select("#story5_life")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*
    --------------------------
        Ensure data from csv are all numbers
    --------------------------
    */
    data.forEach(function (d) {
        d.MEAN_Percentage_of_population_in_the_same_sex_and_age = +d.MEAN_Percentage_of_population_in_the_same_sex_and_age;
        d.life_expectancy_at_birth_unit_year = +d.life_expectancy_at_birth_unit_year;
        d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank = +d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank;

        // Categorize weighted average
        d.weighted_avg_category = categorizeWeightedAvg(d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);
    });

    if (first){

        /*
        ----------------------------------------------------
            Extract unique values from a specific column
        ----------------------------------------------------
        */   

        // Extract unique values from a specific column (e.g., Education_Level)
        // Extract the "name" field from the data
        const names = originaldata_life.map(d => d.name);

        // Create a Set to store unique names
        const uniqueNames = new Set(names);

        // Convert the Set back to an array
        countriesAvailable_story5_life = Array.from(uniqueNames);
        countriesAvailable_story5_life.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

        
        /*
        -------------------------------------------------------
            Map the available countries to the selectpicker
            - the selectpicker' options are added here, because
                countriesAvailable_story5_life scope is within this block.
        -------------------------------------------------------
        */   
        // console.log("countriesAvailable_story5_life 1: ", countriesAvailable_story5_life);

        const selectElement = $('#story5_picker_life');

        // Define the countries you want to be pre-selected
        selectedCountries_life = Array.from(countriesAvailable_story5_life).sort();

    
        countriesAvailable_story5_life.forEach(optionText => {
            // Check if the current option should be pre-selected
            var isSelected = selectedCountries_life.includes(optionText);
            
            if (isSelected){
                selectElement.append(`<option value="${optionText}" title="${optionText}" selected>${optionText}</option>`);
            }
            else{
                selectElement.append(`<option value="${optionText}" title="${optionText}">${optionText}</option>`);
            }
        });
    
        // Refresh the select picker to show the new options
        selectElement.selectpicker("refresh");
    }

    
    /*
    --------------------------
        Define scales
    --------------------------
    */
    var xScale = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.Year).sort(d3.ascending)) // Use Year for x-axis
        .padding(0.01);

    // Get sorted categories
    var sortedCategories = getSortedCategories(data);

    var yScale = d3.scaleBand()
        .range([height, 0])
        .domain(sortedCategories) // Use categorized weighted average for y-axis
        .padding(0.01);

    // Color scale based on life expectancy from original dataset
    var minLifeExp = d3.min(originaldata_life, d => d.life_expectancy_at_birth_unit_year);
    var maxLifeExp = d3.max(originaldata_life, d => d.life_expectancy_at_birth_unit_year);

    var myColor = d3.scaleLinear()
        .range(["lightgreen", "darkgreen"])
        .domain([Math.floor(minLifeExp), Math.ceil(maxLifeExp)]);


    /*
    ------------------------------
        Create axis & its titles
    ------------------------------
    */
    // x-axis  
    svg.append("g")
        .attr("class", "axis-label")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    // y-axis  
    svg.append("g")
        .attr("class", "axis-label")
        .call(d3.axisLeft(yScale));

    // x-axis titles
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", "translate(" + (width - margin.right / 4 - 10) + " ," + (height + 45) + ")")
        // .style("text-anchor", "middle")
        .text("Year"); // Change to your desired title

    // y-axis title
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", "translate(" + (0 - margin.left) + " ," + (-margin.top / 2) + ")")
        // .style("text-anchor", "middle")
        .text("Population of Educated Women, % (WA)"); // Change to your desired title


    /*
    --------------------------
        Create tooltip
    --------------------------
    */
    // create a tooltip
    var Tooltip = d3.select("#story5_life")
        .append("div");
    Tooltip.style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        // .style("border-color", COLORS.webTheme.midGrey)
        .style("border-width", "1px")
        .style("border-radius", "5px")
        // .style("color", "#585858 !important")
        .style("box-shadow", "0px 0px 8px rgba(0, 0, 0, 0.15)")
        .style("padding", "5px")
        .style("width", "120px");
    // var Tooltip = d3.select("#story5_life")
    //     .append("div")
    //         .style("opacity", 0)
    //         .attr("class", "tooltip")
    //         .style("background-color", "white")
    //         .style("border", "solid")
    //         .style("border-color", COLORS.webTheme.midGrey)
    //         .style("border-width", "1px")
    //         .style("border-radius", "5px")
    //         .style("padding", "5px")
    //         .style("width", "120px");
            // .style("z-index", 1000);

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function (d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", COLORS.webTheme.darkGrey)
            .style("opacity", 1)
    }
    var mousemove = function(event, d) {
        var [mouseX, mouseY] = d3.pointer(event, svg.node()); //Using both have blinking, not sure why yet.

        // Make it integer
        mouseX = Math.floor(mouseX);
        mouseY = Math.floor(mouseY);

        // console.log("mouse coord: (" + (event.pageX) +"," + event.pageY + ")")
        // console.log("mouse coord #2: (" + (mouseX) +"," + mouseY + ")")

        Tooltip
            .html("Life expectancy: <b>" + d.life_expectancy_at_birth_unit_year.toFixed(1) + " years</b>")
            .style("color", COLORS.webTheme.darkGrey)
            // .style("left", (Math.abs(event.pageX-width/12)) + "px") // Adjust position
            // .style("top", (Math.abs(event.pageY-height*3.2)) + "px"); // Adjust position
            // .style("left", (Math.abs(event.pageX-width/12)) + "px") // Adjust position
            // .style("top", (Math.abs(20)) + "px"); // Adjust position
            // .style("top", (Math.abs(event.pageY)) + "px"); // Adjust position
            // .style("top", (Math.abs(event.pageY-height*3.2)) + "px"); // Adjust position
            .style("left", (event.pageX - 80) + "px") // Add a small offset for better visibility
            .style("top", (mouseY + 10) + "px");

    };
    var mouseleave = function (d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1)
    }


    /*
    --------------------------
        Create the heatmap  
    --------------------------
    */
    // Add all rect
    svg.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) { return xScale(d.Year); })
        .attr("y", function (d) { return yScale(d.weighted_avg_category); })
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", function (d) {
            return myColor(d.life_expectancy_at_birth_unit_year); // Use life expectancy for color
        })
        // .style("opacity", 0) // Initial opacity
        // .transition() // Start the transition
        // .duration(3400) // Duration of the transition in milliseconds
        // .style("opacity", 1) // Final opacity after transition
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    /*
    --------------------------
        Create legend
    --------------------------
    */    
    var tick = 1.5;
    if (first){
        customLinearVerticalLegend_2(
            myColor,
            Math.floor(minLifeExp),
            Math.ceil(maxLifeExp), //Else when data is null, no legend is display at all
            tick,
            margin,
            "Life Expectancy, years",
            "#story5_legend_life"
        );
    }
}

let originaldata_life = [];
let selectedCountries_life;
function insight_life(correlation, countries, positive = true){
    var text = "higher";
    var insights = "";
    if (positive !== true){
        text = "lower";
    }

    if (Math.abs(correlation) < 0.2){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)}
        have almost no effect on their average life expectancy at birth.
        `;
    }
    else if (Math.abs(correlation) < 0.4){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)} have 
        a slightly ${text} average life expectancy at birth.
        `;
    }
    else if (Math.abs(correlation) < 0.7){
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)}
        have a ${text} average life expectancy at birth.
        `;
    }
    else{
        insights = `
        It was found that, more educated women 
        within ${displayCountries(countries)} 
        have an average life expectancy at birth significantly ${text}.
        `;
    }

    return insights;
}
function init_life() {
    /*
    --------------------------------------
        Create heatmap for life expectancy
    --------------------------------------
    */       
    var margin = { top: 30, right: 0, bottom: 70, left: 70 },
        width = 1050 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

    // Update visualisation' insights
    var insights = "No countries are selected.";
    var insights_p = document.getElementById('story5_insight_life');   
    const selectElement = $('#story5_picker_life');

    d3.csv("datasets/Life_expectancy_merged_education.csv")
        .then(function (data) {   
            // Take year 2000 and after.
            data = data.filter(d => +d.Year >= 2000 && +d.Year <= 2019);

            originaldata_life = data;
            create_heatmap_life(data, margin, width, height, true);

            /*
            -------------------------------------------------------------
                Initial Compute Pearson correlation & update the insight
            -------------------------------------------------------------
            */
            // Extract values for correlation
            var lifeExpectancy = data.map(d => d.life_expectancy_at_birth_unit_year);
            var weightedAvg = data.map(d => d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);

            // Calculate correlation
            var correlation = pearsonCorrelation(weightedAvg, lifeExpectancy);
            var defaultCountries = selectElement.val();
            // console.log("defaultCountries", defaultCountries);

            // Negative correlation
            if (correlation < 0){
                insights = insight_life(correlation, defaultCountries, false);
            }
            else{ //Positive correlation
                insights = insight_life(correlation, defaultCountries);
            }

            insights_p.textContent = insights;

        })        
        .catch(function (error) {
            console.error('Error loading the CSV file:', error);
        });

    /*
    ------------------------------------
        Event listeners for selectpicker
    -------------------------------------
    */
    // when the selection changes, filter the heatmap
    selectElement.on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        selectedCountries_life = $(this).val(); // Get the selected values
        // console.log("Hi", selectedCountries_life); // Print "Hi" followed by the selected items
        // Filter the original data based on selected countries
        d3.select("#story5_life").selectAll("*").remove(); // Clear previous heatmap

        if (selectedCountries_life == null){
            create_heatmap_life([], margin, width, height);

            // Update the insights
            insights = "No countries are selected.";

        }else{
            const filteredData = originaldata_life.filter(d => selectedCountries_life.includes(d.name));
            // console.log("originaldata_life", filteredData)
            
            // Redraw the heatmap with the filtered data
            create_heatmap_life(filteredData, margin, width, height);

            /*
            -----------------------------------------------------
                Compute Pearson correlation & update the insight
            -----------------------------------------------------
            */
            // Extract values for correlation
            var lifeExpectancy = filteredData.map(d => d.life_expectancy_at_birth_unit_year);
            var weightedAvg = filteredData.map(d => d.weighted_avg_MEAN_Perc_of_pop_each_country_and_year_in_unit_rank);

            // Calculate correlation
            var correlation = pearsonCorrelation(weightedAvg, lifeExpectancy);

            // Negative correlation
            if (correlation < 0){
                insights = insight_life(correlation, selectedCountries_life, false);
            }
            else{ //Positive correlation
                insights = insight_life(correlation, selectedCountries_life);
            }
        }

        // Update the insights
        insights_p.textContent = insights;
        
    });    
}





(function() {
    init_life();
    init_mort();
})();
// function init(){
//     init_life();
//     init_mort();
// }

// window.onload = init;

