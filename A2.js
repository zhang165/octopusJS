/*
 * UBC CPSC 314 (2016_W1)
 * Assignment 2
 */

// ASSIGNMENT-SPECIFIC API EXTENSION
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix=a;
  this.matrix.decompose(this.position,this.quaternion,this.scale);
}


// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(-28,10,28);
camera.lookAt(scene.position);
scene.add(camera);


// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;


// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();


// FLOOR WITH CHECKERBOARD 
var floorTexture = new THREE.ImageUtils.loadTexture('images/water.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1, 1);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(50, 50);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0;
floor.rotation.x = Math.PI / 2;
scene.add(floor);


var clock = new THREE.Clock(true);
// MATERIALS
var normalMaterial = new THREE.MeshNormalMaterial();

// OCTOPUS MATERIAL
//You must change this matrix in updateBody() if you want to animate the octopus head.
var octopusMatrix = {type: 'm4', value: new THREE.Matrix4().set(
  1.0,0.0,0.0,0.0, 
  0.0,1.0,0.0,2.3, 
  0.0,0.0,1.0,0.0, 
  0.0,0.0,0.0,1.0
  )};
var octopusMaterial = new THREE.ShaderMaterial({
  uniforms:{
    octopusMatrix: octopusMatrix,
  },
});

var shaderFiles = [
  'glsl/octopus.vs.glsl',
  'glsl/octopus.fs.glsl'
];
new THREE.SourceLoader().load(shaderFiles, function(shaders) {
  octopusMaterial.vertexShader = shaders['glsl/octopus.vs.glsl'];
  octopusMaterial.fragmentShader = shaders['glsl/octopus.fs.glsl'];
});


// GEOMETRY

//Here we load the octopus geometry from a .obj file, just like the dragon
function loadOBJ(file, material, scale, xOff, yOff, zOff, xRot, yRot, zRot) {
  var onProgress = function(query) {
    if ( query.lengthComputable ) {
      var percentComplete = query.loaded / query.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var onError = function() {
    console.log('Failed to load ' + file);
  };

  var loader = new THREE.OBJLoader();
  loader.load(file, function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    object.position.set(xOff,yOff,zOff);
    object.rotation.x= xRot;
    object.rotation.y = yRot;
    object.rotation.z = zRot;
    object.scale.set(scale,scale,scale);
    scene.add(object);
  }, onProgress, onError);
  
}

//We keep the octopus at (0,0,0) and without any offset or scale factor, so we can change these values with transformation matrices.
loadOBJ('obj/Octopus_04_A.obj',octopusMaterial,1.0,0,0,0,0,0,0);

//Eyes

//We create a sphereGeometry for the eyes and the pupils
var eyeGeometry = new THREE.SphereGeometry(1.0,64,64);

var eye_R = new THREE.Mesh(eyeGeometry,normalMaterial);
//This Matrix for the right eye includes translation and scale
var eyeTSMatrix_R = new THREE.Matrix4().set(
  0.5,0.0,0.0,-0.2, 
  0.0,0.5,0.0,4.1, 
  0.0,0.0,0.5,-0.92, 
  0.0,0.0,0.0,1.0
  );
//Here we relate the eye with the octopus by multiplying their matrices
var octopusEye_RMatrix = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_R);
eye_R.setMatrix(octopusEye_RMatrix);
scene.add(eye_R);
//Right eye pupil translation and scale matrix
var pupilMatrix_R = new THREE.Matrix4().set(
  0.35,0.0,0.0,0.0, 
  0.0,0.35,0.0,0.0, 
  0.0,0.0,0.15,-0.9, 
  0.0,0.0,0.0,1.0
  );
var cosTheta = Math.cos(Math.PI * (-50 /180.0));
var sinTheta = Math.sin(Math.PI * (-50 /180.0));
//This is a rotation matrix for the right pupil
var pupilRotMatrix_R = new THREE.Matrix4().set(
  cosTheta,0.0,-sinTheta,0.0, 
  0.0,1.0,0.0,0.0, 
  sinTheta,0.0,cosTheta,0.0, 
  0.0,0.0,0.0,1.0
  );
var pupilTSRMatrix_R = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_R, pupilMatrix_R);
var eyePupilMatrix_R = new THREE.Matrix4().multiplyMatrices(octopusEye_RMatrix, pupilTSRMatrix_R);
var pupil_R = new THREE.Mesh(eyeGeometry,normalMaterial);
pupil_R.setMatrix(eyePupilMatrix_R);
scene.add(pupil_R);

