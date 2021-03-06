$.ajax({
  type: "GET",
  url: "js/three.min.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/MTLLoader.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/OrbitControls.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/JSONLoader.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/OBJMTLLoader.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/GeometryUtils.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/Stats.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/Tween.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/StereoEffect.js",
  dataType: "script",
  async: false
});

$.ajax({
  type: "GET",
  url: "js/reticulum.js",
  dataType: "script",
  async: false
});


sbVertexShader = [
  "varying vec3 vWorldPosition;",
  "void main() {",
  "  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
  "  vWorldPosition = worldPosition.xyz;",
  "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
  "}",
].join("\n");

sbFragmentShader = [
  "uniform vec3 topColor;",
  "uniform vec3 bottomColor;",
  "uniform float offset;",
  "uniform float exponent;",
  "varying vec3 vWorldPosition;",
  "void main() {",
  "  float h = normalize( vWorldPosition + offset ).y;",
  "  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 0.1 );",
  "}",
].join("\n");


//isto e um teste
var annie;

var runnerTexture = new THREE.ImageUtils.loadTexture( 'img/run.png' );
annie = new TextureAnimator( runnerTexture, 10, 1, 10, 75 ); // texture, #horiz, #vert, #total, duration.
var groundHeight;

var animationIsOver = false;

var objectGroup = new THREE.Object3D();

var tween;

var INTERSECTED;

var objectSelected = false;

var currentlySelectedObject = null;

var materialArray = [];

var clock = new THREE.Clock();

var container, isVR, vr;

var isMouseMoving = false;

var currentScene = null;

var isLoading = true;

var camera, scene, renderer;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var statsFPS = new Stats();
var statsMS = new Stats();
var statsMB = new Stats();

var seleccionado = false;

var mouseTimeout;

var controls;

var mouseState;

var sceneCentroid;

var singleGeometry = new THREE.Geometry();

var singleGeometryMaterials = [];

// scene
scene = new THREE.Scene();

THREE.DeviceOrientationControls = function ( object ) {

  var scope = this;

  var firstAlpha;
  var firstIn = false;
  var entrouOri = false;

  this.object = object;

  this.object.rotation.reorder( "YXZ" );

  this.freeze = true;

  this.deviceOrientation = {};

  this.screenOrientation = 0;

  var onDeviceOrientationChangeEvent = function ( event ) {
    scope.deviceOrientation = event;
    if(!firstIn)
    {
      firstAlpha = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 90;
      firstIn = true;
    }

    var outlineMeshObject = new THREE.Object3D();

    var childrenSize = 0;

    var mouse2 = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();

    mouse2.x = 2 * ((window.innerWidth/2) / window.innerWidth) - 1;
    mouse2.y = 1 - 2 * ((window.innerHeight/2) / window.innerHeight);

    raycaster.setFromCamera( mouse2, camera );

    var intersects = raycaster.intersectObjects( interactiveObjectGroup.children, true );

    var selectedObject = scene.getObjectByName("temporaryOutlineMesh");
    while ( selectedObject != undefined ) {
      scene.remove( scene.getObjectByName('temporaryOutlineMesh',true) );
      selectedObject = scene.getObjectByName('temporaryOutlineMesh');
    }

    for( var i = 0; i < intersects.length; i++ ) {
      var intersection = intersects[ i ],
      obj = intersects[ 0 ].object.parent;

      var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, opacity:0.2, transparent:true } );

      noneSelected = true;

      obj.traverse(function(child) {
        childrenSize = obj.children.length;
        if (child instanceof THREE.Mesh && noneSelected) {
          var outlineMesh = child.clone();
          outlineMesh.material = outlineMaterial;

          outlineMeshObject.name = "temporaryOutlineMesh";

          if(childrenSize != outlineMeshObject.children.length)
          outlineMeshObject.add( outlineMesh);

          if(childrenSize == outlineMeshObject.children.length)
          noneSelected=false;
        }
      });
      if(childrenSize == outlineMeshObject.children.length)
      scene.add(outlineMeshObject);
    }
  };

  var onScreenOrientationChangeEvent = function () {
      scope.screenOrientation = window.orientation || 0;
  };

  // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

  var setObjectQuaternion = function () {

    var zee = new THREE.Vector3( 0, 0, 1 );

    var euler = new THREE.Euler();

    var q0 = new THREE.Quaternion();

    var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

    return function ( quaternion, alpha, beta, gamma, orient ) {
      euler.set( beta, alpha, - gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us

      quaternion.setFromEuler( euler );                               // orient the device

      quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top

      quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation
    }

  }();

  this.connect = function() {

    onScreenOrientationChangeEvent(); // run once on load

    window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
    window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

    scope.freeze = false;

  };

  this.disconnect = function() {

    scope.freeze = true;

    window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
    window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

  };

  this.update = function () {

    if ( scope.freeze ) return;

    var alpha  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
    var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
    var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
    var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O

    alpha = alpha-firstAlpha;
    setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );
  };

};

scene.fog = new THREE.FogExp2( 0x000000, 0.00001 );
//scene.fog.color.setHSL( 0.6, 0, 1 );

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xdddddd);


container = document.createElement( 'div' );
document.body.appendChild( container );

container.appendChild( renderer.domElement );

var octree;

var hemiLight = new THREE.HemisphereLight( 0xf5f5dc, 0x000000, 2.0 );

hemiLight.position.set( 500, 500, -500 );
scene.add( hemiLight );

var interactiveObjectGroup = new THREE.Object3D();

//camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 5000 );

var loader = new THREE.JSONLoader();

var light = new THREE.DirectionalLight(0xffffff, 0.2);
var light2 = new THREE.DirectionalLight(0xffffff, 1);
light1 = new THREE.PointLight( 0xff0040, 2.5, 100 );


