function WordCloudWidget(options) {
    for (v in options)
        if (options.hasOwnProperty(v))
            this[v] = options[v];

    this.myQueue = new VariableDelayQueue([3000, 2000, 1500, 1000, 500]);
}

WordCloudWidget.prototype.redraw = function (data) {
    var w = this.currentView.width;
    var h = this.currentView.height;

    console.log('resizing to: ' + w + "x" + h);
    this.vis.attr("transform", "translate(" + [w >> 1, h >> 1] + ")");
    this.w = w;
    this.h = h;
    this.cloud.stop()
        .size([w, h])
        .words(this.words).start();
}

WordCloudWidget.prototype.update = function (data) {
    var self = this;

    this.myQueue.add({
        start:  function (delay, next) {
            self.delay = delay;
            self.next = next;
            startLayout(data);
        }
    });

    var fill = d3.scale.category20();

    function startLayout(data) {
        /* Picking the font size is tricky.  Words are laid out in boxes, whose
         * height is the font size and whose width depends on how much space the letters
         * take in the chosen font.  If the resulting rectangle is too large to fit in the
         * cloud, it is simply skipped.
         *
         * Approach: find the range of frequencies.   For short periods (say last50, or last 5 mins),
         * the maximum is at around 4-8.  For longer periods (say last200, or last 1 hour), its
         * maybe at 30-50 or more.  The low end is usually 1.  
         * This is put in minSize, maxSize (should really be minFrequency, maxFrequency).
         *
         * Now this domain is mapped to possible font sizes.
         * We can use either a linear or a log scale.  Log scale makes frequent words more
         * prominent.
         * 
         * The issues here are:
         *  The high end of the font size range should probably depend on the screen size.
         *  Large font sizes, particularly for long words, makes it more likely that words are
         *  omitted if they don't fit.  On the other hands, too small of a font size means that
         *  either words are too small to read from a far, or the word cloud becomes too busy,
         *  or the distinction between low and high frequency terms is being washed out.
         *
         * A possible approach may be to look at the screen height and ask roughly how many
         * of the highest-frequency items should be there if they were arranged in lines.
         * This is implemented below in minFrequency/maxFontHeight.  Choosing a higher
         * dividend will allow longer subject terms to show up in the word cloud.
         */
        
        var minSize = 1e6;
        var maxSize = 0;
        self.words = data[self.key].filter(function (item) {
            return item[1] > 0;
        }).map(function (item) {
            minSize = Math.min(minSize, item[1]);
            maxSize = Math.max(maxSize, item[1]);
            return { text: item[0], frequency: item[1] };
        });

        self.w = self.currentView.width;
        self.h = self.currentView.height;
        
        var minFontHeight = self.h / 40;
        var maxFontHeight = self.h / 5;
        console.log("font size mapping log([" 
            + minSize + "," + maxSize + "]) -> [" + minFontHeight + "," + maxFontHeight + "]");
        // maps [ minSize, maxSize ] -> [*, *];
        var fontSizeFunc = d3.scale.log().domain([minSize, maxSize]).range([minFontHeight, maxFontHeight]);
        var frequencyToFontSize = function (d) {
            return fontSizeFunc(d.frequency);
        }
        if (self.cloud) {
            console.log("restarting layout" + " " + new Date);
            // already created, stop it, update font size function, update words, and restart
            self.cloud.stop().fontSize(frequencyToFontSize).words(self.words).start();
        } else {
            console.log("starting layout" + " " + new Date);

            var svg = self.svg;
            self.background = svg.append("g");
            self.vis = svg.append("g").attr("transform", "translate(" + [self.w >> 1, self.h >> 1] + ")");

            // first time: create it, set it up.
            // will call 'draw' when layout for current set of words has
            // been computed
            self.cloud = d3.layout.cloud();
            self.cloud.size([self.w, self.h])
                .timeInterval(10)
                // .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .rotate(function(d) { return ~~(Math.random() * 5) * 30 - 60; })
                .padding(1)
                .font("Impact")
                .fontSize(frequencyToFontSize)
                // .text(function(d) { return d.text; })
                .on("end", draw)
                .words(self.words)
                .start();
        }
    }

    function draw(words, bounds) {
        var w = self.w;
        var h = self.h;
        console.log("layout end fired, using: " + w + "x" + h + " " + new Date);
        var scale = bounds ? Math.min(
              w / Math.abs(bounds[1].x - w / 2),
              w / Math.abs(bounds[0].x - w / 2),
              h / Math.abs(bounds[1].y - h / 2),
              h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;

        var text = self.vis.selectAll("text")
              .data(words, function(d) { return d.text; });

        // move existing words
        text.transition()
            .duration(1000)
            .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
            .style("font-size", function(d) { return d.size + "px"; });

        // add in new words
        text.enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; })
            .transition()
            .duration(1000)
            .style("opacity", 1);

        var exitGroup = self.background.append("g")
                                  .attr("transform", self.vis.attr("transform"));
        var exitGroupNode = exitGroup.node();
        text.exit().each(function() {
            exitGroupNode.appendChild(this);
        });
        exitGroup.transition()
            .duration(1000)
            .style("opacity", 1e-6)
            .remove();
        if (isNaN(scale)) {
            console.log("scale is NaN!!!!");
        }
        self.vis.transition()
            .delay(1000)
            .duration(750)
            .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");

        if (self.next) {
            var next = self.next;
            next();
/*
            setTimeout(function () {
                console.log("and ... next!");
                next();
            }, self.delay);
            delete self.next;
*/
        } 
    }
}
