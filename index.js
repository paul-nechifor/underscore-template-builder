var async = require('async');
var fs = require('fs');
var path = require('path');
var beautify = require('js-beautify').js_beautify;

exports.saveModule = function (templatePath, output, cb) {
    var structure = {};
    populate(structure, templatePath, function (err) {
        if (err) {
            return cb(err);
        }
        var file = beautify(getModule(structure), {indent_size: 2});
        fs.writeFile(output, file, {encoding: 'utf8'}, cb);
    });
};

function populate(structure, filepath, cb) {
    fs.readdir(filepath, function (err, files) {
        if (err) {
            return cb(err);
        }
        var action = populateStructure(structure, filepath);
        async.map(files, action, function (err, results) {
            if (err) {
                return cb(err);
            }
            cb();
        });
    });
}

function populateStructure(structure, filepath) {
    return function (file, cb) {
        var newPath = filepath + '/' + file;
        fs.lstat(newPath, function (err, stat) {
            if (err) {
                return cb(err);
            }
            if (stat.isDirectory()) {
                structure[file] = {};
                return populate(structure[file], newPath, cb);
            }
            fs.readFile(newPath, {encoding: 'utf8'}, function (err, data) {
                if (err) {
                    return cb(err);
                }
                structure[path.basename(file, '.html')] = data;
                cb();
            })
        });
    };
}

function getModule(structure) {
    return 'var _ = require("lodash");\nmodule.exports = '
    + getMap(structure) + ';'
}

function getMap(map) {
    var ret = '{\n';
    var first = true;
    for (var key in map) {
        if (!first) {
            ret += ',\n';
        }
        ret += JSON.stringify(key) + ':';
        value = map[key];
        if (typeof value === 'string') {
            ret += '_.template(' + JSON.stringify(value) + ')';
        } else {
            ret += getMap(value);
        }
        first = false;
    }
    return ret + '\n}';
}
