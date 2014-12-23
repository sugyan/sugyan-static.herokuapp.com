window.addEventListener("DOMContentLoaded", function () {
    var c = document.getElementById("canvas");
    c.width  = 800;
    c.height = 600;

    var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, document.getElementById("vs").text);
    gl.compileShader(vs);
    if (! gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error("vertex shader compile error");
        console.error(gl.getShaderInfoLog(vs));
        return;
    }
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, document.getElementById("fs").text);
    gl.compileShader(fs);
    if (! gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error("fragment shader compile error");
        console.error(gl.getShaderInfoLog(fs));
        return;
    }
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(! gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("link error");
        console.error(gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    loadImage("./data/img/genericModTexture.png", function (img) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(program, "texture"), false, texture);

        loadFile("./data/json/portalkey.json", function (data) {
            var attrLocations = [
                gl.getAttribLocation(program, "position"),
                gl.getAttribLocation(program, "texCoord")
            ];

            var buf = new Array(2);
            buf[0] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf[0]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(attrLocations[0], 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(attrLocations[0]);
            buf[1] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf[1]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texcoord), gl.STATIC_DRAW);
            gl.vertexAttribPointer(attrLocations[1], 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(attrLocations[1]);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data.indexes), gl.STATIC_DRAW);

            var frame = 0;
            (function () {
                frame++;
                var rad = Math.PI * (frame % 360) / 180.0;
                var p_mat  = mat4.create();
                var mv_mat = mat4.create();
                mat4.perspective(p_mat, 45, c.width / c.height, 1, 10);
                mat4.translate(p_mat, p_mat, [0.0, 0.0, -3.0]);
                mat4.rotate(mv_mat, mv_mat, Math.PI * 25.0 / 180.0, [1.0, 0.0, 0.0]);
                mat4.rotate(mv_mat, mv_mat, rad, [0.0, 1.0, 0.0]);
                mat4.scale(mv_mat, mv_mat, [2.0, 2.0, 2.0]);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "pMatrix"),  false, p_mat);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, "mvMatrix"), false, mv_mat);

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                gl.drawElements(gl.TRIANGLES, data.indexes.length, gl.UNSIGNED_SHORT, 0);
                gl.flush();

                window.setTimeout(arguments.callee, 1000 / 60);
            }());
        });
    });

}, false);

function loadFile (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
            callback(JSON.parse(xhr.responseText));
        }
    };
    xhr.open("GET", url, true);
    xhr.send(null);
};

function loadImage (source, callback) {
    var img = new window.Image();
    img.onload = function () {
        callback(img);
    };
    img.src = source;
}