var eye_L = new THREE.Mesh(eyeGeometry,normalMaterial);
//Left eye translation and scale matrix
var eyeTSMatrix_L = new THREE.Matrix4().set(
  0.5,0.0,0.0,-0.2, 
  0.0,0.5,0.0,4.1, 
  0.0,0.0,0.5,0.92, 
  0.0,0.0,0.0,1.0
  );
var octopusEye_LMatrix = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_L);
eye_L.setMatrix(octopusEye_LMatrix);
scene.add(eye_L);
//Left eye pupil translation and scale matrix
var pupilMatrix_L = new THREE.Matrix4().set(
  0.35,0.0,0.0,0.0, 
  0.0,0.35,0.0,0.0, 
  0.0,0.0,0.15,-0.9, 
  0.0,0.0,0.0,1.0
  );
cosTheta = Math.cos(Math.PI * (-130 /180.0));
sinTheta = Math.sin(Math.PI * (-130 /180.0));
var pupilRotMatrix_L = new THREE.Matrix4().set(
  cosTheta,0.0,-sinTheta,0.0, 
  0.0,1.0,0.0,0.0, 
  sinTheta,0.0,cosTheta,0.0, 
  0.0,0.0,0.0,1.0
  );
var pupilTSRMatrix_L = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_L, pupilMatrix_L);
var eyePupilMatrix_L = new THREE.Matrix4().multiplyMatrices(octopusEye_LMatrix, pupilTSRMatrix_L);
var pupil_L = new THREE.Mesh(eyeGeometry,normalMaterial);
pupil_L.setMatrix(eyePupilMatrix_L);
scene.add(pupil_L);

//Tentacle socket
//This point indicates the position for the first tentacle socket, you must figure out the other positions, (you get extra points if it is algorithmically)
var tentacleSocketMatrixArray = [ // declare octopus sockets
new THREE.Matrix4().set(
  1.0,0.0,0.0,-2.4, 
  0.0,1.0,0.0,-0.35, 
  0.0,0.0,1.0,2.4, 
  0.0,0.0,0.0,1.0
  ),
  new THREE.Matrix4().set(
   1.0,0.0,0.0,-2.4, 
  0.0,1.0,0.0,-0.35, 
  0.0,0.0,1.0,-2.4, 
  0.0,0.0,0.0,1.0
  ),
  new THREE.Matrix4().set(
   1.0,0.0,0.0,2.4, 
  0.0,1.0,0.0,-0.35, 
  0.0,0.0,1.0,-2.4, 
  0.0,0.0,0.0,1.0
  ),
  new THREE.Matrix4().set(
 1.0,0.0,0.0,2.4, 
  0.0,1.0,0.0,-0.35, 
  0.0,0.0,1.0,2.4, 
  0.0,0.0,0.0,1.0
  )];

var octopusSocketMatrixArray = []; // parent it 
for(var i=0; i<tentacleSocketMatrixArray.length; i++){
  octopusSocketMatrixArray[i] = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, tentacleSocketMatrixArray[i]);
}

var tentacleLinkFirst = new THREE.CylinderGeometry(0.4,0.45,1.8,64);
var tentacleJointFirst = new THREE.SphereGeometry(0.45,64,64);

var tentacleLinkSecond = new THREE.CylinderGeometry(0.28,0.35,2.3,64);
var tentacleJointSecond = new THREE.SphereGeometry(0.35,64,64);

var tentacleLinkThird = new THREE.CylinderGeometry(0.2,0.25,2.2,64);
var tentacleJointThird = new THREE.SphereGeometry(0.30,64,64);

var tentacleLinkFourth = new THREE.CylinderGeometry(0.12,0.24,2.2,64);

//Tentacle's links
var tentacleLinkFirstRotated = [];
var tentacleLinkFirstParent = [];
var tentacleLinkFirstMesh = [];

