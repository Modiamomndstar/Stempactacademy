import { getCuratedVideoForLesson } from '../verifiedVideoRegistry.js';
import { normalizeAcademicLevel } from './types.js';
import { EXTENDED_DOMAIN_THEMES } from './extendedDomainThemes.js';

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonResourceMetadata {
  lessonType:
    | 'COURSE_WELCOME'
    | 'COURSE_OVERVIEW'
    | 'COURSE_SYLLABUS'
    | 'COURSE_ASSESSMENT_POLICY'
    | 'COURSE_RESOURCES'
    | 'COURSE_NAVIGATION'
    | 'UNIT_OVERVIEW'
    | 'CORE_LESSON'
    | 'PHYSICAL_CLASS_GUIDE'
    | 'UNIT_ASSIGNMENT'
    | 'UNIT_QUIZ'
    | 'UNIT_CONCLUSION'
    | 'FINAL_PROJECT_OVERVIEW'
    | 'FINAL_PROJECT_SPEC'
    | 'FINAL_PROJECT_SUBMISSION'
    | 'CERTIFICATE_GATE';
  unitNumber: number;
  levelCode: string;
  levelDisplayName: string;
  videoCitation?: string;
  videoTitle?: string;
  videoChannel?: string;
  videoExpectations?: string;
  learningOutcomes?: string[];
  quizQuestions?: QuizQuestionItem[];
  assignmentDeliverable?: string;
  physicalLabAgenda?: string[];
}

export const LEVEL_META: Record<
  string,
  {
    code: string;
    shortLabel: string;
    displayName: string;
    courseCodeSuffix: string;
    pedagogicalDepth: string;
    prerequisitesText: string;
    projectComplexity: string;
  }
> = {
  LEVEL_0_ASSESSMENT: {
    code: 'LEVEL_0_ASSESSMENT',
    shortLabel: 'Diagnostic Assessment',
    displayName: 'Intake Diagnostic & Orientation',
    courseCodeSuffix: '100',
    pedagogicalDepth: 'Diagnostic evaluation and digital readiness orientation',
    prerequisitesText: 'Open to all prospective applicants.',
    projectComplexity: 'Orientation readiness check',
  },
  LEVEL_1_FOUNDATION: {
    code: 'LEVEL_1_FOUNDATION',
    shortLabel: 'Level 1 — Foundation',
    displayName: 'Level 1 — Foundation Bootcamp',
    courseCodeSuffix: '101',
    pedagogicalDepth: 'Foundational principles, safety standards, core toolchains, and guided hands-on builds',
    prerequisitesText: 'Basic digital literacy, logical reasoning, and completion of STEMPACT Intake Diagnostic Assessment.',
    projectComplexity: 'Foundational functional prototype demonstrating core concepts and standard safety/engineering workflows',
  },
  LEVEL_2_INTERMEDIATE: {
    code: 'LEVEL_2_INTERMEDIATE',
    shortLabel: 'Level 2 — Intermediate',
    displayName: 'Level 2 — Applied Hands-On Engineering',
    courseCodeSuffix: '201',
    pedagogicalDepth: 'Multi-component integration, diagnostic instrumentation, intermediate workflows, and performance testing',
    prerequisitesText: 'Successful completion of Level 1 Foundation Certificate or verified equivalent placement.',
    projectComplexity: 'Multi-module applied system integrating diagnostics, automated testing, and real-world data/hardware interfacing',
  },
  LEVEL_3_ADVANCED: {
    code: 'LEVEL_3_ADVANCED',
    shortLabel: 'Level 3 — Advanced',
    displayName: 'Level 3 — Advanced Systems & Architecture',
    courseCodeSuffix: '301',
    pedagogicalDepth: 'Complex system architecture, fault isolation, board/cloud-level optimization, and security/reliability auditing',
    prerequisitesText: 'Successful completion of Level 2 Intermediate Certificate or verified advanced industry placement.',
    projectComplexity: 'Production-resilient advanced architecture with fault tolerance, telemetry, and comprehensive engineering documentation',
  },
  LEVEL_4_SPECIALIST: {
    code: 'LEVEL_4_SPECIALIST',
    shortLabel: 'Level 4 — Specialist / Mastery',
    displayName: 'Level 4 — Specialist & Production Mastery',
    courseCodeSuffix: '401',
    pedagogicalDepth: 'Enterprise-grade engineering mastery, specialist precision rework/deployment, SLA governance, and commercial defense',
    prerequisitesText: 'Successful completion of Level 3 Advanced Certificate and faculty clearance for Specialist Mastery.',
    projectComplexity: 'Enterprise-ready flagship capstone solution with full commercial specification, live defense, and industry SLA compliance',
  },
  LEVEL_4_MASTERY: {
    code: 'LEVEL_4_SPECIALIST',
    shortLabel: 'Level 4 — Specialist / Mastery',
    displayName: 'Level 4 — Specialist & Production Mastery',
    courseCodeSuffix: '401',
    pedagogicalDepth: 'Enterprise-grade engineering mastery, specialist precision rework/deployment, SLA governance, and commercial defense',
    prerequisitesText: 'Successful completion of Level 3 Advanced Certificate and faculty clearance for Specialist Mastery.',
    projectComplexity: 'Enterprise-ready flagship capstone solution with full commercial specification, live defense, and industry SLA compliance',
  },
  LEVEL_5_INNOVATION: {
    code: 'LEVEL_5_INNOVATION',
    shortLabel: 'Venture Lab — R&D Innovation',
    displayName: 'Post-Academic Pathway — Applied R&D & Prototyping',
    courseCodeSuffix: '501',
    pedagogicalDepth: 'Post-academic research, novel product incubation, and intellectual property development',
    prerequisitesText: 'Completion of Core Academic Pathway (Level 4 Specialist) or selected Innovation Hub Fellowship.',
    projectComplexity: 'Patent-ready or market-ready R&D innovation prototype',
  },
  LEVEL_6_ENTREPRENEURSHIP: {
    code: 'LEVEL_6_ENTREPRENEURSHIP',
    shortLabel: 'Venture Lab — Commercialization',
    displayName: 'Post-Academic Pathway — Venture Commercialization',
    courseCodeSuffix: '601',
    pedagogicalDepth: 'Startup incorporation, unit economics, customer acquisition, and investor pitch readiness',
    prerequisitesText: 'Completion of R&D Prototype or Venture Lab admission.',
    projectComplexity: 'Commercial startup launch deck, live customer traction metrics, and investor demo day defense',
  },
};

interface UnitBlueprint {
  unitTheme: string;
  unitSummary: string;
  lesson1Title: string;
  lesson1Focus: string;
  lesson2Title: string;
  lesson2Focus: string;
  labSessionTitle: string;
  assignmentTitle: string;
  assignmentDeliverable: string;
  quizTitle: string;
  quizQuestions: QuizQuestionItem[];
}

export function resolveDomainKey(title: string, schoolCode: string = '', keywords: string = ''): string {
  const titleLow = (title || '').toLowerCase().trim();
  const schoolLow = (schoolCode || '').toUpperCase().trim();
  const keywordsLow = (keywords || '').toLowerCase();

  // =========================================================================
  // STAGE 1: AUTHORITATIVE TITLE & PROGRAM CODE MATCH (Highest Priority)
  // Ensures existing and custom program titles are matched unambiguously FIRST
  // =========================================================================

  // 1A. Kids & Teens STEM Programs (Checked first so 'Young AI' / 'Young Robotics' never route to adult tracks)
  if (
    schoolLow === 'SKT' ||
    /\b(kids?|teens?|junior|scratch|creative computing|creative coding|young web|young robotics|young ai|young entrepreneurs?)\b/i.test(titleLow)
  ) {
    return 'junior';
  }

  // 1B. Internet of Things (IoT) — RIOTH-02, Smart Energy IoT
  if (
    /\b(internet of things|iot|lorawan|mqtt|smart connected|smart agriculture|smart grid)\b/i.test(titleLow)
  ) {
    return 'iot';
  }

  // 1C. Drone Technology & UAVs — RIOTH-07
  if (
    /\b(drone|uav|quadcopter|aerial robotics|ardupilot|pixhawk|aviation)\b/i.test(titleLow)
  ) {
    return 'drone_uav';
  }

  // 1D. Embedded Systems & Microcontrollers — RIOTH-03
  if (
    /\b(embedded systems?|stm32|freertos|rtos|microcontrollers?|bare-metal|arm cortex)\b/i.test(titleLow)
  ) {
    return 'embedded';
  }

  // 1E. Electronics, Digital Systems & PCB Design — RIOTH-04 / RETE-03
  if (
    /\b(electronics and digital|electronic systems|pcb design|kicad|analog circuits|digital circuits|electrical and electronics)\b/i.test(titleLow)
  ) {
    return 'electronics_pcb';
  }

  // 1F. Computer Hardware Engineering & Diagnostics — RIOTH-05
  if (
    /\b(computer hardware|hardware engineering|pc repair|motherboard diagnostics|chip-level repair)\b/i.test(titleLow)
  ) {
    return 'computer_hardware';
  }

  // 1G. 3D Design, CAD & Digital Fabrication — RIOTH-06
  if (
    /\b(cad|autocad|fusion\s*360|solidworks|3d\s*design|3d\s*print|3d\s*printing|digital fabrication|rapid prototyping)\b/i.test(titleLow)
  ) {
    return 'cad_3d_fabrication';
  }

  // 1H. Robotics & Automation — RIOTH-01
  if (
    /\b(robotics|mechatronics|ros2|autonomous mobile|autonomous robots?)\b/i.test(titleLow)
  ) {
    return 'robotics';
  }

  // 1I. Solar Installation, Renewable Energy & Energy Storage — RETE-01..05
  if (
    schoolLow === 'RETE' ||
    /\b(solar|renewable energy|photovoltaic|energy storage|battery management|microgrids?)\b/i.test(titleLow)
  ) {
    return 'solar';
  }

  // 1J. Digital Marketing, AI Content Creation, Digital Design & Educators — DMAP-01, 04, 05, 06, 07
  if (
    schoolLow === 'DMAP' ||
    /\b(digital marketing|ai marketing|ai content|content creation|copywriting|seo|paid advertising|meta ads|social media marketing|ai productivity|ai for education|ai for educators?|ai for teachers?|digital design|graphic design|ai design|ai digital design|creative media)\b/i.test(titleLow)
  ) {
    return 'content';
  }

  // 1K-1. Python for Data Analytics & Machine Learning (AIDM)
  if (
    /\b(python)\b/i.test(titleLow) &&
    /\b(data|analytics|machine learning|pandas|numpy|scikit|model|deep learning)\b/i.test(titleLow)
  ) {
    return 'python_data_ai';
  }

  // 1K-2. Python for Software Development & Backend Web Engineering (CSE)
  if (
    /\b(python)\b/i.test(titleLow) &&
    /\b(software|developer|development|backend|web|django|flask|fastapi|api|programming|full-stack|fullstack)\b/i.test(titleLow)
  ) {
    return 'python_software';
  }

  // If title is specifically Python Programming or Learn Python
  if (/\b(python programming|python fundamentals|learn python|mastering python)\b/i.test(titleLow)) {
    return 'python_software';
  }

  // 1K-3. Data Analytics & Business Intelligence — AIDM-01, AIDM-02
  if (
    /\b(data analytics|business intelligence|power bi|data analysis|data insights|tableau)\b/i.test(titleLow)
  ) {
    return 'data_science';
  }

  // 1L. Artificial Intelligence, Machine Learning & Computer Vision — AIDM-03..06
  if (
    schoolLow === 'AIDM' ||
    /\b(artificial intelligence|machine learning|deep learning|data science|generative ai|computer vision|ai automation|neural networks?|llm)\b/i.test(titleLow)
  ) {
    return 'aiml';
  }

  // 1M. Cybersecurity, Cloud Computing, DevOps & Systems — CSE-05..07
  if (
    /\b(cybersecurity|cyber security|ethical hacking|cloud computing|devops|networking|system administration|docker|kubernetes)\b/i.test(titleLow)
  ) {
    return 'cyber_cloud';
  }

  // 1N. Business, Entrepreneurship, Startup & Innovation Labs — BIE-01..05, ISL-01..06
  if (
    schoolLow === 'BIE' ||
    schoolLow === 'ISL' ||
    /\b(entrepreneurship|business development|startup|venture|freelancing|e-commerce|innovation lab|product development|hackathon)\b/i.test(titleLow)
  ) {
    return 'business';
  }

  // 1O. Full-Stack Software Engineering & Web Development — CSE-01..04
  if (
    schoolLow === 'CSE' ||
    /\b(software engineering|software development|web development|full-stack|fullstack|frontend|backend|python|javascript|typescript|mobile app)\b/i.test(titleLow)
  ) {
    return 'software';
  }

  // =========================================================================
  // STAGE 2: SECONDARY KEYWORDS MATCH (Fallback for Custom / Unfamiliar Titles)
  // Strict word boundaries prevent "content" or "academic" from hijacking classification
  // =========================================================================
  if (/\b(scratch|micro:bit|kids|teens)\b/i.test(keywordsLow)) return 'junior';
  if (/\b(iot|internet of things|mqtt|esp32|lorawan)\b/i.test(keywordsLow)) return 'iot';
  if (/\b(drone|uav|quadcopter|ardupilot)\b/i.test(keywordsLow)) return 'drone_uav';
  if (/\b(embedded|freertos|stm32|arm cortex|microcontroller)\b/i.test(keywordsLow)) return 'embedded';
  if (/\b(cad|fusion 360|solidworks|3d print|slicing)\b/i.test(keywordsLow)) return 'cad_3d_fabrication';
  if (/\b(motherboard|esd|post card|vrm|chip-level)\b/i.test(keywordsLow)) return 'computer_hardware';
  if (/\b(robot|robotics|ros2|kinematics)\b/i.test(keywordsLow)) return 'robotics';
  if (/\b(pcb|kicad|oscilloscope|transistor|circuits?)\b/i.test(keywordsLow)) return 'electronics_pcb';
  if (/\b(solar|photovoltaic|inverter|mppt|lifepo4)\b/i.test(keywordsLow)) return 'solar';
  if (/\b(digital marketing|copywriting|seo|paid ads|ad creative|digital design|graphic design|content creation|educator|ai for education)\b/i.test(keywordsLow)) return 'content';
  if (/\b(data analytics|business intelligence|power bi|sql|pandas)\b/i.test(keywordsLow)) return 'data_science';
  if (/\b(machine learning|deep learning|neural|pytorch|tensorflow|llm)\b/i.test(keywordsLow)) return 'aiml';
  if (/\b(cybersecurity|firewall|devops|docker|kubernetes|aws)\b/i.test(keywordsLow)) return 'cyber_cloud';
  if (/\b(startup|business model|venture|entrepreneur|pitch)\b/i.test(keywordsLow)) return 'business';
  if (/\b(python)\b/i.test(keywordsLow) && /\b(data|pandas|analytics|machine learning|numpy|scikit)\b/i.test(keywordsLow)) return 'python_data_ai';
  if (/\b(python)\b/i.test(keywordsLow) && /\b(django|flask|fastapi|backend|software|api|oop)\b/i.test(keywordsLow)) return 'python_software';
  if (/\b(python)\b/i.test(keywordsLow)) return 'python_software';

  return 'software';
}

