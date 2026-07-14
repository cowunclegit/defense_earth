extends Control

# HUD labels & bars
@onready var credits_label = $MainLayout/TopHUD/HUDMargin/HUDContent/ResourcesBar/CreditsLabel
@onready var tp_label = $MainLayout/TopHUD/HUDMargin/HUDContent/ResourcesBar/TPLabel
@onready var nanocores_label = $MainLayout/TopHUD/HUDMargin/HUDContent/ResourcesBar/NanocoresLabel
@onready var hp_progress = $MainLayout/TopHUD/HUDMargin/HUDContent/StatusGrid/HPBar/HPProgress
@onready var shield_progress = $MainLayout/TopHUD/HUDMargin/HUDContent/StatusGrid/ShieldBar/ShieldProgress
@onready var power_label = $MainLayout/TopHUD/HUDMargin/HUDContent/StatusGrid/PowerGrid/PowerLabel

# Tab Buttons & Panels
@onready var buildings_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/TabBar/BuildingsBtn
@onready var satellites_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/TabBar/SatellitesBtn
@onready var lab_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/TabBar/LabBtn

@onready var buildings_tab = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/BuildingsTab
@onready var satellites_tab = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/SatellitesTab
@onready var lab_tab = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/LabTab

# Construction buttons
@onready var power_plant_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/BuildingsTab/PowerPlantBtn
@onready var factory_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/BuildingsTab/FactoryBtn
@onready var housing_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/BuildingsTab/HousingBtn
@onready var bunker_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/BuildingsTab/BunkerBtn

# Satellite buttons
@onready var buy_laser_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/SatellitesTab/BuyLaserBtn
@onready var buy_emp_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/SatellitesTab/BuyEmpBtn
@onready var buy_plasma_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/SatellitesTab/BuyPlasmaBtn
@onready var buy_cluster_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/SatellitesTab/BuyClusterBtn

# Lab buttons
@onready var credit_gen_upgrade_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/LabTab/CreditGenUpgradeBtn
@onready var intercept_upgrade_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/LabTab/InterceptUpgradeBtn
@onready var rebirth_btn = $MainLayout/ControlPanel/PanelMargin/PanelLayout/ContentContainer/TabMargin/LabTab/RebirthBtn

func _ready():
	# Connect GameState notifications
	GameState.connect("state_changed", Callable(self, "_on_state_changed"))
	
	# Connect Tab Switchers
	buildings_btn.connect("pressed", Callable(self, "_on_tab_pressed").bind(0))
	satellites_btn.connect("pressed", Callable(self, "_on_tab_pressed").bind(1))
	lab_btn.connect("pressed", Callable(self, "_on_tab_pressed").bind(2))
	
	# Connect Infrastructure Actions
	power_plant_btn.connect("pressed", Callable(self, "_on_infra_pressed").bind("power_plant"))
	factory_btn.connect("pressed", Callable(self, "_on_infra_pressed").bind("factory"))
	housing_btn.connect("pressed", Callable(self, "_on_infra_pressed").bind("housing"))
	bunker_btn.connect("pressed", Callable(self, "_on_infra_pressed").bind("bunker"))
	
	# Connect Satellite Actions
	buy_laser_btn.connect("pressed", Callable(self, "_on_satellite_pressed").bind("laser"))
	buy_emp_btn.connect("pressed", Callable(self, "_on_satellite_pressed").bind("emp"))
	buy_plasma_btn.connect("pressed", Callable(self, "_on_satellite_pressed").bind("plasma"))
	buy_cluster_btn.connect("pressed", Callable(self, "_on_satellite_pressed").bind("cluster"))
	
	# Connect Lab Actions
	credit_gen_upgrade_btn.connect("pressed", Callable(self, "_on_lab_pressed").bind("creditGen"))
	intercept_upgrade_btn.connect("pressed", Callable(self, "_on_lab_pressed").bind("kineticIntercept"))
	rebirth_btn.connect("pressed", Callable(GameState, "trigger_time_loop"))
	
	_on_state_changed()

