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
var floorTexture = new THREE.ImageUtils.loadTexture('images/checkerboard.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(30, 30);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = 0;
floor.rotation.x = Math.PI / 2;
scene.add(floor);



// MATERIALS
var normalMaterial = new THREE.MeshNormalMaterial();

// OCTOPUS MATERIAL
//You must change this matrix in updateBody() if you want to animate the octopus head.
var octopusMatrix = {type: 'm4', value: new THREE.Matrix4().set(
  1.0,0.0,0.0,0.0, 
  0.0,1.0,0.0,3.0, 
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
})


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
  0.0,0.0,1.0,2.4, 
  0.0,0.0,0.0,1.0
  ),
  new THREE.Matrix4().set(
 1.0,0.0,0.0,2.4, 
  0.0,1.0,0.0,-0.35, 
  0.0,0.0,1.0,-2.4, 
  0.0,0.0,0.0,1.0
  )];

var octopusSocketMatrixArray = []; // parent it 
for(var i=0; i<tentacleSocketMatrixArray.length; i++){
  octopusSocketMatrixArray[i] = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, tentacleSocketMatrixArray[i]);
}

//create tentacles and add them to the scene here (at least two cylinders per tentacle):
//Tentacle's links

var tentacleLinkFirstRotated = [];
var tentacleLinkFirstParent = [];
var tentacleLinkFirst = [];
var tentacleLinkFirstMesh = [];
  
var tentacleLinkSecondRotated = [];
var tentacleLinkSecondParent = [];
var tentacleLinkSecond = [];
var tentacleLinkSecondMesh = [];

for(var i = 0; i<tentacleSocketMatrixArray.length; i++){
     // var tentacle_01Link_01G = new THREE.CylinderGeometry(0.35,0.45,3,64);
      tentacleLinkFirst[i] = new THREE.CylinderGeometry(0.35,0.45,3,64);
      tentacleLinkFirstRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,0.0, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);// add rotation
      tentacleLinkFirstMesh[i] = new THREE.Mesh(tentacleLinkFirst[i],normalMaterial);
      tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
      tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);
      scene.add(tentacleLinkFirstMesh[i]);

      tentacleLinkSecond[i] = new THREE.CylinderGeometry(0.15,0.30,3,64);
      tentacleLinkSecondRotated[i] = new THREE.Matrix4().set(
      1.0,0.0,0.0,0.0, 
      0.0,1.0,0.0,3.0, 
      0.0,0.0,1.0,0.0, 
      0.0,0.0,0.0,1.0);
      tentacleLinkSecondMesh[i] = new THREE.Mesh(tentacleLinkSecond[i],normalMaterial);
      tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleLinkSecondRotated[i]); // parent it
      tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);
      scene.add(tentacleLinkSecondMesh[i]);
}
//APPLY DIFFERENT EFFECTS TO DIFFERNET CHANNELS

var clock = new THREE.Clock(true);
function updateBody() {
  var t = clock.getElapsedTime();
  // update everything
  updateBodyParts(t);

  switch(channel)
  {
    //add poses here:
    case 0: 

      break;

    case 1:
      
      break;

    case 2:

      break;

    //animation
    case 3:
      {
        
        //animate octopus here:
       octopusMatrix.value = new THREE.Matrix4().set(
                  1.0,0.0,0.0,0.0, 
                  0.0,1.0,0.0,2*(Math.sin(t/1.2)+2.2), 
                  0.0,0.0,1.0,0.0, 
                  0.0,0.0,0.0,1.0
                  )
     }
      break;
    default:
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

function updateBodyParts(t){
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

  for(var i=0; i<tentacleSocketMatrixArray.length; i++){
    octopusSocketMatrixArray[i] = new THREE.Matrix4().multiplyMatrices(octopusMatrix.value, tentacleSocketMatrixArray[i]);
  }
  for(var i = 0; i<tentacleSocketMatrixArray.length; i++){
        tentacleLinkFirstParent[i] = new THREE.Matrix4().multiplyMatrices(octopusSocketMatrixArray[i],tentacleLinkFirstRotated[i]);
        tentacleLinkFirstMesh[i].setMatrix(tentacleLinkFirstParent[i]);

        tentacleLinkSecondParent[i] = new THREE.Matrix4().multiplyMatrices(tentacleLinkFirstParent[i],tentacleLinkSecondRotated[i]);
        tentacleLinkSecondMesh[i].setMatrix(tentacleLinkSecondParent[i]);
  }
}

update();