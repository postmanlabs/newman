var jsface = require('jsface');

var CsvHelper = jsface.Class({
    $singleton: true,
    CSV: function () {
        var a = /^\d+$/,
            b = /^\d*\.\d+$|^\d+\.\d*$/,
            c = /^\s|\s$|,|"|\n/,
            d = function () {
                return String.prototype.trim ? function (a) {
                    return a.trim()
                } : function (a) {
                    return a.replace(/^\s*/, "").replace(/\s*$/, "")
                }
            }(),
            e = function (a) {
                return "[object Number]" === Object.prototype.toString.apply(a)
            },
            f = function (a) {
                return "[object String]" === Object.prototype.toString.apply(a)
            },
            g = function (a) {
                return "\n" !== a.charAt(a.length - 1) ? a : a.substring(0, a.length - 1)
            },
            h = function (d) {
                return f(d) ? (d = d.replace(/"/g, '""'), c.test(d) || a.test(d) || b.test(d) ? d = '"' + d + '"' : "" === d && (d = '""')) : d = e(d) ? d.toString(10) : null === d || void 0 === d ? "" : d.toString(), d
            },
            i = {
                arrayToCsv: function (a) {
                    var b, c, d, e, f = "";
                    for (d = 0; d < a.length; d += 1) {
                        for (c = a[d], e = 0; e < c.length; e += 1) b = c[e], b = h(b), f += e < c.length - 1 ? b + "," : b;
                        f += "\n"
                    }
                    return f
                },
                csvToArray: function (c, e) {
                    c = g(c), e = e === !0 ? {
                        trim: !0
                    } : e || {};
                    var f, h = "",
                        i = !1,
                        j = !1,
                        k = "",
                        l = [],
                        m = [],
                        n = e.trim === !0 ? !0 : !1,
                        o = function (c) {
                            var e = d(c);
                            return j !== !0 && ("" === c ? c = c : n === !0 && (c = e), (a.test(e) || b.test(e)) && (c = +e)), c
                        };
                    for (f = 0; f < c.length; f += 1) h = c.charAt(f), i !== !1 || "," !== h && "\n" !== h ? '"' !== h ? k += h : i ? '"' === c.charAt(f + 1) ? (k += '"', f += 1) : i = !1 : (i = !0, j = !0) : (k = o(k), l.push(k), "\n" === h && (m.push(l), l = []), k = "", j = !1);
                    return k = o(k), l.push(k), m.push(l), m
                },
                csvToObject: function (a, b) {
                    b = void 0 !== b ? b : {};
                    var c = b.columns,
                        d = !!b.trim,
                        e = this.csvToArray(a, d);
                    return c || (c = e.shift()), e.map(function (a) {
                        for (var b = {}, d = 0, e = c.length; e > d; d += 1) b[c[d]] = a[d];
                        return b
                    })
                },
                objectToCsv: function (a, b) {
                    b = void 0 !== b ? b : {};
                    var c = b.columns,
                        d = b.includeColumns,
                        e = "",
                        f = "",
                        g = function (b) {
                            var d, e, f, g = "",
                                i = a.length,
                                j = c.length;
                            for (e = 0; i > e; e += 1) {
                                for (b = a[e], f = 0; j > f; f += 1) d = c[f], g += h(b[d]), g += j - 1 > f ? "," : "";
                                g += "\n"
                            }
                            return g
                        },
                        i = function () {
                            var b, d, e, f, g, i, j, k = [],
                                l = a.length,
                                m = [];
                            for (g = 0; l > g; g += 1) {
                                e = a[g], j = [];
                                for (f in e) e.hasOwnProperty(f) && (i = k.indexOf(f), -1 === i && (i = k.push(f), i -= 1), j[i] = h(e[f]));
                                0 === g && (b = j.length), m.push(j)
                            }
                            return d = k.length, b !== d && m.forEach(function (a) {
                                a.length = d
                            }), c = k, m.map(function (a) {
                                return a.join(",")
                            }).join("\n") + "\n"
                        };
                    return d = void 0 === d ? !0 : !!d, e = void 0 !== c ? g() : i(), d && (c.forEach(function (a) {
                        f += h(a) + ","
                    }), f = f.substring(0, f.length - 1), e = f + "\n" + e), e
                }
            };
        return "object" == typeof exports && (exports.arrayToCsv = i.arrayToCsv, exports.csvToArray = i.csvToArray, exports.objectToCsv = i.objectToCsv, exports.csvToObject = i.csvToObject), i
    }()
});

module.exports = CsvHelper;