/**
 * Generates level-specific and domain-specific unit blueprints for Units 1..W
 */
function getDomainLevelUnitBlueprints(
  domainKey: string,
  programTitle: string,
  levelCode: string,
  unitCount: number
): UnitBlueprint[] {
  const lvlNum = levelCode.includes('4') ? 4 : levelCode.includes('3') ? 3 : levelCode.includes('2') ? 2 : 1;

  // Domain-specific catalog of progressive themes per level, augmented with full extended catalogs
  const domainThemes: Record<string, Record<number, Array<{ theme: string; l1: string; l2: string; deliverable: string }>>> = {
    ...EXTENDED_DOMAIN_THEMES,
    computer_hardware: {
      1: [
        {
          theme: 'ESD Safety Protocols, Workbench Instrumentation & PC Architecture Foundations',
          l1: 'Electrostatic Discharge (ESD) Grounding, Workbench Safety & Tooling Standards',
          l2: 'ATX / Micro-ATX / Mini-ITX Motherboard Form Factors, Chipsets & Bus Topologies',
          deliverable: 'Complete ESD Workbench Audit Report & Annotated Motherboard Component Architecture Diagram',
        },
        {
          theme: 'Power Delivery Systems (PSU), Processor Sockets, Thermal Interfaces & Memory Channels',
          l1: 'ATX Power Supply Rails (+12V, +5V, +3.3V), Wattage Budgeting & Multimeter Rail Verification',
          l2: 'LGA/PGA CPU Socket Mechanics, Thermal Paste Application Physics & Dual-Channel DDR4/DDR5 RAM',
          deliverable: 'PSU Multimeter Voltage Rail Test Log & Complete Bench Top System Assembly Video/Photo Evidence',
        },
        {
          theme: 'NVMe/SATA Storage Subsystems, UEFI/BIOS Provisioning & Baseline POST Diagnostics',
          l1: 'PCIe NVMe M.2 vs SATA III Storage Architecture, GPT Partitioning & SMART Health Telemetry',
          l2: 'UEFI/BIOS Firmware Configuration, XMP/EXPO Profiles, Secure Boot & POST Beep Code Diagnostics',
          deliverable: 'BIOS/UEFI Configuration Checklist, Storage Benchmark Report & Simulated No-POST Fault Resolution Log',
        },
      ],
      2: [
        {
          theme: 'Advanced Multimeter Board Probing, Schematic Reading & Power Rail Diagnostics',
          l1: 'Digital Multimeter Continuity, Diode Mode, Resistance Probing & Short-Circuit Detection on PCBs',
          l2: 'Reading Motherboard Boardviews, Power Sequence States (S0–S5) & PCIe Slot Pinout Verification',
          deliverable: 'Motherboard Power Rail Impedance & Voltage Drop Diagnostic Sheet across 12 Test Points',
        },
        {
          theme: 'Laptop Architecture Disassembly, Display Hinges, DC Jack Repair & Thermal Re-Engineering',
          l1: 'Mobile Form-Factor Disassembly, Ribbon Cable ZIF Connectors, eDP Display Panels & Battery BMS Safety',
          l2: 'Heatpipe Thermal Dynamics, VRM Thermal Pads, Fan Bearing Maintenance & Stress-Test Telemetry',
          deliverable: 'Complete Laptop Teardown, Thermal Restoration & 30-Minute Prime95/FurMark Thermal Delta Report',
        },
        {
          theme: 'Diagnostic POST Cards, Structured Network Cabling (Cat6/RJ45) & Peripheral Bus Repair',
          l1: 'Hexadecimal PCIe/LPC POST Diagnostic Card Analysis & Isolating CPU/RAM/Chipset Initialization Hangs',
          l2: 'Structured Ethernet Cabling (T568B), RJ45 Crimping, Patch Panel Termination & LAN Continuity Testing',
          deliverable: 'POST Code Fault Isolation Matrix & Certified Cat6 Patch Cable Termination Test Report',
        },
      ],
      3: [
        {
          theme: 'Board-Level Through-Hole & SMD Soldering, Flux Chemistry & Capacitor Replacement',
          l1: 'Temperature-Controlled Soldering Stations, Rosin/No-Clean Flux Chemistry & Desoldering Braids/Pumps',
          l2: 'Surface Mount Device (SMD) Hot-Air Rework, Electrolytic/Polymer Capacitor Replacement & Pad Repair',
          deliverable: 'Board-Level SMD Component Extraction & Precision Re-Soldering Inspection Portfolio',
        },
        {
          theme: 'VRM Multi-Phase Buck Converters, MOSFET Short Isolation & Current-Limited Voltage Injection',
          l1: 'CPU/GPU Voltage Regulator Module (VRM) PWM Controllers, High/Low-Side MOSFETs & Choke Coils',
          l2: 'DC Bench Power Supply Voltage Injection, Thermal Camera Fault Localization & Dead-Short Clearance',
          deliverable: 'VRM Short-Circuit Isolation & MOSFET Replacement Engineering Case Report',
        },
        {
          theme: 'SPI Flash EEPROM BIOS Recovery, Hardware Programmers (CH341A) & Server Rack Hardware',
          l1: 'Corrupted UEFI Firmware Extraction, Hex Binary Inspection & External SPI EEPROM Flashing',
          l2: 'Enterprise Rackmount Server Hardware, ECC Registered Memory, Hot-Swap RAID Controllers & Redundant PSUs',
          deliverable: 'Hardware SPI BIOS Dump/Reflash Verification Log & Enterprise Server Hardware Maintenance Spec',
        },
      ],
      4: [
        {
          theme: 'Enterprise Hardware Architecture, Signal Integrity & High-Speed Bus Diagnostics',
          l1: 'Oscilloscope Signal Integrity Probing, Clock Crystal Verification & PCIe Gen4/Gen5 Differential Pairs',
          l2: 'Micro-Soldering Under Stereo Microscope: Broken Trace Jumper Reconstruction & Fine-Pitch IC Rework',
          deliverable: 'Board-Level Oscilloscope Waveform Analysis & Microscopic Trace Reconstruction Evidence Pack',
        },
        {
          theme: 'BGA Rework Profiles, Charging IC / Super-IO Replacement & Power Sequence Mastery',
          l1: 'Multi-Zone Infrared/Hot-Air BGA Reballing Profiles, Stencil Alignment & Underfill Epoxy Removal',
          l2: 'Embedded Controller (EC / Super-IO) Pinout Analysis, USB-C PD Controller Repair & Charging Circuitry',
          deliverable: 'Super-IO / USB-C PD Controller Replacement & Full S5-to-S0 Power Sequence Verification Report',
        },
        {
          theme: 'Data Center Infrastructure Engineering, Hardware Lab QA Governance & Commercial Service Operations',
          l1: 'Enterprise Data Center Rack Airflow, Uninterruptible Power Supply (UPS) Sizing & Hardware Lifecycle SLAs',
          l2: 'Running a Certified Hardware Engineering & Repair Center: Diagnostic Ticketing, RMA Workflows & Costing',
          deliverable: 'Enterprise Hardware Lab Operations Manual, SLA Pricing Matrix & Fleet Reliability Architecture',
        },
      ],
    },
    robotics: {
      1: [
        {
          theme: 'Microcontroller Architecture, Breadboard Prototyping & Digital GPIO Control',
          l1: 'Arduino / ESP32 Microcontroller Pinouts, Logic Levels (3.3V vs 5V) & Ohm’s Law Circuit Protection',
          l2: 'C/C++ Embedded Firmware Structure (setup/loop), Digital I/O & Pulse Width Modulation (PWM)',
          deliverable: 'Working Multi-Pattern Traffic & Telemetry Controller with Schematic & Commented Firmware',
        },
        {
          theme: 'Analog Sensor Interfacing, ADC Quantization & Serial Telemetry Pipelines',
          l1: 'Analog-to-Digital Conversion (ADC), Ultrasonic Distance, DHT Environmental & Photoresistor Sensors',
          l2: 'UART Serial Monitor Telemetry, Signal Debouncing & Noise Filtering Algorithms',
          deliverable: 'Multi-Sensor Environmental & Proximity Telemetry Station with Real-Time Serial Plotter Logs',
        },
        {
          theme: 'Actuators, Servo Kinematics, H-Bridge DC Motor Drivers & Autonomous Obstacle Avoidance',
          l1: 'PWM Servo Angular Control, L298N / TB6612FNG Dual H-Bridge Motor Drivers & Separate Power Rails',
          l2: 'Closed-Loop State Machines for Autonomous Obstacle Detection and Navigation',
          deliverable: 'Autonomous Differential-Drive Obstacle Avoidance Robot Sub-Assembly & Firmware Repository',
        },
      ],
      2: [
        {
          theme: 'I2C / SPI Communication Protocols, OLED Displays & Inertial Measurement Units (IMU)',
          l1: 'Synchronous Serial Buses: I2C Addressing, Pull-Up Resistors & SPI Master-Slave Timing',
          l2: 'Interfacing SSD1306 OLED Displays and MPU6050 6-Axis Accelerometer/Gyroscope IMUs',
          deliverable: 'Digital Spirit Level & Motion Telemetry Dashboard on I2C OLED Display',
        },
        {
          theme: 'Wi-Fi / MQTT IoT Cloud Connectivity, ESP32 Web Servers & Remote Actuator Control',
          l1: 'ESP32 Wi-Fi Stack, Asynchronous HTTP Web Servers & REST JSON Telemetry Payloads',
          l2: 'Publish-Subscribe Architecture with MQTT Brokers, Topic Hierarchies & Mobile IoT Dashboards',
          deliverable: 'Connected Smart Energy/Farm IoT Node Publishing Live Sensor Data to an MQTT Dashboard',
        },
        {
          theme: 'PID Closed-Loop Control Systems, Rotary Encoders & Precision Mechatronics',
          l1: 'Hardware Interrupts, Quadrature Rotary Encoders & RPM Velocity Measurement',
          l2: 'Proportional-Integral-Derivative (PID) Feedback Control Tuning for Speed and Line Following',
          deliverable: 'PID-Stabilized Motor Control System with Step-Response Tuning Graphs',
        },
      ],
      3: [
        {
          theme: 'Real-Time Operating Systems (FreeRTOS), Multi-Tasking & Custom PCB Design in KiCad',
          l1: 'FreeRTOS Task Scheduling, Queues, Semaphores & Deterministic Real-Time Execution on Dual-Core ESP32',
          l2: 'Schematic Capture, Footprint Routing & Gerber Manufacturing File Generation in KiCad',
          deliverable: 'Multi-Threaded FreeRTOS Firmware & Complete 2-Layer Custom Sensor Shield PCB Gerber Package',
        },
        {
          theme: 'Industrial Fieldbus Protocols (RS-485 / Modbus), Low-Power Sleep Modes & Solar Battery Management',
          l1: 'Differential RS-485 Signaling, Modbus RTU Framing & Industrial Sensor Integration',
          l2: 'Deep-Sleep Microamp Optimization, LiFePO4/Li-Ion BMS Protection & Solar MPPT Harvesting for Remote Nodes',
          deliverable: 'Solar-Powered Low-Power Industrial Telemetry Node with Power Consumption Budget Analysis',
        },
        {
          theme: 'Edge AI (TinyML), Embedded Computer Vision & Robotic Kinematics',
          l1: 'Quantizing Neural Networks for Microcontrollers (TensorFlow Lite Micro) & Anomaly Detection',
          l2: 'Forward & Inverse Kinematics for Multi-DOF Robotic Manipulators',
          deliverable: 'Edge-AI Anomaly/Gesture Classifier Running Locally on Embedded Hardware',
        },
      ],
      4: [
        {
          theme: 'ROS2 (Robot Operating System) Architecture, Nodes, Topics & URDF Simulation',
          l1: 'ROS2 Publisher/Subscriber Nodes, Services, Actions & Distributed Robotic Middleware',
          l2: 'Unified Robot Description Format (URDF), Coordinate Frames (tf2) & Gazebo Physics Simulation',
          deliverable: 'Complete ROS2 Robot Package with Custom URDF Model and Autonomous Navigation Node',
        },
        {
          theme: 'SLAM (Simultaneous Localization & Mapping), LiDAR Point Clouds & Sensor Fusion',
          l1: '2D/3D LiDAR Odometry, Extended Kalman Filtering (EKF) & IMU-Wheel Odometry Fusion',
          l2: 'Autonomous Path Planning (Nav2), Costmaps & Dynamic Obstacle Avoidance',
          deliverable: 'SLAM Map Generation & Autonomous Waypoint Navigation Benchmark Report',
        },
        {
          theme: 'Industrial IoT Fleet Security, OTA Firmware Pipelines & Design for Manufacturing (DFM)',
          l1: 'TLS Mutual Authentication, Secure Boot, Encrypted Flash & Over-The-Air (OTA) Fleet Rollouts',
          l2: 'Design for Manufacturing (DFM), Pick-and-Place BOM Preparation & Regulatory Compliance',
          deliverable: 'Production-Ready Industrial IoT/Robotics System Specification, BOM & OTA Security Architecture',
        },
      ],
    },
    cad_3d_fabrication: {
      1: [
        {
          theme: 'Parametric 2D Sketching, Geometric Constraints & 3D Solid Extrusion in Fusion 360',
          l1: 'Parametric Design Intent, Fully Constrained Sketches, Dimensions & User Parameters',
          l2: 'Extrude, Revolve, Sweep, Loft, Fillets & Chamfers for Precision Functional Parts',
          deliverable: 'Parametric Enclosure CAD Model (.f3d & .step) with Editable Dimension Table',
        },
        {
          theme: 'FDM 3D Printing Mechanics, Slicing Profiles (Cura/PrusaSlicer) & Bed Leveling Calibration',
          l1: 'Cartesian vs CoreXY Kinematics, Bowden vs Direct Drive Extruders & Build Plate Adhesion Physics',
          l2: 'Layer Height, Wall Perimeters, Infill Geometries, Support Overhangs & G-Code Inspection',
          deliverable: 'Sliced G-Code Production Profile & Calibrated Dimensional Tolerance Test Print Report',
        },
        {
          theme: 'Multi-Part Assemblies, Mechanical Clearance Fits & Digital Fabrication Post-Processing',
          l1: 'Top-Down Assembly Design, Revolute/Slider Joints, Interference Detection & Snap-Fit Tolerances',
          l2: 'Filament Material Science (PLA, PETG, ABS, TPU), Heat-Set Threaded Inserts & Surface Finishing',
          deliverable: 'Multi-Component Interlocking Mechanical Assembly Ready for Physical Fabrication',
        },
      ],
      2: [
        {
          theme: 'Advanced Surface Modeling, Sheet Metal Enclosures & Technical Engineering Drawings (GD&T)',
          l1: 'Patch Workspace Surface Lofting, Complex Ergonomic Contours & Hybrid Solid-Surface Modeling',
          l2: 'Sheet Metal Bend Allowances, K-Factor Rules, Flat Pattern DXF Exports & ASME/ISO 2D Drawings',
          deliverable: 'Industrial Sheet-Metal & Surface Enclosure with Complete Annotated 2D Orthographic Drawings',
        },
        {
          theme: 'Gear Trains, Cam Mechanisms, Motion Studies & Mechatronic Enclosure Integration',
          l1: 'Involute Spur/Helical Gear Generation, Rack-and-Pinion Ratios & Contact Motion Simulation',
          l2: 'Designing Custom Mounting Bosses, Ventilation Louvers & Cable Glands for PCBs and Motors',
          deliverable: 'Functional Gear-Reduction Mechanism & Custom PCB/Sensor Housing Assembly',
        },
        {
          theme: 'Resin MSLA Printing, Multi-Material FDM & Print Failure Root-Cause Diagnostics',
          l1: 'Photopolymer Resin MSLA Exposure Calibration, Orientation Angles, Hollowing & Drain Holes',
          l2: 'Diagnosing Layer Shifts, Heat Creep, Stringing, Delamination & Nozzle Clogs',
          deliverable: 'High-Detail Fabrication Process Sheet & Print Failure Diagnostic Runbook',
        },
      ],
      3: [
        {
          theme: 'Finite Element Analysis (FEA), Static Stress Simulation & Topology Optimization',
          l1: 'Material Yield Strength, Von Mises Stress, Safety Factor Distribution & Mesh Convergence',
          l2: 'Generative Design & Load-Path Topology Optimization for Lightweight Structural Brackets',
          deliverable: 'FEA Stress Validation Report & Mass-Optimized Structural Component Design',
        },
        {
          theme: 'CAM Toolpaths, CNC 3-Axis Milling, Laser Cutting & Subtractive Manufacturing',
          l1: '2.5D and 3D Adaptive Clearing Toolpaths, Feeds and Speeds, Endmill Selection & Workholding (WCS)',
          l2: 'CO2/Diode Laser Kerf Compensation, Acrylic/Wood Interlocking Finger Joints & DXF Nesting',
          deliverable: 'Verified CNC G-Code Toolpath Simulation & Laser-Cut Structural Assembly Files',
        },
        {
          theme: 'Silicone Urethane Casting, Injection Molding Core/Cavity Design & Small-Batch Production',
          l1: 'Draft Angles, Uniform Wall Thickness, Parting Lines, Undercuts & Rib/Boss Design Rules',
          l2: '3D-Printed Master Molds for Silicone RTV Casting and Low-Volume Production Runs',
          deliverable: 'Two-Part Injection/Casting Mold CAD Assembly with Draft Angle Analysis',
        },
      ],
      4: [
        {
          theme: 'Industrial Product Design Architecture, DFM/DFA Audits & Complete Bill of Materials (BOM)',
          l1: 'Design for Manufacture and Assembly (DFMA), Fastener Standardization & Tolerance Stack-Up Analysis',
          l2: 'Multi-Level Engineering Bill of Materials (EBOM), Revision Control & Vendor Sourcing Specifications',
          deliverable: 'Enterprise Product Engineering Package (3D Master Assembly, Tolerance Stack-Up & Full BOM)',
        },
        {
          theme: '3D Print Farm Automation, Klipper High-Speed Firmware & Quality Assurance Metrology',
          l1: 'Input Shaping Resonance Compensation, Pressure Advance Calibration & Remote Print Farm Orchestration',
          l2: 'Precision Metrology with Digital Calipers, Micrometers, Dial Indicators & Statistical Process Control',
          deliverable: 'Print Farm Production Throughput Architecture & Dimensional QA Inspection Protocol',
        },
        {
          theme: 'Commercial Hardware Product Launch, Packaging Engineering & Client Fabrication Pitch',
          l1: 'Photorealistic Ray-Traced Product Rendering, Exploded Assembly Animations & Packaging Inserts',
          l2: 'Unit Costing (Material, Machine Depreciation, Labor), Quotation Engines & Commercial Delivery',
          deliverable: 'Commercial Digital Fabrication Portfolio, Costing Model & Client Manufacturing Proposal',
        },
      ],
    },
    content: {
      1: [
        {
          theme: 'Prompt Engineering Architecture, Persona Framing & High-Conversion Copywriting',
          l1: 'Deterministic Prompt Schemas: System Personas, Few-Shot Examples, Delimiters & Temperature Control',
          l2: 'Omnichannel Brand Copywriting, SEO Semantic Mapping & Cultural Resonance for African/Global Markets',
          deliverable: '5-Stage Brand Prompt Library & Complete Multi-Channel Marketing Copy Suite',
        },
        {
          theme: 'Generative Visual Art Direction, Diffusion Models & Commercial Brand Assets',
          l1: 'Latent Diffusion Mechanics, Camera Optics Descriptors, Lighting Taxonomies & Negative Prompts',
          l2: 'Consistent Character/Product Reference Workflows & Production Layout Compositing in Figma/Canva',
          deliverable: 'High-Resolution Commercial Ad Campaign Pack with Consistent Brand Visual Identity',
        },
        {
          theme: 'AI Video Synthesis, Neural Voice Cloning & Digital Media Monetization',
          l1: 'Text-to-Video & Image-to-Video Storyboarding, Camera Motion Control & Temporal Continuity',
          l2: 'Multilingual Neural Voiceovers, Audio Soundscapes & Freelance/Agency Retainer Packaging',
          deliverable: '60-Second Commercial AI Video Showcase & Client Retainer Pitch Deck',
        },
        {
          theme: 'Semantic Search Engine Optimization (SEO), AI Keyword Clustering & Search Visibility',
          l1: 'Entity-Based Semantic SEO, AI-Powered Keyword Intent Clustering & Content Gap Auditing',
          l2: 'Programmatic Long-Form Article Generation, Schema Markup & On-Page Technical Optimization',
          deliverable: 'Comprehensive 90-Day Organic Search Growth Blueprint & 10 AI-Optimized Pillar Articles',
        },
        {
          theme: 'Paid Performance Advertising, AI Creative Variants & Multi-Platform Campaign Scaling',
          l1: 'Meta & Google Ads Advantage+ AI Algorithms, Creative Fatigue Management & Dynamic Ad Sets',
          l2: 'High-Converting Video Ad Scripting, Visual Hook Testing & ROAS Telemetry Tracking',
          deliverable: 'Omnichannel Paid Advertising Campaign Architecture, Ad Creative Matrix & ROAS Model',
        },
        {
          theme: 'Marketing Funnel Automation, AI Chatbots, Email Nurture Sequences & Client Retainers',
          l1: 'Automated Lead Magnets, AI Conversational Chatbots & Automated Email Nurturing Workflows',
          l2: 'CRM Integration, Conversion Rate Optimization (CRO) & Packaging Freelance/Agency Retainers',
          deliverable: 'End-to-End Automated Customer Acquisition Funnel & Client Retainer Proposal Deck',
        },
      ],
      2: [
        {
          theme: 'Advanced Multi-Step Prompt Chaining, Custom Knowledge Bases & Automated Editorial Engines',
          l1: 'Chain-of-Thought Prompting, Retrieval-Augmented Brand Context & Tone Consistency Audits',
          l2: 'Automated Content Repurposing Pipelines (Video Transcript to 20+ Multi-Platform Assets)',
          deliverable: 'Automated Omnichannel Editorial System & 30-Day Content Matrix',
        },
        {
          theme: 'ControlNet Spatial Conditioning, Product Mockup Studios & Vector Brand Systems',
          l1: 'Pose Estimation, Depth Maps, Edge Conditioning & Photorealistic E-Commerce Product Staging',
          l2: 'Neural Super-Resolution Upscaling, Raster-to-Vector SVG Conversion & Print-Ready CMYK Prepress',
          deliverable: 'Complete E-Commerce Visual Catalog & Print/Digital Brand Identity Guideline Book',
        },
        {
          theme: 'Avatar Digital Twins, Lip-Sync Localization & High-Retention Short-Form Video Production',
          l1: 'Custom AI Spokesperson Avatars, Multi-Language Lip-Sync Dubbing & Retention Hook Scripting',
          l2: 'Dynamic Captions, Sound Design Mastering & Analytics-Driven Content Optimization',
          deliverable: 'Localized Multi-Language Commercial Video Series & Audience Retention Audit',
        },
      ],
      3: [
        {
          theme: 'No-Code/Low-Code Media Automation Workflows (Make/Zapier/APIs) & Programmatic Publishing',
          l1: 'Connecting LLM APIs, Image Generators, and Airtable/Notion CMS via Automated Webhooks',
          l2: 'Human-in-the-Loop Quality Gates, Error Handling & Cost-Per-Generation Optimization',
          deliverable: 'End-to-End Autonomous Content Production Webhook Pipeline & Architecture Diagram',
        },
        {
          theme: 'Custom LoRA Fine-Tuning, Brand Style Models & Advanced Compositing',
          l1: 'Curating Training Datasets, Captioning & Training Custom Style/Product LoRA Weights',
          l2: 'Inpainting, Outpainting, VFX Compositing & Color Grading for Broadcast Commercials',
          deliverable: 'Custom Brand Visual Model Specification & Broadcast-Quality Commercial Spot',
        },
        {
          theme: 'Data-Driven Growth Marketing, Conversion Funnel Analytics & Ethical AI Governance',
          l1: 'A/B Testing Creative Variants, CTR/ROAS Attribution & Landing Page Conversion Optimization',
          l2: 'Synthetic Media Copyright Law, Likeness Consent Contracts & Watermarking Compliance',
          deliverable: 'Full-Funnel Growth Campaign Report & Enterprise AI Media Compliance Framework',
        },
      ],
      4: [
        {
          theme: 'Enterprise AI Media Agency Architecture, Multi-Agent Creative Workflows & Operations',
          l1: 'Orchestrating Multi-Agent Research, Scripting, Design, and QA Pipelines for Enterprise Clients',
          l2: 'Standard Operating Procedures (SOPs), Creative Asset Management & Team Review Portals',
          deliverable: 'Enterprise AI Creative Studio Operating System & Multi-Agent Workflow Blueprint',
        },
        {
          theme: 'High-Ticket B2B Client Acquisition, Retainer Economics & Global Talent Positioning',
          l1: 'Structuring ₦500k–₦2M/Month Corporate Media Retainers, Scope of Work & SLA Contracts',
          l2: 'Executive Brand Positioning, Case Study Packaging & International Client Onboarding',
          deliverable: 'Complete B2B Agency Commercial Kit, Pricing Calculator & Live Client Case Study',
        },
        {
          theme: 'Executive Creative Direction, Multi-Channel Flagship Campaign Execution & Defense',
          l1: 'Directing Integrated Brand Launches Across Video, Web, Print, and Interactive Channels',
          l2: 'Measuring Brand Lift, ROI Reporting & Presenting to Executive Stakeholders',
          deliverable: 'Flagship Multi-Modal Commercial Campaign Portfolio & Executive Board Defense',
        },
      ],
    },
  };

  const selectedDomain = domainThemes[domainKey];
  const primaryTemplates = selectedDomain ? selectedDomain[lvlNum] || selectedDomain[1] || [] : [];
  // Strictly prevent advanced levels (2, 3, 4) from borrowing Level 1 beginner units!
  const nextTierTemplates = selectedDomain
    ? (lvlNum === 1
        ? [...(selectedDomain[2] || []), ...(selectedDomain[3] || [])]
        : lvlNum === 2
        ? [...(selectedDomain[3] || []), ...(selectedDomain[4] || [])]
        : lvlNum === 3
        ? [...(selectedDomain[4] || []), ...(selectedDomain[2] || [])]
        : [...(selectedDomain[3] || [])])
    : [];

  // Deduplicate templates by theme so no two units in the same course ever repeat a title
  const seenThemes = new Set<string>();
  const uniqueTemplates: Array<{ theme: string; l1: string; l2: string; deliverable: string }> = [];
  for (const item of [...primaryTemplates, ...nextTierTemplates]) {
    if (item && !seenThemes.has(item.theme)) {
      seenThemes.add(item.theme);
      uniqueTemplates.push(item);
    }
  }

  // Level-differentiated progressive fallbacks: guarantees Level 4 never gets Level 1 beginner fallbacks!
  const getLevelFallbackThemes = (lvl: number) => {
    if (lvl === 4) {
      return [
        {
          theme: `${programTitle} Enterprise Systems Architecture & High-Availability SLAs`,
          l1: `Architectural Principles, Fault Tolerance & Enterprise SLAs for ${programTitle}`,
          l2: `High-Availability Multi-Region Deployment, Load Balancing & Zero-Downtime Migration`,
          deliverable: `Enterprise High-Availability Architecture Specification & SLA Compliance Dossier`,
        },
        {
          theme: `${programTitle} Production Observability, Automated CI/CD & Security Hardening`,
          l1: `Continuous Delivery: Automated Testing Pipelines, Security Linting & Artifact Signing`,
          l2: `Production Telemetry: Distributed Tracing, Real-Time Alerting & Incident Runbooks`,
          deliverable: `Production Automated Deployment Pipeline & Telemetry Monitoring Dashboard Suite`,
        },
        {
          theme: `${programTitle} High-Concurrency Optimization & Extreme Load Scaling`,
          l1: `Profiling System Bottlenecks, Memory Footprints & Asynchronous Event Processing`,
          l2: `Distributed Caching Strategies, Database Connection Pooling & Latency Optimization`,
          deliverable: `System Stress-Testing Benchmark Report Demonstrating 5x Throughput Improvement`,
        },
        {
          theme: `${programTitle} Enterprise Governance, Regulatory Compliance & Team Workflows`,
          l1: `Security Auditing, OWASP Hardening, Role-Based Access Control & Compliance Standards`,
          l2: `Collaborative Code Governance, Architectural Review Protocols & Technical Mentorship`,
          deliverable: `Comprehensive Enterprise Compliance Audit & Production Runbook Documentation`,
        },
        {
          theme: `${programTitle} Production Capstone Architecture & Defense Brief`,
          l1: `Integrating Production-Grade Systems with End-to-End Enterprise Requirements`,
          l2: `Peer System Architecture Review, Code Quality Gates & Deployment Verification`,
          deliverable: `Production-Grade System Architecture Blueprint Ready for Defense`,
        },
        {
          theme: `${programTitle} Industry Portfolio Showcase & Technical Hire-Readiness`,
          l1: `Structuring Enterprise Engineering Portfolios, Live Demonstration & Technical Writing`,
          l2: `Senior Engineering Interview Defense, System Design Review & Career Readiness`,
          deliverable: `Hire-Ready Professional Portfolio Package with Live Deployment and Defense Deck`,
        },
      ];
    }

    if (lvl === 3) {
      return [
        {
          theme: `${programTitle} Advanced Systems Modeling & Distributed Frameworks`,
          l1: `Advanced Framework Architecture, Component Lifecycles & Design Patterns in ${programTitle}`,
          l2: `Designing Modular Multi-Layer Systems with Decoupled Service Boundaries`,
          deliverable: `Modular Multi-Layer System Architecture Blueprint & Interface Contract Specs`,
        },
        {
          theme: `${programTitle} Relational Data Persistence, Schema Engineering & ORM Optimization`,
          l1: `Relational Data Modeling, Normalization, Complex Entity Relationships & Migrations`,
          l2: `Query Optimization, Database Indexing, Connection Pools & Mitigating N+1 Query Traps`,
          deliverable: `Production-Grade Relational Schema and Benchmark-Optimized Query Layer`,
        },
        {
          theme: `${programTitle} Asynchronous Messaging, Task Queues & Event-Driven Workflows`,
          l1: `Event-Driven Architecture: Message Brokers, Pub/Sub Patterns & Background Task Queues`,
          l2: `Worker Orchestration: Scheduled Periodic Jobs, Task Retries & Idempotent Handlers`,
          deliverable: `Asynchronous Background Worker Pipeline with Broker Integration and Error Handling`,
        },
        {
          theme: `${programTitle} Multi-Tier Testing: Unit, Integration & End-to-End Test Automation`,
          l1: `Automated Test Suites: Mocking External Dependencies, Fixtures & Regression Assertions`,
          l2: `Integration Testing: Testing Database Transactions, Service APIs & Coverage Profiling`,
          deliverable: `Comprehensive Automated Test Suite Achieving Over 85% Code Coverage Verification`,
        },
        {
          theme: `${programTitle} Containerization & Multi-Service Environment Orchestration`,
          l1: `Writing Production Container Specifications, Dependency Isolation & Environment Security`,
          l2: `Orchestrating Multi-Container Services with Networking, Volumes & Health Checks`,
          deliverable: `Multi-Container Orchestration Environment with Automated Health Verification`,
        },
        {
          theme: `${programTitle} Advanced Capstone Synthesis & Architectural Design Review`,
          l1: `Synthesizing Multi-Service Systems into a Cohesive Production Architecture`,
          l2: `Architectural Review, Performance Benchmarking & Pre-Defense Preparation`,
          deliverable: `Advanced Architectural System Package with Comprehensive Documentation`,
        },
      ];
    }

    if (lvl === 2) {
      return [
        {
          theme: `${programTitle} Algorithmic Data Structures, Core Protocols & Logic Architecture`,
          l1: `Core Data Structures, Time/Space Efficiency & Algorithmic Problem Solving in ${programTitle}`,
          l2: `Network & Application Protocols: Request-Response Lifecycles, Client/Server Mechanics & Sockets`,
          deliverable: `Benchmarked Algorithm Suite & Protocol Inspection Test Log`,
        },
        {
          theme: `${programTitle} Modular Service Architecture & RESTful API Engineering`,
          l1: `RESTful Architecture: Resource URIs, HTTP Verbs, Status Codes & Data Contracts`,
          l2: `Implementing Modular Route Handlers, Request Payload Parsing & Schema Validation`,
          deliverable: `Modular Production REST Service with Strict Data Schema Validation`,
        },
        {
          theme: `${programTitle} Web Security Essentials, Authentication & Session Defense`,
          l1: `Security Fundamentals: TLS/SSL Handshakes, CORS Policies, Headers & Token Authentication`,
          l2: `Defensive Programming: Input Sanitization, Role-Based Access Guards & Error Handling`,
          deliverable: `Authenticated API Service with Cryptographic Verification and Defensive Middleware`,
        },
        {
          theme: `${programTitle} Subsystem Integration, Automated Testing & Diagnostic Tracing`,
          l1: `Subsystem Wiring: Interfacing Internal Modules, State Management & Diagnostic Logging`,
          l2: `Automated Test Fixtures: Unit Testing, Mock Assertions & Runtime Error Diagnostics`,
          deliverable: `Integrated Multi-Module Subsystem with Automated Unit and Diagnostic Test Logs`,
        },
        {
          theme: `${programTitle} Database Connectivity, CRUD Operations & Data Serialization`,
          l1: `Connecting Applications to Relational Datastores, Connection Lifecycles & Parametric Queries`,
          l2: `Data Serialization: JSON/Binary Schemas, Structured Query Output & Model Mapping`,
          deliverable: `Working Database Data Access Layer with Verified CRUD Functionality`,
        },
        {
          theme: `${programTitle} Applied Intermediate Milestone & Practical Portfolio Showcase`,
          l1: `Integrating Intermediate Subsystems into a Working Functional Prototype`,
          l2: `Code Quality Verification, Refactoring Best Practices & Documentation Standards`,
          deliverable: `Functional Intermediate Prototype Package with Source Code and Verification Report`,
        },
      ];
    }

    // Level 1: Foundations
    return [
      {
        theme: `${programTitle} Foundations, Architecture & Toolchain Setup`,
        l1: `Core Principles, Industry Standards & System Architecture of ${programTitle}`,
        l2: `Workstation Setup, Safety Guardrails & Baseline Practical Verification`,
        deliverable: `Baseline Architecture Diagram & Environment Verification Report`,
      },
      {
        theme: `${programTitle} Core Subsystem Implementation & Component Workflows`,
        l1: `Designing and Implementing Core Functional Modules in ${programTitle}`,
        l2: `Interfacing Subsystems, Signal/Data Validation & Guided Laboratory Build`,
        deliverable: `Working Core Subsystem Prototype & Integration Test Log`,
      },
      {
        theme: `${programTitle} Diagnostic Instrumentation, Debugging Workflows & Precision Testing`,
        l1: `Systematic Fault Isolation, Instrumentation Probing & Error Tracing`,
        l2: `Stress-Testing, Telemetry Capture & Bottleneck Resolution`,
        deliverable: `Diagnostic Root-Cause Analysis Report & Calibrated Measurement Log`,
      },
      {
        theme: `${programTitle} Multi-Module Integration, Automation & Quality Verification`,
        l1: `Orchestrating Multi-Component Workflows & Automated Quality Gates`,
        l2: `Fault-Tolerant Design Patterns, Redundancy & Edge-Case Handling`,
        deliverable: `Integrated Multi-Module System & Automated Verification Suite`,
      },
      {
        theme: `${programTitle} Security Hardening, Preventive Maintenance & Standard Operating Procedures`,
        l1: `Vulnerability Auditing, Safety Compliance & Preventive Maintenance Protocols`,
        l2: `Standard Operating Procedures (SOPs), Service Level Agreements & Documentation`,
        deliverable: `Security & Compliance Audit Checklist and Preventive Maintenance SOP`,
      },
      {
        theme: `${programTitle} Foundation Capstone Synthesis & Practical Portfolio Demonstration`,
        l1: `End-to-End Performance Tuning, Cost/Efficiency Optimization & Packaging`,
        l2: `Pre-Capstone System Integration, Peer Design Review & Defense Preparation`,
        deliverable: `Foundation Capstone System Package & Readiness Brief`,
      },
    ];
  };

  const progressiveFallbackThemes = getLevelFallbackThemes(lvlNum);

  const blueprints: UnitBlueprint[] = [];

  for (let u = 1; u <= unitCount; u++) {
    const tpl =
      uniqueTemplates[u - 1] ||
      progressiveFallbackThemes[(u - 1) % progressiveFallbackThemes.length];
    const levelBadge = LEVEL_META[levelCode]?.shortLabel || 'Level 1 — Foundation';

    const unitTheme = tpl.theme;
    const l1Title = tpl.l1;
    const l2Title = tpl.l2;
    const deliverable = tpl.deliverable;

    blueprints.push({
      unitTheme,
      unitSummary: `This unit equips learners at ${levelBadge} with rigorous theoretical grounding and hands-on practical mastery in ${unitTheme}. Learners will study the unit overview, complete two core video-supported instructional lessons, participate in the weekly physical/hybrid laboratory session, submit the graded unit assignment, and validate their mastery through the Unit ${u} Self-Quiz.`,
      lesson1Title: l1Title,
      lesson1Focus: `Architectural principles, technical standards, and step-by-step operational mechanics for ${l1Title}.`,
      lesson2Title: l2Title,
      lesson2Focus: `Applied laboratory implementation, diagnostic verification, and real-world deployment for ${l2Title}.`,
      labSessionTitle: `Weekly Physical / Hybrid Lab Session — Unit ${u}: ${unitTheme}`,
      assignmentTitle: `Unit ${u} Graded Assignment: ${deliverable.split('&')[0].trim()}`,
      assignmentDeliverable: deliverable,
      quizTitle: `Self-Quiz — Unit ${u}: ${unitTheme.split(',')[0]}`,
      quizQuestions: [
        {
          id: `u${u}-q1`,
          question: `In the context of Unit ${u} (${unitTheme}), what is the primary engineering purpose of establishing verifiable baseline specifications before executing implementation?`,
          options: [
            'To guarantee reproducibility, prevent fault cascades, and validate outputs against measurable industry tolerances',
            'To bypass safety and quality assurance checks during production deployment',
            'To eliminate the need for documentation or version control',
            'To restrict the system to unverified manual guesswork',
          ],
          correctAnswer: 'To guarantee reproducibility, prevent fault cascades, and validate outputs against measurable industry tolerances',
          explanation: `At ${levelBadge}, professional engineering requires deterministic baselines so every modification can be measured and verified against target specifications.`,
        },
        {
          id: `u${u}-q2`,
          question: `When completing the practical workflow for "${l1Title}", which diagnostic practice best ensures operational reliability?`,
          options: [
            'Incremental component testing and systematic verification at each stage of the workflow',
            'Deploying the entire system without testing any intermediate sub-components',
            'Ignoring warning telemetry until a complete system failure occurs',
            'Relying solely on theoretical assumptions without physical or runtime verification',
          ],
          correctAnswer: 'Incremental component testing and systematic verification at each stage of the workflow',
          explanation: 'Incremental stage-gate verification isolates defects early and prevents compound failures in complex systems.',
        },
        {
          id: `u${u}-q3`,
          question: `How does the curated video lecture in Unit ${u} directly support your "${l2Title}" laboratory deliverable?`,
          options: [
            'It demonstrates the industry-standard tool workflow, safety/quality guardrails, and troubleshooting techniques required for the lab',
            'It replaces the need to complete the hands-on practical assignment',
            'It covers unrelated historical trivia with no practical application',
            'It only applies to non-technical observers',
          ],
          correctAnswer: 'It demonstrates the industry-standard tool workflow, safety/quality guardrails, and troubleshooting techniques required for the lab',
          explanation: 'Every curated Watch video in the STEMPACT Learning Studio is mapped directly to the unit learning outcomes and practical lab sprint.',
        },
        {
          id: `u${u}-q4`,
          question: `Before submitting the Unit ${u} Assignment (${deliverable.slice(0, 60)}...), what must be verified against the evaluation rubric?`,
          options: [
            'Functional completeness, clear technical documentation, adherence to safety/architectural standards, and reproducible evidence',
            'Only the file name of the submission',
            'Submitting an empty placeholder without testing',
            'Copying unverified templates without customization or testing',
          ],
          correctAnswer: 'Functional completeness, clear technical documentation, adherence to safety/architectural standards, and reproducible evidence',
          explanation: 'STEMPACT competency-based grading evaluates both working technical execution and professional engineering documentation.',
        },
      ],
    });
  }

  return blueprints;
}

