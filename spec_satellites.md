# 디펜스 어스 (Defense Earth): 아군 방어 체계 및 함대 상세 스펙

이 문서는 지구 및 태양계 각 행성의 방어 체계를 구성하는 **궤도 방어 위성, 궤도 방어 기지, 쉽야드 생산 함대, 행성 실드 시스템**의 상세한 수치와 수식을 정리한 개발용 스펙 시트입니다.

---

## 1. 궤도 방어 위성 (Orbital Defense Satellites)

방어 위성은 행성 주위를 공전하며 침입하는 적선을 요격하거나 아군을 보조하는 무인 시설입니다.

### 1.1. 기본 스펙 테이블
| 키 (Type) | 위성명 (Korean Name) | 기본 건설 비용 (Credits) | 에너지 소모량 (Energy) | 무장 여부 (isWeapon) | 기본 데미지 (dmg) | 기본 쿨다운 (cd) | 기본 사거리 (range) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `laser` | 타겟팅 레이저 위성 | 200 | 5 | Yes | 120 | 3.0s | 400 |
| `plasmaLaser` | 플라즈마 레이저 위성 | 180 | 8 | Yes | 180 | 5.0s | 350 |
| `emp` | EMP 위성 | 150 | 7 | Yes | 0 | 6.0s | 300 |
| `clusterMissile` | 클러스터 미사일 위성 | 250 | 10 | Yes | 90 (x3) | 8.0s | 450 |
| `gravityBomb` | 중력 포탄 위성 | 160 | 9 | Yes | 160 | 6.0s | 280 |
| `antimatter` | 반물질 포 위성 | 400 | 15 | Yes | 400 | 15.0s | 500 |
| `sensor` | 조기 경보 센서 위성 | 150 | 8 | No | - | - | - |
| `forceShield` | 포스 실드 위성 | 250 | 12 | No | - | - | - |
| `decoy` | 디코이 위성 | 100 | 5 | No | - | - | - |
| `repairDrone` | 수리 드론 위성 | 200 | 10 | No | - | - | - |

> [!NOTE]
> - 한 행성 내에서 **공격용 위성**과 **지원/방어용 위성**은 각각 최대 **20개**씩 건설할 수 있습니다 (`MAX_SATELLITES_PER_CATEGORY = 20`).
> - `clusterMissile`은 한 번 사격 시 3방향의 투사체를 동시에 발사합니다.

### 1.2. 건설 비용 증가 공식
동일 행성에 위성을 추가로 건설할 때마다 비용이 기하급수적으로 증가합니다.
$$Cost = \lfloor BaseCost \times 1.5^{C} \rfloor$$
* $C$: 해당 행성에 이미 건설된 **모든 위성 종류의 총합** 수량 (`planet.orbitalSatellites`).

### 1.3. 위성 성능 업그레이드 및 스케일링 공식
위성은 연구와 크레딧을 통해 **데미지(damage), 공격속도(speed), 사거리(range)** 항목을 개별 업그레이드할 수 있습니다.
* **업그레이드 비용 공식** (레벨 $L$에서 $L+1$로 강화 시):
  $$UpgradeCost = \lfloor BaseCost \times L \times 1.5 \rfloor$$
  * 여기서 $BaseCost$는 해당 위성의 기본 건설 비용입니다.

* **업그레이드 적용 공식**:
  * **사거리 (Range)**:
    $$Range = Range_{base} \times (1 + (L_{range} - 1) \times 0.05)$$
  * **데미지 (Damage)**:
    $$Damage = \lfloor Damage_{base} \times (1 + (L_{damage} - 1) \times 0.15) \rfloor$$
  * **쿨다운 (Cooldown)**:
    $$Cooldown = Cooldown_{base} \times 0.95^{(L_{speed} - 1)}$$

---

## 2. 궤도 방어 기지 (Orbital Defense Stations)

