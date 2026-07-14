extends Node

func _ready():
	print("==================================================")
	print("🤖 STARTING GODOT PORT VALIDATION TESTS")
	print("==================================================")
	
	# Stop the automatic engine process frames, so manual tick calling works deterministically
	GameState.set_process(false)
	GameState.is_paused = false
	
	run_all_tests()
	
	print("==================================================")
	print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
	print("==================================================")
	get_tree().quit(0)

func run_all_tests():
	test_population_logistic_growth()
	test_population_decay()
	test_factory_income()
	test_tax_revenue_and_credits()
	test_overload_energy_charging()
	test_load_shedding_sequential_offline()
	test_kinetic_intercept_chance()
	test_kinetic_intercept_failure()
	test_milestone_multipliers()
	test_weapon_upgrade_scaling()
	test_rebirth_tp_earned()
	test_chronos_upgrade_pricing()

# Assertion Helpers
func assert_true(cond: bool, msg: String):
	if not cond:
		push_error("❌ Assertion Failed: " + msg)
		assert(false, msg)

func assert_close(val: float, expected: float, epsilon: float, msg: String):
	if abs(val - expected) > epsilon:
		var err_msg = "❌ Assertion Failed: %s. Expected %f, got %f" % [msg, expected, val]
		push_error(err_msg)
		assert(false, err_msg)

# 1. Economic & Population Growth Math Tests
func test_population_logistic_growth():
	GameState.reset_game_state(true)
	
	var earth = GameState.planets.earth
	earth.unlocked = true
	earth.terraform_progress = 100.0
	earth.population = 2799900.0
	earth.infrastructure.housing = 2
	
	GameState.rebirth_skip_ticks = 0
	GameState._process(1.0)
	
	assert_close(earth.population, 2799909.7, 0.5, "Logistic population growth target match")
	assert_true(earth.population <= 2800000.0, "Population must be capped by housing limits")
	print("✅ test_population_logistic_growth passed")

func test_population_decay():
	GameState.reset_game_state(true)
	
	var earth = GameState.planets.earth
	earth.unlocked = true
	earth.terraform_progress = 50.0 # Cap = 1,000,000
	earth.population = 1500000.0
	earth.infrastructure.housing = 0
	
	GameState.rebirth_skip_ticks = 0
	GameState._process(1.0)
	
	assert_close(earth.population, 1484990.0, 1.0, "Population decay matching cap drop")
	print("✅ test_population_decay passed")

func test_factory_income():
	assert_true(GameSpecs.get_factory_income(0) == 0, "Level 0 factory makes 0 credits")
	assert_true(GameSpecs.get_factory_income(-5) == 0, "Negative level factory makes 0 credits")
	assert_true(GameSpecs.get_factory_income(1) == 15, "Level 1 factory makes 15 credits")
	assert_true(GameSpecs.get_factory_income(2) == 20, "Level 2 factory makes 20 credits")
	assert_true(GameSpecs.get_factory_income(5) == 43, "Level 5 factory makes 43 credits")
	print("✅ test_factory_income passed")

func test_tax_revenue_and_credits():
	GameState.reset_game_state(true)
	
	var earth = GameState.planets.earth
	earth.unlocked = true
	earth.population = 1000000.0
	earth.infrastructure.factory = 0
	
	GameState.credits = 1000.0
	GameState.rebirth_skip_ticks = 0
	GameState._process(0.5)
	
	assert_close(GameState.credits, 1084.131, 0.05, "Credits tax income matching 1M population")
	print("✅ test_tax_revenue_and_credits passed")

# 2. Power Grid Overload & Load Shedding Tests
func test_overload_energy_charging():
	GameState.reset_game_state(true)
	
	GameState.max_energy = 100.0
	GameState.used_energy = 20.0
	GameState.overload_energy = 80.0
	GameState.is_power_offline = false
	
	GameState.planets.earth.infrastructure.power_plant = 2 # baseProdRate = 15 + 40 = 55 TW/s
	GameState.rebirth_skip_ticks = 0
	
	# Shield consumes 5, so net power is 55 - 5 = +50
	GameState._process(1.0)
	
	assert_close(GameState.overload_energy, 130.0, 0.1, "Overload energy charging check")
	print("✅ test_overload_energy_charging passed")

func test_load_shedding_sequential_offline():
	GameState.reset_game_state(true)
	
	GameState.planets.earth.unlocked = true
	GameState.planets.earth.orbital_satellites_list.laser = 4
	GameState.planets.earth.orbital_satellites = 4
	
	GameState.overload_energy = 80.0
	GameState.is_power_offline = true
	GameState.online_satellite_count = 4
	GameState.satellite_boot_timer = 2.0
	GameState.rebirth_skip_ticks = 0
	
	# Tick 1.0s (power offline, draws 20 TW, production 15 TW -> net -5 TW/s)
	GameState._process(1.0)
	
	assert_true(GameState.overload_energy < 80.0, "Energy should decrease under overload")
	assert_true(GameState.is_power_offline, "Grid should remain offline")
	assert_true(GameState.online_satellite_count == 4, "Sats count should still be 4 within 2s timer")
	assert_close(GameState.satellite_boot_timer, 1.0, 0.1, "Timer should tick down to 1s")
	
	# Tick another 1.5s (timer exceeds and bootTimer resets)
	GameState._process(1.5)
	
	assert_true(GameState.online_satellite_count == 3, "Sat count should drop to 3 due to load shedding")
	assert_close(GameState.satellite_boot_timer, 2.0, 0.1, "Shedding timer should reset to 2.0s")
	print("✅ test_load_shedding_sequential_offline passed")

