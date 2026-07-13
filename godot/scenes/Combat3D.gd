extends Node3D

@onready var planet_mesh = $PlanetMesh
@onready var shield_mesh = $PlanetMesh/ShieldMesh
@onready var satellite_pivot = $SatellitePivot
@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D

var current_planet_id: String = "earth"
var camera_orbit_speed: float = 0.005
var camera_zoom_speed: float = 0.5
var min_zoom: float = 2.0
var max_zoom: float = 12.0

var dragging: bool = false
var drag_start_pos: Vector2

func _ready():
	GameState.connect("state_changed", Callable(self, "_on_state_changed"))
	rebuild_orbitals()

func _process(delta: float):
	# 1. Rotate the planet mesh slowly
	if planet_mesh:
		planet_mesh.rotate_y(0.05 * delta)
		
	# 2. Rotate satellite orbits
	if satellite_pivot:
		satellite_pivot.rotate_y(0.2 * delta)
		
	# Adjust shield opacity based on current shield percentage
	if shield_mesh:
		var shield_mat = shield_mesh.get_active_material(0) as StandardMaterial3D
		if shield_mat:
			shield_mat.albedo_color.a = (GameState.earth_shield / 100.0) * 0.4

func _unhandled_input(event: InputEvent):
	# Camera Orbit Control (Click & Drag)
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			dragging = event.pressed
			drag_start_pos = event.position
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera.position.z = clamp(camera.position.z - camera_zoom_speed, min_zoom, max_zoom)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera.position.z = clamp(camera.position.z + camera_zoom_speed, min_zoom, max_zoom)
			
	elif event is InputEventMouseMotion and dragging:
		var diff = event.relative
		camera_pivot.rotate_y(-diff.x * camera_orbit_speed)
		camera_pivot.rotate_x(-diff.y * camera_orbit_speed)
		# Clamp pitch to prevent flipping upside down
		camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, -PI/3, PI/3)

func _on_state_changed():
	rebuild_orbitals()

# Dynamically spawn 3D placeholder meshes representing satellites
func rebuild_orbitals():
	# Clear old satellites
	for child in satellite_pivot.get_children():
		child.queue_free()
		
	if not GameState.planets.has(current_planet_id):
		return
		
	var planet_state = GameState.planets[current_planet_id]
	var list = planet_state.orbital_satellites_list
	
	var index = 0
	var total_sats = planet_state.orbital_satellites
	
	for sat_type in list.keys():
		var count = list[sat_type]
		for i in range(count):
			# Calculate orbital angle
			var angle = (float(index) / float(max(1, total_sats))) * TAU
			var radius = 2.2 if sat_type in ["laser", "plasma"] else 3.2 # Inner vs Outer orbits
			
			# Create satellite Node3D container
			var container = Node3D.new()
			satellite_pivot.add_child(container)
			
			# Position container radially
			container.position = Vector3(cos(angle) * radius, 0.0, sin(angle) * radius)
			
			# Create visible mesh
			var mesh_instance = MeshInstance3D.new()
			container.add_child(mesh_instance)
			
			# Set different visual styles/colors depending on satellite weapon type
			var sphere = BoxMesh.new()
			sphere.size = Vector3(0.18, 0.18, 0.18)
			mesh_instance.mesh = sphere
			
			var mat = StandardMaterial3D.new()
			mat.shading_mode = StandardMaterial3D.SHADING_MODE_UNSHADED
			if sat_type == "laser":
				mat.albedo_color = Color(1.0, 0.2, 0.2) # Red
			elif sat_type == "plasma":
				mat.albedo_color = Color(1.0, 0.6, 0.0) # Orange
			elif sat_type == "emp":
				mat.albedo_color = Color(0.2, 0.8, 1.0) # Light blue
			else:
				mat.albedo_color = Color(0.8, 0.2, 1.0) # Purple
				
			mesh_instance.material_override = mat
			index += 1
