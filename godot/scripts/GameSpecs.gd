extends Node

# Preset Max Populations
const MAX_POPULATION = {
	"earth": 2000000,
	"luna": 50000,
	"mars": 250000,
	"venus": 120000,
	"mercury": 35000,
	"jupiter": 150000,
	"saturn": 80000,
	"uranus": 40000,
	"neptune": 20000,
	"pluto": 5000
}

# Baseline weapon constants
const WEAPON_SPECS = {
	"laser": { "dmg": 40, "cd": 0.4, "rng": 250, "cost": 200, "energy": 5 },
	"plasma": { "dmg": 3500, "cd": 5.0, "rng": 450, "cost": 5000, "energy": 8 },
	"emp": { "dmg": 480, "cd": 3.0, "rng": 400, "cost": 1000, "energy": 7 },
	"cluster": { "dmg": 35000, "cd": 8.0, "rng": 550, "cost": 120000, "energy": 10 },
	"gravity": { "dmg": 20000, "cd": 6.0, "rng": 500, "cost": 25000, "energy": 9 },
	"antimatter": { "dmg": 600000, "cd": 8.0, "rng": 1200, "cost": 600000, "energy": 15 }
}

# Milestone multiplier calculator
func get_milestone_multiplier(lvl: int) -> float:
	var m10 = float(int(lvl / 10))
	var m50 = float(int(lvl / 50))
	var m100 = float(int(lvl / 100))
	return pow(1.5, m10) * pow(2.0, m50) * pow(3.0, m100)

# Weapon spec calculators
func get_scaled_dmg(type: String, lvl: int) -> int:
	if not WEAPON_SPECS.has(type): return 0
	var base = WEAPON_SPECS[type].dmg
	var mult = get_milestone_multiplier(lvl)
	return int(round(base * (1.0 + (lvl - 1) * 0.15) * mult))

func get_scaled_cd(type: String, lvl: int) -> float:
	if not WEAPON_SPECS.has(type): return 0.1
	var base = WEAPON_SPECS[type].cd
	return max(0.1, base * pow(0.95, lvl - 1))

func get_scaled_range(type: String, lvl: int) -> int:
	if not WEAPON_SPECS.has(type): return 0
	var base = WEAPON_SPECS[type].rng
	return int(base * (1.0 + (lvl - 1) * 0.05))

# Factory income formula
func get_factory_income(lvl: int) -> int:
	if lvl <= 0: return 0
	return int(round(15.0 * pow(1.3, lvl - 1)))

# Chronos upgrade cost formula
func get_chronos_upgrade_cost(lvl: int) -> int:
	return int(5 * pow(3, lvl))