var texturaComando = THREE.ImageUtils.loadTexture( "models/VRSTAND/Replacers/Controler/TEX_DIF_Controler.jpg" );
var texturaComandoNormal = THREE.ImageUtils.loadTexture( "models/VRSTAND/Replacers/Controler/TEX_NORMAL_Controler.jpg" );

startLoadingScene();
loadGround();
loadScene();

function init() {


  statsFPS.setMode( 0 ); // 0: fps, 1: ms, 2: mb
  statsMS.setMode( 1 ); // 0: fps, 1: ms, 2: mb
  statsMB.setMode( 2 ); // 0: fps, 1: ms, 2: mb

  // align top-left
  statsFPS.domElement.style.position = 'absolute';
  statsFPS.domElement.style.left = '0px';
  statsFPS.domElement.style.top = '0px';
  // align top-left
  statsMS.domElement.style.position = 'absolute';
  statsMS.domElement.style.left = '80px';
  statsMS.domElement.style.top = '0px';
  // align top-left
  statsMB.domElement.style.position = 'absolute';
  statsMB.domElement.style.left = '160px';
  statsMB.domElement.style.top = '0px';

  document.body.appendChild( statsFPS.domElement );
  document.body.appendChild( statsMS.domElement );
  document.body.appendChild( statsMB.domElement );

  //controls.movementSpeed = 1000;
  controls.domElement = container;
  controls.enablePan = true;

  controls.minDistance = 0.01;
  controls.maxDistance = 0.03;

  var ambient = new THREE.AmbientLight( 0x101030 );

  loader = new THREE.JSONLoader();

  var position = new THREE.Vector3();



  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mouseup', onMouseUp, false);

  showMenuSelect();

  window.addEventListener( 'resize', onWindowResize, false );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000000 );

  controls = new THREE.OrbitControls( camera );

  //var selectedObject = scene.getObjectByName("Ground",true);
  camera.position.z = sceneCentroid.z-1800;
  camera.position.y = sceneCentroid.y+1500;
  camera.position.x = sceneCentroid.x+2000;

  controls.target = new THREE.Vector3(sceneCentroid.x+50, sceneCentroid.y, sceneCentroid.z+50);
  controls.minDistance = 800;
  controls.maxDistance = 3000;
  controls.minPolarAngle = -Math.PI/2; // radians
  controls.maxPolarAngle = Math.PI/2; // radians
  controls.enableDamping = true;
  controls.dampingFactor = 1.0;
  controls.noPan = true;
  currentScene = scene;

  $("#loadedScreen").fadeOut( "slow", function() {
  isLoading = false;
  });

}

function showMenuSelect(){

  // create main legenda for cinema
  var legDiv = document.createElement('div');
  legDiv.style.width = '100%';
  legDiv.style.top = "100%";
  legDiv.style.marginTop = "-80px";
  legDiv.style.height = '160px';
  legDiv.style.position = "absolute";
  legDiv.id = 'LegDiv';
  // create sub main legenda for cinema
  var legenda = document.createElement('div');
  legenda.style.width = '900px';
  legenda.style.margin = "auto";
  legenda.style.textAlign = "center";
  legenda.style.height = '200px';
  legenda.style.borderRadius = "10px";
  legenda.id = 'legenda';

  var legEsq = document.createElement('div');
  legEsq.style.width = '90px';
  legEsq.style.float = "left";
  legEsq.style.textAlign = "center";
  legEsq.style.height = '200px';
  legEsq.style.background = '#1cbb9b';
  legEsq.style.borderRadius = "10px";
  legEsq.id = 'legEsq';

  legEsq.onclick = function() {
    console.log("entrou");
    switchToVr();
  }
  legEsq.onmouseover = function() {
    legEsq.style.cursor = 'pointer';
  }

  var ptrocavr = document.createElement('p');
  ptrocavr.innerHTML = "VR";
  ptrocavr.style.color = "#FFF";
  ptrocavr.style.fontSize = "13px";
  ptrocavr.style.fontFamily = "osr";
  ptrocavr.style.marginTop = "15px";
  ptrocavr.id = "ptrocavr";

  var ptrocavrImg = document.createElement('img');
  ptrocavrImg.id = "ptrocavrImg";
  ptrocavrImg.style.marginTop = "-4px";

  legEsq.appendChild(ptrocavr);
  legEsq.appendChild(ptrocavrImg);
  legDiv.appendChild(legenda);
  legenda.appendChild(legEsq);
  document.body.appendChild(legDiv);
  document.getElementById("ptrocavrImg").src="img/VR-icon.png";

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function fullscreen() {
  if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}


function onDocumentMouseMove( e ) {

  mouseState = 0;

  clearTimeout(mouseTimeout);

  isMouseMoving = true;

  var outlineMeshObject = new THREE.Object3D();

  var childrenSize = 0;

  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();

  //mouse.x = ( event.clientX - windowHalfX ) / 2;
  //mouse.y = ( event.clientY - windowHalfY ) / 2;

  mouse.x = 2 * (event.clientX / window.innerWidth) - 1;
  mouse.y = 1 - 2 * (event.clientY / window.innerHeight);

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( interactiveObjectGroup.children, true );

  var selectedObject = scene.getObjectByName("temporaryOutlineMesh");
  while ( selectedObject != undefined ) {
    scene.remove( scene.getObjectByName('temporaryOutlineMesh',true) );
    selectedObject = scene.getObjectByName('temporaryOutlineMesh');
  }


  for( var i = 0; i < intersects.length; i++ ) {
    var intersection = intersects[ i ],
    obj = intersects[ 0 ].object.parent;

    var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, opacity:0.2, transparent:true } );

    noneSelected = true;

    obj.traverse(function(child) {
      childrenSize = obj.children.length;
      if (child instanceof THREE.Mesh && noneSelected) {
        var outlineMesh = child.clone();
        outlineMesh.material = outlineMaterial;

        outlineMeshObject.name = "temporaryOutlineMesh";

        if(childrenSize != outlineMeshObject.children.length)
        outlineMeshObject.add( outlineMesh);

        if(childrenSize == outlineMeshObject.children.length)
        noneSelected=false;
      }
    });
    if(childrenSize == outlineMeshObject.children.length)
    scene.add(outlineMeshObject);
  }

  mouseTimeout = setTimeout(function(){}, 60000);

}

