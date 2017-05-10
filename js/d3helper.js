// https://groups.google.com/forum/#!msg/d3-js/WC_7Xi6VV50/j1HK0vIWI-EJ
// create and invoke a callback when all d3 elements have transitioned
function allD3TransitionsDone(transition, callback) { 
    var n = 0; 
    if (transition.empty())
        callback.apply(this, arguments);
    else
        transition 
            .each(function() { ++n; }) 
            .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
} 

/* implement a svg area that resizes to take up the entire window, minus a vertical header 
 * code refactored from Listen to Wikipedia
 */
function createFullScreenSVG(options) {
    var divContainerSelector = options.area,
        headerSelector = options.header;

    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName(divContainerSelector + ' svg')[0]; // is this correct? A CSS selector passed to getElementsByTagName?

    var svg = d3.select(divContainerSelector).append("svg");

    function update_svg_size() {
        options.width = w.innerWidth || e.clientWidth || g.clientWidth;
        var headerHeight = $(headerSelector).height();
        options.height = Math.round((w.innerHeight  - headerHeight)
              || (e.clientHeight - headerHeight)
              || (g.clientHeight - headerHeight));

        // console.log("sizing to: " + options.width + "x" + options.height);
        svg.attr({width: options.width, height: options.height});
        typeof options.callback == 'function' && options.callback();
    }

    update_svg_size();
    window.onresize = update_svg_size;
    return svg;
}
