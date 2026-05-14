export type Vector2 = { x: number; y: number };

export type Body = {
  id: number;
  position: Vector2;
  mass: number;
  radius: number;
  color: string;
};

export type Target = {
  position: Vector2;
  radius: number;
  noStartRadius: number;
};

export type Level = {
  id: number;
  name: string;
  bounds: { w: number; h: number };
  startPosition: Vector2;
  bodies: Body[];
  target: Target;
  difficulty?: number;
};

const COLORS = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#10b981',
  purple: '#8b5cf6',
  yellow: '#eab308',
  orange: '#f97316',
};

export const LEVELS: Level[] = [
  {
    "id": 1,
    "name": "Tutorial",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 650,
      "y": 840
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1260,
          "y": 840
        },
        "mass": 5000,
        "radius": 80,
        "color": COLORS.blue
      }
    ],
    "target": {
      "position": {
        "x": 2000,
        "y": 840
      },
      "radius": 60,
      "noStartRadius": 300
    },
    "difficulty": 0.66
  },
  {
    "id": 2,
    "name": "Binary System",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 650,
      "y": 840
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1260,
          "y": 640
        },
        "mass": 4000,
        "radius": 70,
        "color": COLORS.purple
      },
      {
        "id": 2,
        "position": {
          "x": 1260,
          "y": 1040
        },
        "mass": 4000,
        "radius": 70,
        "color": COLORS.purple
      }
    ],
    "target": {
      "position": {
        "x": 2000,
        "y": 840
      },
      "radius": 60,
      "noStartRadius": 300
    },
    "difficulty": 0
  },
  {
    "id": 3,
    "name": "The Wall",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 650,
      "y": 840
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1300,
          "y": 840
        },
        "mass": 12000,
        "radius": 150,
        "color": COLORS.red
      }
    ],
    "target": {
      "position": {
        "x": 2000,
        "y": 840
      },
      "radius": 60,
      "noStartRadius": 300
    },
    "difficulty": 1.06
  },
  {
    "id": 4,
    "name": "Asteroid Field",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 500,
      "y": 840
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 900,
          "y": 840
        },
        "mass": 6000,
        "radius": 80,
        "color": COLORS.red
      },
      {
        "id": 2,
        "position": {
          "x": 1300,
          "y": 600
        },
        "mass": 5000,
        "radius": 70,
        "color": COLORS.orange
      },
      {
        "id": 3,
        "position": {
          "x": 1300,
          "y": 1100
        },
        "mass": 5000,
        "radius": 70,
        "color": COLORS.yellow
      },
      {
        "id": 4,
        "position": {
          "x": 1700,
          "y": 840
        },
        "mass": 8000,
        "radius": 90,
        "color": COLORS.purple
      }
    ],
    "target": {
      "position": {
        "x": 2000,
        "y": 840
      },
      "radius": 50,
      "noStartRadius": 300
    },
    "difficulty": 1.67
  },
  {
    "id": 5,
    "name": "Slingshot Maneuver",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 600,
      "y": 1100
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1260,
          "y": 840
        },
        "mass": 28000,
        "radius": 120,
        "color": COLORS.blue
      },
      {
        "id": 2,
        "position": {
          "x": 1260,
          "y": 1150
        },
        "mass": 1000,
        "radius": 30,
        "color": COLORS.red
      }
    ],
    "target": {
      "position": {
        "x": 1900,
        "y": 1100
      },
      "radius": 40,
      "noStartRadius": 200
    },
    "difficulty": 1.43
  },
  {
    "id": 6,
    "name": "Twin Suns (Figure 8)",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 1260,
      "y": 450
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1000,
          "y": 840
        },
        "mass": 25000,
        "radius": 120,
        "color": COLORS.orange
      },
      {
        "id": 2,
        "position": {
          "x": 1520,
          "y": 840
        },
        "mass": 25000,
        "radius": 120,
        "color": COLORS.red
      },
      {
        "id": 3,
        "position": {
          "x": 1260,
          "y": 840
        },
        "mass": 0,
        "radius": 60,
        "color": "#444"
      }
    ],
    "target": {
      "position": {
        "x": 1260,
        "y": 1230
      },
      "radius": 40,
      "noStartRadius": 200
    },
    "difficulty": 6.04
  },
  {
    "id": 7,
    "name": "Wired",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 500,
      "y": 1100
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1000,
          "y": 1100
        },
        "mass": 22000,
        "radius": 70,
        "color": COLORS.green
      },
      {
        "id": 2,
        "position": {
          "x": 1400,
          "y": 1100
        },
        "mass": 22000,
        "radius": 70,
        "color": COLORS.blue
      },
      {
        "id": 3,
        "position": {
          "x": 1800,
          "y": 1100
        },
        "mass": 22000,
        "radius": 70,
        "color": COLORS.orange
      },
      {
        "id": 4,
        "position": {
          "x": 1200,
          "y": 800
        },
        "mass": 0,
        "radius": 140,
        "color": "#555"
      },
      {
        "id": 5,
        "position": {
          "x": 1600,
          "y": 1400
        },
        "mass": 0,
        "radius": 140,
        "color": "#555"
      },
      {
        "id": 6,
        "position": {
          "x": 1000,
          "y": 1350
        },
        "mass": 0,
        "radius": 50,
        "color": "#555"
      },
      {
        "id": 7,
        "position": {
          "x": 1800,
          "y": 850
        },
        "mass": 0,
        "radius": 50,
        "color": "#555"
      }
    ],
    "target": {
      "position": {
        "x": 2200,
        "y": 1100
      },
      "radius": 40,
      "noStartRadius": 300
    },
    "difficulty": 4.53
  },
  {
    "id": 8,
    "name": "Gravity Well",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 450,
      "y": 1180
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1300,
          "y": 840
        },
        "mass": 140000,
        "radius": 150,
        "color": "#111827"
      },
      {
        "id": 2,
        "position": {
          "x": 1000,
          "y": 840
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 3,
        "position": {
          "x": 1150,
          "y": 550
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 4,
        "position": {
          "x": 1500,
          "y": 550
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 5,
        "position": {
          "x": 1650,
          "y": 840
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 6,
        "position": {
          "x": 1500,
          "y": 1150
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 7,
        "position": {
          "x": 1150,
          "y": 1150
        },
        "mass": 15000,
        "radius": 40,
        "color": COLORS.red
      },
      {
        "id": 8,
        "position": {
          "x": 800,
          "y": 1050
        },
        "mass": 0,
        "radius": 100,
        "color": "#555"
      },
      {
        "id": 9,
        "position": {
          "x": 1800,
          "y": 1050
        },
        "mass": 0,
        "radius": 100,
        "color": "#555"
      },
      {
        "id": 10,
        "position": {
          "x": 1300,
          "y": 350
        },
        "mass": 0,
        "radius": 100,
        "color": "#555"
      }
    ],
    "target": {
      "position": {
        "x": 1900,
        "y": 840
      },
      "radius": 30,
      "noStartRadius": 200
    },
    "difficulty": 2.83
  },
  {
    "id": 9,
    "name": "The Gauntlet",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 450,
      "y": 840
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 800,
          "y": 700
        },
        "mass": 8000,
        "radius": 60,
        "color": COLORS.purple
      },
      {
        "id": 2,
        "position": {
          "x": 800,
          "y": 980
        },
        "mass": 8000,
        "radius": 60,
        "color": COLORS.orange
      },
      {
        "id": 3,
        "position": {
          "x": 1200,
          "y": 840
        },
        "mass": 15000,
        "radius": 80,
        "color": COLORS.yellow
      },
      {
        "id": 4,
        "position": {
          "x": 1600,
          "y": 600
        },
        "mass": 8000,
        "radius": 60,
        "color": COLORS.blue
      },
      {
        "id": 5,
        "position": {
          "x": 1600,
          "y": 1080
        },
        "mass": 8000,
        "radius": 60,
        "color": COLORS.green
      },
      {
        "id": 6,
        "position": {
          "x": 1900,
          "y": 840
        },
        "mass": 0,
        "radius": 60,
        "color": "#444"
      }
    ],
    "target": {
      "position": {
        "x": 2100,
        "y": 840
      },
      "radius": 50,
      "noStartRadius": 200
    },
    "difficulty": 3.10
  },
  {
    "id": 10,
    "name": "Event Horizon",
    "bounds": {
      "w": 2520,
      "h": 1680
    },
    "startPosition": {
      "x": 1260,
      "y": 450
    },
    "bodies": [
      {
        "id": 1,
        "position": {
          "x": 1260,
          "y": 900
        },
        "mass": 55000,
        "radius": 120,
        "color": "#111827"
      },
      {
        "id": 2,
        "position": {
          "x": 1260,
          "y": 650
        },
        "mass": 0,
        "radius": 60,
        "color": "#444"
      },
      {
        "id": 3,
        "position": {
          "x": 800,
          "y": 900
        },
        "mass": 20000,
        "radius": 60,
        "color": COLORS.red
      },
      {
        "id": 4,
        "position": {
          "x": 1720,
          "y": 900
        },
        "mass": 20000,
        "radius": 60,
        "color": COLORS.red
      },
      {
        "id": 5,
        "position": {
          "x": 1060,
          "y": 1150
        },
        "mass": 0,
        "radius": 60,
        "color": "#444"
      },
      {
        "id": 6,
        "position": {
          "x": 1460,
          "y": 1150
        },
        "mass": 0,
        "radius": 60,
        "color": "#444"
      }
    ],
    "target": {
      "position": {
        "x": 1260,
        "y": 1300
      },
      "radius": 40,
      "noStartRadius": 300
    },
    "difficulty": 3.86
  }
];
