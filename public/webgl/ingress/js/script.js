var IIV = function (c) {
    this.c  = c;
    var gl = this.gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);
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
        data.extra = resources["extra"];
        data.color = resources["color"];
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
    self.changeColor();
    self.changeViewAngle(Math.PI * 25.0 / 180.0);
    self.changeSize(1.0);

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
    var color = this.colorData.rarity[1]; // default color
    if (this.data.color) {
        color = this.color[this.data.color];
    }
    var gl = this.gl;
    var rad = time * (60 / 1000) / 180.0 * Math.PI;

    var p_mat  = mat4.create();
    var v_mat  = mat4.create();
    var m_mat  = mat4.create();
    var mvp_mat = mat4.create();
    mat4.perspective(p_mat, 45, this.c.width / this.c.height, 0.1, 10);
    mat4.lookAt(v_mat, vec3.fromValues(0.0, 0.0, 2.0), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
    mat4.rotate(v_mat, v_mat, this.viewAngle, [1.0, 0.0, 0.0]);
    mat4.rotate(m_mat, m_mat, rad, [0.0, 1.0, 0.0]);
    mat4.scale(m_mat, m_mat, [this.size, this.size, this.size]);
    mat4.multiply(mvp_mat, p_mat, v_mat);
    mat4.multiply(mvp_mat, mvp_mat, m_mat);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (var i = 0; i < this.data["programs"].length; i++) {
        var vbuf, ibuf, texture;
        var attrLocations = [
            gl.getAttribLocation(this.data["programs"][i], "a_position"),
            gl.getAttribLocation(this.data["programs"][i], "a_texCoord")
        ];
        var teamColor = [1.0, 0.7, 1.0, 1.0];
        if (this.data["extra"] && this.data["extra"]["team_color"]) {
            teamColor = this.data["extra"]["team_color"];
        }
        // uniform
        gl.useProgram(this.data["programs"][i]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.data["programs"][i], "u_pMatrix"),  false, p_mat);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.data["programs"][i], "u_mvpMatrix"), false, mvp_mat);
        gl.uniform1f(gl.getUniformLocation(this.data["programs"][i], "u_elapsedTime"), time / 6000);
        gl.uniform4fv(gl.getUniformLocation(this.data["programs"][i], "u_teamColor"), teamColor);
        gl.uniform3fv(gl.getUniformLocation(this.data["programs"][i], "u_color"), color);
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
IIV.prototype.changeColor = function () {
    this.color = {
        "level": this.colorData["level"][Math.floor(Math.random() * 8)],
        "rarity": this.colorData["rarity"][Math.floor(Math.random() * 3)],
        "extra": this.colorData["extra"][0]
    };
};
IIV.prototype.changeViewAngle = function (rad) {
    this.viewAngle = rad;
};
IIV.prototype.changeSize = function (size) {
    this.size = size;
};
IIV.prototype.colorData = {
    "level": [
        [0.90, 0.90, 0.09],     // L1
        [0.90, 0.63, 0.09],     // L2
        [0.90, 0.36, 0.09],     // L3
        [0.90, 0.09, 0.09],     // L4
        [0.90, 0.09, 0.36],     // L5
        [0.90, 0.09, 0.63],     // L6
        [0.90, 0.09, 0.90],     // L7
        [0.63, 0.09, 0.90]      // L8
    ],
    "rarity": [
        [0.60, 1.00, 0.63],     // Common
        [0.67, 0.60, 1.00],     // Rare
        [1.00, 0.60, 1.00]      // Very Rare
    ],
    "extra": [
        [1.00, 0.60, 1.00]      // Very Rare
    ]
};
IIV.prototype.resourceData = {
    "Capsule": {
        "vertices": ["./data/json/capsuleResource.json", "./data/json/capsuleResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ]
    },
    "Media": {
        "vertices": ["./data/json/mediaCubeResourceUnit.json"],
        "textures": ["./data/img/genericModTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            }
        ]
    },
    "Portal Shield": {
        "vertices": ["./data/json/shieldResource.json", "./data/json/shieldResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "rarity"
    },
    "AXA Shield": {
        "vertices": ["./data/json/extra_shield.json", "./data/json/shieldResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "extra"
    },
    "Link Amp": {
        "vertices": ["./data/json/linkAmpResource.json", "./data/json/linkAmpResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ]
    },
    "Heat Sink": {
        "vertices": ["./data/json/heatSinkResource.json", "./data/json/heatSinkResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "rarity"
    },
    "Multi-hack": {
        "vertices": ["./data/json/multiHackResource.json", "./data/json/multiHackResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "rarity"
    },
    "Force Amp": {
        "vertices": ["./data/json/forceAmpResource.json", "./data/json/forceAmpResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ]
    },
    "Turret": {
        "vertices": ["./data/json/turretResource.json", "./data/json/turretResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ]
    },
    "Portal Key": {
        "vertices": ["./data/json/portalKeyResourceUnit.json"],
        "textures": ["./data/img/genericModTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            }
        ]
    },
    "Power Cube": {
        "vertices": ["./data/json/powerCubeResource.json", "./data/json/powerCubeResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "level"
    },
    "Resonator": {
        "vertices": ["./data/json/texturedResonatorRing.json", "./data/json/texturedResonatorXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "level"
    },
    "XMP Burster": {
        "vertices": ["./data/json/xmp.json", "./data/json/xmpXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "level"
    },
    "Ultra Strike": {
        "vertices": ["./data/json/ultrastrike.json", "./data/json/ultrastrikeXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "color": "level"
    },
    "ADA Refactor": {
        "vertices": ["./data/json/flipCardResourceAda.json", "./data/json/flipCardResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "extra": {
            "team_color": [0.0, 0.5, 1.0, 1.0]
        }
    },
    "JARVIS Virus": {
        "vertices": ["./data/json/flipCardResourceJarvis.json", "./data/json/flipCardResourceXM.json"],
        "textures": ["./data/img/genericModTexture.png", "./data/img/objectXMTexture.png"],
        "shaders": [
            {
                "vertex": "./shaders/textured.vert",
                "fragment": "./shaders/textured.frag"
            },
            {
                "vertex": "./shaders/xm.vert",
                "fragment": "./shaders/xm.frag"
            }
        ],
        "extra": {
            "team_color": [0.0, 0.8, 0.4, 1.0]
        }
    }
};
$(function () {
    var c = $("#canvas").css({
        width: "100%",
        height: "100%"
    }).get(0);
    c.width  = $(c).width() * 2;
    c.height = c.width * 3 / 4;
    var iiv = new IIV(c);

    $('.item').click(function (e) {
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
    });
    $(window.location.hash).trigger('click');

    $(c).click(function () {
        iiv.changeColor();
    });
    if ('ontouchend' in document) {
        (function () {
            var touch = false;
            var startY = 0;
            var baseAngle = 0;
            $(c).on('touchstart', function (e) {
                touch = true;
                startY = e.originalEvent.changedTouches[0].pageY;
                baseAngle = iiv.viewAngle;
            });
            $(c).on('touchend', function (e) {
                touch = false;
            });
            $(c).on('touchmove', function (e) {
                if (touch) {
                    var angle = baseAngle - ((startY - e.originalEvent.changedTouches[0].pageY) / 2.0 / 180.0 * Math.PI);
                    if (angle >  0.5 * Math.PI) { angle =  0.5 * Math.PI; }
                    if (angle < -0.5 * Math.PI) { angle = -0.5 * Math.PI; }
                    iiv.changeViewAngle(angle);
                }
            });
        }());
    } else {
        $(c).mousemove(function (e) {
            var h = c.height / 2;
            var y = e.clientY - c.offsetTop;
            iiv.changeViewAngle((0.5 - y / h) * Math.PI);
        });
        $(c).mousewheel(function (e) {
            var size = iiv.size;
            size -= e.deltaY * e.deltaFactor * 0.01;
            if (size < 0.5) { size = 0.5; }
            if (size > 2.0) { size = 2.0; }
            iiv.changeSize(size);
            return false;
        });
    }
});
