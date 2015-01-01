window.addEventListener("DOMContentLoaded", function () {
    var c = document.getElementById("canvas");
    c.width = 800;
    c.height = 600;
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var program = function () {
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, document.getElementById("vs").text);
        gl.compileShader(vs);
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, document.getElementById("fs").text);
        gl.compileShader(fs);
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        return program;
    }();
    gl.useProgram(program);

    loadFile(function (data) {
        var vertices = new Array();
        var indexes  = new Array();
        var normals  = new Array();
        (function () {
            var i, j, n;
            var i0, i1, i2, i3;
            var v0, v1, v2, v3;
            var normalAtVertex = new Array();
            var rows, cols;
            var addNormal = function (index, n) {
			    if (! normalAtVertex[index]) {
				    normalAtVertex[index] = vec3.clone(n);
			    } else {
				    var normal = normalAtVertex[index];
				    vec3.add(normal, normal, n);
			    }
            };
            rows = data.split("\n");
            for (i = 0; i < 256; i++) {
                cols = rows[i].split(",");
                for (j = 0; j < 256; j++) {
                    vertices.push(i / 2 - 64.0);
                    vertices.push(j / 2 - 64.0);
                    vertices.push(cols[j]);
                }
            }
            for (i = 0; i < 255; i++) {
                for (j = 0; j < 255; j++) {
                    i0 = (j + 0) * 256 + i + 0;
                    i1 = (j + 0) * 256 + i + 1;
                    i2 = (j + 1) * 256 + i + 0;
                    i3 = (j + 1) * 256 + i + 1;
                    v0 = vec3.fromValues(vertices[i0 * 3 + 0], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
                    v1 = vec3.fromValues(vertices[i1 * 3 + 0], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
                    v2 = vec3.fromValues(vertices[i2 * 3 + 0], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
                    v3 = vec3.fromValues(vertices[i3 * 3 + 0], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]);
                    indexes.push(i1);
                    indexes.push(i0);
                    indexes.push(i2);
                    n = vec3.create();
                    vec3.sub(v1, v2, v1);
                    vec3.sub(v2, v0, v1);
                    vec3.cross(n, v1, v2);
                    vec3.normalize(n, n);
                    addNormal(i1, n);
                    addNormal(i0, n);
                    addNormal(i2, n);
                    indexes.push(i3);
                    indexes.push(i1);
                    indexes.push(i2);
                    n = vec3.create();
                    vec3.sub(v1, v2, v3);
                    vec3.sub(v2, v1, v3);
                    vec3.cross(n, v1, v2);
                    vec3.normalize(n, n);
                    addNormal(i3, n);
                    addNormal(i1, n);
                    addNormal(i2, n);
                }
            }
            for (i = 0; i < vertices.length / 3; i++) {
                n = vec3.fromValues(normalAtVertex[i][0], normalAtVertex[i][1], normalAtVertex[i][2]);
                vec3.normalize(n, n);
                normals[i * 3 + 0] = n[0];
                normals[i * 3 + 1] = n[1];
                normals[i * 3 + 2] = n[2];
            }
        }());

        var vbuf;
        vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "position"), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "position"));
        vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, "normal"), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, "normal"));
        var ibuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexes), gl.STATIC_DRAW);

        var lightDir = vec3.fromValues(10, -20, -30.0);
        vec3.normalize(lightDir, lightDir);
        gl.uniform3fv(gl.getUniformLocation(program, "lightDir"), lightDir);

        var start = new Date().getTime();
        (function () {
            var time = new Date().getTime() - start;
            var rad = time / 2.0 * (60 / 1000) / 180.0 * Math.PI;

            var p_mat   = mat4.create();
            var mv_mat  = mat4.create();
            var inv_mat = mat4.create();
            mat4.perspective(p_mat, 45, c.width / c.height, 1, 1000);
            mat4.translate(p_mat, p_mat, [0.0, 0.0, -45.0]);
            mat4.rotate(p_mat, p_mat, - Math.PI * 70.0 / 180.0, [1.0, 0.0, 0.0]);
            mat4.rotate(mv_mat, mv_mat, rad, [0.0, 0.0, 1.0]);
            mat4.translate(mv_mat, mv_mat, [20.0, 20.0, 0.0]);
            mat4.invert(inv_mat, mv_mat);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, "pMatrix"),   false, p_mat);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "mvMatrix"),  false, mv_mat);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "invMatrix"), false, inv_mat);

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, indexes.length, gl.UNSIGNED_SHORT, 0);

            gl.flush();

            self.animationID = window.requestAnimationFrame(arguments.callee);
        }());
    });
}, false);

function loadFile (callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
    xhr.open("GET", "./data/dem.csv", true);
    xhr.send(null);
}
