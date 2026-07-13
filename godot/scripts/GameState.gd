extends Node

# Signals for UI notifications
signal state_changed

# Game State Variables
var credits: float = 1000.0
var time_particles: int = 0
var nanocores: float = 0.0
var current_wave: int = 1
var earth_hp: float = 100.0
var earth_shield: float = 100.0

# Power Grid Variables
var max_energy: float = 100.0
var used_energy: float = 0.0
var overload_energy: float = 100.0
var is_power_offline: bool = false
var online_satellite_count: int = 0
var satellite_boot_timer: float = 2.0

var rebirth_skip_ticks: int = 0
var game_speed: float = 1.0
var is_paused: bool = false

# Planets dictionary state
var planets: Dictionary = {}

# Permanent Upgrade levels
var chronos_upgrades: Dictionary = {
	"creditGen": 0,
	"kineticIntercept": 0,
	"rebirthBonus": 0
}

# Synergy Multipliers
var synergies: Dictionary = {
	"creditMultiplier": 1.0,
	"energyProductionMultiplier": 1.0,
	"shieldRegenMultiplier": 1.0,
	"timeMachineChargeSpeedMultiplier": 1.0
}

# Initialize game states
func _ready():
	reset_game_state(true)

func reset_game_state(full_reset: bool):
	credits = 1000.0
	earth_hp = 100.0
	earth_shield = 100.0
	overload_energy = 100.0
	is_power_offline = false
	online_satellite_count = 0
	satellite_boot_timer = 2.0
	
	if full_reset:
		time_particles = 0
		chronos_upgrades = {
			"creditGen": 0,
			"kineticIntercept": 0,
			"rebirthBonus": 0
		}
	
	# Rebuild planet dictionaries
	planets.clear()
	for p_id in GameSpecs.MAX_POPULATION.keys():
		planets[p_id] = {
			"unlocked": p_id == "earth",
			"terraform_progress": 100.0 if p_id == "earth" else 0.0,
			"population": 1000000.0 if p_id == "earth" else 0.0,
			"infrastructure": {
				"housing": 0,
				"factory": 0,
				"power_plant": 0,
				"bunker": 0
			},
			"orbital_satellites": 0,
			"orbital_satellites_list": {
				"laser": 0,
				"plasma": 0,
				"emp": 0,
				"cluster": 0,
				"gravity": 0,
				"antimatter": 0
			},
			"weapon_upgrades": {
				"laser": { "dmg": 1, "spd": 1, "rng": 1 },
				"plasma": { "dmg": 1, "spd": 1, "rng": 1 },
				"emp": { "dmg": 1, "spd": 1, "rng": 1 },
				"cluster": { "dmg": 1, "spd": 1, "rng": 1 },
				"gravity": { "dmg": 1, "spd": 1, "rng": 1 },
				"antimatter": { "dmg": 1, "spd": 1, "rng": 1 }
			}
		}
	
	recalculate_synergies()
	recalculate_energy_limits()
	emit_signal("state_changed")