# 3. Combat Defense & Interception Tests
func test_kinetic_intercept_chance():
	GameState.reset_game_state(true)
	
	GameState.planets.earth.unlocked = true
	GameState.planets.earth.orbital_satellites = 2
	GameState.chronos_upgrades.kineticIntercept = 2
	
	var rate = GameState.get_kinetic_intercept_rate()
	assert_close(rate, 0.80, 0.01, "Kinetic intercept rate calculation matching upgrade levels")
	print("✅ test_kinetic_intercept_chance passed")

func test_kinetic_intercept_failure():
	GameState.reset_game_state(true)
	
	GameState.planets.earth.unlocked = true
	GameState.planets.earth.population = 1000000.0
	GameState.planets.earth.orbital_satellites = 0
	
	# Force kineticIntercept rate to 0.0
	GameState.chronos_upgrades.kineticIntercept = -30
	GameState.earth_hp = 100.0
	
	GameState.damage_earth(10.0, "kinetic")
	
	assert_close(GameState.earth_hp, 85.0, 0.01, "Failed intercept kinetic damage penalty (1.5x)")
	assert_close(GameState.planets.earth.population, 980000.0, 0.01, "Failed intercept population casualty (2%)")
	print("✅ test_kinetic_intercept_failure passed")

# 4. Satellite Weapon Math & Milestones Tests
func test_milestone_multipliers():
	assert_close(GameSpecs.get_milestone_multiplier(9), 1.0, 0.01, "Level 9 multiplier is 1x")
	assert_close(GameSpecs.get_milestone_multiplier(10), 1.5, 0.01, "Level 10 multiplier is 1.5x")
	assert_close(GameSpecs.get_milestone_multiplier(50), 15.1875, 0.001, "Level 50 multiplier is 15.1875x")
	print("✅ test_milestone_multipliers passed")

func test_weapon_upgrade_scaling():
	assert_true(GameSpecs.get_scaled_dmg("laser", 1) == 40, "Level 1 Laser Dmg is 40")
	assert_close(GameSpecs.get_scaled_cd("laser", 1), 0.4, 0.01, "Level 1 Laser Cd is 0.4s")
	assert_true(GameSpecs.get_scaled_range("laser", 1) == 250, "Level 1 Laser Range is 250")
	
	assert_true(GameSpecs.get_scaled_dmg("laser", 3) == 52, "Level 3 Laser Dmg is 52")
	assert_close(GameSpecs.get_scaled_cd("laser", 3), 0.361, 0.01, "Level 3 Laser Cd is 0.361s")
	assert_true(GameSpecs.get_scaled_range("laser", 3) == 275, "Level 3 Laser Range is 275")
	print("✅ test_weapon_upgrade_scaling passed")

# 5. Time Machine & Upgrade Progression Tests
func test_rebirth_tp_earned():
	GameState.reset_game_state(true)
	
	GameState.planets.earth.unlocked = true
	GameState.planets.earth.terraform_progress = 100.0
	GameState.planets.luna.unlocked = true
	GameState.planets.luna.terraform_progress = 50.0
	
	GameState.credits = 500000.0
	GameState.nanocores = 20.0
	GameState.time_particles = 0
	GameState.chronos_upgrades.rebirthBonus = 2
	
	GameState.trigger_time_loop()
	
	assert_true(GameState.time_particles == 1808, "Earned TP calculated correctly on Time Loop reset")
	print("✅ test_rebirth_tp_earned passed")

func test_chronos_upgrade_pricing():
	GameState.reset_game_state(true)
	
	GameState.time_particles = 100
	GameState.chronos_upgrades.creditGen = 0
	
	var success = GameState.buy_chronos_upgrade("creditGen")
	assert_true(success, "Lvl 0->1 upgrade should succeed")
	assert_true(GameState.chronos_upgrades.creditGen == 1, "Level should be 1")
	assert_true(GameState.time_particles == 95, "5 TP spent")
	
	success = GameState.buy_chronos_upgrade("creditGen")
	assert_true(success, "Lvl 1->2 upgrade should succeed")
	assert_true(GameState.chronos_upgrades.creditGen == 2, "Level should be 2")
	assert_true(GameState.time_particles == 80, "15 TP spent")
	
	success = GameState.buy_chronos_upgrade("creditGen")
	assert_true(success, "Lvl 2->3 upgrade should succeed")
	assert_true(GameState.chronos_upgrades.creditGen == 3, "Level should be 3")
	assert_true(GameState.time_particles == 35, "45 TP spent")
	
	success = GameState.buy_chronos_upgrade("creditGen")
	assert_true(not success, "Lvl 3->4 upgrade should fail due to lack of TP")
	assert_true(GameState.chronos_upgrades.creditGen == 3, "Level should remain 3")
	assert_true(GameState.time_particles == 35, "TP balance remains unchanged")
	print("✅ test_chronos_upgrade_pricing passed")
