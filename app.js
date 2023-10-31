var vertexShaderText =
  [
    'precision mediump float;',
    '',
    'attribute float t;',
    'attribute vec3 vertColor;',
    'uniform vec3 controlPoints[4];',
    'varying vec3 vColor;',
    '',
    'void main()',
    '{',
    ' float u = 1.0 - t;',
    ' float tt = t * t;',
    ' float uu = u * u;',
    ' float uuu = uu * u;',
    ' float ttt = tt * t;',
    ' vec3 p = uuu * controlPoints[0];', // term for control point 0
    ' p += 3.0 * uu * t * controlPoints[1];', // term for control point 1
    ' p += 3.0 * u * tt * controlPoints[2];', // term for control point 2
    ' p += ttt * controlPoints[3];', // term for control point 3
    ' gl_Position = vec4(p, 1.0);',
    ' vColor = vertColor;',
    '}'
  ].join('\n');

var fragmentShaderText =
  [
    'precision mediump float;',
    '',
    'varying vec3 vColor;',
    'void main()',
    '{',
    ' gl_FragColor = vec4(vColor, 1.0);',
    '}'
  ].join('\n');

var gl;

var initDemo = function () {
  console.log('This is working');

  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('webgl');

  if (!gl) {
    console.log("WebGL not supported, falling back on experimental");
    gl = canvas.getContext("experimental-webgl");
  }

  if (!gl) {
    alert('Your brower does not support WebGL');
  }

  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
    return;
  }

  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(vertexShader));
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ERROR linking program!', gl.getProgramInfoLog(program));
    return;
  }
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  var controlPoints = [
    0.0, 0.0, 0.0,
    0.2, 0.3, 0.2,
    0.5, 0.2, 0.6,
    0.8, -0.7, 0.5,
  ];
  var controlPointsLocation = gl.getUniformLocation(program, 'controlPoints');
  gl.uniform3fv(controlPointsLocation, new Float32Array(controlPoints.flat()));

  var tValues = new Float32Array(100);
  var colors = new Float32Array(300);
  for (var i = 0; i < 100; ++i) {
    tValues[i] = i / 99.0;
    colors[3 * i] = 1.0; // R
    colors[3 * i + 1] = 1.0; // G
    colors[3 * i + 2] = 1.0; // B
  }

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, tValues, gl.STATIC_DRAW);
  var tLocation = gl.getAttribLocation(program, 't');
  gl.enableVertexAttribArray(tLocation);
  gl.vertexAttribPointer(tLocation, 1, gl.FLOAT, false, 0, 0);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  var colorLocation = gl.getAttribLocation(program, 'vertColor');
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

  var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
  var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
  var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

  var worldMatrix = new Float32Array(16);
  var viewMatrix = new Float32Array(16);
  var projMatrix = new Float32Array(16);
  mat4.identity(worldMatrix);
  mat4.lookAt(viewMatrix, [60, 100, 0], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
  gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
  gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

  var xRotationMatrix = new Float32Array(16);
  var yRotationMatrix = new Float32Array(16);

  var identityMatrix = new Float32Array(16);
  mat4.identity(identityMatrix);
  var angle = 0;
  var loop = function () {
    angle = performance.now() / 1000 / 6 * 2 * Math.PI;
    mat4.rotate(xRotationMatrix, identityMatrix, angle, [0, 1, 0]);
    mat4.rotate(yRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
    mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.LINE_STRIP, 0, tValues.length);

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

window.onload = initDemo;