/**
 * Builds a complete UoPeople-Inspired Course Structure for a specific Program and Academic Level:
 * - Module 0: Course Introduction (Welcome, Course Overview & CLOs Blueprint, Syllabus & Physical Class Schedule, Assessment Policy, Resources, Navigating Studio)
 * - Modules 1..W: Weekly Learning Units (Unit X Overview & Outcomes, Core Lesson X.1 + Watch, Core Lesson X.2 + Watch, Weekly Physical Class Guide, Assignment Activity, Self-Quiz, Unit X Conclusion)
 * - Module W+1: Final Level Project & Certificate Issuance (Project Overview, Project Architecture & Rubric, Project Submission Guide, Level Completion & Certificate Gate)
 */
export function buildUoPeopleStructuredCourse(params: {
  programTitle: string;
  programCode?: string;
  schoolCode?: string;
  durationWeeks?: number;
  levelStr?: string;
  keywords?: string;
  description?: string;
  tools?: string[];
}) {
  const {
    programTitle,
    programCode = 'STP-PRG',
    schoolCode = 'SCSE',
    durationWeeks = 7,
    levelStr = 'LEVEL_1_FOUNDATION',
    keywords = '',
    description = '',
    tools = [],
  } = params;

  const normalizedLevel = normalizeAcademicLevel(levelStr);
  const lvlMeta = LEVEL_META[normalizedLevel] || LEVEL_META.LEVEL_1_FOUNDATION;
  const domainKey = resolveDomainKey(programTitle, schoolCode, `${keywords} ${description}`);

  // Guarantee at least 6 distinct weekly learning units + Course Intro + Final Project Unit (8+ total units)
  const rawWeeks = Math.max(7, durationWeeks && durationWeeks >= 7 ? durationWeeks : 7);
  const learningUnitsCount = Math.min(8, Math.max(6, rawWeeks - 1));
  const finalProjectUnitNumber = learningUnitsCount + 1;

  const unitBlueprints = getDomainLevelUnitBlueprints(
    domainKey,
    programTitle,
    normalizedLevel,
    learningUnitsCount
  );

  const courseLearningObjectives = [
    `CLO 1: Demonstrate rigorous mastery of ${programTitle} principles at the ${lvlMeta.shortLabel} standard (${lvlMeta.pedagogicalDepth}).`,
    `CLO 2: Execute end-to-end hands-on laboratory workflows for ${unitBlueprints.map((b) => b.unitTheme.split(',')[0]).join('; ')}.`,
    `CLO 3: Diagnose, troubleshoot, and optimize real-world systems using professional instrumentation, industry toolchains, and safety/governance protocols.`,
    `CLO 4: Design, document, and defend a production-grade ${lvlMeta.shortLabel} Final Project solving a high-impact technical challenge in the Nigerian and global ecosystem.`,
  ];

  const introVideo = getCuratedVideoForLesson({
    programName: programTitle,
    programCode,
    schoolCode,
    moduleTitle: `Course Introduction — ${programTitle}`,
    lessonTitle: `Overview & Foundations of ${programTitle}`,
    level: normalizedLevel,
    weekIdx: 0,
    lessonIdx: 0,
  });

  const syllabusTableMarkdown = [
    `| Unit | Schedule | Unit Title & Core Focus | Graded Deliverables |`,
    `| :--- | :--- | :--- | :--- |`,
    `| **Course Intro** | Orientation | Course Introduction, Syllabus, Lab Safety & Learning Studio Setup | Orientation Checklist |`,
    ...unitBlueprints.map(
      (b, idx) =>
        `| **Unit ${idx + 1}** | Week ${idx + 1} | **${b.unitTheme}** | Unit ${idx + 1} Lab Assignment & Self-Quiz |`
    ),
    `| **Unit ${finalProjectUnitNumber} (Final)** | Final Week | **Final Level Project & Certificate of Completion Issuance** | Final ${lvlMeta.shortLabel} Project & Certificate Gate |`,
  ].join('\n');

  // =========================================================================
  // MODULE 0: COURSE INTRODUCTION
  // =========================================================================
  const courseIntroModule = {
    title: `Course Introduction`,
    description: `Essential academic orientation, comprehensive Course Overview & Learning Objectives blueprint, weekly physical/hybrid syllabus schedule, grading policy, and tool environment setup for ${programTitle} (${lvlMeta.shortLabel}).`,
    durationHours: 4,
    order: 0,
    assessmentQuiz: `Orientation Readiness Check`,
    assignmentTitle: `Orientation & Lab Environment Verification`,
    lessons: [
      {
        title: `Welcome to ${programTitle} (${lvlMeta.shortLabel})`,
        contentSummary: `Executive welcome, institutional mission, and how this ${lvlMeta.shortLabel} course fits into the STEMPACT 4-Tier Academic Progression Model.`,
        interactiveLabType: 'COURSE_WELCOME',
        videoUrl: introVideo.embedUrl,
        videoDurationMin: introVideo.durationMin,
        videoSummary: `${introVideo.citation} — ${introVideo.learningExpectations}`,
        resources: JSON.stringify({
          lessonType: 'COURSE_WELCOME',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
          videoCitation: introVideo.citation,
          videoTitle: introVideo.title,
          videoChannel: introVideo.channel,
          videoExpectations: introVideo.learningExpectations,
          learningOutcomes: courseLearningObjectives,
        } satisfies LessonResourceMetadata),
        content: `### Welcome to ${programTitle} — ${lvlMeta.displayName}

Welcome to **STEMPACT Academy**! You are enrolled in **${programTitle}** at **${lvlMeta.displayName}**. Our learning model combines structured digital academic units (inspired by top global university online learning portals) with intensive **weekly physical and hybrid laboratory sessions** at your designated STEMPACT Learning Center.

### Where This Level Fits in Your 4-Tier Academic Journey
STEMPACT Academy operates a standardized **4-Tier Core Academic Progression Pathway**:
- **Diagnostic Intake Assessment**: Evaluates baseline aptitude to place learners into the right starting tier.
- **Level 1 — Foundation**: Core principles, safety protocols, foundational toolchains, and guided builds.
- **Level 2 — Intermediate**: Multi-component integration, instrumentation, debugging, and applied engineering.
- **Level 3 — Advanced**: Complex architecture, board/cloud-level fault isolation, optimization, and reliability.
- **Level 4 — Specialist / Mastery**: Enterprise production mastery, SLA governance, and commercial capstone defense.
- **Post-Academic Venture Lab & Innovation Hub**: Optional R&D prototyping and startup commercialization accelerator for graduates.

### Current Level Scope (${lvlMeta.shortLabel})
- **Pedagogical Depth**: ${lvlMeta.pedagogicalDepth}.
- **Prerequisites**: ${lvlMeta.prerequisitesText}
- **Theory-to-Practical Ratio**: **30% Structured Theory : 70% Hands-On Laboratory Practice**.`,
        practicalActivities: [
          `Complete your Learner Profile verification and confirm your assigned cohort schedule in the Timetable tab.`,
        ],
      },
      {
        title: `Course Overview & Learning Objectives`,
        contentSummary: `Master academic blueprint detailing the course narrative, numbered Course Learning Objectives (CLOs), and how every subsequent unit builds upon this overview.`,
        interactiveLabType: 'COURSE_OVERVIEW',
        resources: JSON.stringify({
          lessonType: 'COURSE_OVERVIEW',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
          learningOutcomes: courseLearningObjectives,
        } satisfies LessonResourceMetadata),
        content: `### 1. Comprehensive Course Overview
**${programTitle} (${lvlMeta.shortLabel})** is an intensive, competency-driven engineering course designed to transform learners from theoretical understanding into verifiable practical mastery. ${description || `Throughout this level, you will master ${lvlMeta.pedagogicalDepth.toLowerCase()} through structured weekly units, curated video lectures, physical lab sprints, and graded engineering deliverables.`}

This **Course Overview** serves as the **authoritative curriculum blueprint** for all subsequent learning units in this course. Each weekly unit (Units 1 through ${learningUnitsCount}) and the **Final Level Project (Unit ${finalProjectUnitNumber})** directly maps back to the Course Learning Objectives defined below. *(Academic Administrators and Lead Faculty can refine and customize this overview at any time in the Curriculum Console.)*

### 2. Course Learning Objectives (CLOs)
Upon successful completion of **${programTitle} (${lvlMeta.shortLabel})**, you will be able to:
${courseLearningObjectives.map((clo, i) => `${i + 1}. **${clo}**`).join('\n')}

### 3. How Subsequent Units Are Built on This Overview
${unitBlueprints
  .map(
    (b, idx) =>
      `- **Unit ${idx + 1} (${b.unitTheme})**: Advances **CLO 1, CLO 2 & CLO 3** through two video-anchored core lessons (*${b.lesson1Title}* and *${b.lesson2Title}*), a supervised physical laboratory session, and a graded practical assignment.`
  )
  .join('\n')}
- **Unit ${finalProjectUnitNumber} (Final Level Project & Certificate Issuance)**: Synthesizes **CLO 1–4** into a comprehensive **${lvlMeta.shortLabel} Final Project**, culminating in your official **Certificate of Completion** for this level.`,
        practicalActivities: [
          `Review the 4 Course Learning Objectives (CLOs) and note which industry competency you are most excited to master this term.`,
        ],
      },
      {
        title: `Course Syllabus & Weekly Physical/Hybrid Class Schedule`,
        contentSummary: `Week-by-week syllabus breakdown, unit progression map, and physical/hybrid laboratory attendance schedule.`,
        interactiveLabType: 'COURSE_SYLLABUS',
        resources: JSON.stringify({
          lessonType: 'COURSE_SYLLABUS',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### 1. Structured Weekly Syllabus Map
Every week in **${programTitle} (${lvlMeta.shortLabel})** corresponds to a dedicated **Learning Unit**. You are expected to complete the digital reading and **Watch** video lectures prior to attending your scheduled weekly physical/hybrid laboratory session.

${syllabusTableMarkdown}

### 2. Weekly Physical & Hybrid Class Schedule
- **Pre-Class Preparation (Self-Paced Digital Studio)**: Study the *Unit Overview*, *Core Lessons*, and *Curated Watch Videos* before your live lab session.
- **Live Physical / Hybrid Lab Session**: Attend your cohort's scheduled weekly laboratory session at your designated **STEMPACT Learning Center** (or Virtual Global Campus room). Your instructor will record attendance in real time.
- **Post-Lab Deliverable & Self-Quiz**: Submit your *Unit Assignment* and complete the interactive *Unit Self-Quiz* before the end of the week.`,
        practicalActivities: [
          `Synchronize your cohort's weekly physical class schedule with your personal calendar and verify your Learning Center room assignment.`,
        ],
      },
      {
        title: `Assessment, Graded Quizzes & Project Grading Policy`,
        contentSummary: `Institutional grading weights, unit assignments, self-quizzes, attendance thresholds, and level completion certificate requirements.`,
        interactiveLabType: 'COURSE_ASSESSMENT_POLICY',
        resources: JSON.stringify({
          lessonType: 'COURSE_ASSESSMENT_POLICY',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### 1. Competency-Based Grading Breakdown
STEMPACT Academy evaluates learners on verifiable practical output rather than rote memorization. Your overall grade and level completion readiness in **${programTitle} (${lvlMeta.shortLabel})** are governed by four pillars:

| Evaluation Component | Weight | Minimum Requirement for Level Certificate |
| :--- | :--- | :--- |
| **1. Lesson & Unit Engagement** | **20%** | **100% of Course Lessons & Units Marked Completed** |
| **2. Weekly Unit Assignments & Labs** | **30%** | Submission & passing evaluation of weekly practical assignments |
| **3. Physical / Hybrid Lab Attendance** | **20%** | Minimum **75% Verified Attendance** across scheduled cohort sessions |
| **4. Final Level Project (Unit ${finalProjectUnitNumber})** | **30%** | Approved Final Level Project submission & faculty evaluation |

### 2. Instructor-Created Assignments & Unit Quizzes
- **Unit Self-Quizzes**: Every learning unit includes an interactive **Self-Quiz & Knowledge Check** that provides instant feedback and explanation to reinforce your mastery.
- **Practical Assignments**: In addition to the built-in unit assignment briefs, your cohort instructor may publish customized **Graded Cohort Assignments** directly linked to your active cohort.
- **Certificate of Completion Gate**: Located at the end of **Unit ${finalProjectUnitNumber}**, the Certificate Terminal automatically verifies that all completion requirements are satisfied before issuing your verifiable **${lvlMeta.shortLabel} Certificate of Completion**.`,
        practicalActivities: [
          `Review the 4 completion pillars required to unlock your Level Certificate of Completion in Unit ${finalProjectUnitNumber}.`,
        ],
      },
      {
        title: `Tools, Lab Environment & Learning Resources`,
        contentSummary: `Required hardware/software toolchains, safety precautions, and reference documentation for ${programTitle}.`,
        interactiveLabType: 'COURSE_RESOURCES',
        resources: JSON.stringify({
          lessonType: 'COURSE_RESOURCES',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### 1. Required Workbench & Software Toolchain
To succeed in **${programTitle} (${lvlMeta.shortLabel})**, ensure you have access to the following tools (provided at STEMPACT physical laboratories and/or configured on your workstation):
- **Primary Domain Toolchain**: ${tools.length > 0 ? tools.join(', ') : `Industry-standard instrumentation, professional software environment, and diagnostic utilities for ${programTitle}`}.
- **Documentation & Portfolio Repository**: Structured lab notebook, GitHub/portfolio folder, and evidence capture tools (screenshots, schematic exports, or lab photos).

### 2. Laboratory Safety & Professional Conduct
- Always adhere to **STEMPACT Lab Safety Protocols** (including ESD protection for hardware/electronics labs, equipment sign-out procedures, and data privacy guardrails for software/AI labs).
- Cite all external documentation properly and ensure every submitted assignment represents your own authentic engineering work.`,
        practicalActivities: [
          `Verify that your workstation and laboratory toolkit are ready for Unit 1.`,
        ],
      },
      {
        title: `Navigating the STEMPACT Learning Studio`,
        contentSummary: `Step-by-step guide to completing lessons, watching curated videos, submitting assignments, and tracking unit completion.`,
        interactiveLabType: 'COURSE_NAVIGATION',
        resources: JSON.stringify({
          lessonType: 'COURSE_NAVIGATION',
          unitNumber: 0,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### How to Use Your Dual-Pane Learning Studio
1. **Left Unit Accordion Sidebar**: Displays **Course Introduction** followed by **Unit 1** through **Unit ${finalProjectUnitNumber}**. Each unit shows your live completion badge (e.g., \`2/7 Completed\` or \`Completed ✅\`).
2. **Reading & Watch Video Sections**: Core instructional lessons include a structured **Watch** box displaying the video's formal citation, duration, and a detailed **"What You Will Learn & How It Aligns with Unit Outcomes"** guide right above the embedded player.
3. **Automatic & Manual Lesson Completion**:
   - Click **"Mark Lesson Complete"** at the bottom of any lesson (or **"Complete & Continue to Next Lesson"**) to record your progress.
   - Completing a **Unit Self-Quiz** or submitting a **Unit Assignment** also automatically records your lesson progress!
4. **Instructor & Admin Engagement Tracking**: Your lesson and unit completion timestamps are synchronized in real time with your Cohort Instructor and Academic Administration dashboard.
5. **Final Unit Certificate Generation**: Once all units and the Final Project in **Unit ${finalProjectUnitNumber}** are complete, open the **Level Completion & Certificate Issuance** lesson to generate and download your official level certificate!`,
        practicalActivities: [
          `Click "Complete & Continue" below to finish the Course Introduction unit and advance to Unit 1!`,
        ],
      },
    ],
  };

  // =========================================================================
  // MODULES 1..W: WEEKLY LEARNING UNITS
  // =========================================================================
  const weeklyLearningModules = unitBlueprints.map((bp, idx) => {
    const unitNum = idx + 1;
    const vid1 = getCuratedVideoForLesson({
      programName: programTitle,
      programCode,
      schoolCode,
      moduleTitle: `Unit ${unitNum}: ${bp.unitTheme}`,
      lessonTitle: bp.lesson1Title,
      level: normalizedLevel,
      weekIdx: idx,
      lessonIdx: 0,
    });
    const vid2 = getCuratedVideoForLesson({
      programName: programTitle,
      programCode,
      schoolCode,
      moduleTitle: `Unit ${unitNum}: ${bp.unitTheme}`,
      lessonTitle: bp.lesson2Title,
      level: normalizedLevel,
      weekIdx: idx,
      lessonIdx: 1,
    });

    const unitOutcomes = [
      `ULO ${unitNum}.1: Explain the core architectural principles and technical specifications of ${bp.lesson1Title}.`,
      `ULO ${unitNum}.2: Execute the step-by-step practical workflow for ${bp.lesson2Title} at the ${lvlMeta.shortLabel} standard.`,
      `ULO ${unitNum}.3: Apply diagnostic verification, safety/quality guardrails, and troubleshooting techniques during the Unit ${unitNum} Physical Lab Session.`,
      `ULO ${unitNum}.4: Deliver and document the graded ${bp.assignmentTitle} meeting all rubric criteria.`,
    ];

    return {
      title: `Unit ${unitNum}: ${bp.unitTheme}`,
      description: bp.unitSummary,
      durationHours: 12,
      order: unitNum,
      assessmentQuiz: bp.quizTitle,
      assignmentTitle: bp.assignmentTitle,
      lessons: [
        // Lesson X.1: Unit X Overview & Learning Outcomes
        {
          title: `Unit ${unitNum} Overview & Learning Outcomes`,
          contentSummary: `Comprehensive introduction to Unit ${unitNum}, lesson-by-lesson breakdown, and measurable Unit Learning Outcomes (ULOs).`,
          interactiveLabType: 'UNIT_OVERVIEW',
          resources: JSON.stringify({
            lessonType: 'UNIT_OVERVIEW',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            learningOutcomes: unitOutcomes,
          } satisfies LessonResourceMetadata),
          content: `### 1. Welcome to Unit ${unitNum}: ${bp.unitTheme}
${bp.unitSummary}

### 2. Unit ${unitNum} Learning Outcomes (ULOs)
By the end of **Unit ${unitNum}**, you will be able to:
${unitOutcomes.map((o) => `- **${o}**`).join('\n')}

### 3. Unit ${unitNum} Lesson & Activity Breakdown
1. **Lesson ${unitNum}.1 — ${bp.lesson1Title}**: ${bp.lesson1Focus} *(Includes curated Watch video lecture & technical reading guide).*
2. **Lesson ${unitNum}.2 — ${bp.lesson2Title}**: ${bp.lesson2Focus} *(Includes curated Watch video demonstration & lab walkthrough).*
3. **Weekly Physical / Hybrid Class Session Guide**: Structured laboratory agenda and equipment checklist for your live cohort session.
4. **${bp.assignmentTitle}**: Graded hands-on deliverable (**${bp.assignmentDeliverable}**).
5. **${bp.quizTitle}**: Interactive 4-question knowledge check to verify your conceptual and practical mastery.
6. **Unit ${unitNum} Conclusion & Synthesis**: Summary of mastered competencies and preparation for Unit ${unitNum + 1}.`,
          practicalActivities: [
            `Review the Unit ${unitNum} Learning Outcomes above and prepare your lab notebook for Lesson ${unitNum}.1.`,
          ],
        },

        // Lesson X.2: Core Lesson X.1 (with UoPeople Watch Video Card)
        {
          title: `Lesson ${unitNum}.1: ${bp.lesson1Title}`,
          contentSummary: bp.lesson1Focus,
          interactiveLabType: 'CORE_LESSON',
          videoUrl: vid1.embedUrl,
          videoDurationMin: vid1.durationMin,
          videoSummary: `${vid1.citation} — ${vid1.learningExpectations}`,
          resources: JSON.stringify({
            lessonType: 'CORE_LESSON',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            videoCitation: vid1.citation,
            videoTitle: vid1.title,
            videoChannel: vid1.channel,
            videoExpectations: vid1.learningExpectations,
            learningOutcomes: [unitOutcomes[0], unitOutcomes[2]],
          } satisfies LessonResourceMetadata),
          content: `### 1. Core Architectural & Theoretical Foundations (${lvlMeta.shortLabel})
In **Lesson ${unitNum}.1**, we examine **${bp.lesson1Title}** within the context of **${programTitle} (${lvlMeta.shortLabel})**. At this academic tier, learners move beyond surface definitions to master ${lvlMeta.pedagogicalDepth.toLowerCase()}. Every component, signal path, or programmatic module must be understood in terms of its input specifications, transformation logic, operational tolerances, and failure modes.

### 2. Step-by-Step Technical Workflow & Implementation
1. **Baseline Specification & Inspection**: Before energizing hardware or executing code pipelines, establish a clean baseline and document initial system parameters.
2. **Guided Execution of ${bp.lesson1Title}**: Follow the structured methodology demonstrated in this lesson's **Watch** video lecture (*${vid1.title}* by *${vid1.channel}*). Observe how each parameter or physical interface is verified before advancing to the next step.
3. **Diagnostic Verification & Telemetry**: Record quantitative measurements (voltages, timings, logs, or dimensional tolerances) to confirm that your implementation satisfies industry standards.

### 3. Nigerian & Global Industry Application
Across Nigerian and international engineering environments—from enterprise infrastructure in Lagos and Ile-Ife to global production teams—mastery of **${bp.lesson1Title}** prevents costly downtime, eliminates systemic defects, and ensures compliance with professional quality benchmarks.`,
          practicalActivities: [
            `Watch the curated video lecture "${vid1.title}" (${vid1.durationMin} mins) and record 3 key technical takeaways in your engineering log.`,
            `Complete the guided baseline verification exercise for ${bp.lesson1Title}.`,
          ],
        },

        // Lesson X.3: Core Lesson X.2 (with UoPeople Watch Video Card)
        {
          title: `Lesson ${unitNum}.2: ${bp.lesson2Title}`,
          contentSummary: bp.lesson2Focus,
          interactiveLabType: 'CORE_LESSON',
          videoUrl: vid2.embedUrl,
          videoDurationMin: vid2.durationMin,
          videoSummary: `${vid2.citation} — ${vid2.learningExpectations}`,
          resources: JSON.stringify({
            lessonType: 'CORE_LESSON',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            videoCitation: vid2.citation,
            videoTitle: vid2.title,
            videoChannel: vid2.channel,
            videoExpectations: vid2.learningExpectations,
            learningOutcomes: [unitOutcomes[1], unitOutcomes[3]],
          } satisfies LessonResourceMetadata),
          content: `### 1. Applied Engineering & Practical Integration
Building directly upon Lesson ${unitNum}.1, **Lesson ${unitNum}.2** focuses on the hands-on execution of **${bp.lesson2Title}**. Here we bridge theory into practice by integrating subsystems, calibrating operational parameters, and stress-testing our implementation under realistic working conditions.

### 2. Laboratory Walkthrough & Troubleshooting Protocol
1. **Subsystem Configuration**: Configure your workspace and toolchains specifically for **${bp.lesson2Title}**.
2. **Applied Build & Calibration**: Follow the practical walkthrough in this lesson's **Watch** video (*${vid2.title}* by *${vid2.channel}*), paying special attention to how edge cases, tolerances, and common configuration errors are diagnosed and resolved.
3. **Quality Assurance Benchmark**: Validate your output against the Unit ${unitNum} performance checklist to ensure readiness for your graded Unit Assignment.

### 3. Preparing for Your Weekly Physical Lab & Assignment
Document all observations, configuration parameters, and test outputs from this lesson—you will use them directly during the **Unit ${unitNum} Physical Class Session** and in your **${bp.assignmentTitle}** submission.`,
          practicalActivities: [
            `Watch "${vid2.title}" (${vid2.durationMin} mins) and replicate the practical workflow in your lab environment.`,
            `Verify your output against the Unit ${unitNum} quality checklist before attending the physical lab session.`,
          ],
        },

        // Lesson X.4: Weekly Physical Class & Lab Session Guide
        {
          title: `Weekly Physical Class & Lab Session — Unit ${unitNum}`,
          contentSummary: `In-person / hybrid laboratory session guide, 3-hour workshop schedule, equipment checklist, and instructor attendance verification.`,
          interactiveLabType: 'PHYSICAL_CLASS_GUIDE',
          resources: JSON.stringify({
            lessonType: 'PHYSICAL_CLASS_GUIDE',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            physicalLabAgenda: [
              `00:00 – 00:30 | Instructor Briefing, Safety Check & Review of Unit ${unitNum} Core Concepts (${bp.lesson1Title})`,
              `00:30 – 02:00 | Supervised Hands-On Laboratory Sprint: ${bp.lesson2Title}`,
              `02:00 – 02:40 | Fault Injection, Diagnostic Troubleshooting & Peer Code/Hardware Review`,
              `02:40 – 03:00 | Lab Sign-Off, Attendance Verification & Unit ${unitNum} Assignment Q&A`,
            ],
          } satisfies LessonResourceMetadata),
          content: `### 1. Unit ${unitNum} Physical / Hybrid Laboratory Session Overview
Every week at **STEMPACT Academy**, digital study is reinforced by a supervised **Physical / Hybrid Laboratory Session** held at your cohort's designated Learning Center (or live virtual lab room).

- **Session Topic**: **${bp.labSessionTitle}**
- **Target Level**: **${lvlMeta.displayName}**
- **Attendance Policy**: Physical/hybrid session attendance is recorded by your Lead Instructor and contributes **20%** toward your level completion eligibility (minimum 75% required).

### 2. Structured 3-Hour Lab Workshop Agenda
1. **Phase 1 (30 Mins) — Technical Briefing & Safety Inspection**: Instructor-led review of *${bp.lesson1Title}*, workstation/ESD safety verification, and Q&A on the pre-class Watch videos.
2. **Phase 2 (90 Mins) — Supervised Hands-On Lab Sprint**: Practical bench/workstation execution of *${bp.lesson2Title}* with direct faculty mentorship.
3. **Phase 3 (40 Mins) — Diagnostic Troubleshooting & Verification**: Live debugging of edge cases, measurement verification, and peer inspection.
4. **Phase 4 (20 Mins) — Lab Sign-Off & Assignment Kickoff**: Instructor inspection of lab progress, attendance sign-off, and rubric walkthrough for **${bp.assignmentTitle}**.`,
          practicalActivities: [
            `Attend your scheduled Week ${unitNum} physical/hybrid class session and ensure your instructor marks your attendance.`,
            `Complete the in-lab practical verification checkpoint with your bench partner or instructor.`,
          ],
        },

        // Lesson X.5: Unit X Assignment Activity
        {
          title: bp.assignmentTitle,
          contentSummary: `Graded practical assignment for Unit ${unitNum}: ${bp.assignmentDeliverable}`,
          interactiveLabType: 'UNIT_ASSIGNMENT',
          resources: JSON.stringify({
            lessonType: 'UNIT_ASSIGNMENT',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            assignmentDeliverable: bp.assignmentDeliverable,
          } satisfies LessonResourceMetadata),
          content: `### 1. Assignment Overview & Deliverable Specification
In this graded practical assignment for **Unit ${unitNum} (${bp.unitTheme})**, you will synthesize what you learned in Lesson ${unitNum}.1, Lesson ${unitNum}.2, and the Weekly Physical Lab Session to produce a verifiable engineering deliverable.

- **Required Deliverable**: **${bp.assignmentDeliverable}**
- **Academic Level Standard**: **${lvlMeta.displayName}**

### 2. Step-by-Step Submission Instructions
1. Complete the practical build, diagnostic analysis, or implementation specified in the deliverable above.
2. Prepare your submission evidence package:
   - **Technical Summary / Documentation**: Explain your architecture, methodology, measurements/test results, and how you resolved any issues encountered.
   - **Verifiable Artifact Link or Upload**: Attach your project repository URL, CAD/schematic file, diagnostic report, or high-resolution lab photo/video evidence.
3. Submit your work using the **Submit Assignment** button below (or via the **Assignments & Projects** tab if your instructor has published a custom cohort assignment slot for Unit ${unitNum}).

### 3. Faculty Evaluation Rubric (100 Points)
| Criterion | Points | Evaluation Standard |
| :--- | :--- | :--- |
| **Technical Accuracy & Completeness** | **40 pts** | Deliverable functions accurately and satisfies all Unit ${unitNum} specifications. |
| **Practical Lab & Toolchain Execution** | **30 pts** | Demonstrates proper use of ${lvlMeta.shortLabel} tools, safety standards, and diagnostics. |
| **Documentation & Evidence Quality** | **20 pts** | Clear step-by-step explanation, measurements, and reproducible evidence. |
| **Professional Presentation** | **10 pts** | Organized formatting, proper terminology, and timely submission. |`,
          practicalActivities: [
            `Complete and verify your deliverable: ${bp.assignmentDeliverable}.`,
            `Submit your assignment evidence for instructor grading and feedback.`,
          ],
        },

        // Lesson X.6: Self-Quiz & Knowledge Check — Unit X
        {
          title: bp.quizTitle,
          contentSummary: `Interactive 4-question multiple-choice knowledge check evaluating Unit ${unitNum} learning outcomes.`,
          interactiveLabType: 'UNIT_QUIZ',
          resources: JSON.stringify({
            lessonType: 'UNIT_QUIZ',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            quizQuestions: bp.quizQuestions,
          } satisfies LessonResourceMetadata),
          content: `### Unit ${unitNum} Self-Quiz & Knowledge Check
Test your understanding of **Unit ${unitNum}: ${bp.unitTheme}** by completing the interactive multiple-choice quiz below.

- **Format**: 4 Multiple-Choice Questions mapped to **ULO ${unitNum}.1 – ULO ${unitNum}.4**.
- **Passing Threshold**: **75% (3/4 correct)** recommended.
- **Automatic Progress Tracking**: Submitting and passing the interactive quiz below automatically marks this quiz lesson as **Completed ✅**!`,
          practicalActivities: [
            `Answer all 4 questions in the interactive Self-Quiz runner below and review the explanations for each question.`,
          ],
        },

        // Lesson X.7: Unit X Conclusion & Synthesis
        {
          title: `Unit ${unitNum} Conclusion & Synthesis`,
          contentSummary: `Executive summary of concepts mastered in Unit ${unitNum}, self-reflection checklist, and bridge to Unit ${unitNum + 1}.`,
          interactiveLabType: 'UNIT_CONCLUSION',
          resources: JSON.stringify({
            lessonType: 'UNIT_CONCLUSION',
            unitNumber: unitNum,
            levelCode: normalizedLevel,
            levelDisplayName: lvlMeta.displayName,
            learningOutcomes: unitOutcomes,
          } satisfies LessonResourceMetadata),
          content: `### 1. What You Have Accomplished in Unit ${unitNum}
Congratulations on reaching the conclusion of **Unit ${unitNum}: ${bp.unitTheme}**! In this unit, you have:
- Studied the theoretical and architectural foundations of **${bp.lesson1Title}**.
- Completed the hands-on practical workflow for **${bp.lesson2Title}** supported by curated **Watch** video demonstrations.
- Participated in the **Unit ${unitNum} Physical / Hybrid Lab Session** and executed your graded **Unit ${unitNum} Assignment**.
- Validated your knowledge through the **${bp.quizTitle}**.

### 2. Self-Check Against Unit ${unitNum} Learning Outcomes
Before advancing, confirm that you can confidently perform each of the following:
${unitOutcomes.map((o) => `- [x] ${o}`).join('\n')}

### 3. Looking Ahead to Unit ${unitNum + 1}
${
  unitNum < learningUnitsCount
    ? `In **Unit ${unitNum + 1} (${unitBlueprints[unitNum].unitTheme})**, we will build directly upon the foundations established this week to tackle more advanced integration and diagnostic challenges.`
    : `In **Unit ${finalProjectUnitNumber} (Final Level Project & Certificate Issuance)**, you will synthesize everything you have mastered across Units 1–${learningUnitsCount} to deliver your **${lvlMeta.shortLabel} Final Project** and claim your official **Certificate of Completion**!`
}`,
          practicalActivities: [
            `Ensure all lessons in Unit ${unitNum} are marked Completed so your Unit ${unitNum} badge turns green!`,
          ],
        },
      ],
    };
  });

  // =========================================================================
  // MODULE W+1 (FINAL UNIT): FINAL LEVEL PROJECT & CERTIFICATE ISSUANCE
  // =========================================================================
  const finalProjectModule = {
    title: `Unit ${finalProjectUnitNumber}: Final Level Project & Certificate Issuance`,
    description: `The culminating project unit for ${programTitle} (${lvlMeta.shortLabel}). Instead of a traditional written final exam, STEMPACT learners design, build, document, and submit a comprehensive ${lvlMeta.shortLabel} Final Project, followed by official Level Certificate of Completion issuance.`,
    durationHours: 16,
    order: finalProjectUnitNumber,
    assessmentQuiz: `Final Project Readiness & Defense Checklist`,
    assignmentTitle: `Final Level Project Submission — ${programTitle} (${lvlMeta.shortLabel})`,
    lessons: [
      {
        title: `Final Level Project Overview & Objectives (${lvlMeta.shortLabel})`,
        contentSummary: `Why STEMPACT replaces traditional written final exams with a real-world ${lvlMeta.shortLabel} Final Project, and what you will build.`,
        interactiveLabType: 'FINAL_PROJECT_OVERVIEW',
        resources: JSON.stringify({
          lessonType: 'FINAL_PROJECT_OVERVIEW',
          unitNumber: finalProjectUnitNumber,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
          learningOutcomes: courseLearningObjectives,
        } satisfies LessonResourceMetadata),
        content: `### 1. Why a Final Level Project Instead of a Traditional Final Exam?
At **STEMPACT Academy**, every academic level (**Level 1 Foundation** through **Level 4 Specialist/Mastery**) culminates in a **Final Level Project Unit** rather than a rote-memorization written exam. Employers, clients, and venture partners evaluate engineers and creators by what they can **design, build, troubleshoot, and deploy**.

### 2. Scope of Your ${lvlMeta.shortLabel} Final Project
- **Program**: **${programTitle}**
- **Academic Level**: **${lvlMeta.displayName}**
- **Target Complexity**: ${lvlMeta.projectComplexity}.
- **Core Requirement**: Your project must integrate the competencies mastered across **Units 1 through ${learningUnitsCount}** (${unitBlueprints.map((b) => b.unitTheme.split(',')[0]).join(', ')}) into a cohesive, well-documented solution addressing a real-world Nigerian or global technical problem.`,
        practicalActivities: [
          `Select your Final Level Project problem statement and review it with your cohort instructor.`,
        ],
      },
      {
        title: `Project Architecture, Milestones & Evaluation Rubric`,
        contentSummary: `Technical specifications, 4-stage execution milestones, documentation templates, and the 100-point faculty grading rubric.`,
        interactiveLabType: 'FINAL_PROJECT_SPEC',
        resources: JSON.stringify({
          lessonType: 'FINAL_PROJECT_SPEC',
          unitNumber: finalProjectUnitNumber,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### 1. Mandatory Project Milestones
To ensure your **${lvlMeta.shortLabel} Final Project** meets STEMPACT Academic Board standards, structure your work across these 4 milestones:
1. **Milestone 1 — Problem Definition & System Specification**: Define the target user/system problem, constraints, bill of materials or tech stack, and architecture diagram.
2. **Milestone 2 — Core Implementation & Subsystem Integration**: Execute the hardware/software/media build applying best practices from Units 1–${learningUnitsCount}.
3. **Milestone 3 — Testing, Calibration & Diagnostic Verification**: Conduct rigorous quality testing, record quantitative metrics, and resolve edge-case faults.
4. **Milestone 4 — Technical Documentation & Presentation Defense**: Package your project repository/report and record or present a concise demonstration walkthrough.

### 2. Official Faculty Evaluation Rubric (100 Points — Minimum 70/100 to Pass)
| Evaluation Dimension | Weight | Mastery Standard (${lvlMeta.shortLabel}) |
| :--- | :--- | :--- |
| **1. Problem Relevance & Architecture Design** | **25 pts** | Clear architectural blueprint and well-justified engineering decisions. |
| **2. Practical Execution & Technical Depth** | **35 pts** | Working, verifiable implementation demonstrating ${lvlMeta.shortLabel} mastery. |
| **3. Testing, Diagnostics & Safety/Quality** | **20 pts** | Documented test results, fault handling, and adherence to safety/quality standards. |
| **4. Documentation & Defense Presentation** | **20 pts** | Professional documentation, clear evidence artifacts, and articulate defense. |`,
        practicalActivities: [
          `Complete Milestones 1–3 and verify your project against the 4 rubric dimensions above.`,
        ],
      },
      {
        title: `Final Project Submission & Defense Guide`,
        contentSummary: `Submit your Final Level Project repository, documentation, and demonstration evidence for instructor evaluation.`,
        interactiveLabType: 'FINAL_PROJECT_SUBMISSION',
        resources: JSON.stringify({
          lessonType: 'FINAL_PROJECT_SUBMISSION',
          unitNumber: finalProjectUnitNumber,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
          assignmentDeliverable: `Complete ${lvlMeta.shortLabel} Final Project Package (Architecture Doc + Working Artifact/Repo + Test Evidence)`,
        } satisfies LessonResourceMetadata),
        content: `### Submitting Your ${lvlMeta.shortLabel} Final Project
You are now ready to submit your **Final Level Project** for **${programTitle} (${lvlMeta.displayName})**.

### Submission Checklist
- [x] **Project Title & Problem Statement**: Clearly stated at the top of your submission.
- [x] **Working Evidence / Repository / Media Link**: GitHub repository, Google Drive/Cloudflare R2 evidence folder, CAD/Gerber package, or video walkthrough link.
- [x] **Technical Report & Test Logs**: Summary of architecture, tools used, diagnostic measurements, and lessons learned.

Use the **Submit Final Project / Assignment** launcher below (or open the **Assignments & Projects** tab) to upload your project evidence. Once submitted and marked complete, proceed to the final lesson below to generate your **Certificate of Completion**!`,
        practicalActivities: [
          `Submit your Final Level Project evidence package and mark this lesson Completed.`,
        ],
      },
      {
        title: `Level Completion & Certificate of Completion Issuance`,
        contentSummary: `Official STEMPACT Academic Board Completion Gate: verify all level requirements and generate your verifiable Certificate of Completion for ${lvlMeta.displayName}.`,
        interactiveLabType: 'CERTIFICATE_GATE',
        resources: JSON.stringify({
          lessonType: 'CERTIFICATE_GATE',
          unitNumber: finalProjectUnitNumber,
          levelCode: normalizedLevel,
          levelDisplayName: lvlMeta.displayName,
        } satisfies LessonResourceMetadata),
        content: `### Official ${lvlMeta.shortLabel} Completion & Certificate Issuance Terminal
Congratulations on reaching the final milestone of **${programTitle} (${lvlMeta.displayName})**!

### Institutional Completion Verification Policy
To preserve the academic integrity and global industry credibility of **STEMPACT Academy Credentials**, a learner can only generate their official **Certificate of Completion** for this level when **all completion requirements** below are verified:
1. **100% Curriculum Unit & Lesson Completion**: All lessons across *Course Introduction*, *Units 1–${learningUnitsCount}*, and *Unit ${finalProjectUnitNumber}* must be completed.
2. **Practical Assignments & Final Project Fulfillment**: Required cohort assignments and project deliverables must be submitted and evaluated.
3. **Physical / Hybrid Class Attendance**: Minimum **75% attendance** across scheduled cohort sessions (or 100% if no sessions have been held yet).
4. **Financial Clearance**: No overdue tuition balance blocking credential issuance.

Use the interactive **Certificate of Completion Gate** panel below to inspect your live eligibility checklist, generate your verifiable **${lvlMeta.shortLabel} Certificate of Completion**, and unlock your progression entitlement to the next academic level!`,
        practicalActivities: [
          `Review your live Completion Readiness Checklist below and click "Generate Level Certificate of Completion" once all requirements are met.`,
        ],
      },
    ],
  };

  const allModules = [courseIntroModule, ...weeklyLearningModules, finalProjectModule];

  const courseCodePrefix = (programCode || schoolCode || 'STP').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const courseCode = `${courseCodePrefix}-${lvlMeta.courseCodeSuffix}`;

  return [
    {
      code: courseCode,
      title: `${programTitle} — ${lvlMeta.displayName}`,
      description: `UoPeople-standard structured curriculum for ${programTitle} (${lvlMeta.shortLabel}), featuring Course Introduction, ${learningUnitsCount} weekly learning & laboratory units, and a dedicated Final Level Project & Certificate Issuance unit.`,
      credits: Math.min(6, Math.max(3, durationWeeks)),
      order: lvlMeta.courseCodeSuffix === '101' ? 1 : lvlMeta.courseCodeSuffix === '201' ? 2 : lvlMeta.courseCodeSuffix === '301' ? 3 : 4,
      level: normalizedLevel,
      modules: allModules,
    },
  ];
}
