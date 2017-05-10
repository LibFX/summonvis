function RecordPainter(svg_area) {
    this.svg_area = svg_area;
    this.myQueue = new VariableDelayQueue([3000, 2000, 1500, 1000]);
    //this.myQueue = new VariableDelayQueue([100]);
    this.key = "record";
    this.maxOnScreen = 20;
    this.onScreen = [];
}

RecordPainter.prototype.update = function (_jdata) {
    // console.dir(_jdata);
    var self = this;

    this.myQueue.add({
        start:  function (delay, next) {
            paintNewRecord(_jdata, delay, next);
        }
    });

    function getFirstText(data, key) {
        if (!(key in data))
            return undefined;
        return data[key] && data[key][0];
    }

    function getBool(data, key) {
        if (!(key in data))
            return undefined;
        var v = data[key];
        if (typeof v == 'boolean')
            return v;
        if (typeof v == 'object' && v.length > 0)
            return Boolean(v[0]);
        return undefined;
    }

    /* avoid all uppercase */
    function prettyForm(t) {
        var L = t.length;
        var words = t.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            words[i] = w.charAt(0) + w.substring(1).toLowerCase();
        }
        return words.join(" ");
    }

    function splitText(st,n) {
        if (n===undefined)
            n = 40;

        var b = []; 
        var s = st;
        while (s.length > n) {
            var c = s.substring(0,n);
            var d = c.lastIndexOf(' ');
            var e =c.lastIndexOf('\n');
            if (e != -1) d = e; 
            if (d == -1) d = n; 
            b.push(c.substring(0,d));
            s = s.substring(d+1);
        }
        b.push(s);
        return b;
    }

    function paintNewRecord(_jdata, delay, next) {
        var data = _jdata.record;
        var ts = _jdata.timestamp;

        /* basic structure
        var allTransitionsDone = new Barrier(next);
        var resizeExisting = allTransitionsDone.add();

        .call(allD3TransitionsDone, function () {
            resizeExisting.finish();
        });
        */
        var allTransitionsDone = new Barrier(next);

        var size = Number(data.PageCount && data.PageCount[0]);
        if (isNaN(size) || size == 0) {
            var sPage = Number(getFirstText(data, "StartPage"));
            var ePage = Number(getFirstText(data, "EndPage"));
            if (sPage > 0 && ePage > 0) {
                size = ePage - sPage + 1;
                console.log("got pgsize: " + size);
            }
        }
        size = size > 0 ? size : 10;

        var label_text = prettyForm(data.Title[0]);

        var csize = size;
        var no_label = false;
        var type;
        /*
        IsPeerReviewed  [ "true" ]
        IsScholarly [ "true" ]
        isFullTextHit   true/false
        inHoldings  true/false
        */
        var peerOrScholary = getBool(data, "IsPeerReviewed") || getBool(data, "IsScholarly");
        if (peerOrScholary) {
            type = 'anon';
        } else {
            type = 'user';
        }

        var circle_id = 'd' + ((Math.random() * 100000) | 0);
        var abs_size = Math.abs(size);
        size = Math.max(Math.sqrt(abs_size) * scale_factor, 3);

        var isFromCatalog = getFirstText(data, 'Source') == "Innovative Interfaces";
        var inHoldings = getBool(data, "inHoldings");

        var year = Number(getFirstText(data, 'PublicationYear'));
        if (false && !isNaN(year) && year != 0) {
            function year2sound_(year) {
                var x = 2014 - year + 3;
                var y = x < 17 ? (3 + 3.8 * x - 0.16 * x * x) : 100 / (x-13);
                console.log(year + " -> " + Math.round(y));
                return Math.round(y);
            }
            function year2sound(year) {
                var x = 2014 - year;
                var y = Math.max(3, 13 - x);
                console.log(year + " -> " + Math.round(y));
                return Math.round(y);
            }
            if (isFromCatalog) {
                soundMgr.playSound(year, soundMgr.CLAV, 1, year2sound);
            } else {
                soundMgr.playSound(year, soundMgr.CELESTA, 1, year2sound);
            }
        } else {
            if (getFirstText(data, 'ContentType') == "Web Resource") {
                soundMgr.playRandomSwell();
            } else {
                if (isFromCatalog) {
                    soundMgr.playSound(size, soundMgr.CLAV, 1);
                } else {
                    soundMgr.playSound(size, soundMgr.CELESTA, 1);
                }
            }
        }

        Math.seedrandom(data.Title[0])
        var x = Math.random() * (currentView.width - size) + size;
        var y = Math.random() * (currentView.height - size) + size;

        var svg_area = self.svg_area;
        var circle_group = svg_area.append('g')
            .attr('transform', 'translate(' + x + ', ' + y + ')')
            .attr('fill', edit_color);

        self.onScreen.push({
            item: circle_group
        });

        var cGroupDone = allTransitionsDone.add();
        // expanding circle
        var ring = circle_group.append('circle')
             .attr({r: size + 20,
                    stroke: 'none'})
             .transition()
             .attr('r', size + 80)
             .style('opacity', 0.0)
             .ease(Math.sqrt)
             .duration(delay)   // was 2500
             .remove()
             .call(allD3TransitionsDone, function () {
                cGroupDone.finish();
             })
             ;

        var circle_container = circle_group.append('a')
            .attr('xlink:href', data.url)
            .attr('target', '_blank')
            .attr('fill', svg_text_color)
            ;

        circle_container
            .style('opacity', 0.0)
            .transition()
            .ease(Math.sqrt)
            .duration(delay)
            .style('opacity', 1.0)
            ;

        var category = discipline2Category[data.Discipline && data.Discipline[0]] || "Other";
        var color = d3.scale.category10().domain(SUMMON_CATEGORIES);

        var circle = circle_container.append('circle')
            .classed(type, true)
            //.style("fill", function(_data) { return color(category); });
            .style("fill", color(category))
            .attr('r', size)
            ;

        if (self.onScreen.length > self.maxOnScreen) {
            var toremove = self.onScreen.shift();
            toremove.item
                .transition()
                .duration(4000 || max_life)
                .style('opacity', 0)
                .each('end', function() {
                    toremove.item.remove();
                })
                .remove();
        }

        circle_container.on('mouseover', function() {
            if (no_label) {
                no_label = false;
                circle_container.append('text')
                    .text(label_text)
                    .classed('article-label', true)
                    .attr('text-anchor', 'middle')
                    .transition()
                    .delay(1000)
                    .style('opacity', 0)
                    .duration(2000)
                    .each('end', function() { no_label = true; })
                    .remove();
            }

        });

        if (s_titles) {
            // var textDone = allTransitionsDone.add();
            /*
            var text = circle_container.append('text')
                .text(label_text)
                .classed('article-label', true)
                .attr('text-anchor', 'middle')
                ;
            */
            // http://stackoverflow.com/questions/18536012/d3-js-line-breaks-not-working-in-text-using-html
            var xw = 70;
            var yw = 120;
            var text = circle_container.append("foreignObject")
                // .attr("class", "article-label")
                .attr("width", String(2*xw))
                .attr("height", String(2*yw))
                .attr("transform", "translate(-" + xw + ",-" + yw + ")")
                .html(function(d) { 
                    var bgimage = "";
                    var th = data.thumbnail_s || data.thumbnail_m || data.thumbnail_l;
                    if (th)
                        bgimage = 'style="background-image: url(' + th[0] 
                            + '); background-repeat: no-repeat; background-position: center;"';
                    // splitText not needed, will flow automatically
                    var html = '<div class="article-div" ' + bgimage + '>'; 
                    // html += '<div class="article-thumbnail-background" ' + bgimage+ '></div>';
                    html +=
                          '<a class="article-label" href="' + data.link + '">' + label_text + '</a>'
                        // + "<br/>" + category
                        ;

                    //var fts = moment(ts).format('MMM Do YYYY, h:mm:ss a');
                    var fts = moment(ts).format('h:mma');
                    html += '<br /><span class="article-time">' + fts + "</span>";
                    html += "</div>";
                    return html;
                });

            /* text transitions out */
            false && text.transition()
                .delay(delay)
                .style('opacity', 0)
                /*.call(allD3TransitionsDone, function () {
                    textDone.finish();
                }) */
                .duration(max_life)
                .each('end', function() { no_label = true; })
                .remove()
                ;
            false && setTimeout(function () {
                textDone.finish();
            }, delay);
        } else {
            no_label = true;
        }
    }
}