var tentacleJointFirstRotated = [];
var tentacleJointFirstParent = [];
var tentacleJointFirstMesh = [];
  
var tentacleLinkSecondRotated = [];
var tentacleLinkSecondParent = [];
var tentacleLinkSecondMesh = [];

var tentacleJointSecondRotated = [];
var tentacleJointSecondParent = [];
var tentacleJointSecondMesh = [];
  
var tentacleLinkThirdRotated = [];
var tentacleLinkThirdParent = [];
var tentacleLinkThirdMesh = [];

var tentacleJointThirdRotated = [];
var tentacleJointThirdParent = [];
var tentacleJointThirdMesh = [];

var tentacleLinkFourthRotated = [];
var tentacleLinkFourthParent = [];
var tentacleLinkFourthMesh = [];

for(var i = 0; i<tentacleSocketMatrixArray.length; i++){
      tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(90, 'x'),rotationMatrix(45+90*i, 'z')),transMatrix(0,0.58,0)); // double rotation and translation

      tentacleLinkFirstMesh[i] = new THREE.Mesh(tentacleLinkFirst,normalMaterial);
      tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
      tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);
      scene.add(tentacleLinkFirstMesh[i]);

      tentacleJointFirstRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.1, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleJointFirstMesh[i] = new THREE.Mesh(tentacleJointFirst,normalMaterial);
      tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
      tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);
      scene.add(tentacleJointFirstMesh[i]);

      tentacleLinkSecondRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.3, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleLinkSecondMesh[i] = new THREE.Mesh(tentacleLinkSecond,normalMaterial);
      tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]); // parent it
      tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);
      scene.add(tentacleLinkSecondMesh[i]);

      tentacleJointSecondRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.3, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleJointSecondMesh[i] = new THREE.Mesh(tentacleJointSecond,normalMaterial);
      tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
      tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);
      scene.add(tentacleJointSecondMesh[i]);

      tentacleLinkThirdRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.3, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleLinkThirdMesh[i] = new THREE.Mesh(tentacleLinkThird,normalMaterial);
      tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]); // parent it
      tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);
      scene.add(tentacleLinkThirdMesh[i]);

      tentacleJointThirdRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.3, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleJointThirdMesh[i] = new THREE.Mesh(tentacleJointThird,normalMaterial);
      tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
      tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);
      scene.add(tentacleJointThirdMesh[i]);

      tentacleLinkFourthRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,1.3, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleLinkFourthMesh[i] = new THREE.Mesh(tentacleLinkFourth,normalMaterial);
      tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]); // parent it
      tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      scene.add(tentacleLinkFourthMesh[i]);
}

