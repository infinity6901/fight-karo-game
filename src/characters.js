// Character Roster & Model Definitions for Sansad Showdown (FIGHT KARO)

export const BASE_CHARACTERS = [
  {
    id: 'mitraman',
    modelId: 'modi',
    name: 'MITRAMAN',
    team: 'Team Vaada',
    portrait: './textures/card_mitraman_hi.jpg',
    modelUrl: './models/modi.glb',
    faceTexture: './textures/modi_orig.png',
    outfitStyle: 'kurta_saffron',
    primaryColor: '#ea580c',   // Saffron Kurta
    accentColor: '#f97316',
    pantsColor: '#9ca3af',     // Grey Churidar
    skinTone: '#e5c298',
    hairColor: '#ffffff',     // White beard & hair
    hairStyle: 'modi_beard',
    hasGlasses: true,
    stats: { power: 88, speed: 76, defense: 84 },
    moveNames: {
      special1: 'DEMONETIZATION PALM!',
      special2: 'SURPRISE STRIKE!',
      finisher: 'LAMBA BHASHAN COMBO!',
      sweep: 'GST SWEEP!',
      uppercut: 'VIKAS UPPERCUT!',
      grab: 'HUGPLOMACY!',
      roundhouse: 'SUNEHRE DIN ROUNDHOUSE!'
    },
    superMove: {
      id: 'chakra',
      name: 'MITRA CHAKRA',
      desc: 'Rises into the sky as a spinning chakra grows from a spark, then hurls it for 45% damage.',
      damage: 45
    },
    quotes: {
      start: 'Mitron! Swagat nahi karoge?',
      super: '56 inch Mitra Chakra blast!',
      hit: 'Virodhi saazish!',
      win: 'Vikas ho ke rahega!'
    }
  },
  {
    id: 'yatraboy',
    modelId: 'rahul',
    name: 'YATRA BOY',
    team: 'Team Yatra',
    portrait: './textures/card_yatraboy_hi.jpg',
    modelUrl: './models/rahul.glb',
    faceTexture: './textures/rahul_orig.png',
    outfitStyle: 'kurta_white',
    primaryColor: '#f8fafc',   // Crisp White Khadi
    accentColor: '#e2e8f0',
    pantsColor: '#f1f5f9',     // Loose white pyjama
    skinTone: '#e0ac69',
    hairColor: '#27272a',     // Dark salt-and-pepper
    hairStyle: 'rahul_beard',
    hasGlasses: false,
    hasSandals: true,
    stats: { power: 78, speed: 88, defense: 76 },
    moveNames: {
      special1: 'ROADSHOW UPPERCUT!',
      special2: 'LAMBI YATRA KICK!',
      finisher: 'FATAFAT COMBO!',
      sweep: 'YATRA SWEEP!',
      uppercut: 'JOSH UPPERCUT!',
      grab: 'AIKIDO FATAFAT!',
      roundhouse: 'PYAAR ROUNDHOUSE!'
    },
    superMove: {
      id: 'gold_machine',
      name: 'ALOO SE SONA',
      desc: 'Zaps the opponent into an aloo, feeds it to his machine — and out comes pure sona, for 45% damage.',
      damage: 45
    },
    quotes: {
      start: 'Chalo, yatra shuru!',
      super: '...us side se SONA niklega!',
      hit: 'Daro mat!',
      win: 'Mohabbat ki dukaan mein jeet!'
    }
  },
  {
    id: 'deedee',
    modelId: 'didi',
    name: 'DEEDEE',
    team: 'Bengal Tigers',
    portrait: './textures/card_deedee_hi.jpg',
    modelUrl: './models/didi.glb',
    faceTexture: './textures/didi_orig.png',
    outfitStyle: 'saree_bengali',
    primaryColor: '#ffffff',   // White Cotton Saree
    accentColor: '#2563eb',    // Blue border
    pantsColor: '#38bdf8',
    skinTone: '#dfaf76',
    hairColor: '#18181b',
    hairStyle: 'saree_drape',
    hasGlasses: true,
    stats: { power: 82, speed: 82, defense: 75 },
    moveNames: {
      special1: 'CHAPPAL SLAP!',
      special2: 'PADAYATRA KICK!',
      finisher: 'NON-STOP DHARNA COMBO!',
      sweep: 'MAIDAN SWEEP!',
      uppercut: 'JOSHILA UPPERCUT!',
      grab: 'CHAPPAL CHAMATKAR!',
      roundhouse: 'DHARNA ROUNDHOUSE!'
    },
    superMove: {
      id: 'khela_hobe',
      name: 'KHELA HOBE',
      desc: 'Summons a giant floating soccer ball of pure energy and volleys it across the screen!',
      damage: 44
    },
    quotes: {
      start: 'Khela hobe, khela hobe!',
      super: 'Hamba hamba ramba ramba!',
      hit: 'Eee ki hochhey?!',
      win: 'Didi bole khela finished!'
    }
  },
  {
    id: 'taruftaau',
    modelId: 'trump',
    name: 'TARIFF TAAU',
    team: 'Wall Builders',
    portrait: './textures/card_tariff_hi.jpg',
    modelUrl: './models/trump.glb',
    faceTexture: './textures/trump_orig.png',
    outfitStyle: 'suit_trump',
    primaryColor: '#0f172a',   // Navy Suit
    accentColor: '#dc2626',    // Bright Red Tie
    pantsColor: '#0f172a',
    skinTone: '#fed7aa',
    hairColor: '#fbbf24',     // Blonde Swoosh
    hairStyle: 'trump_swoosh',
    hasGlasses: false,
    stats: { power: 86, speed: 72, defense: 82 },
    moveNames: {
      special1: 'EXECUTIVE ORDER!',
      special2: 'BADA DEAL KICK!',
      finisher: 'TREMENDOUS COMBO!',
      sweep: 'DEAL SWEEP!',
      uppercut: 'MEGA TARIFF UPPERCUT!',
      grab: 'POWER HANDSHAKE!',
      roundhouse: 'DEAL OFF ROUNDHOUSE!'
    },
    superMove: {
      id: 'tariff_wall',
      name: 'THE TARIFF SLAM',
      desc: 'Constructs an impenetrable trade tariff wall and drops it directly onto the opponent!',
      damage: 46
    },
    quotes: {
      start: 'Huge match, nobody does it better!',
      super: 'You are going to pay 100% tariff!',
      hit: 'Fake news punch!',
      win: 'Total victory! You are fired!'
    }
  },
  {
    id: 'dozerdada',
    modelId: 'yogi',
    name: 'DOZER DADA',
    team: 'Action Force',
    portrait: './textures/card_dozer_hi.jpg',
    modelUrl: './models/yogi.glb',
    faceTexture: './textures/yogi_orig.png',
    outfitStyle: 'kurta_saffron',
    primaryColor: '#ea580c',   // Saffron Robe
    accentColor: '#c2410c',
    pantsColor: '#ea580c',
    skinTone: '#cb997e',
    hairColor: '#000000',
    hairStyle: 'yogi_bald',
    hasGlasses: false,
    hasTilak: true,
    stats: { power: 92, speed: 70, defense: 88 },
    moveNames: {
      special1: 'BULLDOZER PUNCH!',
      special2: 'DEMOLITION KICK!',
      finisher: 'NON-STOP DOZER COMBO!',
      sweep: 'DOZER SWEEP!',
      uppercut: 'HARD HAT UPPERCUT!',
      grab: 'PATKI PATAKH!',
      roundhouse: 'CEMENT ROUNDHOUSE!'
    },
    superMove: {
      id: 'bulldozer',
      name: 'BULLDOZER ACTION',
      desc: 'Summons a bright yellow bulldozer that scoops up the rival and demolishes their defenses!',
      damage: 50
    },
    quotes: {
      start: 'Prashasanik action shuru!',
      super: 'Bulldozer ki chadhai!',
      hit: 'Anushasanheen!',
      win: 'Encroachment removed successfully!'
    }
  },
  {
    id: 'tollman',
    modelId: 'nitin',
    name: 'TOLL MAN',
    team: 'Expressway Guild',
    portrait: './textures/card_tollman_hi.jpg',
    modelUrl: './models/nitin.glb',
    faceTexture: './textures/nitin_orig.png',
    outfitStyle: 'suit_formal',
    primaryColor: '#1e3a8a',   // Blue Blazer
    accentColor: '#3b82f6',
    pantsColor: '#1e293b',
    skinTone: '#d4a373',
    hairColor: '#1f2937',
    hairStyle: 'gadkari_hair',
    hasGlasses: false,
    stats: { power: 90, speed: 66, defense: 86 },
    moveNames: {
      special1: 'TOLL TAX UPPERCUT!',
      special2: 'FLYOVER KICK!',
      finisher: 'FULL SPEED COMBO!',
      sweep: 'SPEED BREAKER SWEEP!',
      uppercut: 'UDGHATAN UPPERCUT!',
      grab: 'TOLL TAG FLIP!',
      roundhouse: 'RING ROAD ROUNDHOUSE!'
    },
    superMove: {
      id: 'roller_slam',
      name: 'EXPRESSWAY ROLLER',
      desc: 'Summons an asphalt road roller that steamrolls forward at 120 km/h!',
      damage: 48
    },
    quotes: {
      start: 'Greenfield highway construction on!',
      super: 'Double engine speed limit crossed!',
      hit: 'Pothole encountered!',
      win: 'Fastag toll processed instantly!'
    }
  },
  {
    id: 'mbapu',
    modelId: 'mbapu',
    name: 'MBAPU',
    team: 'Ahimsa Legion',
    portrait: './textures/card_mbapu_hi.jpg',
    modelUrl: './models/mbapu.glb',
    faceTexture: './textures/mbapu_orig.png',
    outfitStyle: 'khadi_shawl',
    primaryColor: '#f8fafc',
    accentColor: '#cbd5e1',
    pantsColor: '#f8fafc',
    skinTone: '#cda882',
    hairColor: '#ffffff',
    hairStyle: 'bald_glasses',
    hasGlasses: true,
    stats: { power: 84, speed: 85, defense: 80 },
    moveNames: {
      special1: 'SHANTI PALM!',
      special2: 'FLYING MBAPU!',
      finisher: 'SHANTI TOOFAN SPIN!',
      sweep: 'ZAMEEN SWEEP!',
      uppercut: 'MBAPU UPPERCUT!',
      grab: 'GREAT PATKI!'
    },
    superMove: {
      id: 'satyagraha',
      name: 'DANDI MARCH SLAM',
      desc: 'Steps forward with moral force, creating an expanding ring of non-violent kinetic energy for 45% damage.',
      damage: 45
    },
    quotes: {
      start: 'Ahimsa paramo dharmah... par ring mein alag!',
      super: 'Satyagraha hurricane strike!',
      hit: 'Hey Ram!',
      win: 'Swaraaj achieved through non-violence!'
    }
  },
  {
    id: 'kejriwal',
    modelId: 'modi',
    name: 'MUFFLER MAN',
    team: 'Aam Sena',
    portrait: './textures/card_kejriwal_hi.jpg',
    modelUrl: './models/modi.glb',
    faceTexture: './textures/face_kejriwal.png',
    outfitStyle: 'muffler_man',
    primaryColor: '#38bdf8',   // Light blue shirt
    accentColor: '#b45309',    // Brown muffler scarf
    pantsColor: '#334155',
    skinTone: '#d99b66',
    hairColor: '#1f2937',
    hairStyle: 'kejri_hair',
    hasGlasses: true,
    hasMuffler: true,
    stats: { power: 76, speed: 86, defense: 80 },
    moveNames: {
      special1: 'MUFFLER WHIP!',
      special2: 'FREE BIJLI STRIKE!',
      finisher: 'DHARNA FATAFAT COMBO!',
      sweep: 'JHAROO SWEEP!',
      uppercut: 'AAP UPPERCUT!',
      grab: 'PRESS CONFERENCE!'
    },
    superMove: {
      id: 'dharna_storm',
      name: 'DHARNA PROTEST',
      desc: 'Spreads out a massive protest mat, calling down torrential rain of subsidy coupons!',
      damage: 44
    },
    quotes: {
      start: 'Sab mile hue hain ji!',
      super: 'Main aam aadmi hoon!',
      hit: 'Ye sab LG ki saazish hai!',
      win: 'Bijli paani free, match bhi free!'
    }
  }
];