# Redraw HUD and control buttons whenever state changes
func _on_state_changed():
	# 1. Update Resource values
	credits_label.text = "Credits: %d" % int(GameState.credits)
	tp_label.text = "TP: %d" % GameState.time_particles
	nanocores_label.text = "Nanocores: %d" % int(GameState.nanocores)
	
	# 2. Update Progress Bars
	hp_progress.value = GameState.earth_hp
	shield_progress.value = GameState.earth_shield
	
	# 3. Update Grid Energy display
	var net_power = GameState.max_energy - GameState.used_energy
	if GameState.is_power_offline:
		net_power = GameState.get_production_power() - GameState.get_offline_consumption()
		
	var power_sign = "+" if net_power >= 0 else ""
	var offline_text = " [OFFLINE]" if GameState.is_power_offline else ""
	power_label.text = "Grid: %s%d TW / Bat: %d TW%s" % [
		power_sign,
		int(net_power),
		int(GameState.overload_energy),
		offline_text
	]
	
	# Set red color for offline/overloaded grids
	if GameState.is_power_offline or net_power < 0:
		power_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	else:
		power_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.3))

	# 4. Update Button labels and level states
	var earth = GameState.planets.earth
	
	# Infrastructure Level and Cost
	var pp_lvl = earth.infrastructure.power_plant
	power_plant_btn.text = "Power Plant Lvl %d\nCost: %d" % [pp_lvl, int(100 * pow(2, pp_lvl))]
	
	var fact_lvl = earth.infrastructure.factory
	factory_btn.text = "Factory Lvl %d\nCost: %d" % [fact_lvl, int(100 * pow(2, fact_lvl))]
	
	var house_lvl = earth.infrastructure.housing
	housing_btn.text = "Housing Lvl %d\nCost: %d" % [house_lvl, int(100 * pow(2, house_lvl))]
	
	var bunker_lvl = earth.infrastructure.bunker
	bunker_btn.text = "Bunker Lvl %d\nCost: %d" % [bunker_lvl, int(100 * pow(2, bunker_lvl))]
	
	# Satellite counts and progressive costs
	var laser_count = earth.orbital_satellites_list.laser
	buy_laser_btn.text = "Laser Sat (%d)\nCost: %d" % [laser_count, int(GameSpecs.WEAPON_SPECS.laser.cost * pow(1.5, earth.orbital_satellites))]
	
	var emp_count = earth.orbital_satellites_list.emp
	buy_emp_btn.text = "EMP Sat (%d)\nCost: %d" % [emp_count, int(GameSpecs.WEAPON_SPECS.emp.cost * pow(1.5, earth.orbital_satellites))]
	
	var plasma_count = earth.orbital_satellites_list.plasma
	buy_plasma_btn.text = "Plasma Sat (%d)\nCost: %d" % [plasma_count, int(GameSpecs.WEAPON_SPECS.plasma.cost * pow(1.5, earth.orbital_satellites))]
	
	var cluster_count = earth.orbital_satellites_list.cluster
	buy_cluster_btn.text = "Cluster Sat (%d)\nCost: %d" % [cluster_count, int(GameSpecs.WEAPON_SPECS.cluster.cost * pow(1.5, earth.orbital_satellites))]

	# Lab Upgrade Levels and TP Cost
	var cr_lvl = GameState.chronos_upgrades.creditGen
	credit_gen_upgrade_btn.text = "Lab: Credit Gen Lvl %d\nCost: %d TP" % [cr_lvl, GameSpecs.get_chronos_upgrade_cost(cr_lvl)]
	
	var int_lvl = GameState.chronos_upgrades.kineticIntercept
	intercept_upgrade_btn.text = "Lab: Intercept Lvl %d\nCost: %d TP" % [int_lvl, GameSpecs.get_chronos_upgrade_cost(int_lvl)]

# Actions bindings
func _on_infra_pressed(type: String):
	GameState.upgrade_infrastructure("earth", type)

func _on_satellite_pressed(type: String):
	GameState.buy_satellite("earth", type)

func _on_lab_pressed(type: String):
	GameState.buy_chronos_upgrade(type)

# Tab toggle logic
func _on_tab_pressed(tab_index: int):
	# Update toggle button states
	buildings_btn.button_pressed = tab_index == 0
	satellites_btn.button_pressed = tab_index == 1
	lab_btn.button_pressed = tab_index == 2
	
	# Switch tab view visibility
	buildings_tab.visible = tab_index == 0
	satellites_tab.visible = tab_index == 1
	lab_tab.visible = tab_index == 2