# Autoload Game Loop ticking (standard _process)
func _process(delta: float):
	if is_paused:
		return
		
	var actual_delta = delta * game_speed
	
	if rebirth_skip_ticks > 0:
		rebirth_skip_ticks -= 1
		return
		
	# 1. Economic & Population Ticks
	var total_population: float = 0.0
	var factory_income_sum: int = 0
	var tax_bonus_sum: float = 0.0
	
	for p_id in planets.keys():
		var p = planets[p_id]
		if not p.unlocked:
			continue
			
		# Compute Max Population Capacity
		var max_pop = GameSpecs.MAX_POPULATION[p_id]
		var cap = (p.terraform_progress / 100.0 * max_pop) + (p.infrastructure.housing * 0.2 * max_pop)
		
		# Population growth / decay simulation
		if p.population < cap:
			var growth_rate = 0.005 + p.infrastructure.housing * 0.001
			var immigration = 5.0 + p.infrastructure.housing * 2.0
			var logistic_val = p.population * growth_rate * (1.0 - p.population / max(1.0, cap))
			p.population = min(cap, p.population + (logistic_val + immigration) * actual_delta)
		elif p.population > cap:
			var decay = p.population * 0.01 + 10.0
			p.population = max(cap, p.population - decay * actual_delta)
			
		total_population += p.population
		factory_income_sum += GameSpecs.get_factory_income(p.infrastructure.factory)
		tax_bonus_sum += p.infrastructure.factory * 0.03

	# Tax Revenue calculations
	var tax_revenue = 0.005 * pow(max(0.0, total_population), 0.75)
	var base_credit_rate = 10.0 + tax_revenue * (1.0 + tax_bonus_sum) + factory_income_sum
	
	# Apply Chronos upgrade credit bonus: e.g. 20% per level
	var chronos_credit_bonus = 1.0 + (chronos_upgrades.creditGen * 0.20)
	credits += base_credit_rate * synergies.creditMultiplier * chronos_credit_bonus * actual_delta
	
	# 2. Power Grid Tick
	recalculate_energy_limits()
	var net_power = max_energy - used_energy # For charging rates
	if is_power_offline:
		net_power = get_production_power() - get_offline_consumption()
		
	if net_power >= 0:
		overload_energy = min(max_energy, overload_energy + net_power * actual_delta)
	else:
		overload_energy = max(0.0, overload_energy + net_power * actual_delta)
		
	# Power Offline and Load Shedding triggers
	if overload_energy <= 0.0:
		if not is_power_offline:
			is_power_offline = true
			online_satellite_count = 0
			satellite_boot_timer = 2.0
	elif is_power_offline:
		if net_power < 0 and online_satellite_count > 0:
			satellite_boot_timer -= actual_delta
			if satellite_boot_timer <= 0.0:
				online_satellite_count -= 1
				satellite_boot_timer = 2.0
		elif online_satellite_count < get_total_satellites():
			satellite_boot_timer -= actual_delta
			if satellite_boot_timer <= 0.0:
				online_satellite_count += 1
				satellite_boot_timer = 2.0
				
		# Restore power when fully recharged and all satellites booted
		if online_satellite_count >= get_total_satellites() and net_power >= 0:
			is_power_offline = false
			
	if not is_power_offline:
		online_satellite_count = get_total_satellites()
		satellite_boot_timer = 2.0
		
	# Basic Shield recovery tick if online
	if not is_power_offline and earth_shield < 100.0:
		earth_shield = min(100.0, earth_shield + 5.0 * synergies.shieldRegenMultiplier * actual_delta)
		
	emit_signal("state_changed")

# Calculations helpers
func get_total_satellites() -> int:
	var count = 0
	for p in planets.values():
		if p.unlocked:
			count += p.orbital_satellites
	return count

func get_production_power() -> float:
	var base_prod_rate = 15.0
	for p in planets.values():
		if p.unlocked:
			base_prod_rate += p.infrastructure.power_plant * 20.0
	return floor(base_prod_rate * synergies.energyProductionMultiplier)

func get_offline_consumption() -> float:
	var sat_consumption = 0.0
	for p_id in planets.keys():
		var p = planets[p_id]
		if p.unlocked:
			for sat_type in p.orbital_satellites_list.keys():
				var count = p.orbital_satellites_list[sat_type]
				var spec = GameSpecs.WEAPON_SPECS[sat_type]
				sat_consumption += count * spec.energy
				
	# If offline, only active booted satellites consume power, shield is offline
	var active_limit = online_satellite_count if is_power_offline else get_total_satellites()
	var ratio = 0.0
	var total_sats = get_total_satellites()
	if total_sats > 0:
		ratio = float(active_limit) / float(total_sats)
	return sat_consumption * ratio

func recalculate_energy_limits():
	var base_energy = 100.0
	for p_id in planets.keys():
		var p = planets[p_id]
		if p.unlocked:
			if p_id != "earth":
				base_energy += (p.terraform_progress / 100.0) * 50.0
			base_energy += p.infrastructure.power_plant * 20.0
			
	max_energy = floor(base_energy * synergies.energyProductionMultiplier)
	
	# Recalculate used energy
	var shield_draw = 5.0 if not is_power_offline else 0.0
	var sat_draw = 0.0
	for p_id in planets.keys():
		var p = planets[p_id]
		if p.unlocked:
			for sat_type in p.orbital_satellites_list.keys():
				var count = p.orbital_satellites_list[sat_type]
				var spec = GameSpecs.WEAPON_SPECS[sat_type]
				sat_draw += count * spec.energy
				
	if is_power_offline:
		var active_limit = online_satellite_count
		var total_sats = get_total_satellites()
		var ratio = float(active_limit) / float(total_sats) if total_sats > 0 else 0.0
		used_energy = sat_draw * ratio
	else:
		used_energy = shield_draw + sat_draw