궤도에 고정 설치되는 대형 요새형 구조물로, 행성당 최대 **3개**까지 건설할 수 있으며 중복 건설은 불가합니다.

| 키 (Type) | 기지명 (Korean Name) | 크레딧 비용 (Credits) | 나노코어 비용 (Nanocores) | 에너지 소모량 (Energy) | 특수 스펙 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `aegisShield` | 행성 보호막 발생기 (Aegis) | 4,000 | 10 | 25 | 행성 실드 최대 용량 $+20\%$ 버프 제공 |
| `gigaPlasma` | 기가 플라즈마포 (EMP) | 5,000 | 15 | 30 | 액티브 광역 스턴 / 쿨다운 20.0s |
| `gravityDistorter` | 중력 왜곡기 | 4,500 | 12 | 25 | 침입한 적의 비행 속도를 일괄 $25\%$ 감속 ($x0.75$) |

---

## 3. 궤도 쉽야드 생산 함대 (Orbital Shipyard & Fleet)

궤도 쉽야드에서 생산하여 실시간으로 적을 차단하는 기동 부대입니다.

### 3.1. 함선 상세 스펙 테이블
| 키 (Type) | 함선명 (Korean Name) | 크레딧 비용 | 나노코어 비용 | 생산 시간 | 최대 체력 (Max HP) | 에너지 소모 | 비행 속도 | 사거리 | 공격력 | 공격 주기 (cd) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `interceptor` | 무인 요격기 (Interceptor) | 200 | 0 | 5s | 200 | 2 | 120 | 80 | 60 | 1.5s |
| `escort` | 방어용 호위함 (Escort Frigate) | 800 | 5 | 15s | 2,500 | 5 | 80 | 120 | 100 | 2.0s |
| `destroyer` | 구축함 (Destroyer) | 3,000 | 25 | 40s | 1,500 | 15 | 50 | 160 | 350 | 5.0s |
| `cruiser` | 중순양함 (Cruiser) | 4,000 | 20 | 30s | 4,000 | 20 | 40 | 180 | 600 | 8.0s |
| `stealth` | 스텔스 암살자 (Stealth Assassin) | 2,500 | 15 | 20s | 800 | 12 | 100 | 100 | 800 | 12.0s |
| `ionBattleship` | 이온 전함 (Ion Battleship) | 8,000 | 50 | 60s | 8,000 | 40 | 30 | 250 | 1,200 | 20.0s |
| `shieldCarrier` | 실드 탱크 함 (Shield Carrier) | 3,500 | 18 | 25s | 3,000 | 15 | 70 | 130 | 0 | 3.0s |
| `repairShip` | 수리함 (Repair Ship) | 2,000 | 10 | 18s | 1,200 | 10 | 60 | 150 | 0 | 1.0s |
| `barrierShip` | 포스 배리어 함 (Barrier Ship) | 3,000 | 15 | 22s | 2,000 | 15 | 50 | 120 | 0 | 5.0s |

> [!TIP]
> - **수리함 (`repairShip`)**: 매 쿨다운(1.0초)마다 아군 함선 중 손상된 대상의 HP를 지속 회복합니다.
> - **포스 배리어 함 (`barrierShip`)**: 존재 시 아군 함대가 받는 피해량을 최대 $50\%$ 감쇄합니다 (공식: $\max(0.5, 1 - N_{barrier} \times 0.1)$).

---

## 4. 행성 실드 시스템 (Planetary Shield System)

지구를 방어하는 핵심 방어막 모듈 및 반격 시스템 스펙입니다.

