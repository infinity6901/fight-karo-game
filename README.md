# FIGHT KARO - Sansad Showdown (Custom Fighter Edition)

A 3D browser-based satirical fighting game inspired by **FightKaro.com ("Sansad Showdown")**, built with **Three.js** and WebGL.

---

## 🥊 Features

1. **3D Sansad Colonnade Arena**:
   - Iconic circular Parliament pillars and warm sunset atmosphere.
   - Beautiful concentric floral Rangoli battle mat.
   - Desi roadside chai stall with giant brass kettle and canopy.
   - Animated security commandos and crowd bystanders who cheer when combos or supers are unleashed.

2. **Articulated 3D Fighters with Caricature Face Mapping**:
   - **MITRAMAN**: Saffron Kurta & Shawl. Signature Super: *Mitra Chakra* (Levitates into the sky with a spinning energy chakra).
   - **YATRA BOY**: White Khadi Kurta. Signature Super: *Aloo Se Sona* (Summons the mystery transformer machine that zaps the opponent into pure gold).
   - **DEEDEE**: Bengal Storm. Signature Super: *Khela Hobe* (Giant energy soccer ball cannonball).
   - **TOLL MAN**: High-Speed Minister. Signature Super: *Expressway Roller* (Asphalt steamroller at 120 km/h).
   - **TARUF TAAU**: Navy Suit & Blonde Toupee. Signature Super: *The Tariff Slam* (Massive trade tariff wall).
   - **DOZER BABA**: Saffron Robe. Signature Super: *Bulldozer Action* (Heavy demolition).

3. **🎨 Custom Character Builder ("Build Your Own Fighter")**:
   - Custom Fighter Name, Faction, and Title.
   - **Face Photo Upload**: Upload any photo or caricature image, automatically mapped onto the 3D fighter's head!
   - Built-in caricature face presets (Warrior, Techie, Leader, Karateka).
   - Custom Outfit Styles: Traditional Kurta, Power Suit, Street Tracksuit, Martial Arts Gi.
   - Custom Colors: Primary outfit color, pants color, skin tone.
   - Custom Signature Super Move: Quantum Chakra, Gold Forge Machine, Thunder Storm, Mega Slam.
   - Custom Dialogue Quotes: Battle cry, Super move shout, and Victory line.
   - Live 3D character rotation preview right inside the builder modal!

4. **Arcade Fighting Mechanics & Combos**:
   - **Movements**: Walk forward/backward, Jump, Crouch, Block, Dash.
   - **Attacks**: Light Punch (`J`), Heavy Punch (`→ + J`), Low Jab (`↓ + J`), Light Kick (`K`), Low Sweep (`↓ + K` - trips opponent), Uppercut (`↓→ + J`).
   - **Combos**: Multi-hit strings with combo counter UI (`2 HITS`, `3 HITS!`, `COMBO!`) and damage scaling.
   - **Shakti (Super) Gauge**: Charges on landing and taking hits. At 100%, triggers signature Super Move (`Space` or `L`) with custom cinematic props, camera zoom, and massive damage.
   - **Guard Mitigation**: Holding back reduces damage by 80% with metallic shield clinks.

5. **Satirical TV Broadcast & News Layer**:
   - **Live Breaking News Ticker**: Real-time rolling ticker with contextual satire headlines that react to combat moves and combos.
   - **Mini "TV Debate" Studio**: Picture-in-picture box featuring shouting caricature debaters (*Shor Sharma* vs *Tweety Trollwala*) whose heads bob and shout when strikes connect!
   - **Floating Speech Bubbles**: Character quotes and taunts float upwards above fighters during battle.

6. **Audio Engine (Web Audio API)**:
   - Procedural synth sound effects (whooshes, heavy hit impact thuds, block clangs, super charging sirens, sub-bass drops).
   - Dynamic 80s arcade battle synth & Indian Dhol rhythm background music (toggle with `M` or top-right button).

---

## 🎮 Controls

### Player 1:
- **Move Left / Right**: `A` / `D`
- **Jump**: `W`
- **Crouch**: `S`
- **Block**: Hold Back (away from opponent)
- **Light Punch**: `J`
- **Heavy Punch**: Forward + `J` (`D + J` or `A + J`)
- **Light Kick**: `K`
- **Low Sweep (Trip)**: `S + K` (Crouch + Kick)
- **Uppercut**: `S + D + J` (Down-Forward + Punch)
- **Signature Super Move**: `Spacebar` or `L` (When Shakti bar is 100%)

### Player 2 (Local 2P Mode):
- **Move Left / Right**: `←` / `→`
- **Jump**: `↑`
- **Crouch**: `↓`
- **Punch**: `1` or `U`
- **Kick**: `2` or `I`
- **Low Sweep**: `↓ + 2`
- **Super Move**: `Enter` or `O`

### Global:
- **Pause / Help**: `Esc`
- **Toggle Music & SFX**: `M` (or click 🔊 icon in top-right)

---

## 🚀 Running the Game

### Quick Start (Dev Mode):
```bash
npm run dev
```

### Production Build & Preview:
The pre-built, production-ready bundle is located in `dist/`. You can serve it with any static web server:
```bash
npx vite preview
```
or python's built-in server:
```bash
python3 -m http.server 8080 --directory dist
```
and open `http://localhost:8080` in your web browser.
