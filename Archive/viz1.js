function init() {
    // Select the chart container div and get its width and height
    var container = d3.select("#viz1_chart");
    var w = parseInt(container.style("width"));
    var h = parseInt(container.style("height"));

    // Set up the SVG inside the chart container
    var svg = container.append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("fill", "grey");

    // Scale map - smaller scale to make the world map fit in the container
    var projection = d3.geoMercator()
                        .center([0, 20])  // Adjust the center to be around the equator and prime meridian
                        .translate([w / 2, h / 2])
                        .scale(w / 12);  // Adjust the scale to make the map smaller

    // Geo path 
    var path = d3.geoPath()
                .projection(projection);

    // Draw map 
    d3.json("custom.geo.json")
    .then(function(json) {
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .style("stroke", "darkgrey")
            .attr("d", path);
    });
}

window.onload = init;