### 4.1. 메인 보호막 발생기 모듈 (Shield Modules)
지구 보호막에 기본 장착할 수 있는 모듈 스펙입니다.
| 키 (Type) | 모듈명 (Korean Name) | 보호막 추가 용량 (Capacity) | 초당 재생량 (Regen) | 에너지 소모 (Energy) | 크레딧 비용 (Credits) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `basic` | 기본 포스필드 | $+500$ | $+10$ / 초 | 5 | 0 |
| `plasma` | 강화 플라즈마 실드 | $+1,500$ | $+25$ / 초 | 15 | 1,000 |
| `dual` | 이중 레이어 배리어 | $+3,000$ | $+40$ / 초 | 30 | 3,000 |
| `reflect` | 반사 에너지 실드 | $+2,000$ | $+20$ / 초 | 25 | 2,500 |
| `phase` | 위상 실드 (Phase) | $+4,000$ | $+50$ / 초 | 50 | 5,000 |
| `repair` | 나노 수리 실드 | $+1,000$ | $+15$ / 초 | 10 | 2,000 |

### 4.2. 실드 수치 최종 계산식
행성 보호막의 최대 용량은 실드 모듈의 성능, 크로노스 영구 업그레이드, 그리고 건설된 궤도 방어 기지 수에 의해 스케일링됩니다.
$$MaxShield = (BaseShield_{base} + ModuleCapacityBonus) \times (1 + UpgradeBonus + StationBonus)$$
* $BaseShield_{base} = 100$
* $UpgradeBonus = L_{shieldCap} \times 0.15$ (크로노스 영구 업그레이드)
* $StationBonus = N_{stations} \times 0.20$ (태양계 전체에 활성화된 궤도 방어 기지 수 $N_{stations}$)

### 4.3. 반격 모듈 (Counterattack Modules)
실드 피격 또는 파괴 시 특수 효과를 발휘하는 모듈입니다.
| 키 (Type) | 모듈명 (Korean Name) | 에너지 소모 (Energy) | 크레딧 비용 (Credits) | 효과 내용 |
| :--- | :--- | :---: | :---: | :--- |
| `reflector` | 실드 반사포 | 10 | 2,000 | 받은 데미지의 $30\%$를 공격자에게 반사 |
| `discharge` | 과부하 방전 | 10 | 2,000 | 실드 붕괴 직전 주변 적들에게 200 광역 데미지 |
| `electricField` | 전기장 역류 | 15 | 2,500 | 실드 활성화 중 근접한 적에게 초당 80 지속 데미지 |

---

## 5. 지상 방어 기지 (Ground Defense Bases) [폐지 예정 / 레거시 참조용]
지상 포탑 시스템은 궤도 위성 요격 시스템으로 흡수되었으나, 시뮬레이터 및 내부 상태 처리를 위해 보존된 레거시 스펙 데이터입니다.
* 기본적으로 행성당 최대 8개까지 건설 가능합니다.

| 키 (Type) | 기지명 (Korean Name) | 크레딧 비용 | 에너지 소모 | 무장 여부 | 데미지 (dmg) | 쿨다운 (cd) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `railgun` | 대함 레일건 요새 | 100 | 10 | Yes | 200 | 5.0s |
| `energyCannon` | 지대공 에너지 캐논 | 80 | 5 | Yes | 80 | 2.0s |
| `missileSilo` | 지상 요격 미사일 사일로 | 120 | 8 | Yes | 120 | 3.0s |
| `plasmaBomber` | 플라즈마 폭격기 | 250 | 12 | Yes | 250 | 7.0s |
| `electricTurret` | 전기 방출 포탑 | 150 | 10 | Yes | 150 | 4.0s |
| `sniperCannon` | 초전도 스나이퍼 캐논 | 350 | 15 | Yes | 350 | 10.0s |
| `gatling` | 속사 개틀링 포탑 | 30 | 6 | Yes | 30 | 0.4s |
| `nuclearTorpedo` | 핵 어뢰 사일로 | 800 | 25 | Yes | 800 | 30.0s |
| `forceShield` | 지상 포스필드 배리어 | 150 | 10 | No | - | - |
| `ciws` | 미사일 방어막 (CIWS) | 100 | 8 | Yes | 50 | 0.8s |
| `armor` | 강화 장갑 플레이팅 | 100 | 0 | No | - | - |