// Mouse Click Event

function onMouseDown(e) {
  mouseState = 1;
}

function onMouseUp(e) {
  if(mouseState == 1){
    if(!objectSelected)
    {
      var vector = new THREE.Vector3();
      vector.set(
        2 * (event.clientX / window.innerWidth) - 1,
        - 1 - 2 * (event.clientY / window.innerHeight),
        0.5 );
        vector.unproject( camera );
        var dir = vector.sub( camera.position ).normalize();
        var distance = - camera.position.z / dir.z;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
        var intersectedOne = false;
        var intersectedObject = new THREE.Object3D();
        var mouse = new THREE.Vector2();
        var raycaster = new THREE.Raycaster();

        mouse.x = 2 * (event.clientX / window.innerWidth) - 1;
        mouse.y = 1 - 2 * (event.clientY / window.innerHeight);

        if (isVR == true){
          mouse.x = 2 * ((window.innerWidth/2) / window.innerWidth) - 1;
          mouse.y = 1 - 2 * ((window.innerHeight/2) / window.innerHeight);
          raycaster.setFromCamera( mouse, camera );
        }else{
          mouse.x = 2 * (event.clientX / window.innerWidth) - 1;
          mouse.y = 1 - 2 * (event.clientY / window.innerHeight);
          raycaster.setFromCamera( mouse, camera );
        }

        var selectMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 1, wireframe: true} );
        var intersects = raycaster.intersectObjects( interactiveObjectGroup.children, true );
        // if there is one (or more) intersections
        if ( intersects.length > 0 )
        {
          var clickedObject = intersects[ 0 ].object;
          currentlySelectedObject = clickedObject;
          bbox = getCompoundBoundingBox(clickedObject);

          var point = bbox.center();
          setupTweenIn(point.x,point.y,point.z,clickedObject);
          //tween.start();
          dist = window.innerHeight / 2 / Math.tan(Math.PI * 45 / 360);
          var iDiv = document.createElement('div');
          iDiv.style.width = '300px';
          iDiv.style.margin =  '20px';
          iDiv.style.padding = '10px';
          iDiv.style.position = "absolute";
          iDiv.style.display = 'inline-block';
          iDiv.style.background = '-webkit-gradient(linear, 0% 20%, 0% 1000%, from(#fff), to(#fff), color-stop(.1,#f3f3f3))';
          iDiv.style.border = '1px solid #ccc';
          iDiv.style.boxShadow = '0px 3px 30px rgba(0, 0, 0, 0.1) inset';
          iDiv.style.borderBottomRightRadius = '6px 50px';
          iDiv.id = 'tempID';
          iDiv.style.left = '70%';
          iDiv.style.right = '5%';
          iDiv.style.top = '30vh';
          iDiv.style.display = 'none';
          document.body.appendChild(iDiv);
          $( "#tempID" ).fadeIn(1000);
          //
          var textoBancada = " STAR WARS \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas pellentesque urna nec eros ornare, ac tristique diam porta. Donec fermentum velit eget dignissim condimentum. Sed rutrum libero sit amet enim viverra tristique. Mauris ultricies ornare arcu non adipiscing. Sed id ipsum vitae libero facilisis pulvinar id nec lacus. Ut lobortis neque et luctus mattis. Morbi nunc diam, elementum rutrum tellus non, viverra mattis diam. Vestibulum sed arcu tincidunt, auctor ligula ut, feugiat nisi. Phasellus adipiscing eros ut iaculis sagittis. Sed posuere vehicula elit vel tincidunt. Duis feugiat feugiat libero bibendum consectetur. Ut in felis non nisl egestas lacinia. Fusce interdum vitae nunc eget elementum. Quisque dignissim luctus magna et elementum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed nunc lorem, convallis consequat fermentum eget, aliquet sit amet libero.";
          var textoDestiny = " DESTINY \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas pellentesque urna nec eros ornare, ac tristique diam porta. Donec fermentum velit eget dignissim condimentum. Sed rutrum libero sit amet enim viverra tristique. Mauris ultricies ornare arcu non adipiscing. Sed id ipsum vitae libero facilisis pulvinar id nec lacus. Ut lobortis neque et luctus mattis. Morbi nunc diam, elementum rutrum tellus non, viverra mattis diam. Vestibulum sed arcu tincidunt, auctor ligula ut, feugiat nisi. Phasellus adipiscing eros ut iaculis sagittis. Sed posuere vehicula elit vel tincidunt. Duis feugiat feugiat libero bibendum consectetur. Ut in felis non nisl egestas lacinia. Fusce interdum vitae nunc eget elementum. Quisque dignissim luctus magna et elementum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed nunc lorem, convallis consequat fermentum eget, aliquet sit amet libero.";
          var textoFIFA = " COD \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas pellentesque urna nec eros ornare, ac tristique diam porta. Donec fermentum velit eget dignissim condimentum. Sed rutrum libero sit amet enim viverra tristique. Mauris ultricies ornare arcu non adipiscing. Sed id ipsum vitae libero facilisis pulvinar id nec lacus. Ut lobortis neque et luctus mattis. Morbi nunc diam, elementum rutrum tellus non, viverra mattis diam. Vestibulum sed arcu tincidunt, auctor ligula ut, feugiat nisi. Phasellus adipiscing eros ut iaculis sagittis. Sed posuere vehicula elit vel tincidunt. Duis feugiat feugiat libero bibendum consectetur. Ut in felis non nisl egestas lacinia. Fusce interdum vitae nunc eget elementum. Quisque dignissim luctus magna et elementum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed nunc lorem, convallis consequat fermentum eget, aliquet sit amet libero.";
          var textoDisney = " PSVR \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas pellentesque urna nec eros ornare, ac tristique diam porta. Donec fermentum velit eget dignissim condimentum. Sed rutrum libero sit amet enim viverra tristique. Mauris ultricies ornare arcu non adipiscing. Sed id ipsum vitae libero facilisis pulvinar id nec lacus. Ut lobortis neque et luctus mattis. Morbi nunc diam, elementum rutrum tellus non, viverra mattis diam. Vestibulum sed arcu tincidunt, auctor ligula ut, feugiat nisi. Phasellus adipiscing eros ut iaculis sagittis. Sed posuere vehicula elit vel tincidunt. Duis feugiat feugiat libero bibendum consectetur. Ut in felis non nisl egestas lacinia. Fusce interdum vitae nunc eget elementum. Quisque dignissim luctus magna et elementum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed nunc lorem, convallis consequat fermentum eget, aliquet sit amet libero.";
          if(clickedObject.name.indexOf("OBJ_SW") > -1)
          iDiv.innerHTML = textoBancada;
          else if(clickedObject.name.indexOf("OBJ_Dest") > -1)
          iDiv.innerHTML = textoDestiny;
          else if(clickedObject.name.indexOf("OBJ_COD") > -1)
          iDiv.innerHTML = textoFIFA;
          else if(clickedObject.name.indexOf("OBJ_PSVR") > -1)
          iDiv.innerHTML = textoDisney;
          else
          iDiv.innerHTML = textoBancada;
          objectSelected = true;
          document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
          var selectedObject = scene.getObjectByName("temporaryOutlineMesh");
          while ( selectedObject != undefined ) {
            scene.remove( selectedObject );
            selectedObject = scene.getObjectByName('temporaryOutlineMesh');
          }
        }
      }
      else
      {
        controls.autoRotate = false;
        $( "#tempID" ).fadeOut(1000);
        //var selectedObject = scene.getObjectByName("Ground",true);
        setupTweenOut(sceneCentroid.x,sceneCentroid.y+1500,sceneCentroid.z,selectedObject);
        controls.target = new THREE.Vector3(sceneCentroid.x+50, sceneCentroid.y, sceneCentroid.z+50);
        objectSelected = false;
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
      }
    }
}