func recalculate_synergies():
	# Standard synergies calculations based on terraform unlocks
	var credit_mult = 1.0
	var energy_mult = 1.0
	var shield_mult = 1.0
	var tm_mult = 1.0
	
	if planets.get("luna", {}).get("terraform_progress", 0.0) >= 80.0:
		shield_mult *= 1.5
	if planets.get("mars", {}).get("terraform_progress", 0.0) >= 80.0:
		credit_mult *= 1.25
	if planets.get("venus", {}).get("terraform_progress", 0.0) >= 80.0:
		energy_mult *= 1.5
	if planets.get("jupiter", {}).get("terraform_progress", 0.0) >= 80.0:
		tm_mult *= 1.5
		
	synergies.creditMultiplier = credit_mult
	synergies.energyProductionMultiplier = energy_mult
	synergies.shieldRegenMultiplier = shield_mult
	synergies.timeMachineChargeSpeedMultiplier = tm_mult

# Actions and Mechanics
func get_kinetic_intercept_rate() -> float:
	var count = get_total_satellites()
	var upgrade_lvl = chronos_upgrades.kineticIntercept
	return min(1.0, 0.60 + upgrade_lvl * 0.02 + count * 0.08)

func damage_earth(amount: float, dmg_type: String):
	if dmg_type == "kinetic":
		# Interception check
		var r = randf()
		if r <= get_kinetic_intercept_rate():
			# Intercepted! Takes 0 damage
			return
			
		# Interception failed: takes 1.5x damage and 2% population dies
		earth_hp = max(0.0, earth_hp - amount * 1.5)
		if planets.has("earth"):
			planets.earth.population = floor(planets.earth.population * 0.98)
	else: # Energy damage
		var shield_cost = amount * 1.5
		if earth_shield >= shield_cost:
			earth_shield -= shield_cost
		else:
			var remain = shield_cost - earth_shield
			earth_shield = 0.0
			earth_hp = max(0.0, earth_hp - remain * 0.5) # mitigated by hull defense (0.5x)
			
	if earth_hp <= 0.0:
		# Auto trigger loop on death
		trigger_time_loop()
		
	emit_signal("state_changed")

# Infrastructure construction
func upgrade_infrastructure(planet_id: String, type: String) -> bool:
	if not planets.has(planet_id): return false
	var p = planets[planet_id]
	if not p.unlocked: return false
	
	var current_lvl = p.infrastructure.get(type, 0)
	var cost = 100 * pow(2, current_lvl) # Cost scale matching spec
	
	if credits >= cost:
		credits -= cost
		p.infrastructure[type] = current_lvl + 1
		recalculate_energy_limits()
		emit_signal("state_changed")
		return true
	return false

# Buy Satellite
func buy_satellite(planet_id: String, type: String) -> bool:
	if not planets.has(planet_id): return false
	if not GameSpecs.WEAPON_SPECS.has(type): return false
	
	var p = planets[planet_id]
	if not p.unlocked: return false
	
	var spec = GameSpecs.WEAPON_SPECS[type]
	var current_sats = p.orbital_satellites
	var cost = spec.cost * pow(1.5, current_sats) # Progressive global-like scaling
	
	if credits >= cost:
		credits -= cost
		p.orbital_satellites_list[type] += 1
		p.orbital_satellites += 1
		recalculate_energy_limits()
		emit_signal("state_changed")
		return true
	return false

# Permanent Lab Upgrades
func buy_chronos_upgrade(type: String) -> bool:
	if not chronos_upgrades.has(type): return false
	var current_lvl = chronos_upgrades[type]
	var cost = GameSpecs.get_chronos_upgrade_cost(current_lvl)
	
	if time_particles >= cost:
		time_particles -= cost
		chronos_upgrades[type] = current_lvl + 1
		emit_signal("state_changed")
		return true
	return false

# Rebirth / Time Loop
func trigger_time_loop():
	# Calculate earned TP
	var base_tp = credits * 0.00001 + nanocores * 0.1
	for p in planets.values():
		if p.unlocked:
			base_tp += p.terraform_progress * 10.0
			
	var bonus = 1.0 + (chronos_upgrades.rebirthBonus * 0.10)
	var pluto_bonus = 1.0
	if planets.get("pluto", {}).get("terraform_progress", 0.0) >= 80.0:
		pluto_bonus = 1.5
		
	var earned_tp = int(floor(base_tp * bonus * pluto_bonus))
	
	var prev_tp = time_particles
	var prev_upgrades = chronos_upgrades.duplicate()
	
	# Reset state
	reset_game_state(false)
	
	time_particles = prev_tp + earned_tp
	chronos_upgrades = prev_upgrades
	rebirth_skip_ticks = 3 # Replicate tick-skip mechanism
	
	emit_signal("state_changed")
