var IIV = function (c) {
    this.c  = c;
    var gl = this.gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);
    this.resourceData = {
        "Portal Shield": {
            "vertices": ["./data/json/shieldResource.json", "./data/json/shieldResourceXM.json"],
            "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
            "shaders": [
                {
                    vertex: "./shaders/textured.vert",
                    fragment: "./shaders/textured.frag"
                },
                {
                    vertex: "./shaders/xm.vert",
                    fragment: "./shaders/xm.frag"
                }
            ]
        },
        "Portal Key": {
            "vertices": ["./data/json/portalKeyResourceUnit.json"],
            "textures": ["./data/img/genericModTexture.png"],
            "shaders": [
                {
                    vertex: "./shaders/textured.vert",
                    fragment: "./shaders/textured.frag"
                }
            ]
        }
    };
};
IIV.prototype.setup = function (name, callback) {
    var self = this;
    var resources = self.resourceData[name];
    if (! resources) {
        return;
    }
    var data = {};
    var onload = function () {
        if (! (data["vertices"] && data["textures"] && data["programs"])) {
            return;
        };
        self.data = data;
        callback();
    };
    this.loadVertices(resources.vertices, function (vertices) {
        data["vertices"] = vertices;
        onload();
    });
    this.loadTextures(resources.textures, function (textures) {
        data["textures"] = textures;
        onload();
    });
    this.loadShaders(resources.shaders, function (shaders) {
        data["programs"] = self.createPrograms(shaders);
        onload();
    });
};
IIV.prototype.start = function () {
    var self = this;

    var start = new Date().getTime();
    (function () {
        var time = new Date().getTime() - start;
        self.draw(time);
        self.animationID = window.requestAnimationFrame(arguments.callee);
    }());
};
IIV.prototype.stop = function () {
    var gl = this.gl;
    window.cancelAnimationFrame(this.animationID);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};
IIV.prototype.draw = function (time) {
    var gl = this.gl;
    var rad = time * (60 / 1000) / 180.0 * Math.PI;

    var p_mat  = mat4.create();
    var mv_mat = mat4.create();
    mat4.perspective(p_mat, 45, this.c.width / this.c.height, 1, 10);
    mat4.translate(p_mat, p_mat, [0.0, 0.0, -3.0]);
    mat4.rotate(mv_mat, mv_mat, Math.PI * 20.0 / 180.0, [1.0, 0.0, 0.0]);
    mat4.rotate(mv_mat, mv_mat, rad, [0.0, 1.0, 0.0]);
    mat4.scale(mv_mat, mv_mat, [2.0, 2.0, 2.0]);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (var i = 0; i < this.data["programs"].length; i++) {
        var vbuf, ibuf, texture;
        var attrLocations = [
            gl.getAttribLocation(this.data["programs"][i], "a_position"),
            gl.getAttribLocation(this.data["programs"][i], "a_texCoord")
        ];
        // uniform
        gl.useProgram(this.data["programs"][i]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.data["programs"][i], "u_pMatrix"),  false, p_mat);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.data["programs"][i], "u_mvMatrix"), false, mv_mat);
        gl.uniform1f(gl.getUniformLocation(this.data["programs"][i], "u_elapsedTime"), time / 6000);
        // vbo
        vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data["vertices"][i][0]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attrLocations[0], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attrLocations[0]);
        vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data["vertices"][i][1]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attrLocations[1], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attrLocations[1]);
        // ibo
        ibuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(this.data["vertices"][i][2]), gl.STATIC_DRAW);
        // texture
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data["textures"][i]);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(this.data["programs"][i], "u_texture"), false, texture);

        gl.drawElements(gl.TRIANGLES, this.data["vertices"][i][2].length, gl.UNSIGNED_SHORT, 0);
    }

    gl.flush();
};
IIV.prototype.loadVertices = function (urls, callback) {
    var self = this;
    var count = 0;
    var results = [];
    urls.forEach(function (url, i) {
        self.loadData(url, function (result) {
            results[i] = result;
            count++;
            if (count === urls.length) {
                callback(results);
            }
        });
    });
};
IIV.prototype.loadTextures = function (urls, callback) {
    var self = this;
    var count = 0;
    var results = [];
    urls.forEach(function (url, i) {
        var img = new window.Image();
        img.onload = function () {
            results[i] = img;
            count++;
            if (count === urls.length) {
                callback(results);
            }
        };
        img.src = url;
    });
};
IIV.prototype.loadShaders = function (shaders, callback) {
    var self = this;
    var count = 0;
    var results = [];
    shaders.forEach(function (e, i) {
        var result = {};
        var onload = function () {
            if (result["vertex"] && result["fragment"]) {
                results[i] = result;
                count++;
                if (count === shaders.length) {
                    callback(results);
                }
            }
        };
        self.loadData(e.vertex, function (script) {
            result["vertex"] = script;
            onload();
        });
        self.loadData(e.fragment, function (script) {
            result["fragment"] = script;
            onload();
        });
    });
};
IIV.prototype.loadData = function (url, callback) {
    $.ajax({
        url: url,
        success: callback,
        error: console.error
    });
};
IIV.prototype.createPrograms = function (shaders) {
    var gl = this.gl;
    return shaders.map(function (shader) {
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, shader["vertex"]);
        gl.compileShader(vs);
        if (! gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error("vertex shader compile error");
            console.error(gl.getShaderInfoLog(vs));
            return null;
        }
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, shader["fragment"]);
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
    });
};

$(function () {
    var c = $("#canvas").css({
        width: "100%",
        height: "100%"
    }).get(0);
    c.width  = $(c).width();
    c.height = c.width * 3 / 4;
    var iiv = new IIV(c);

    $('a[href=""]').click(function (e) {
        var name = $(this).text();
        iiv.stop();
        $(".navbar li").removeClass("active");
        $(this).closest("li").addClass("active");
        $(".collapse.in").collapse("hide");
        $(".dropdown.open").find(".dropdown-toggle").dropdown("toggle");
        $("h1").text(name);
        iiv.setup(name, function () {
            iiv.start();
        });
        return false;
    });

    $('a').get(3).click();
});