function rendervr(dt) {
  renderVR.render(scene, camera);
}

function update(dt) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderVR.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  requestAnimationFrame(render);


  statsFPS.begin();
  statsMS.begin();
  statsMB.begin();

  controls.update(clock.getDelta()); //for cameras

  TWEEN.update();

  statsFPS.end();
  statsMS.end();
  statsMB.end();

  var time = Date.now() * 0.00025;
  var z = 20, d = 150;

  renderer.render( currentScene, camera );


  annie.update(1000 * clock.getDelta());

  if(isLoading)
  {
    cube.rotation.x -= 0.01 * 2;
    cube.rotation.y -= 0.01;
    cube.rotation.z -= 0.01 * 3;
  }


}

render();

function getCentroid ( mesh ) {

  mesh.geometry.computeBoundingBox();
  boundingBox = mesh.geometry.boundingBox;

  var x0 = boundingBox.min.x;
  var x1 = boundingBox.max.x;
  var y0 = boundingBox.min.y;
  var y1 = boundingBox.max.y;
  var z0 = boundingBox.min.z;
  var z1 = boundingBox.max.z;


  var bWidth = ( x0 > x1 ) ? x0 - x1 : x1 - x0;
  var bHeight = ( y0 > y1 ) ? y0 - y1 : y1 - y0;
  var bDepth = ( z0 > z1 ) ? z0 - z1 : z1 - z0;

  var centroidX = x0 + ( bWidth / 2 ) + mesh.position.x;
  var centroidY = y0 + ( bHeight / 2 )+ mesh.position.y;
  var centroidZ = z0 + ( bDepth / 2 ) + mesh.position.z;

  return mesh.geometry.centroid = { x : centroidX, y : centroidY, z : centroidZ };

}

