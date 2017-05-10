/**
 * Helper functions to output Summon records
 */
(function () {

function Outputter(record) {
    this.output = "";
    this.lastsep = "";
    this.record = record;
}

Outputter.prototype = {
    append: function (what, nextsep) {
        if (nextsep !== undefined) {
            this.output += this.lastsep + what;
        } else {
            this.output += what;
        }
        this.lastsep = nextsep || "";
    },
    allof: function (prefix, field, sep, nextsep) {
        if (field in this.record) {
            this.output += this.lastsep + prefix;
            this.output += this.record[field].join(sep);
            this.lastsep = nextsep || "";
        }
    },
    first: function (prefix, field, nextsep, wrap) {
        if (field in this.record) {
            this.output += this.lastsep + prefix;
            var v = this.record[field][0];
            if (typeof wrap == 'function')
                this.output += wrap(v);
            else
                this.output += v;
            this.lastsep = nextsep || "";
        }
    },
    firstsub: function(prefix, field, subfield, nextsep, wrap) {
        if (field in this.record) {
            var v = this.record[field][0];
            if (subfield in v) {
                v = v[subfield];
                this.output += this.lastsep + prefix;
                if (typeof wrap == 'function')
                    this.output += wrap(v);
                else
                    this.output += v;
                this.lastsep = nextsep || "";
            }
        }
    },
    finish: function () {
        this.output += this.lastsep;
    },
    INBOLD : function (v) {
        return "<b>" + v + "</b>";
    },
    INPAR : function (clazz) {
        return function (v) {
            return "<p class='" + clazz + "'>" + v + "</p>";
        }
    },
    INIMG : function (clazz, handler) {
        return function (v) {
            handler = handler && (" onload='javascript:" + handler + "(event);' ") || " ";
            return "<img class='" + clazz + "' src='" + v + "'" + handler + ">";
        }
    }
}

libFxRemoveEmptyImageFromDOM = function (ev) {
    var img = ev.target;
    if (img.width == 1 && img.height == 1) {
        img.parentNode.remove(img);
    }
}

/* for use on cube faces. */
formatRecord2 = function (data) {
    var fts = moment(data.timestamp).format('MMM Do YYYY, h:mm:ss a');
    var record = data.record;

    var o = new Outputter(record);
    o.append('<div class="libfx-timestamp">On ' + fts + ", a user discovered in Summon</div>");
    o.append('<div style="float: left">');
    // NB: load handler must exist when element is defined, can't use $.live or $.on
    o.first('', 'thumbnail_m', "", o.INIMG('libfx-bookcover libfx-bookcover-md', 'libFxRemoveEmptyImageFromDOM'));
    // TBD: if large/medium fails, fall back to small; unfortunately, load handler won't fire.
    o.append('</div>');

    o.first('', 'Title', "", o.INPAR("libfx-record-title"));
    o.allof("<p class='libfx-record-authors'>by ", 'Author', "; ", "</p>");

    o.append("<p class='libfx-record-publicationtitle'>");
    o.first("", 'PublicationTitle', ". ");
    o.first('ISBN ', 'ISBN', ", ");
    o.first('ISSN ', 'ISSN', ", ");
    o.first('Volume ', 'Volume', ", ");
    o.first('Issue ', 'Issue', ", ");
    o.first("pp. ", 'StartPage', "--");
    o.first("", 'EndPage', " ");
    o.append("</p>");

    o.first('<p class="libfx-record-contenttype"><span class="libfx-heading">Content Type:</span> ', 'ContentType', '</p>');

    o.first('<p class="libfx-record-publisher"><span class="libfx-heading">Publisher:</span> ', 'Publisher', '</p>');
    
    var dateopen = '<p class="libfx-record-publicationdate"><span class="libfx-heading">Date:</span> ';
    var dateclose = '</p>';
    var hasXMLPubDate =  'PublicationDate_xml' in record;
    var hasPubDate =  'PublicationDate' in record;
    if (hasXMLPubDate || hasPubDate) {
        if (hasXMLPubDate) {
            // record might have year, but not month or day
            o.append(dateopen);
            o.firstsub('', 'PublicationDate_xml', 'month', '/');
            o.firstsub('', 'PublicationDate_xml', 'day', '/');
            o.firstsub('', 'PublicationDate_xml', 'year', '');
            o.append('', dateclose);
        } else {
            o.first(dateopen, 'PublicationDate', dateclose);
        }
    }

    o.first('<p class="libfx-record-callnum"><span class="libfx-heading">Call Number:</span> ', 'LCCallNum', '</p>');
    o.first('<p class="libfx-record-abstract"><span class="libfx-heading">Abstract:</span> ', 'Abstract', '</p>');
    if (!('Abstract' in record)) {
        o.first('<p class="libfx-record-abstract"><span class="libfx-heading">Snippet:</span> ', 'Snippet', '</p>');
    }
    var runWhenReady = null;

    if ('ISBN' in record) {
        o.append('<div id="syn_summary"></div>');
        
        runWhenReady = function () {
            var url = makeSyndeticsRequest(record);
            $syndetics = {
                jQuery: $,
                truncate_enhancements: function () { },
                log_usage: function () { }, // $syndetics.log_usage("vtu","isbn","0805832807",new Array("syn_summary"));
                callback: function () {
                    var $sbody = $("#syn_summary .syn_body");
                    if ($sbody.html()) {
                        $("#syn_summary").html('<div><span class="libfx-heading">Summary: </span>' + $sbody.html() + '</div>');
                    }
                    $("#syn_summary").attr('id', '');   // clear id
                }
            } 
            $.getScript(url, function () {
                $("#syn_summary").attr('id', '');   // clear id
            });
        }
    }

    /* Syndetics */
    o.finish();
    // console.log(o.output);
    return {
        html: "<div class='libfx-cubeface'>" + o.output + "</div>",
        qrcode: makeQRCode(record),
        runafterinsert: runWhenReady
    };
}

makeSyndeticsRequest = function(record) {
    if ('ISBN' in record) {
        return "http://plus.syndetics.com/widget_response.php?id=vtu&isbn=" + record.ISBN.join(",") + "&upc=&oclc=&issn=&enhancements=syn_summary";
    }
    return undefined;
}

makeQRCode = function(record, width, height) {
    width = width || 300;
    height = height || 300;
    // https://google-developers.appspot.com/chart/infographics/docs/qr_codes
    if (record.link != null)
        return '<img src="https://chart.googleapis.com/chart?cht=qr&chs=' 
            + width + 'x' + height + '&chld=L|1&chl=' 
            + encodeURIComponent(record.link) + '" />';
    return "";
}

// https://vufind.svn.sourceforge.net/svnroot/vufind/trunk/web/interface/themes/default/Summon/record.tpl
/* currently used in record scroller widget */
formatRecord = function (record) {

    var ts = record.timestamp;
    var record = record.record;

    var o = new Outputter(record);

    o.first('', 'Title', ", ", function (v) {
        if ('link' in record)
            return "<a href='" + record.link + "'>" + v + "</a>";
    });

    o.allof("by ", 'Author', "; ", ", ");

    o.first('', 'PublicationTitle', ", ");
    var hasXMLPubDate =  'PublicationDate_xml' in record;
    var hasPubDate =  'PublicationDate' in record;
    if (hasXMLPubDate || hasPubDate) {
        if (hasXMLPubDate) {
            o.append(" ");
            o.firstsub('', 'PublicationDate_xml', 'month', '/');
            o.firstsub('', 'PublicationDate_xml', 'day', '/');
            o.firstsub('', 'PublicationDate_xml', 'year', ', ', o.INBOLD);
        } else {
            o.first(' ', 'PublicationDate', ', ', o.INBOLD);
        }
    }

    // first('', 'Snippet', ". ");
    o.first('ISBN: ', 'ISBN', " ");
    o.first('ISSN: ', 'ISSN', " ");
    o.first('Related Author: ', 'RelatedAuthor', " ");
    o.first('Volume: ', 'Volume', " ");
    o.first('Issue: ', 'Issue', " ");
    o.first("pp. ", 'StartPage', "--");
    o.first("", 'EndPage', " ");
    o.allof(" ", 'SubjectTerms', "--");
    o.allof("; ", 'Discipline', "--");
    o.first("", 'Abstract', " ", function (v) {
        if (v.length > 400)
            v = v.substr(0, 400) + "...";
        return "<br /><i style='color: maroon'>" + v + "</i>";
    });

    var fts = moment(ts).format('MMM Do YYYY, h:mm:ss a');
    //var fts = moment(record.timestamp).fromNow();
    var html = '<span class="libfx-record-timestamp">' + fts + "</span><br>" + o.output;
    return html;
}

}) ();