function updateBody() {
  var t = clock.getElapsedTime();
   updateBodyParts(t);
  switch(channel)
  {
    case 4: // Creative
        var size = 0.7+0.3*Math.abs(Math.sin(t/4));
        octopusMatrix.value = new THREE.Matrix4().multiplyMatrices(scaleMatrix(size,size,size),
                  new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,5.8, 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  ), rotationMatrix(40*t,'y')));
        for(var i = 0; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix((i<2==0?-30:30)*Math.sin(t/1.2),'y'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90*i,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30*Math.sin(t/1.2),'z'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40*Math.sin(t/1.2),'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30*Math.sin(t/1.2),'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
  }

        break;
    case 1: // Rearing stance
       octopusMatrix.value = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,5.8, 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  ), rotationMatrix((t*20)%360,'y'));

        var octopusEye_RMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_R), rotationMatrix(-35,'x'));
        eye_R.setMatrix(octopusEye_RMatrix);
        var pupilTSRMatrix_R = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_R, pupilMatrix_R);
        var eyePupilMatrix_R = new THREE.Matrix4().multiplyMatrices(octopusEye_RMatrix, pupilTSRMatrix_R);
        pupil_R.setMatrix(eyePupilMatrix_R);

        var octopusEye_LMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_L), rotationMatrix(35,'x'));
        eye_L.setMatrix(octopusEye_LMatrix);

        var pupilTSRMatrix_L = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_L, pupilMatrix_L);
        var eyePupilMatrix_L = new THREE.Matrix4().multiplyMatrices(octopusEye_LMatrix, pupilTSRMatrix_L);
        pupil_L.setMatrix(eyePupilMatrix_L);

      for(var i = 0; i<1; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(-50,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90*i,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-50,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 1; i<2; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'x'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(0,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 2; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(-80,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90*i,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-50,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }
      break;

    case 2: // Blocking stance
      octopusMatrix.value = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,2.0, 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  ), rotationMatrix(-t*20,'y'));

        var octopusEye_RMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_R), rotationMatrix(45,'y'));
        eye_R.setMatrix(octopusEye_RMatrix);
        var pupilTSRMatrix_R = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_R, pupilMatrix_R);
        var eyePupilMatrix_R = new THREE.Matrix4().multiplyMatrices(octopusEye_RMatrix, pupilTSRMatrix_R);
        pupil_R.setMatrix(eyePupilMatrix_R);

        var octopusEye_LMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_L), rotationMatrix(-45,'y'));
        eye_L.setMatrix(octopusEye_LMatrix);

        var pupilTSRMatrix_L = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_L, pupilMatrix_L);
        var eyePupilMatrix_L = new THREE.Matrix4().multiplyMatrices(octopusEye_LMatrix, pupilTSRMatrix_L);
        pupil_L.setMatrix(eyePupilMatrix_L);

      for(var i = 0; i<1; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'x'),rotationMatrix(45+90*i,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-100,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-60,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 1; i<2; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(10,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(-40,'x'),rotationMatrix(90,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(70,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 2; i<3; i++){
         tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'x'),rotationMatrix(200,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-100,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-60,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 3; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(50,'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(-80,'x'),rotationMatrix(-180,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(70,'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40,'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30,'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }
      break;
    case 3: // Intoxicated

      octopusMatrix.value = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,3.2, 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  ), rotationMatrix(0+20*Math.sin(t/1.2),'z'));

        var octopusEye_RMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_R), rotationMatrix(-105*t,'z'));
        eye_R.setMatrix(octopusEye_RMatrix);
        var pupilTSRMatrix_R = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_R, pupilMatrix_R);
        var eyePupilMatrix_R = new THREE.Matrix4().multiplyMatrices(octopusEye_RMatrix, pupilTSRMatrix_R);
        pupil_R.setMatrix(eyePupilMatrix_R);

        var octopusEye_LMatrix = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_L), rotationMatrix(105*t,'z'));
        eye_L.setMatrix(octopusEye_LMatrix);

        var pupilTSRMatrix_L = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_L, pupilMatrix_L);
        var eyePupilMatrix_L = new THREE.Matrix4().multiplyMatrices(octopusEye_LMatrix, pupilTSRMatrix_L);
        pupil_L.setMatrix(eyePupilMatrix_L);

      for(var i = 0; i<1; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(-30+5*Math.sin(t*3),'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(85,'x'),rotationMatrix(45,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-70+10*Math.sin(t*3),'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-10+10*Math.sin(t*3),'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-70+30*Math.sin(t*3),'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
      }

      for(var i = 1; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90*i,'z')), transMatrix(0,0.4+0.28*Math.sin(t/1.2),0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30*Math.sin(t/1.2),'z'),transMatrix(0,1.3-0.2*Math.sin(t/1.2),0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(40*Math.sin(t/1.2),'z'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30*Math.sin(t/1.2),'z'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
  }
      break;

    case 0: // swim animation
    default:
        {
       octopusMatrix.value = new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,2*(Math.sin(t/1.2)+2.4), 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  )
       animateLegs(t)
     }
      break;
  }
   
}


// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();
var channel = 0;
function checkKeyboard() {
  for (var i=0; i<6; i++)
  {
    if (keyboard.pressed(i.toString()))
    {
      channel = i;
      break;
    }
  }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  updateBody();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

function animateLegs(t){ // moves legs
  for(var i = 0; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstRotated[i] = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(rotationMatrix((i<2==0?-50:50)*Math.sin(t/1.2),'z'),
                                      new THREE.Matrix4().multiplyMatrices(rotationMatrix(90,'x'),rotationMatrix(45+90*i,'z'))), transMatrix(0,0.58,0));
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleJointFirstParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleJointFirstRotated[i]);
        tentacleJointFirstMesh[i].setMatrix(tentacleJointFirstParent[i]);

        tentacleLinkSecondRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(30*Math.sin(t/1.2),'x'),transMatrix(0,1.3,0));
        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);

        tentacleJointSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkSecondParent[i],tentacleJointSecondRotated[i]);
        tentacleJointSecondMesh[i].setMatrix(tentacleJointSecondParent[i]);

        tentacleLinkThirdRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-40*Math.sin(t/1.2),'x'),transMatrix(0,1.3,0));
        tentacleLinkThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointSecondParent[i],tentacleLinkThirdRotated[i]);
        tentacleLinkThirdMesh[i].setMatrix(tentacleLinkThirdParent[i]);

        tentacleJointThirdParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkThirdParent[i],tentacleJointThirdRotated[i]);
        tentacleJointThirdMesh[i].setMatrix(tentacleJointThirdParent[i]);

        tentacleLinkFourthRotated[i] = new THREE.Matrix4().multiplyMatrices(rotationMatrix(-30*Math.sin(t/1.2),'x'),transMatrix(0,1.3,0));
        tentacleLinkFourthParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleJointThirdParent[i],tentacleLinkFourthRotated[i]);
        tentacleLinkFourthMesh[i].setMatrix(tentacleLinkFourthParent[i]);
  }
}

function updateBodyParts(t){
  // update eyes and pupils
  var octopusEye_RMatrix = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_R);
  eye_R.setMatrix(octopusEye_RMatrix);
  var pupilTSRMatrix_R = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_R, pupilMatrix_R);
  var eyePupilMatrix_R = new THREE.Matrix4().multiplyMatrices(octopusEye_RMatrix, pupilTSRMatrix_R);
  pupil_R.setMatrix(eyePupilMatrix_R);

  var octopusEye_LMatrix = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, eyeTSMatrix_L);
  eye_L.setMatrix(octopusEye_LMatrix);

  var pupilTSRMatrix_L = new THREE.Matrix4().multiplyMatrices(pupilRotMatrix_L, pupilMatrix_L);
  var eyePupilMatrix_L = new THREE.Matrix4().multiplyMatrices(octopusEye_LMatrix, pupilTSRMatrix_L);
  pupil_L.setMatrix(eyePupilMatrix_L);

  for(var i=0; i<tentacleSocketMatrixArray.length; i++){ // update socket locations
    octopusSocketMatrixArray[i] = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, tentacleSocketMatrixArray[i]);
  }
}

function rotationMatrix(angle, axis){
    var s = Math.sin(Math.PI * (angle/180.0));
    var c = Math.cos(Math.PI * (angle/180.0));

    if(axis=='z'){
      return new THREE.Matrix4().set(
                c,  -s,  0, 0.0,
                s,  c,  0,  0,
                0,  0,  1,  0,
                0.0,0.0,0.0,1.0);
    }else if(axis=='y'){
      return new THREE.Matrix4().set(
                c,   0,  -s,  0.0,
                0,   1,  0,  0,
                s,  0,  c,  0.0,
                0.0,0.0,0.0,1.0);
    }else if(axis=='x'){ 
      return new THREE.Matrix4().set(
                1,  0,  0,  0.0,
                0,  c,  -s,  0,
                0,  s,  c,  0.0,
                0.0,0.0,0.0,1.0);
    }else{
      return new THREE.Matrix4().set(
                1,  0,  0,  0.0,
                0,  1,  0,  0.0,
                0,  0,  1,  0.0,
                0.0,0.0,0.0,1.0);
    }
}

function transMatrix(x, y, z){
   return new THREE.Matrix4().set(
                1,  0,  0,  x,
                0,  1,  0,  y,
                0,  0,  1,  z,
                0.0,0.0,0.0,1.0);
}

function scaleMatrix(x, y, z){
   return new THREE.Matrix4().set(
                x,  0,  0,  1,
                0,  y,  0,  1,
                0,  0,  z,  1,
                0.0,0.0,0.0,1.0);
}

update();