function loadScene() {
  //scene.add(interactiveObjectGroup);

  pathArrayReplacers = [];
  replacersName = [];

  pathArrayJSDestiny = ['models/VRSTAND/Dest/OBJ_Dest'];

  pathArrayJSCOD = ['models/VRSTAND/COD/OBJ_COD_1','models/VRSTAND/COD/OBJ_COD_2'];

  pathArrayJSLiga = ['models/VRSTAND/Liga/OBJ_Liga','models/VRSTAND/Liga/OBJ_LIGA_TV', 'models/VRSTAND/Liga/OBJ_Liga_Coluna'];

  pathArrayJSPSVR = ['models/VRSTAND/PSVR/OBJ_PSVR','models/VRSTAND/PSVR/OBJ_PSVR_Linha'];

  pathArrayJSMix = ['models/VRSTAND/Mix/OBJ_Mix'];

  pathArrayJSPlateia =['models/VRSTAND/Plateia/OBJ_Plateia'];

  pathArrayJSSW =['models/VRSTAND/fifasw/OBJ_SW'];

  pathArrayJSGD =['models/VRSTAND/GD/OBJ_GD', 'models/VRSTAND/GD/OBJ_DetalhesGD'];

  pathArrayReplacersFIFA = ['models/VRSTAND/fifasw/PC_fifasw_Controles','models/VRSTAND/fifasw/PC_fifasw_Bancos','models/VRSTAND/fifasw/PC_fifasw_IDU'];

  pathArrayReplacersFIFAName = ['models/VRSTAND/Replacers/Controler/OBJ_REP_Controler3','models/VRSTAND/Replacers/Banco/chairsw','models/VRSTAND/Replacers/IDU/OBJ_REP_IDU'];

  pathArrayReplacersCOD = ['models/VRSTAND/COD/PC_COD_DoubleTv','models/VRSTAND/COD/PC_COD_Bancos','models/VRSTAND/COD/PC_COD_Controlers' ]

  pathArrayReplacersCODName = ['models/VRSTAND/Replacers/Double_TV/OBJ_REP_DoubleTV','models/VRSTAND/Replacers/Banco/chairsw','models/VRSTAND/Replacers/Controler/OBJ_REP_Controler3'];

  pathArrayReplacersSW = ['models/VRSTAND/fifasw/PC_SW_DoubleTv']

  pathArrayReplacersSWName = ['models/VRSTAND/Replacers/Double_TV/OBJ_REP_DoubleTV'];

  pathArrayReplacersPSVR = ['models/VRSTAND/PSVR/PC_PSVR_Pinos','models/VRSTAND/PSVR/PC_PSVR_Mesas','models/VRSTAND/PSVR/PC_PSVR_Luzes']

  pathArrayReplacersPSVRName = ['models/VRSTAND/Replacers/PSVRPino/OBJ_REP_PSVR_PINO','models/VRSTAND/Replacers/PSVRMesa/OBJ_REP_PSVR_Mesa','models/VRSTAND/Replacers/PSVRLuz/OBJ_PSVR_LUZ'];

  pathArrayReplacersLiga = ['models/VRSTAND/Liga/PC_Liga_Mesas']

  pathArrayReplacersLigaName = ['models/VRSTAND/Replacers/MesasLiga/OBJ_LIGA_MESAS'];

  pathArrayReplacersPlateia = ['models/VRSTAND/Plateia/PC_Plateia_Bancos']

  pathArrayReplacersPlateiaName = ['models/VRSTAND/Replacers/PlateiaBanco/OBJ_REP_Plateia_Bancos'];

  pathArrayReplacersGD = ['models/VRSTAND/GD/PC_GD_Truss']

  pathArrayReplacersGDName = ['models/VRSTAND/Replacers/Truss/OBJ_REP_Truss'];

  pathArrayReplacersMix = ['models/VRSTAND/Mix/PC_IDU_MIX']

  pathArrayReplacersMixName = ['models/VRSTAND/Replacers/IDU/OBJ_REP_IDU'];

  pathArrayReplacersDestiny = ['models/VRSTAND/Dest/PC_DEST_Bancos']

  pathArrayReplacersDestinyName = ['models/VRSTAND/Replacers/Banco/chairsw'];

  var destiny = new THREE.Object3D();
  for(i = 0 ; i<pathArrayJSDestiny.length ; i++)
  {
    destiny = loadObjectJSON(pathArrayJSDestiny[i],destiny);
  }

  var cod = new THREE.Object3D();

  for(i = 0 ; i<pathArrayJSCOD.length ; i++)
  {
    cod = loadObjectJSON(pathArrayJSCOD[i],cod);
  }

  var liga = new THREE.Object3D();

  for(i = 0 ; i<pathArrayJSLiga.length ; i++)
  {
    liga = loadObjectJSON(pathArrayJSLiga[i],liga);
  }

  var psvr = new THREE.Object3D();

  for(i = 0 ; i<pathArrayJSPSVR.length ; i++)
  {
    psvr = loadObjectJSON(pathArrayJSPSVR[i],psvr);
  }

  var mix = new THREE.Object3D();

  for(i = 0 ; i<pathArrayJSMix.length ; i++)
  {
    mix = loadObjectJSON(pathArrayJSMix[i],mix);
  }

  var sw = new THREE.Object3D();

  for(i = 0 ; i<pathArrayJSMix.length ; i++)
  {
    sw = loadObjectJSON(pathArrayJSSW[i],sw);
  }

  var plateia = new THREE.Object3D();

  /*for(i = 0 ; i<pathArrayJSPlateia.length ; i++)
  {
    plateia = loadObjectJSON(pathArrayJSPlateia[i],plateia);
  }*/

  var gd = new THREE.Object3D();

  /*for(i = 0 ; i<pathArrayJSGD.length ; i++)
  {
    gd = loadObjectJSON(pathArrayJSGD[i],gd);
  }*/

  for(i = 0 ; i<pathArrayReplacersFIFA.length ; i++)
  {
    sw = loadReplacersWithPointCloud(pathArrayReplacersFIFA[i],pathArrayReplacersFIFAName[i],sw);
  }

  for(i = 0 ; i<pathArrayReplacersCOD.length ; i++)
  {
    cod = loadReplacersWithPointCloud(pathArrayReplacersCOD[i],pathArrayReplacersCODName[i],cod);
  }

  for(i = 0 ; i<pathArrayReplacersSW.length ; i++)
  {
    sw = loadReplacersWithPointCloud(pathArrayReplacersSW[i],pathArrayReplacersSWName[i],sw);
  }

  for(i = 0 ; i<pathArrayReplacersLiga.length ; i++)
  {
    liga = loadReplacersWithPointCloud(pathArrayReplacersLiga[i],pathArrayReplacersLigaName[i],liga);
  }

  for(i = 0 ; i<pathArrayReplacersPSVR.length ; i++)
  {
    psvr = loadReplacersWithPointCloud(pathArrayReplacersPSVR[i],pathArrayReplacersPSVRName[i],psvr);
  }

  for(i = 0 ; i<pathArrayReplacersPlateia.length ; i++)
  {
    plateia = loadReplacersWithPointCloud(pathArrayReplacersPlateia[i],pathArrayReplacersPlateiaName[i],plateia);
  }

  for(i = 0 ; i<pathArrayReplacersGD.length ; i++)
  {
    gd = loadReplacersWithPointCloud(pathArrayReplacersGD[i],pathArrayReplacersGDName[i],gd);
  }

  for(i = 0 ; i<pathArrayReplacersMix.length ; i++)
  {
    mix = loadReplacersWithPointCloud(pathArrayReplacersMix[i],pathArrayReplacersMixName[i],mix);
  }

  for(i = 0 ; i<pathArrayReplacersDestiny.length ; i++)
  {
    destiny = loadReplacersWithPointCloud(pathArrayReplacersDestiny[i],pathArrayReplacersDestinyName[i],destiny);
  }

    interactiveObjectGroup.add(destiny);
    interactiveObjectGroup.add(cod);
    interactiveObjectGroup.add(liga);
    interactiveObjectGroup.add(psvr);
    interactiveObjectGroup.add(mix);
    interactiveObjectGroup.add(sw);
    interactiveObjectGroup.add(plateia);
    interactiveObjectGroup.add(gd);
    ///interactiveObjectGroup.add(fifa);
}

