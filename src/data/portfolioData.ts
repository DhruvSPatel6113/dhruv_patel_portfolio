import { PortfolioData } from '@/types';

export const portfolioData: PortfolioData = {
  profile: {
    name: 'Dhruv Patel',
    college: 'Vellore Institute of Technology (VIT Vellore)',
    cgpa: '7.62',
    gradYear: '2029',
    email: 'patel.dhruv6113@gmail.com',
    github: 'https://github.com/DhruvSPatel6113',
    linkedin: 'https://linkedin.com/in/dhruvpatel6113',
    location: 'Vellore / Gujarat, India',
  },
  hero: {
    statusBadge: "VIT VELLORE '29 • SIH '26 WINNER • ICRTAC'26 AUTHOR",
    name: 'DHRUV PATEL.',
    headline: 'Relentless builder upgrading across silicon, edge AI, and systems.',
    subheadline:
      'I ship end-to-end engineering—from 24V opto-isolated factory PCBs and real-time SCADA twins to YOLOv11 edge vision and low-level C++ systems. Whatever the task demands, I learn it and finish it.',
    primaryCtaLabel: 'Explore Research',
    primaryCtaTarget: 'act-3',
    secondaryCtaLabel: 'Featured Projects',
    secondaryCtaTarget: 'act-5',
    githubUrl: 'https://github.com/DhruvSPatel6113',
    resumeUrl: '',
    highlights: [
      '2+ YRS PRODUCTION ROBOTIC GRIPPER',
      '9TH ICRTAC\'26 ACCEPTED PAPER',
      'SIH \'26 INTERNAL WINNER (ROBOTICS & DRONES)',
    ],
  },
  chapters: [
    {
      id: 0,
      actTitle: 'ACT 00 // THE PHYSICAL ORIGIN',
      heading: 'The Factory Shop & Maker Intuition',
      tagline: 'Where curiosity met steel, grease, and industrial machinery.',
      location: "Father's Industrial Machine Workshop",
      timeframe: 'Early Roots',
      narrativeText: [
        "Before I wrote a single line of code, my playground was my father's factory workshop. While other kids played with finished toys, I dismantled mine to see how gears meshed and electric motors whirred.",
        'Standing beside my father as he fabricated industrial machinery instilled a visceral intuition for mechanical tolerances, electrical load, and building things that survive real production floors.',
      ],
      milestones: [
        'Reverse-engineered mechanical assemblies & DC motors',
        'Hands-on fabrication in active manufacturing workshop',
      ],
      themeColor: '#f59e0b',
    },
    {
      id: 1,
      actTitle: 'ACT 01 // THE DIGITAL SYNAPSE',
      heading: 'Lockdown Awakening: Code as Creation',
      tagline: 'From physical wrenches to software architectures.',
      location: 'Home Terminal',
      timeframe: '2020 – 2021',
      narrativeText: [
        'When the world paused during lockdown, my workshop moved to a keyboard. I realized software is a frictionless machine shop where you can architect complex logic from scratch.',
        'I dove into algorithms, 2D physics loops, and automation scripts—turning curiosity into a habit of shipping relentlessly.',
      ],
      milestones: [
        'Built 2D physics & algorithmic simulation loops',
        'Transitioned from scripting to full-stack & systems C/C++',
      ],
      themeColor: '#0284c7',
    },
    {
      id: 2,
      actTitle: 'ACT 02 // CODE MEETS STEEL',
      heading: 'Custom PCBs & 2Y+ Production Gripper',
      tagline: '24V/5V opto-isolated hardware running live on a factory floor.',
      location: 'Active Manufacturing Line',
      timeframe: 'Production Hardware',
      narrativeText: [
        'Software on a screen wasn’t enough—I needed my code to move physical steel. I designed 24V/5V opto-isolated ATmega328 & MOSFET driver PCBs and programmed an autonomous 1-axis pick-and-place robotic gripper.',
        'Installed permanently in my father’s factory, that exact system has operated non-stop for over 2 continuous years with zero maintenance failures.',
      ],
      milestones: [
        'Designed 24V/5V opto-isolated MOSFET & optocoupler PCBs (Fritzing)',
        '2+ years continuous production uptime (10,000+ cycles)',
      ],
      themeColor: '#10b981',
    },
    {
      id: 3,
      actTitle: 'ACT 03 // SYSTEMS & RESEARCH FRONTIER',
      heading: 'VIT Vellore, SIH ’26 & Edge AI Research',
      tagline: 'Constantly upgrading across edge vision, RTOS security, and SCADA.',
      location: "VIT Vellore • B.Tech CSE '29",
      timeframe: '2025 – Present',
      narrativeText: [
        "Pursuing B.Tech CSE at VIT Vellore ('29), I push myself across domains—winning the SIH '26 Internal Hackathon under Robotics & Drones and authoring an accepted 9th ICRTAC'26 conference paper on edge-based solar panel defect segmentation.",
        'From secure dual-bank ESP32 OTA engines (AEGIS-OTA) to Factory I/O Digital Twin SCADA systems (Project Apex), I never stop upgrading my stack to solve the problem in front of me.',
      ],
      milestones: [
        "Winner — Smart India Hackathon (SIH '26) Internal Round (Robotics & Drones)",
        "Accepted Paper — 9th ICRTAC'26 (YOLOv11-seg Edge Solar Inspection)",
      ],
      themeColor: '#6366f1',
    },
  ],
  research: [
    {
      id: 'icrtac-26-solar-inspect',
      title:
        'Edge-Based Solar Panel Inspection Using Instance Segmentation for Automated Defect Quantification and Efficiency Assessment',
      venue: "9th ICRTAC'26 (Accepted Conference Paper)",
      date: 'Nov 2026',
      status: 'Accepted',
      authors: ['Rajveer Singh', 'Dhruv Patel', 'Rakshit Goyal', 'Rashmi Ranjan Das'],
      abstract:
        'Replaces conventional bounding-box detectors with pixel-level YOLOv11-seg (yolo11n-seg) instance segmentation to compute exact surface contamination and real-time PV efficiency loss (24.34%–100%). Deployed completely offline on a Raspberry Pi 5 (8GB) with Intel RealSense D405 RGB-D, Fluke Ti480 IR thermal imaging, and a 7-inch Kivy kiosk UI—validated across 6 real-world scenarios at VIT Vellore.',
      metrics: [
        '0.9446 mAP@50 (crack.pt)',
        '24.34% – 100% Real-Time Efficiency',
        '4.4 – 8.1 FPS / 151.3 ms Latency',
        '100% Offline Edge (TRL 6)',
      ],
      hardwareStack: ['Raspberry Pi 5 (8GB)', 'Intel RealSense D405', 'Fluke Ti480 Thermal', '7" Touchscreen'],
      softwareStack: ['YOLOv11-seg', 'Python', 'C++', 'CUDA', 'PyTorch / ONNX', 'OpenCV', 'Kivy'],
      paperUrl: '',
      codeUrl: '',
    },
  ],
  experiences: [
    {
      id: 'sih-26-winner',
      type: 'achievement',
      role: 'Winner — Robotics & Drones Domain',
      organization: "Smart India Hackathon (SIH '26) Internal Hackathon, VIT Vellore",
      period: '2026',
      location: 'VIT Vellore',
      summary:
        'Won the VIT internal selection round under the Robotics & Drones track by architecting a hardware-software autonomous system under tight hackathon constraints.',
      highlights: [
        'Selected among top university teams for SIH ’26 Robotics & Drones',
        'Designed end-to-end embedded telemetry and control architecture',
      ],
      badge: 'SIH ’26 Winner',
    },
    {
      id: 'factory-automation',
      type: 'achievement',
      role: 'Embedded & Industrial Automation Lead',
      organization: 'Production Manufacturing Line (Custom Hardware Deployment)',
      period: '2024 – Present',
      location: 'Gujarat, India',
      summary:
        'Engineered custom 24V/5V opto-isolated PCB driver boards and an autonomous 1-axis pick-and-place robotic gripper deployed permanently on a live factory floor.',
      highlights: [
        '2+ years continuous production uptime with zero maintenance failures',
        'Custom ATmega328/Arduino optocoupler & MOSFET isolation schematics',
      ],
      badge: '2+ Yrs Uptime',
    },
    {
      id: 'robovitics-club',
      type: 'club',
      role: 'Junior Core & Organizing Committee (OC)',
      organization: 'roboVITics — Official Robotics Club of VIT',
      period: 'Mar 2026 – Present',
      location: 'VIT Vellore',
      summary:
        'Core organizer driving hands-on robotics workshops and flagship national techfest competitions.',
      highlights: [
        'Organized "Hands on Robotics" workshop for 150+ participants with a 100% bot completion rate',
        'Coordinated Robowars at Gravitas (VIT flagship techfest) for competing teams across India',
      ],
      badge: 'Robotics Club',
    },
    {
      id: 'bulls-and-bears-tam',
      type: 'club',
      role: 'Junior Core — Technical Operations',
      organization: 'Bulls and Bears & TAM-VIT',
      period: 'Jan 2026 – Present',
      location: 'VIT Vellore',
      summary:
        'Managing technical operations, tooling, and event execution across finance and technology-management student chapters.',
      highlights: [
        'Coordinated technical operations across concurrent student events',
        'Bridged quantitative market interest with campus technical workflows',
      ],
      badge: 'Tech Ops',
    },
  ],
  projects: [
    {
      id: 'icrtac-solardetect',
      title: 'SolarDetect: Edge PV Defect Segmentation',
      subtitle: "9th ICRTAC'26 Accepted • Offline RPi 5 + Thermal Vision",
      category: 'edge-ai',
      tags: ['YOLOv11-seg', 'Python', 'C++', 'CUDA', 'RPi 5', 'Fluke Ti480', 'RealSense D405'],
      summary:
        'Pixel-level instance segmentation system quantifying dust, bird droppings, cracks, and thermal hotspots on solar panels to compute real-time efficiency loss completely offline.',
      story:
        'Replaces inaccurate bounding-box estimates with binary pixel masks (PTotal vs PDefect), running PyTorch/ONNX models on Raspberry Pi 5 with live Kivy touchscreen diagnostics.',
      metrics: ['0.9446 mAP@50', '4.4–8.1 FPS (151.3 ms)', '24.34%–100% Efficiency Calc'],
      featured: true,
      modelType: 'chart',
    },
    {
      id: 'aegis-ota',
      title: 'AEGIS-OTA: Dual-Bank Secure OTA Engine',
      subtitle: 'ESP32 FreeRTOS + ATECC608A Crypto + MAX6369 Watchdog',
      category: 'iot',
      tags: ['ESP32', 'C/C++', 'FreeRTOS', 'ATECC608A', 'MAX6369', 'I2C', 'Wokwi'],
      summary:
        'Cryptographically verified dual-bank (app0/app1) OTA firmware engine on ESP32 with custom ATECC608A I2C signature verification and a 400 ms MAX6369 hardware watchdog for automatic rollback.',
      story:
        'Prevents bricking and malicious firmware injection on remote IoT nodes by enforcing hardware-level heartbeat monitoring and rollback recovery across dual flash partitions.',
      metrics: ['Dual-bank app0/app1 rollback', 'ATECC608A I2C verification', '400 ms hardware watchdog'],
      githubUrl: 'https://github.com/DhruvSPatel6113/AEGIS-OTA',
      featured: true,
      modelType: 'chip',
    },
    {
      id: 'project-apex',
      title: 'Project Apex: Digital Twin SCADA & Sorter',
      subtitle: 'Factory I/O 3D Physics + Python Modbus TCP/IP Master',
      category: 'automation',
      tags: ['Python', 'Modbus TCP/IP', 'Flask-SocketIO', 'Factory I/O', 'SCADA', 'HIL/SITL'],
      summary:
        'HIL/SITL Digital Twin SCADA bridging Factory I/O 3D plant physics with a thread-locked Python Modbus TCP/IP master, bi-directional physical panel sync, NC E-stop safety, and live WebSocket telemetry.',
      story:
        'Synchronizes physical control panel switches, vision-sensor color sorting diverters, and emergency stop interlocks at 20 Hz with real-time PPM/PPH analytics.',
      metrics: ['20 Hz Modbus TCP/IP sync', 'NC E-Stop safety interlock', 'Live Socket.IO HMI'],
      githubUrl: 'https://github.com/DhruvSPatel6113/project-apex-scada',
      featured: true,
      modelType: 'robot',
    },
    {
      id: 'industrial-pcb-gripper',
      title: '24V/5V Opto-Isolated PCB & Robotic Gripper',
      subtitle: 'Custom Fritzing Schematics + 2Y+ Factory Automation',
      category: 'automation',
      tags: ['PCB Design', 'ATmega328', 'Optocouplers', 'MOSFET Drivers', 'Embedded C', 'Pneumatics'],
      summary:
        'Custom 24V-to-5V opto-isolated ATmega328/Arduino driver PCBs with MOSFET output stages and fuse protection, driving a 1-axis pick-and-place robotic gripper in live factory production.',
      story:
        'Designed to protect microcontroller logic from noisy 24V industrial solenoids and actuators—running continuously on the factory line for over 2 years.',
      metrics: ['2+ Years continuous uptime', '24V/5V opto-isolation', '10,000+ factory cycles'],
      featured: true,
      modelType: 'circuit',
    },
    {
      id: 'cpp-memory-visualizer',
      title: 'C++ Memory Visualizer & Alloc Dynamics',
      subtitle: 'Byte-Level Heap/Stack & Pointer Layout Inspector',
      category: 'systems',
      tags: ['C++', 'C++17', 'Memory Layout', 'Pointers', 'Heap Allocator'],
      summary:
        'Interactive visual debugger built to demystify dynamic memory allocation, pointer hops, stack/heap boundaries, alignment, and fragmentation at the byte level.',
      story:
        'Created to make low-level C++ memory behavior tangible and inspectable in real time.',
      metrics: ['Byte-level pointer tracking', 'Real-time heap inspection', 'Coalescing analysis'],
      githubUrl: 'https://github.com/DhruvSPatel6113/cpp_memory_visualizer',
      featured: true,
      modelType: 'code',
    },
    {
      id: 'enterprise-library-system',
      title: 'Enterprise Library Management System',
      subtitle: 'PostgreSQL 16 Triggers/Cursors + Node.js + Docker',
      category: 'fullstack',
      tags: ['Node.js', 'Express', 'PostgreSQL 16', 'Prisma', 'JWT', 'Docker'],
      summary:
        'Production REST API and web application powered by PostgreSQL 16 stored triggers and cursors, Prisma ORM, JWT authentication, and containerized Docker deployment.',
      story:
        'Engineered for relational data integrity at the database engine layer alongside clean containerized API delivery.',
      metrics: ['PostgreSQL 16 triggers & cursors', 'JWT auth + Prisma ORM', 'Dockerized deployment'],
      githubUrl: 'https://github.com/DhruvSPatel6113',
      featured: true,
      modelType: 'code',
    },
    {
      id: 'physics-and-algorithm-experiments',
      title: 'Physics & Algorithm Experiments',
      subtitle: '2D Rigid-Body Mechanics & Trajectory Simulator',
      category: 'simulation',
      tags: ['JavaScript', 'Matter.js', 'p5.js', 'Physics Engine'],
      summary:
        'Interactive simulation laboratory exploring 2D rigid-body mechanics, impulse resolution, elastic collisions, and projectile trajectories.',
      story: 'Built to test real-time collision meshes and physics math directly in the browser.',
      metrics: ['60 FPS physics loop', 'Sub-pixel collision detection'],
      githubUrl: 'https://github.com/DhruvSPatel6113/physics_and_algorithm_experiments',
      demoUrl: 'https://dhruvspatel6113.github.io/physics_and_algorithm_experiments/',
      featured: false,
      modelType: 'chart',
    },
    {
      id: 'shed-flow-inventory',
      title: 'ShedFlow Inventory Management',
      subtitle: 'Offline-First Multi-Shed Industrial Supply Chain App',
      category: 'fullstack',
      tags: ['React Native', 'Zustand', 'Offline-First', 'Logistics'],
      summary:
        'Industrial warehouse tracking app with multi-shed synchronization, barcode scanning, and offline persistence for low-connectivity factory floors.',
      story: 'Built for industrial sheds where Wi-Fi drops between bays.',
      metrics: ['100% offline persistence', 'Multi-shed sync'],
      githubUrl: 'https://github.com/DhruvSPatel6113/shed_flow_inventory',
      featured: false,
      modelType: 'circuit',
    },
  ],
  beyond: [
    {
      id: 'volleyball',
      title: 'District-Level Volleyball',
      category: 'sport',
      tagline: 'Split-second court vision, aerial timing & team sync.',
      details:
        'Competed at the district level—sharpening fast-break communication, vertical discipline, and calm execution under match-point pressure.',
      badge: 'District Athlete',
      icon: 'Activity',
    },
    {
      id: 'cricket',
      title: 'District-Level Cricket',
      category: 'sport',
      tagline: 'Tactical focus, stamina & high-pressure match execution.',
      details:
        'Represented district squads in competitive cricket, building resilience and split-second decision making across long formats.',
      badge: 'District Athlete',
      icon: 'Trophy',
    },
    {
      id: 'music',
      title: 'Synthesizer & Jazz Drums',
      category: 'music',
      tagline: 'Polyrhythms, improvisation & analog/digital sound design.',
      details:
        'Playing synthesizer and jazz drums keeps my sense of timing, improvisation, and creative pattern-building sharp outside engineering.',
      badge: 'Musician',
      icon: 'Music',
    },
    {
      id: 'travel',
      title: 'Travelling & Exploring',
      category: 'travel',
      tagline: 'New terrains, new perspectives, zero comfort-zone limits.',
      details:
        'Love hitting the road to explore unfamiliar places, cultures, and landscapes—bringing fresh energy back to the workbench.',
      badge: 'Explorer',
      icon: 'Compass',
    },
  ],
  contact: {
    badge: 'DIRECT PIPELINE',
    heading: "Let's Build Something Extraordinary.",
    description:
      'Open for software engineering, embedded/robotics, and edge AI collaborations, internships, and high-impact hardware-software ventures.',
    email: 'patel.dhruv6113@gmail.com',
    location: 'Vellore / Gujarat, India',
    githubUrl: 'https://github.com/DhruvSPatel6113',
    linkedinUrl: 'https://linkedin.com/in/dhruvpatel6113',
  },
};