// Custom Fighter State (editable by the user)
export let customFighter = {
  id: 'custom_sarvesh',
  modelId: 'modi',
  baseModel: 'modi',
  name: 'SARVESH WARRIOR',
  team: 'Team Agility',
  portrait: './textures/card_sarvesh_hi.jpg',
  modelUrl: './models/modi.glb',
  faceTexture: './textures/modi_orig.png',
  isCustom: true,
  outfitStyle: 'kurta_saffron',
  primaryColor: '#10b981',   // Emerald green
  accentColor: '#059669',
  pantsColor: '#ffffff',
  skinTone: '#e0ac69',
  hairColor: '#1f2937',
  hairStyle: 'modern',
  facePreset: 'warrior',
  customFaceDataUrl: null,
  stats: { power: 90, speed: 86, defense: 84 },
  superMove: {
    id: 'chakra',
    name: 'QUANTUM CHAKRA',
    desc: 'Unleashes an omnidirectional kinetic shockwave that sends the rival flying!',
    damage: 48
  },
  quotes: {
    start: 'Ready to conquer the arena!',
    super: 'Unlimited power unleashed!',
    hit: 'Just a scratch!',
    win: 'Victory is absolute!'
  }
};

export function updateCustomFighter(newData) {
  customFighter = { ...customFighter, ...newData };

  // Sync modelUrl to chosen baseModel
  if (customFighter.baseModel) {
    const baseMapping = {
      modi: './models/modi.glb',
      rahul: './models/rahul.glb',
      didi: './models/didi.glb',
      trump: './models/trump.glb',
      yogi: './models/yogi.glb',
      nitin: './models/nitin.glb',
      mbapu: './models/mbapu.glb'
    };
    customFighter.modelUrl = baseMapping[customFighter.baseModel] || './models/modi.glb';
    customFighter.modelId = customFighter.baseModel;
  }

  try {
    localStorage.setItem('fightkaro_custom_fighter', JSON.stringify(customFighter));
  } catch (e) {
    console.warn('Storage failed:', e);
  }
  return customFighter;
}

export function loadSavedCustomFighter() {
  try {
    const saved = localStorage.getItem('fightkaro_custom_fighter');
    if (saved) {
      customFighter = { ...customFighter, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return customFighter;
}

export function getAllCharacters() {
  return [...BASE_CHARACTERS, customFighter];
}

export function getCharacterById(id) {
  if (id === customFighter.id) return customFighter;
  return BASE_CHARACTERS.find(c => c.id === id) || BASE_CHARACTERS[0];
}