function loadObject(path) {
  var loaderOBJ = new THREE.OBJMTLLoader();
  loaderOBJ.load( path+'.obj', path+'.mtl', function ( object ) {
    bancada.add(object);
  }),

  // Function called when downloads progress
  function ( xhr ) {
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },
  // Function called when downloads error
  function ( xhr ) {
    console.log( 'An error happened' );
  }
}

function loadObjectJSON(path,objectGroup) {
  loaderJSON = new THREE.JSONLoader();

  loaderJSON.load( path+".js", function( geometry, materials ) {


    if(path.indexOf("models/VRSTAND/GD/OBJ_DetalhesGD") > -1)
    {
      for(var i = 0 ; i< materials.length ; i++)
      {
        if(materials[i].name == "Material__1960")
        {
          materials[i].side = THREE.BackSide;
        }
      }
    }

    var mesh = new THREE.Mesh(geometry,new THREE.MeshFaceMaterial(materials));

    mesh.name = path;
    objectGroup.name = path+"-Name";

    if (materials[0].type == "MultiMaterial")
        singleGeometryMaterials[mesh.id] = materials[0].materials[0];
    else
        singleGeometryMaterials[mesh.id] = materials[0];

    singleGeometry.merge(mesh.geometry,mesh.matrix,mesh.id);

  },// Function called when downloads progress
  function ( xhr ) {
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },
  // Function called when downloads error
  function ( xhr ) {
    console.log( 'An error happened' );
  });

  return objectGroup;
}

function loadGround() {

  var groundGeo = new THREE.PlaneGeometry( 100000, 100000 );

  var groundMat = new THREE.MeshBasicMaterial( { color: 0x000000} );
  groundMat.color.set(0xaeadb8);

  var ground = new THREE.Mesh( groundGeo, groundMat );
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -33;

  ground.updateMatrix();

  singleGeometryMaterials.push(groundMat);

  singleGeometry.merge(ground.geometry, ground.matrix,0);

  loader = new THREE.JSONLoader();
  loader.load( "models/VRSTAND/Fundo/Fundo.js", function( geometry,materials ) {

    singleGeometryMaterials.push(materials[0]);

    var fundo = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
    fundo.name = "Fundo";

    singleGeometry.merge(fundo.geometry, fundo.matrix,1);
  });

  loader = new THREE.JSONLoader();
  loader.load( "models/VRSTAND/Ground/OBJ_Ground.js", function( geometry,materials ) {

    singleGeometryMaterials.push(materials[0]);

    var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
    mesh.name = "Ground";

    singleGeometry.merge(mesh.geometry, mesh.matrix,2);

    groundHeight = mesh.position.y;
    ground.position.y = groundHeight-30;

    getCentroid(mesh);

    sceneCentroid = mesh.geometry.centroid;

    var centroid = new THREE.Vector3();
    mesh.geometry.computeBoundingBox();
    centroid.addVectors( mesh.geometry.boundingBox.min, mesh.geometry.boundingBox.max );
    centroid.multiplyScalar( - 0.5 );
    centroid.applyMatrix4( mesh.matrixWorld );

    var spotTarget = new THREE.Object3D();
    spotTarget.position.x = centroid.x;
    spotTarget.position.y = centroid.y;
    spotTarget.position.z = centroid.z;

    var delta = 50;

    var dirLight = new THREE.DirectionalLight(0xffffff, 1);

    dirLight.position.set(-100, 500, -500);
    dirLight.target.position.set( 300, 40, -500 );
    dirLight.target.updateMatrixWorld();

    scene.add(dirLight);

    var light = new THREE.Color( 0xffffff );
    var shadow  = new THREE.Color( 0x303050 );

    var value = 1 - Math.random() * Math.random();
    var baseColor = new THREE.Color().setRGB( value + Math.random() * 0.1, value, value + Math.random() * 0.1 );

    // set topColor/bottom vertexColors as adjustement of baseColor
    var topColor  = baseColor.clone().multiply( light );
    var bottomColor = baseColor.clone().multiply( shadow );

    var iSBrsize = 10000;
    var uniforms = {
      topColor: {type: "c", value: new THREE.Color(0x0077ff)}, bottomColor: {type: "c", value: new THREE.Color(0xffffff)},
      offset: {type: "f", value: iSBrsize}, exponent: {type: "f", value: 1.5}
    }
    var skyGeo = new THREE.SphereGeometry(iSBrsize, 32, 32);
    skyMat = new THREE.ShaderMaterial({vertexShader: sbVertexShader, fragmentShader: sbFragmentShader, uniforms: uniforms, side: THREE.DoubleSide, fog: false});
    skyMesh = new THREE.Mesh(skyGeo, skyMat);

    singleGeometryMaterials.push(skyMat);

    singleGeometry.merge(skyMesh.geometry,skyMesh.matrix,3);

  });
}

