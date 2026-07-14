extends Node

const COMMAND_FILE = "res://automation_command.json"
const RESPONSE_FILE = "res://automation_response.json"
const SCREENSHOT_FILE = "res://automation_screenshot.png"

var check_timer: float = 0.0
const CHECK_INTERVAL: float = 0.25

func _process(delta: float):
	check_timer += delta
	if check_timer >= CHECK_INTERVAL:
		check_timer = 0.0
		_check_for_commands()

func _check_for_commands():
	if not FileAccess.file_exists(COMMAND_FILE):
		return
		
	var file = FileAccess.open(COMMAND_FILE, FileAccess.READ)
	if not file:
		return
		
	var json_text = file.get_as_text()
	file.close()
	
	# Delete the command file immediately to acknowledge receipt
	DirAccess.remove_absolute(COMMAND_FILE)
	
	var json = JSON.new()
	var error = json.parse(json_text)
	if error != OK:
		_write_response({"status": "error", "message": "Failed to parse JSON: " + json.get_error_message()})
		return
		
	var cmd = json.get_data()
	if typeof(cmd) != TYPE_DICTIONARY:
		_write_response({"status": "error", "message": "Command must be a dictionary"})
		return
		
	_execute_command(cmd)

func _execute_command(cmd: Dictionary):
	var action = cmd.get("action", "")
	var main_node = get_parent() # Main node is Control
	
	if action == "click":
		var target_name = cmd.get("target", "")
		var target_btn = main_node.get_node_or_null(target_name)
		if not target_btn:
			# Try finding by name recursively
			target_btn = _find_node_by_name(main_node, target_name)
			
		if target_btn and target_btn is Button:
			# Trigger click
			target_btn.emit_signal("pressed")
			_write_response({"status": "success", "message": "Clicked " + target_name})
		else:
			_write_response({"status": "error", "message": "Target button not found or not a Button: " + target_name})
			
	elif action == "get_state":
		var state = {
			"credits": GameState.credits,
			"time_particles": GameState.time_particles,
			"nanocores": GameState.nanocores,
			"earth_hp": GameState.earth_hp,
			"earth_shield": GameState.earth_shield,
			"power_offline": GameState.is_power_offline,
			"net_power": GameState.get_production_power() - GameState.used_energy,
			"infrastructure": GameState.planets.earth.infrastructure,
			"orbital_satellites": GameState.planets.earth.orbital_satellites,
			"satellites_list": GameState.planets.earth.orbital_satellites_list
		}
		_write_response({"status": "success", "state": state})
		
	elif action == "screenshot":
		# Save viewport screenshot
		await RenderingServer.frame_post_draw
		var img = get_viewport().get_texture().get_image()
		var err = img.save_png(SCREENSHOT_FILE)
		if err == OK:
			_write_response({"status": "success", "screenshot_path": SCREENSHOT_FILE})
		else:
			_write_response({"status": "error", "message": "Failed to save screenshot, error code: " + str(err)})
			
	else:
		_write_response({"status": "error", "message": "Unknown action: " + action})

func _find_node_by_name(root: Node, node_name: String) -> Node:
	if root.name == node_name:
		return root
	for child in root.get_children():
		var found = _find_node_by_name(child, node_name)
		if found:
			return found
	return null

func _write_response(data: Dictionary):
	var file = FileAccess.open(RESPONSE_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()
