// Adjust the paths to your CSV files relative to this script
const top5DataFile = "../Datasets/filtered_vaccine_data_top_5_countries.csv";
const bottom5DataFile = "../Datasets/filtered_vaccine_data_bottom_5_countries.csv";

// Configuration for the radar chart
const radarConfig = {
    w: 600,
    h: 600,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    levels: 5,
    maxValue: 1.0, // Adjust based on your data's maximum value
    labelFactor: 1.2,
    wrapWidth: 60,
    opacityArea: 0.35,
    dotRadius: 4,
    opacityCircles: 0.1,
    strokeWidth: 2,
    roundStrokes: true,
    color: d3.scaleOrdinal().range(["#6baed6", "#3182bd"]) // Colors for top 5 and bottom 5
};

// Initialization function
function init() {
    // Load both CSV files and prepare data for radar chart
    Promise.all([
        d3.csv(top5DataFile),
        d3.csv(bottom5DataFile)
    ]).then(([top5Data, bottom5Data]) => {
        // Prepare data for radar chart
        const processedData = prepareRadarData(top5Data, bottom5Data);

        // Create the radar chart
        RadarChart("#radarChart", processedData, radarConfig);
    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

// Function to transform data for radar chart input format
function prepareRadarData(top5Data, bottom5Data) {
    const vaccines = ["Pfizer/BioNTech", "Moderna", "Oxford/AstraZeneca", "Johnson&Johnson", "Sputnik V"];

    const top5 = vaccines.map(vaccine => ({
        axis: vaccine,
        value: d3.mean(top5Data, d => +d[vaccine] || 0)
    }));

    const bottom5 = vaccines.map(vaccine => ({
        axis: vaccine,
        value: d3.mean(bottom5Data, d => +d[vaccine] || 0)
    }));

    return [top5, bottom5];
}

// RadarChart function adjusted for D3 v7
function RadarChart(id, data, options) {
    const cfg = {
        // Default configurations
        w: 600,                // Width of the circle
        h: 600,                // Height of the circle
        margin: { top: 50, right: 50, bottom: 50, left: 50 }, // Margin around the circle
        levels: 3,             // How many levels or inner circles should be drawn
        maxValue: 0,           // What is the value that the biggest circle will represent
        labelFactor: 1.25,     // How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60,         // The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35,     // The opacity of the area of the blob
        dotRadius: 4,          // The size of the colored circles of each blog
        opacityCircles: 0.1,   // The opacity of the circles of each blob
        strokeWidth: 2,        // The width of the stroke around each blob
        roundStrokes: false,   // If true, the area and stroke will follow a round path (cardinal-closed)
        color: d3.scaleOrdinal(d3.schemeCategory10) // Color function
    };

    // Put all of the options into a variable called cfg
    if ('undefined' !== typeof options) {
        for (const i in options) {
            if ('undefined' !== typeof options[i]) {
                cfg[i] = options[i];
            }
        }
    }

    // If the supplied maxValue is smaller than the actual one, replace by the max in the data
    const maxValue = Math.max(cfg.maxValue, d3.max(data, i => d3.max(i.map(o => o.value))));

    const allAxis = data[0].map(i => i.axis); // Names of each axis
    const total = allAxis.length; // The number of different axes
    const radius = Math.min(cfg.w / 2, cfg.h / 2); // Radius of the outermost circle
    const angleSlice = Math.PI * 2 / total; // The width in radians of each "slice"

    // Scale for the radius
    const rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    // Remove whatever chart with the same id/class was present before
    d3.select(id).select("svg").remove();

    // Initiate the radar chart SVG
    const svg = d3.select(id).append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr("class", "radar");

    // Append a g element
    const g = svg.append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    // Filter for the outside glow
    const filter = g.append('defs').append('filter').attr('id','glow');
    filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');

    // Draw the Circular grid
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    // Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => radius / cfg.levels * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        .style("filter" , "url(#glow)");

    // Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(d => (maxValue * d / cfg.levels).toFixed(2));

    // Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    // Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    // Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    // The radar line function
    const radarLine = d3.lineRadial()
        .curve(cfg.roundStrokes ? d3.curveCardinalClosed : d3.curveLinearClosed)
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    // Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    // Append the backgrounds
    blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d))
        .style("fill", (d, i) => cfg.color(i))
        .style("fill-opacity", cfg.opacityArea)
        .on('mouseover', function(event, d) {
            // Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            // Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function() {
            // Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", cfg.opacityArea);
        });

    // Create the outlines
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d))
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")
        .style("filter" , "url(#glow)");

    // Append the circles
    blobWrapper.selectAll(".radarCircle")
        .data((d, i) => {
            // Attach the index to each data point
            return d.map(point => {
                return { ...point, groupIndex: i };
            });
        })
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", cfg.dotRadius)
        .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("fill", (d) => cfg.color(d.groupIndex))
        .style("fill-opacity", 0.8);

    // Helper function to wrap labels
    function wrap(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.4; // ems
            const y = text.attr("y");
            const x = text.attr("x");
            const dy = parseFloat(text.attr("dy"));
            let tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                        .text(word);
                }
            }
        });
    }
}

// Load the radar chart on window load
window.onload = init;