function loadReplacersWithPointCloud(pointCloudPath,replacerPath,objectGroup) {
  loaderJSON = new THREE.JSONLoader();

  var meshPointCloud = [];
  var normalsArrayPointCloud = [];
  var normalVector = new THREE.Vector3(0,0,0);

  loaderJSON.load( pointCloudPath+".js", function( geometry, material, normals ) {

    meshPointCloud = new THREE.Mesh( geometry, material );

    for(i=0 ; i<normals.length ; i+=3)
    {
      normalVector = new THREE.Vector3(normals[i], normals[i+1], normals[i+2]);
      normalsArrayPointCloud.push(normalVector);
    }
  } );

  light.position.x = normalVector.x;
  light.position.y = normalVector.y;
  light.position.z = normalVector.z;
  light.lookAt(normalVector);

  var meshID = [];

  var loaderOBJ = new THREE.OBJMTLLoader();
  loaderOBJ.load( replacerPath+'.obj', replacerPath+'.mtl', function ( object ) {
    object.traverse(function(child) {

      if (child instanceof THREE.Mesh) {

        if(meshID.indexOf(child.id) != 0 )
        {
          meshID.push(child.id);
        }

        for(i=0; i<meshPointCloud.geometry.vertices.length; i++){

          var vertex = meshPointCloud.geometry.vertices[i];

          if(replacerPath.indexOf("OBJ_REP_Controler3") > -1)
          {
            var normalMapMaterial = new THREE.MeshPhongMaterial( {
              color: 0xdddddd,
              specular: 0x222222,
              shininess: 35,
              map: texturaComando,
              normalMap: texturaComandoNormal,
            } );
            var newObject = new THREE.Mesh( child.geometry, normalMapMaterial );
          }
          else
          {
            var newObject = child.clone();
          }

          if(replacerPath.indexOf("OBJ_REP_Truss") > -1)
          {
            newObject.scale.set(1.05,1,1);
          }


          if(replacerPath.indexOf("DoubleTV") > -1)
          {
            if(child.material.name.indexOf("Material__1808") > -1 )
            {
              var runnerTexture = new THREE.ImageUtils.loadTexture( 'img/run.png' );
              annie = new TextureAnimator( runnerTexture, 10, 1, 10, 75 ); // texture, #horiz, #vert, #total, duration.
              child.material.map = runnerTexture;
              child.material.side = THREE.DoubleSide;
            }

          }

          var to = new THREE.Vector3( normalsArrayPointCloud[i].x,normalsArrayPointCloud[i].y,normalsArrayPointCloud[i].z );
          var from = new THREE.Vector3( 0,0,0 );
          var direction = to.clone().sub(from);
          var length = direction.length();

          var origin = new THREE.Vector3(vertex.x,vertex.y,vertex.z);

          newObject.position.x = vertex.x;
          newObject.position.y = vertex.y;
          newObject.position.z = vertex.z;
          newObject.castShadow = true;
          newObject.receiveShadow = true;

          var vAxis = new THREE.Vector3( -1,0,0 );

          var quaternion = new THREE.Quaternion().setFromUnitVectors( vAxis.normalize(),to.normalize()  );

          newObject.setRotationFromQuaternion(quaternion);

          newObject.updateMatrix();

          newObject.name = replacerPath;

          singleGeometryMaterials[child.id] = child.material;
          singleGeometry.merge(newObject.geometry,newObject.matrix,child.id);

        }
      }
    });
  });
  return objectGroup;
}

function getCompoundBoundingBox(object3D) {
  var box = new THREE.Box3();
  object3D.traverse(function (obj3D) {
    var geometry = obj3D.geometry;
    if (geometry === undefined) return;
    geometry.computeBoundingBox();
    if (box === null) {
      box = geometry.boundingBox;
    } else {
      box.union(geometry.boundingBox);
    }
  });
  return box;
}

function setupTweenIn(x,y,z,obj) {

  var variation = 0;

  if(camera.position.z > z)
  variation = 500;
  else
  variation = -500;

  var origpos = new THREE.Vector3().copy(camera.position); // original position
  var origrot = new THREE.Euler().copy(camera.rotation); // original rotation

  camera.position.set(x, y+500, z+variation);
  camera.lookAt(new THREE.Vector3(x,y,z));
  var dstrot = new THREE.Euler().copy(camera.rotation)

  // reset original position and rotation
  camera.position.set(origpos.x, origpos.y, origpos.z);
  camera.rotation.set(origrot.x, origrot.y, origrot.z);

  options = {duration: 3000};

  //
  // Tweening
  //

  // position
  new TWEEN.Tween(camera.position).to({
    x: x,
    y: y+500,
    z: z+variation
  }, options.duration).easing(TWEEN.Easing.Cubic.Out).onUpdate(function () {
    camera.lookAt(new THREE.Vector3(x,y,z));
  }).onComplete(function () {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 5.0;
    controls.target = new THREE.Vector3(x, y, z);
    animationIsOver = true;
    endOfTweenIn(x,y,z);
  }).start();

  // rotation (using slerp)
  (function () {
    var qa = camera.quaternion; // src quaternion
    var qb = new THREE.Quaternion().setFromEuler(dstrot); // dst quaternion
    var qm = new THREE.Quaternion();

    var o = {t: 0};
    new TWEEN.Tween(o).to({t: 1}, options.duration).onUpdate(function () {
      THREE.Quaternion.slerp(qa, qb, qm, o.t);
      camera.quaternion.set(qm.x, qm.y, qm.z, qm.w);
    }).start();
  }).call(this);


}

