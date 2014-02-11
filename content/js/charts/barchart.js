
"use strict";

 ;(function(root) {
    var BarChart = function(){
        var z = d3.scale.category10();
        var m = {t:20, r:20, b:40, l:30};
        var y = d3.scale.linear();
        var x0 = d3.scale.ordinal();
        var x1 = d3.scale.ordinal();
        var yAxis = drata.models.axis()
            .scale(y)
            .orient("left")
            .ticks(10);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var getMin = function(data, prop){
            return d3.min(data, function(d) { 
                return d3.min(d.values.filter(function(i){return !i.disabled}), function(v) {
                    return v[prop]; 
                }); 
            });
        };

        var getMax = function(data, prop){
            return d3.max(data, function(d) { 
                return d3.max(d.values.filter(function(i){return !i.disabled}), function(v) { 
                    return v[prop]; 
                }); 
            });
        };
        
        var dispatch = d3.dispatch('togglePath');
        var disabledItems = 0;
        function chart(selection){
            selection.each(function(data) {
                var container = d3.select(this);
                chart.resize = function() { 
                    container
                    .transition()
                    .duration(1000)
                    .call(chart);
                };

                chart.change = function(newData) { 
                    container
                    .datum(newData)
                    .transition()
                    .duration(1000)
                    .call(chart);
                };

                
                var duplKeys = [];
                var disabledKeys = [];

                _.each(data, function(item){
                     _.each(item.values, function(val){
                        if(duplKeys.indexOf(val.key) === -1){
                            if(val.disabled) disabledKeys.push(val.key);
                            duplKeys.push(val.key);   
                        }
                    });
                });


                
                var labelKeys = duplKeys.map(function(key){
                    return {key: key, disabled : disabledKeys.indexOf(key) > -1};
                });

                dispatch.on("togglePath", function(d, i){
                    var toggle;
                    if(disabledItems === labelKeys.length-1){
                        _.each(data, function(item){
                            _.each(item.values, function(iv){
                                if(iv) iv.disabled = false;
                            });
                        });
                        disabledItems = 0;
                    }
                    else{
                        _.each(data, function(item){
                            toggle = item.values[i] ? item.values[i].disabled : true;
                            if(item.values[i]) item.values[i].disabled = !toggle;
                        });    
                        disabledItems = toggle ? disabledItems - 1 : disabledItems + 1;
                    }
                    console.log(data);
                    chart.resize();
                });

                var w = $(this.parentNode).width();
                var h = $(this.parentNode).height();

                container.attr('width', w).attr('height', h);
                
                var hm = h - m.t - m.b;
                var wm = w - m.l - m.r;

                y.range([hm, 0]);
 

                var min = getMin(data, 'value'), max = getMax(data, 'value');
                var yrange = [min - (min * 1/5),max + (max * 1/5)];
                y.domain(yrange);
                //if(drata.js.logmsg) console.log(yrange);
                

                x0.rangeRoundBands([0, wm], .2);
                x0.domain(data.map(function(d) { return d.key; }));
                x1.domain(duplKeys).rangeRoundBands([0, x0.rangeBand()]);

                //z.domain(keys);
                
                if(drata.js.logmsg) console.log(z.domain());

                var gWrapper =  container
                    .selectAll('g.topgroup')
                    .data([data]);

                var gWrapperEnter = gWrapper.enter()
                    .append("g")
                    .attr('class', 'topgroup');

                gWrapperEnter.append("g").attr('class', 'bars-group');
                gWrapperEnter.append("g").attr("class", 'y axis');
                gWrapperEnter.append("g").attr("class", 'x axis');
                gWrapperEnter.append("g").attr("class", 'labels-group');

                gWrapper.select('g.y.axis')
                    .attr("transform", "translate(" + m.l +"," + m.t + ")")
                    .call(yAxis);
                gWrapper.select('g.x.axis')
                    .attr("transform", "translate(" + m.l +"," + (hm +m.t) + ")")
                    .call(xAxis);

                var barGroup = gWrapper
                    .select("g.bars-group")
                    .attr("transform", "translate(" + m.l +"," + m.t + ")")
                    .selectAll('g.bar-group')
                    .data(function(d){
                        return d;
                    });

                barGroup
                    .enter()
                    .append("g")
                    .attr("class", "bar-group");

                var rects = barGroup
                    .attr("transform", function(d) { return "translate(" + x0(d.key) + ",0)"; })
                    .selectAll('rect')
                    .data(function(d){
                        return d.values;
                    });

                rects.enter()
                    .append('rect').attr("height", 0)
                    .attr("y", y(yrange[0]));
                rects
                    .style("fill", function(d, i) { 
                        return z(i); 
                    })
                    .attr("stroke", '#fff')
                    .attr("stroke-width", 1)
                    .transition().duration(300)
                    .attr("x", function(d) { return x1(d.key); })
                    .attr("y", function(d) {  
                        return d.disabled ?  y(yrange[0]) : y(d.value); 
                    })
                    .attr("width", x1.rangeBand())
                    .attr("height", function(d) {  return d.disabled ? 0 : hm - y(d.value); });
                    

                rects.exit().transition().duration(300).attr("height", 0)
                    .attr("y", y(yrange[0]))
                    .remove();
                
                barGroup.exit().remove();
                gWrapper.exit().remove();

                
                var labels = drata.models.labels().color(function(d,i){return z(i);}).width(w).height(m.t).align('center').dispatch(dispatch);
                gWrapper
                    .select('g.labels-group')
                    .datum(labelKeys)
                    .call(labels);
                
            });
            
            return chart;
        };
        return chart;
    };
    root.drata.ns('charts').extend({
        barChart : BarChart
    });
})(this);