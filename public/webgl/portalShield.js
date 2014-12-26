window.addEventListener("DOMContentLoaded", function () {
    var c = document.getElementById("canvas");
    c.width  = 800;
    c.height = 600;

    var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    var shaderProgram = function (id) {
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, document.getElementById("vs-" + id).text);
        gl.compileShader(vs);
        if (! gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error("vertex shader compile error");
            console.error(gl.getShaderInfoLog(vs));
            return null;
        }
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, document.getElementById("fs-" + id).text);
        gl.compileShader(fs);
        if (! gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error("fragment shader compile error");
            console.error(gl.getShaderInfoLog(fs));
            return null;
        }
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if(! gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("link error");
            console.error(gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    };
    var programs = [
        shaderProgram(0),
        shaderProgram(1)
    ];

    var render = function (data, imgs) {
        var start = new Date().getTime();
        var frame = 0;

        (function () {
            frame++;
            var rad = Math.PI * (frame % 360) / 180.0;
            var p_mat  = mat4.create();
            var mv_mat = mat4.create();
            mat4.perspective(p_mat, 45, c.width / c.height, 1, 10);
            mat4.translate(p_mat, p_mat, [0.0, 0.0, -3.0]);
            mat4.rotate(mv_mat, mv_mat, Math.PI / 6.0, [1.0, 0.0, 0.0]);
            mat4.rotate(mv_mat, mv_mat, rad, [0.0, 1.0, 0.0]);
            mat4.scale(mv_mat, mv_mat, [2.0, 2.0, 2.0]);

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            for (var i = 0; i < 2; i++) {
                var vbuf, ibuf, texture;
                var attrLocations = [
                    gl.getAttribLocation(programs[i], "a_position"),
                    gl.getAttribLocation(programs[i], "a_texCoord")
                ];
                // uniform
                gl.useProgram(programs[i]);
                gl.uniformMatrix4fv(gl.getUniformLocation(programs[i], "u_pMatrix"),  false, p_mat);
                gl.uniformMatrix4fv(gl.getUniformLocation(programs[i], "u_mvMatrix"), false, mv_mat);
                if (i === 1) {
                    gl.uniform1f(gl.getUniformLocation(programs[i], "u_elapsedTime"), (new Date().getTime() - start) / 5000);
                }
                // vbo
                vbuf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[i][0]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(attrLocations[0], 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(attrLocations[0]);
                vbuf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[i][1]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(attrLocations[1], 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(attrLocations[1]);
                // ibo
                ibuf = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data[i][2]), gl.STATIC_DRAW);
                // texture
                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[i]);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.uniform1i(gl.getUniformLocation(programs[i], "u_texture"), false, texture);

                gl.drawElements(gl.TRIANGLES, data[i][2].length, gl.UNSIGNED_SHORT, 0);
            }
            gl.flush();

            window.setTimeout(arguments.callee, 1000 / 60);
        }());
    };
    var loadAndRender = function (imgs) {
        loadFiles([
            "./data/json/shieldResource.json",
            "./data/json/shieldResourceXM.json"
        ], function (data) {
            render(data, imgs);
        });
    };
    loadImages([
        "./data/img/genericModTexture.png",
        "./data/img/objectXMTexture.png"
    ], loadAndRender);
}, false);

function loadFile (url, index, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
            callback(index, JSON.parse(xhr.responseText));
        }
    };
    xhr.open("GET", url, true);
    xhr.send(null);
};

function loadFiles (urls, callback) {
    var done = 0;
    var result = [];

    function partialCallback (index, data) {
        result[index] = data;
        done++;
        if (done == urls.length) {
            callback(result);
        }
    }

    for (var i = 0; i < urls.length; i++) {
        loadFile(urls[i], i, partialCallback);
    }
}

function loadImage (source, i, callback) {
    var img = new window.Image();
    img.onload = function () {
        callback(i, img);
    };
    img.src = source;
}

function loadImages (urls, callback) {
    var done = 0;
    var result = [];

    function partialCallback (index, data) {
        result[index] = data;
        done++;
        if (done == urls.length) {
            callback(result);
        }
    }

    for (var i = 0; i < urls.length; i++) {
        loadImage(urls[i], i, partialCallback);
    }
}