function setupTweenOut(x,y,z,obj) {
  //TWEEN.removeAll();
  initialCameraPosition = camera.position.copy;
  qm = new THREE.Quaternion(); //initiate an empty Qt to be filled by the .slerp function
  curQuaternion = camera.quaternion; //the starting point of your rotation
  var t = 0;
  var variation = 0;
  if(camera.position.z > z)
  variation = 500;
  else
  variation = -500;
  tween = new TWEEN.Tween(camera.position).to({
    x: x-1800,
    y: y+1500,
    z: z+2000
  },2000).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function () {
  }).onComplete(function () {
    animationIsOver = true;
  }).start();
}

function endOfTweenIn(x,y,z) {
  controls.autoRotate = true;
  controls.autoRotateSpeed = 5.0;
  controls.target = new THREE.Vector3(x, y, z);
}


THREE.DefaultLoadingManager.onProgress = function ( item, loaded, total ) {
  if(loaded == total) {

    mergeAllGeometry();

    // create the main selection menu
    var iDiv = document.createElement('div');
    //iDiv.innerHTML = " Cadeiras seleccionadas : ";
    iDiv.style.width = '100%';
    iDiv.style.textAlign = "center";
    iDiv.style.height = '100%';
    iDiv.style.position = "absolute";
    iDiv.style.background = '#000000';
    iDiv.id = 'loadedScreen';
    iDiv.style.top = '0';
    iDiv.style.display = "none";

    var textDiv = document.createElement('div');
    textDiv.style.color = "white";
    textDiv.innerHTML = " Welcome to 'Hawk : Bird-Eye Immersive Space', a PUSH Interactive experiment. <br> <br> <br> This product aims to be a novel way in presenting spaces. Indoors and outdoors, if you want to present to your clients a space, be it a fair, festival, town or country  "
    + " with an added dimension of interaction, probably 'Hawk' is the tool you're looking for."
    + "<br><br> Tailor-made to your needs, we can turn any space virtual and interactive. "
    +"<br><br><br><br> Click anywhere to continue";
    textDiv.style.width = '50%';
    textDiv.style.textAlign = "center";
    textDiv.style.height = '100%';
    textDiv.style.position = "absolute";
    textDiv.style.background = '#000000';
    textDiv.id = 'textScreen';
    textDiv.style.left = '24%';
    textDiv.style.top = '30%';

    iDiv.appendChild(textDiv);

    document.body.appendChild(iDiv);
    $("#loadedScreen").fadeIn("slow");
    $( "#textScreen" ).click(function() {
      fullscreen();
      init();
    });
    isLoading = false;



  }
};

THREE.DefaultLoadingManager.onLoad = function () {
  console.log('all items loaded');
};
THREE.DefaultLoadingManager.onError = function () {
  console.log('there has been an error');
};

function startLoadingScene() {
  loadingScene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10);
  camera.position.set(0, 3.5, 5);
  camera.lookAt(loadingScene.position);

  currentScene = loadingScene;

  cube = new THREE.Mesh(new THREE.CubeGeometry(2, 2, 2), new THREE.MeshNormalMaterial());


  controls = new THREE.OrbitControls( camera );

  loader = new THREE.JSONLoader();
  loader.load( "models/loading.js", function( geometry,materials ) {

    cube = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial() );

    loadingScene.add(cube);

  });

}


function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet.
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );
  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;
  // how long has the current image been displayed?
  this.currentDisplayTime = 0;
  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function( milliSec )
  {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration)
    {
      this.currentDisplayTime -= this.tileDisplayDuration;
      this.currentTile++;
      if (this.currentTile == this.numberOfTiles)
        this.currentTile = 0;
      var currentColumn = this.currentTile % this.tilesHorizontal;
      texture.offset.x = currentColumn / this.tilesHorizontal;
      var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
      texture.offset.y = currentRow / this.tilesVertical;
    }
  };
}

function mergeAllGeometry()
{
  var meshSG = new THREE.Mesh(singleGeometry, new THREE.MeshNormalMaterial());
  meshSG.name = "singleGeometryNormal";
  scene.add(meshSG);

}

function animateVr() {
  vr = requestAnimationFrame(animateVr);
  update(clock.getDelta());
  rendervr(clock.getDelta());
}

function switchToVr() {
  if (isVR==false) // if we're in cinema overview 3D change to VR view
  {
    renderVR = new THREE.StereoEffect(renderer);
    renderVR.eyeSeparation = 0.01;
    document.getElementById ('ptrocavr').innerHTML = "3D";
    document.getElementById("ptrocavrImg").src="img/icon - cadeiras 3D.png";
    isVR = true;
    controls = new THREE.DeviceOrientationControls(camera);
    controls.connect();
    animateVr();
    Reticulum.init(camera, {
        proximity: false,
        clickevents: true,
        near: null, //near factor of the raycaster (shouldn't be negative and should be smaller than the far property)
        far: null, //far factor of the raycaster (shouldn't be negative and should be larger than the near property)
        reticle: {
            visible: true,
            restPoint: 1000, //Defines the reticle's resting point when no object has been targeted
            color: 0xcc0000,
            innerRadius: 0.0001,
            outerRadius: 0.003,
            hover: {
                color: 0xcc0000,
                innerRadius: 0.02,
                outerRadius: 0.024,
                speed: 5,
                vibrate: 50 //Set to 0 or [] to disable
            }
        },
        fuse: {
            visible: true,
            duration: 2.5,
            color: 0x00fff6,
            innerRadius: 0.045,
            outerRadius: 0.06,
            vibrate: 100, //Set to 0 or [] to disable
            clickCancelFuse: false //If users clicks on targeted object fuse is canceled
        }
    });
    currentScene.add(camera);

  }
  else // change back to 3D view
  {
    document.getElementById ('ptrocavr').innerHTML = "VR";
    document.getElementById("ptrocavrImg").src="img/VR-icon.png";
    isVR = false;
    cancelAnimationFrame(vr);
    renderer.setSize( window.innerWidth, window.innerHeight );
    scene.remove(camera);
    //camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000000 );

    controls = new THREE.OrbitControls( camera );
  }
}
