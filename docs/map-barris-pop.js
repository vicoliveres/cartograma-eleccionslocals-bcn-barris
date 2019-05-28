const padding = 2;

const margin = { top: 10, right: 5, bottom: 10, left: 5 };
const width = d3.select('.map').node().getBoundingClientRect().width;
const height = d3.select('.map').node().getBoundingClientRect().width;

const isMobile = d3.select('.map').node().getBoundingClientRect().width < 380;
const isTablet = d3.select('.map').node().getBoundingClientRect().width < 550;

var mapBarrisWinner = function(d3) {
const svg = d3
  .select('#map-barris-pop')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var imgs = svg.selectAll("image").data([0]);
        imgs.enter()
        .append("svg:image")
        .attr("xlink:href", "barris-bcn.png")
        .attr("x", isMobile ? "0" : isTablet ? "0" : "10")
        .attr("y", "30")
        .attr("width", isMobile ? "300" : isTablet ? "450" : "600")
        .attr("height", isMobile ? "230" : isTablet ? "350" : "560")
        .style("opacity", 0.5);

const pob = d3.map();
const nom = d3.map();
const partit = d3.map();
const ptgcand = d3.map();
const cs = d3.map();
const junts = d3.map();
const erc = d3.map();
const psc = d3.map();
const bcomu = d3.map();
const cup = d3.map();
const pp = d3.map();
const bcap = d3.map();

const size = d3.scaleLinear().range(isMobile ? [5, 20] : isTablet ? [8, 40] : [12, 50]);
const color = d3.scaleOrdinal().range(['#edc100', '#f25c00', '#c80a1e', '#850189']).domain(['erc', 'cs', 'psc', 'bcomu']);
const intensitat = d3.scaleLinear().domain([20, 39]).range([0.45, 0.9]);

d3
  .queue()
  .defer(d3.json, 'barris_topo.json')
  .defer(d3.csv, 'bcnbarrisguanyador.csv', d => {
    d.pob = +d.pob;

    pob.set(d.id, d.pob);
    nom.set(d.id, d.nom);
    partit.set(d.id, d.partit);
    ptgcand.set(d.id, d.ptgcand);
    erc.set(d.id, d.erc);
    bcomu.set(d.id, d.bcomu);
    psc.set(d.id, d.psc);
    cs.set(d.id, d.cs);
    junts.set(d.id, d.junts);
    pp.set(d.id, d.pp);
    cup.set(d.id, d.cup);
    bcap.set(d.id, d.bcap);

    return d;
  })
  .await(ready);


function ready(error, bcn, data) {
  if (error) throw error;

  size.domain(d3.extent(data, d => d.pob));

  const barris = topojson.feature(bcn, bcn.objects.barris_geo);
  const features = barris.features;

  // File is already projected
  const projection = d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barris);

  const path = d3.geoPath().projection(projection);

  features.forEach(function(d) {
    d.pos = path.centroid(d);
    d.area = size(pob.get(d.properties.codi));
    [d.x, d.y] = d.pos;
  });

  const simulation = d3
    .forceSimulation(features)
    .force('x', d3.forceX(d => d.x).strength(0.5))
    .force('y', d3.forceY(d => d.y).strength(0.5))
    .force('collide', collide);

  for (let i = 0; i < 125; ++i) simulation.tick();

  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  const rect = svg
    .selectAll('g')
    .data(features)
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  rect
    .append('rect')
    .attr('width', d => d.area)
    .attr('height', d => d.area)
    .attr('x', d => -d.area / 2)
    .attr('y', d => -d.area / 2)
    .attr('fill', d => color(partit.get(d.properties.codi)))
    .style('opacity', d => intensitat(ptgcand.get(d.properties.codi)))
    .attr('stroke', 'white')
    .attr('rx', 2)
    .attr('class', 'rect')
    .on("mousemove", function(d) {
      d3.select(this)
        .style('stroke', 'grey')
        .style('stroke-oppacity', 0.5);
      tooltip.transition()
          .duration(100)
          .style("opacity", .9)
          .style("left", (d3.event.pageX - 100) + "px")
          .style("top", (d3.event.pageY + 10) + "px");
      tooltip.html("<b>" + nom.get(d.properties.codi) + "</b></br>" +
    "ERC: " + erc.get(d.properties.codi) + "%</br>" +
    "BeC: " + bcomu.get(d.properties.codi) + "%</br>" +
    "PSC: " + psc.get(d.properties.codi) + "%</br>" +
    "BCN Canvi-Cs: " + cs.get(d.properties.codi) + "%</br>" +
    "JUNTS: " + junts.get(d.properties.codi) + "%</br>" +
    "PP: " + pp.get(d.properties.codi) + "%</br>" +
    "CUP: " + cup.get(d.properties.codi) + "%</br>" +
    "BCN Capital: " + bcap.get(d.properties.codi) + "%");
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .style('stroke', 'white');
      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
      });

  // From https://bl.ocks.org/mbostock/4055889
  function collide() {
    for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
      for (var i = 0, n = features.length; i < n; ++i) {
        for (var a = features[i], j = i + 1; j < n; ++j) {
          var b = features[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            lx = Math.abs(x),
            ly = Math.abs(y),
            r = a.area / 2 + b.area / 2 + padding;
          if (lx < r && ly < r) {
            if (lx > ly) {
              lx = (lx - r) * (x < 0 ? -strength : strength);
              (a.vx -= lx), (b.vx += lx);
            } else {
              ly = (ly - r) * (y < 0 ? -strength : strength);
              (a.vy -= ly), (b.vy += ly);
            }
          }
        }
      }
    }
  }
}
}(d3);
