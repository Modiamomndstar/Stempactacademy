import { QuizQuestionItem } from './uopeopleCurriculumBuilder.js';

export interface UnitBlueprintTheme {
  theme: string;
  l1: string;
  l2: string;
  deliverable: string;
}

export const EXTENDED_DOMAIN_THEMES: Record<
  string,
  Record<number, UnitBlueprintTheme[]>
> = {
  // -------------------------------------------------------------------------
  // 1. INTERNET OF THINGS (IoT), ESP32, MQTT & SMART SENSORS (RIOTH-02)
  // -------------------------------------------------------------------------
  iot: {
    1: [
      {
        theme: 'IoT System Architecture, Microcontroller Hardware & Edge Sensor Peripherals',
        l1: 'Embedded Sensor Nodes: ESP32 Pinout, ADC Quantization, Logic Levels (3.3V) & Pull-Up Resistors',
        l2: 'Interfacing Environmental Transducers: DHT22, BME280, Ultrasonic & Soil Moisture Sensors',
        deliverable: 'Calibrated Multi-Sensor Environmental Telemetry Node with Serial Telemetry Logging',
      },
      {
        theme: 'Wireless Network Topology, ESP32 Wi-Fi Station Modes & REST Telemetry APIs',
        l1: '802.11 Wi-Fi Networking: STA vs AP Modes, Static IP Configuration & Network Reconnection State Machines',
        l2: 'Serializing Sensor Data into JSON Payloads & Transmitting via Asynchronous HTTP POST Endpoints',
        deliverable: 'Firmware Telemetry Client Publishing Formatted JSON Sensor Data to Local HTTP Gateway',
      },
      {
        theme: 'Publish-Subscribe Messaging Architecture, Mosquitto MQTT Brokers & QoS Levels',
        l1: 'MQTT Protocol Mechanics: Topics, Hierarchies, Wildcards, Keep-Alive Pings & QoS 0/1/2 Contracts',
        l2: 'Configuring Eclipse Mosquitto Broker, User Authentication & Publishing Real-Time Sensor Telemetry',
        deliverable: 'End-to-End MQTT Telemetry Pipeline with Verified Mosquitto Subscriptions & Packet Logs',
      },
      {
        theme: 'Time-Series Data Ingestion, InfluxDB Storage & Real-Time Grafana Telemetry Dashboards',
        l1: 'Time-Series Database Architecture: Buckets, Measurements, Field Keys, Tags & Data Retention Policies',
        l2: 'Designing Live Monitoring Dashboards in Grafana with Dynamic Gauges, Trend Graphs & Threshold Alerts',
        deliverable: 'Production IoT Cloud Dashboard Visualizing Real-Time Sensor Metrics with Automated Alerts',
      },
      {
        theme: 'Long-Range Wireless Networks (LoRa / LoRaWAN) & Low-Power Wide-Area Telemetry',
        l1: 'Sub-GHz Chirp Spread Spectrum Physics: Spreading Factors, Bandwidth, Coding Rate & Link Budget',
        l2: 'LoRaWAN Architecture: Node Join Procedures (OTAA vs ABP), Gateways & The Things Network Integration',
        deliverable: 'Field-Tested Long-Range LoRa Sensor Node Transmitting Packets Across 2km+ Physical Range',
      },
      {
        theme: 'Industrial Actuator Control, Relays & Cloud-to-Edge Automated Feedback Loops',
        l1: 'Optoisolated Solid-State & Mechanical Relays: Flyback Diodes, High-Voltage AC Load Switching Safety',
        l2: 'Bidirectional Command Orchestration: Subscribing to Cloud Command Topics & Triggering Local Actuation',
        deliverable: 'Automated Smart Irrigation / Ventilation Actuator Station Controlled via Cloud Dashboard',
      },
      {
        theme: 'Microamp Power Budgeting, Deep-Sleep States & Solar Harvesting for Edge Nodes',
        l1: 'ESP32 Power Domains: RTC Timer Wakeup, External Interrupt Wakeup & Minimizing Quiescent Current',
        l2: 'Sizing Lithium Ion/LiFePO4 Battery Banks, TP4056 / MPPT Solar Charge Controllers for Autonomous Nodes',
        deliverable: 'Solar-Powered Autonomous IoT Edge Node with Multi-Day Energy Budget Calculation Sheet',
      },
    ],
    2: [
      {
        theme: 'Industrial Edge Gateways, Modbus RS-485 Communication & Protocol Bridging',
        l1: 'Differential RS-485 Signaling, Modbus RTU Frame Structure, Function Codes & Register Addressing',
        l2: 'Building Edge Gateway Software with Node-RED / Python to Bridge Modbus Field Sensors to Cloud MQTT',
        deliverable: 'Operational Modbus-to-MQTT Edge Gateway Interfacing Heavy Industrial Energy Meters',
      },
      {
        theme: 'Edge Computing, Local Rule Engines & Resilient Offline Telemetry Buffering',
        l1: 'Edge Rule Evaluation: Running Complex Threshold Logic on Microcontroller to Mitigate Cloud Latency',
        l2: 'Flash/SD-Card Non-Volatile Ring Buffers: Queuing Telemetry During Network Outages & Synchronizing',
        deliverable: 'Resilient Edge Firmware with Zero Data Loss During 24-Hour Network Disconnection Simulation',
      },
      {
        theme: 'Over-The-Air (OTA) Firmware Management & Secure Device Provisioning',
        l1: 'Dual-Partition Dual-Boot Flash Schemes: Rollback Failsafes, Hash Verification & Seamless OTA Flashing',
        l2: 'Zero-Touch Provisioning via Wi-Fi Captive Portal & BLE: Provisioning New Sensor Nodes in Minutes',
        deliverable: 'Secure OTA Firmware Pipeline Successfully Deploying Remote Updates with Auto-Rollback Guard',
      },
    ],
    3: [
      {
        theme: 'Fleet Cybersecurity, X.509 Mutual TLS Authentication & Hardware Encryption',
        l1: 'Hardware Security Elements: Cryptographic Acceleration, Secure Boot & Encrypted Flash Storage',
        l2: 'Generating Custom Certificate Authorities (CA), Issuing Device Certificates & Mutual TLS Verification',
        deliverable: 'Hardened IoT Node Authenticating Against Enterprise Cloud Broker via Mutual TLS (mTLS)',
      },
      {
        theme: 'Edge AI (TinyML), Vibration Anomaly Detection & Predictive Maintenance',
        l1: 'Quantizing Machine Learning Models for Microcontrollers using TensorFlow Lite for Microcontrollers',
        l2: 'Capturing High-Frequency Accelerometer Vibration Data & Inferring Mechanical Bearing Health Locally',
        deliverable: 'TinyML Edge Anomaly Detector Running on Microcontroller with Sub-50ms Inference Latency',
      },
    ],
    4: [
      {
        theme: 'Enterprise IoT Platform Engineering, AWS IoT Core & Digital Twin Architecture',
        l1: 'Enterprise Ingestion: AWS IoT Core Device Shadows, Rules Engine, Kinesis Streams & Data Lake Storage',
        l2: 'Designing Digital Twins for Complex Physical Assets with Real-Time Telemetry Synchronization & SLAs',
        deliverable: 'Enterprise Digital Twin Architecture Blueprint & Scalable Cloud Ingestion Infrastructure',
      },
      {
        theme: 'Commercial IoT Product Launch, Regulatory Telecommunications Compliance & Field Operations',
        l1: 'EMC/FCC/NCC Radio Certification Guidelines, Enclosure Ingress Protection (IP67/68) & Thermal Testing',
        l2: 'Structuring Multi-Year IoT Hardware-as-a-Service (HaaS) Service Level Agreements (SLAs) & Unit Pricing',
        deliverable: 'Commercial Production IoT Fleet Runbook, Regulatory Compliance Dossier & Enterprise SLA Spec',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. EMBEDDED SYSTEMS & MICROCONTROLLERS (RIOTH-03)
  // -------------------------------------------------------------------------
  embedded: {
    1: [
        {
          theme: 'ARM Cortex-M Architecture, Memory Maps & Bare-Metal C Register Programming',
          l1: 'Microcontroller Internals: Core Registers, Flash/SRAM Address Space, Bus Matrix & Peripheral Clocks',
          l2: 'Direct Register Bit Manipulation: Bitmasks, Volatile Pointers & Writing Bare-Metal GPIO Drivers in C',
          deliverable: 'Bare-Metal C Firmware Operating Without External HAL Libraries with Verified Register Map',
        },
        {
          theme: 'Nested Vectored Interrupt Controller (NVIC), Hardware Timers & Precise PWM Generation',
          l1: 'Interrupt Service Routines (ISRs): Priority Preemption, Latency, Vector Tables & Flag Clearance',
          l2: 'General-Purpose Hardware Timers: Prescalers, Auto-Reload Registers & Generating Jitter-Free PWM Signals',
          deliverable: 'Timer-Driven Interrupt Engine and Precise Multi-Channel PWM Generator with Oscilloscope Logs',
        },
        {
          theme: 'Serial Bus Protocol Analysis: Master-Slave Synchronous SPI & I2C Bus Controllers',
          l1: 'I2C Bus Protocol: Start/Stop Conditions, 7-Bit Device Addressing, Clock Stretching & ACK/NACK Bit Timing',
          l2: 'SPI Protocol: Clock Polarity (CPOL) and Phase (CPHA) Modes, Chip Select & Logic Analyzer Decoding',
          deliverable: 'Custom Low-Level SPI/I2C Peripheral Drivers Verified on Hardware Logic Analyzer',
        },
        {
          theme: 'Asynchronous UART Telemetry, Direct Memory Access (DMA) & Circular Buffers',
          l1: 'UART Framing: Baud Rates, Parity Bits & Eliminating CPU Overhead Using DMA Memory Transfers',
          l2: 'Implementing Lock-Free Circular Ring Buffers for High-Throughput Bidirectional Communications',
          deliverable: 'DMA-Accelerated High-Throughput Serial Communication Interface with Zero Dropped Packets',
        },
        {
          theme: 'Real-Time Operating Systems (FreeRTOS): Task Scheduling, Priorities & Context Switching',
          l1: 'RTOS Principles: Preemptive Priority-Based Scheduler, Task Control Blocks (TCB) & Stack Allocation',
          l2: 'Inter-Task Synchronization: Queues, Mutexes with Priority Inheritance & Binary/Counting Semaphores',
          deliverable: 'Deterministic Multi-Task FreeRTOS Application with Priority Inheritance & Deadlock Verification',
        },
        {
          theme: 'CAN (Controller Area Network) Bus Architecture for Automotive & Industrial Telemetry',
          l1: 'Differential Signaling (CAN_H / CAN_L), Message Arbitration by Identifier & Bit-Stuffing Mechanics',
          l2: 'Configuring Hardware CAN Filters, Masking, Transmitting Real-Time Telemetry & Bus Load Monitoring',
          deliverable: 'Two-Node CAN Bus Network Transmitting Real-Time Sensor Telemetry with Bus-Off Error Recovery',
        },
      ],
      2: [
        {
          theme: 'Bare-Metal Bootloaders, In-Application Programming (IAP) & Dual-Bank Memory Swapping',
          l1: 'Flash Sector Erase/Write Cycles, Vector Table Relocation & Designing Secure Bootloader Protocols',
          l2: 'Firmware Integrity Verification using CRC32 and SHA-256 Hashes Prior to Application Jump',
          deliverable: 'Custom Microcontroller Bootloader Flashing New Firmware Over Serial Bus with Failsafe Fallback',
        },
        {
          theme: 'Power Management, Clock Tree Calibration & Ultra-Low-Power Sleep Modes',
          l1: 'Phase-Locked Loop (PLL) Multipliers, Crystal Oscillators & Dynamic Core Frequency Scaling',
          l2: 'Sleep, Stop, and Standby Low-Power Modes: Preserving SRAM State & Sub-Microamp Wakeup Latency',
          deliverable: 'Ultra-Low-Power Sensor Beacon Consuming Under 2.5 Microamps in Standby with Calibrated Clock Tree',
        },
      ],
      3: [
        {
          theme: 'Defensive Embedded Software, Watchdog Timers & Static Code Analysis (MISRA C)',
          l1: 'Independent & Windowed Watchdog Timers: Diagnosing Software Hangs & Stack Overflow Guard Bands',
          l2: 'MISRA C Safety Guidelines: Avoiding Undefined Behaviors, Dynamic Allocation Risks & Array Overruns',
          deliverable: 'MISRA-Compliant Mission-Critical Embedded Firmware Package with Automated Linting Reports',
        },
      ],
      4: [
        {
          theme: 'Hardware-in-the-Loop (HIL) Testing, Embedded Debugging with JTAG/SWD & Production SLAs',
          l1: 'Non-Intrusive Trace Debugging: Serial Wire Output (SWO), Instruction Trace Macrocell (ITM) & Profiling',
          l2: 'Automated Hardware-in-the-Loop Test Rigs: Fault Injection, Boundary Testing & Enterprise Firmware SLAs',
          deliverable: 'Complete Automated HIL Test Rig Blueprint, Regression Test Suite & Embedded Production SLA Spec',
        },
      ],
    },

  // -------------------------------------------------------------------------
  // 3. DRONE TECHNOLOGY & AUTONOMOUS UAVs (RIOTH-07)
  // -------------------------------------------------------------------------
  drone_uav: {
    1: [
      {
        theme: 'UAV Aerodynamics, Multirotor Flight Physics & Airframe Mechanical Geometry',
        l1: 'Thrust, Drag, Lift, Weight: Aerodynamic Moments, Counter-Rotating Propeller Dynamics & Motor KV Sizing',
        l2: 'Carbon Fiber Frame Geometry (X, Plus, H Configurations), Center of Gravity (CG) Balancing & Vibration Dampening',
        deliverable: 'Multirotor Airframe Assembly with Thrust-to-Weight Ratio Calculations & Center of Gravity Alignment',
      },
      {
        theme: 'Brushless Motors, Electronic Speed Controllers (ESCs) & Power Distribution Architecture',
        l1: '3-Phase BLDC Motor Stators/Rotors, Back-EMF Commutation & Sizing 4S–6S LiPo Batteries with C-Ratings',
        l2: 'Electronic Speed Controllers: DShot Digital Protocols, MOSFET Switching Frequencies & ESC Calibration',
        deliverable: 'Calibrated 4-Motor Power Subsystem with Verified DShot Telemetry & Motor Direction Rotation Check',
      },
      {
        theme: 'Flight Controller Hardware, Inertial Measurement Units (IMUs) & Sensor Calibration',
        l1: 'Flight Computer Architecture: ARM Cortex Processor, 3-Axis Accelerometer, 3-Axis Gyroscope & Barometer',
        l2: 'Sensor Calibration in Betaflight / ArduPilot: Accel Leveling, Gyro Noise Filtering & Notch Filters',
        deliverable: 'Configured Flight Controller with Low-Noise Gyro Telemetry Graphs & Verified Level Sensor Orientation',
      },
      {
        theme: 'Radio Control (RC) Transmission Protocols, Telemetry Links & Failsafe Configuration',
        l1: 'Spread Spectrum Radio Frequencies (2.4GHz / 915MHz / 868MHz): ExpressLRS, TBS Crossfire & SBUS Protocols',
        l2: 'Configuring Failsafe Protocols: Receiver Signal Loss Detection, Auto-Disarm & Emergency Motor Cutoff',
        deliverable: 'Radio Telemetry Link Configured with Verified ExpressLRS Packet Rates and Hardware Failsafe Test Log',
      },
      {
        theme: 'PID Flight Stabilization Control Loops, Rate Tuning & Dynamic Filtering',
        l1: 'Proportional, Integral, Derivative Error Dynamics: Correcting Angular Velocity & Attitude Drift',
        l2: 'In-Flight Blackbox Telemetry Logging, Frequency Analysis & Tuning PID Gains for Wind Rejection',
        deliverable: 'Blackbox Flight Log Analysis Report Demonstrating Tuned PID Stabilization Without Motor Overheating',
      },
      {
        theme: 'Autonomous Navigation, GPS/Compass Integration & Waypoint Mission Planning',
        l1: 'Multi-Constellation GNSS Receivers (GPS, GLONASS, Galileo), Compass Magnetometer Offsets & HDOP Checks',
        l2: 'ArduPilot & QGroundControl Mission Planning: Automated Grid Mapping, Altitude Hold, Return-to-Launch (RTL)',
        deliverable: 'Fully Autonomous Multi-Waypoint GPS Mission Simulation with Automated Takeoff and RTL Landing',
      },
    ],
    2: [
      {
        theme: 'Aerial Photogrammetry, Multispectral Sensors & Precision Agricultural Mapping',
        l1: 'Gimbal Stabilization, Camera Shutter Synchronization, Ground Sampling Distance (GSD) & Image Overlap',
        l2: 'Processing Aerial Orthomosaics, 3D Elevation Models & NDVI Crop Health Indices in OpenDroneMap',
        deliverable: 'Complete High-Resolution Orthomosaic Map and Crop Vegetation Index Report from Aerial Imagery',
      },
      {
        theme: 'Long-Range Radio Telemetry (MAVLink), 4G/LTE Companion Computers & Video Links',
        l1: 'MAVLink Micro Air Vehicle Communication Protocol: Command Sequences, Heartbeat Packets & Telemetry Streams',
        l2: 'Raspberry Pi Companion Computer Integration with Flight Controller via MAVLink / ROS for 4G Telemetry',
        deliverable: 'Companion Computer Telemetry Bridge Providing Live 4G/LTE Flight Telemetry and Video Streaming',
      },
    ],
    3: [
      {
        theme: 'Obstacle Avoidance, LiDAR Rangefinders & Optical Flow Sensor Integration',
        l1: 'Ultrasonic, Optical Flow & 1D/2D LiDAR Sensors: Non-GPS Altitude Hold and Forward Obstacle Detection',
        l2: 'Implementing Proximity Avoidance Boundaries in ArduPilot & Reactive Braking Algorithms',
        deliverable: 'GPS-Denied Autonomous Indoor Hover & Reactive Collision Avoidance Field Demonstration',
      },
    ],
    4: [
      {
        theme: 'Commercial UAV Operations, Aviation Safety Governance (NCAA/ICAO) & Fleet Management',
        l1: 'Aviation Regulations: Airspace Classifications, NOTAMs, Beyond Visual Line of Sight (BVLOS) Authorizations',
        l2: 'Structuring Commercial Drone Surveying & Inspection Services: Maintenance Logs, Risk Assessments & Insurance',
        deliverable: 'Commercial Drone Operations Manual, NCAA Regulatory Safety Dossier & Enterprise Service Sizing Spec',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. ELECTRONICS, DIGITAL SYSTEMS & PCB DESIGN (RIOTH-04 / RETE-03)
  // -------------------------------------------------------------------------
  electronics_pcb: {
    1: [
      {
        theme: 'Circuit Physics, Fundamental Laws (Ohm & Kirchhoff) & Workbench Safety',
        l1: 'Voltage Potential, Conventional Current, Electrical Power (P=IV) & Resistor Color-Code Sizing',
        l2: 'Ohm’s Law, Kirchhoff’s Current Law (KCL) & Kirchhoff’s Voltage Law (KVL) Verification on Breadboard',
        deliverable: 'Bench-Tested Series-Parallel Circuit Analysis Log with Theoretical vs Measured Multimeter Verification',
      },
      {
        theme: 'Passive Electronic Components: Capacitors, Inductors, RC Filters & AC Dynamics',
        l1: 'Capacitive Reactance, Inductive Reactance, Time Constants (Tau=RC) & DC Decoupling Principles',
        l2: 'Designing Passive Low-Pass & High-Pass Audio Filters: Breadboard Probing with Signal Generator & Scope',
        deliverable: 'Assembled RC Audio Filter with Frequency Response Bode Plot and Cutoff Verification',
      },
      {
        theme: 'Semiconductors: Diodes, Zener Regulators, Full-Bridge Rectifiers & DC Power Supplies',
        l1: 'P-N Junction Physics, Diode Forward Voltage Drop, Reverse Breakdown & Zener Voltage Clamping',
        l2: 'Building a Full-Wave Bridge Rectifier with Filter Capacitors: Converting 12V AC to Regulated 5V DC',
        deliverable: 'Working Unregulated-to-Regulated Linear DC Bench Power Supply with Sub-10mV Ripple Voltage',
      },
      {
        theme: 'Bipolar Junction Transistors (BJT) & MOSFET Power Switching Circuits',
        l1: 'BJT Transistor Biasing (Cutoff, Active, Saturation), Base Resistor Sizing & Transistor Switches',
        l2: 'N-Channel / P-Channel Logic-Level MOSFETs: Gate-Source Threshold (Vgs), RDS(on) & Flyback Protection',
        deliverable: 'High-Current Solid-State DC Motor/Heater Driver Circuit Controlled by Low-Power Logic Signal',
      },
      {
        theme: 'Operational Amplifiers (Op-Amps), Inverting/Non-Inverting Amplifiers & Comparators',
        l1: 'Op-Amp Golden Rules: High Input Impedance, Virtual Ground, Negative Feedback & Closed-Loop Gain',
        l2: 'Designing Precision Voltage Comparators with Hysteresis (Schmitt Trigger) for Noise Rejection',
        deliverable: 'Low-Noise Sensor Signal Conditioner Amplifying Millivolt Signals with Zero Clipping Distortion',
      },
      {
        theme: 'Digital Logic Gates, Boolean Algebra, 555 Timers & Sequential State Circuits',
        l1: 'Combinational Logic: AND, OR, NOT, NAND, NOR Truth Tables, De Morgan’s Laws & Logic IC Pinouts',
        l2: 'NE555 Timer in Astable and Monostable Modes: Pulse Width Modulation & Frequency Generation',
        deliverable: 'Clocked Pulse Generator and Logic Circuit Driving 7-Segment LED Display Counter',
      },
    ],
    2: [
      {
        theme: 'Schematic Capture in KiCad: Hierarchical Schematics, Electrical Rules Check (ERC)',
        l1: 'Schematic Design Best Practices: Power Flags, Decoupling Capacitor Placement, Net Labels & Global Nets',
        l2: 'Assigning Component Footprints, Generating Accurate Bill of Materials (BOM) & Running ERC Audits',
        deliverable: 'Complete Error-Free Multi-Sheet Schematic in KiCad with Verified ERC Verification Log',
      },
      {
        theme: 'Printed Circuit Board (PCB) Layout: Design Rules (DRC), Trace Sizing & Ground Planes',
        l1: 'PCB Stackup: 2-Layer and 4-Layer Boards, Copper Thickness (1oz vs 2oz) & Calculating Trace Current Capacity',
        l2: 'Component Placement Strategy, Unbroken Ground Planes, Minimizing Loop Areas & Routing Differential Signals',
        deliverable: 'Production-Ready 2-Layer PCB Layout Meeting Manufacturer DRC Specs with Solid Ground Plane',
      },
    ],
    3: [
      {
        theme: 'High-Speed Signal Integrity, Controlled Impedance & EMI/EMC Mitigation',
        l1: 'Microstrip Transmission Lines, Characteristic Impedance (50 Ohm / 90 Ohm USB), Crosstalk & Return Currents',
        l2: 'Electromagnetic Interference (EMI) Mitigation: Ferrite Beads, TVS Diodes, Common-Mode Chokes & Shielding',
        deliverable: 'High-Speed Signal Integrity Routing Portfolio with Impedance Matching Calculation Dossier',
      },
    ],
    4: [
      {
        theme: 'Commercial PCB Manufacturing (Gerber/Excellon), Pick-and-Place (CPL) & DFM/DFA Audits',
        l1: 'Generating Production Gerber RS-274X, Drill Files, Centroid (CPL) Pick-and-Place Files & Solder Masks',
        l2: 'Design for Manufacture (DFM) and Design for Assembly (DFA) Rules, Component Sourcing & PCBA Costing',
        deliverable: 'Complete Commercial Turnkey PCBA Production Package Ready for Automated Factory Fabrication',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. SOLAR INSTALLATION, RENEWABLE ENERGY & MICROGRIDS (RETE-01..05)
  // -------------------------------------------------------------------------
  solar: {
    1: [
      {
        theme: 'Solar Energy Fundamentals, Photovoltaic Physics & Solar Irradiance Sizing',
        l1: 'Semiconductor P-N Junction PV Effect, Monocrystalline vs Polycrystalline Efficiency & Temperature Coefficients',
        l2: 'Peak Sun Hours (PSH), Solar Irradiance Maps for Nigeria/West Africa, Tilt Angles & Azimuth Orientation',
        deliverable: 'Geographic Solar Irradiance Audit and Peak Sun Hour Calculation for Target Learning Center',
      },
      {
        theme: 'Electrical Load Auditing, Daily Watt-Hour Consumption & Inverter Capacity Sizing',
        l1: 'Apparent Power (kVA) vs Real Power (kW), Power Factor (PF) & Distinguishing Surge vs Continuous Loads',
        l2: 'Conducting Room-by-Room Energy Audits, Compiling Daily Watt-Hour Balance Sheets & Inverter Sizing',
        deliverable: 'Comprehensive Residential/Commercial Energy Audit and Inverter Capacity Specification Sheet',
      },
      {
        theme: 'Solar PV Array Configuration: String Sizing, Series/Parallel Calculations & Voc/Isc Rules',
        l1: 'PV Module Parameters: Open-Circuit Voltage (Voc), Short-Circuit Current (Isc), Vmp, Imp & Temperature Adjustments',
        l2: 'Sizing Series and Parallel Solar Strings to Match Maximum Power Point Tracking (MPPT) Voltage Windows',
        deliverable: 'Calculated 3.5kVA–5kVA Solar PV Array String Sizing Configuration Diagram with Breaker Specs',
      },
      {
        theme: 'Energy Storage Systems: Lead-Acid, Gel & Lithium Iron Phosphate (LiFePO4) Battery Banks',
        l1: 'Battery Chemistries: Energy Density, Depth of Discharge (DoD), Cycle Life, C-Rates & Thermal Runaway Safety',
        l2: 'Sizing 24V/48V Battery Banks, Lithium Battery Management System (BMS) Architecture & Cell Balancing',
        deliverable: '48V Energy Storage Bank Sizing Model with Lifecycle Cost and Depth-of-Discharge Tradeoff Analysis',
      },
      {
        theme: 'Charge Controller Technologies: PWM vs MPPT Algorithms & System Balance',
        l1: 'Maximum Power Point Tracking (MPPT) Mechanics: Sweeping I-V Curves, Buck Conversion & Efficiency Gains',
        l2: 'Wiring Solar PV Strings to MPPT Controllers, Programming Battery Charge Stages (Bulk, Absorb, Float)',
        deliverable: 'Field Commissioning Checklist for High-Efficiency MPPT Solar Controller and Battery Charger',
      },
      {
        theme: 'System Protection, Surge Arresters, Earthing Electrodes & DC/AC Disconnect Panels',
        l1: 'Earthing and Grounding: Earth Rod Installation, Soil Resistivity, Lightning Arresters & Equipotential Bonding',
        l2: 'DC Breakers, Fuses, AC Changeover Switches (ATS), Surge Protective Devices (SPD) & Cable Gauge Sizing',
        deliverable: 'Complete Electrical Single-Line Safety Schematic with Protective Breakers and Earthing Infrastructure',
      },
    ],
    2: [
      {
        theme: 'Commercial Hybrid Inverters, Grid-Tied Synchronization & Dual-Source Integration',
        l1: 'Pure Sine Wave Inverters, Grid-Tie Inverters, Anti-Islanding Protection & Bi-Directional Net Metering',
        l2: 'Commissioning Hybrid Multi-Source Inverters Integrating Solar, Public Utility Grid and Backup Diesel Generator',
        deliverable: 'Multi-Source Hybrid Solar Inverter Commissioning Plan with Automated Generator Start Configuration',
      },
      {
        theme: 'Computer-Aided Solar Engineering: PVsyst Modeling & 3D Shading Simulation',
        l1: 'Simulating Solar System Performance in PVsyst / Helioscope: Horizon Profiles, Near-Shading Loss Models',
        l2: 'Calculating Performance Ratio (PR), Specific Energy Yield (kWh/kWp) & Generation Forecast Reports',
        deliverable: 'Comprehensive PVsyst Simulation Report for a 20kW Commercial Rooftop Solar Installation',
      },
    ],
    3: [
      {
        theme: 'Microgrid Automation, Modbus Energy Monitoring & Remote Cloud Telemetry',
        l1: 'Smart Energy Meters (PZEM / Modbus RS485): Capturing Voltage, Current, Active Power & Frequency in Real Time',
        l2: 'Integrating Smart Meters with IoT Gateways and Grafana Cloud Dashboards for Automated Load Shedding',
        deliverable: 'Operational IoT-Enabled Microgrid Energy Monitoring Dashboard with Automated Peak-Load Alerts',
      },
    ],
    4: [
      {
        theme: 'Utility-Scale Solar Mini-Grids, Levelized Cost of Electricity (LCOE) & EPC Project Management',
        l1: 'Decentralized Solar Mini-Grids: Distribution Networks, Tariffs, Community Off-Grid Power Delivery & SLAs',
        l2: 'Financial Modeling: CapEx, OpEx, Levelized Cost of Electricity (LCOE), Net Present Value (NPV) & Investor Pitch',
        deliverable: 'Bankable 50kW Commercial Solar Mini-Grid Engineering, Procurement & Construction (EPC) Master Dossier',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. ARTIFICIAL INTELLIGENCE, MACHINE LEARNING & GENERATIVE AI (AIDM-03..06)
  // -------------------------------------------------------------------------
  aiml: {
    1: [
      {
        theme: 'Machine Learning Foundations, Python Scientific Stack & Exploratory Data Analysis',
        l1: 'Supervised vs Unsupervised Paradigms: Regression, Classification, Clustering & Data Preprocessing',
        l2: 'NumPy Vectorized Operations, Pandas Dataframe Wrangling, Handling Missing Values & Feature Distributions',
        deliverable: 'End-to-End Exploratory Data Analysis (EDA) Jupyter Notebook with Statistical Inferences',
      },
      {
        theme: 'Classical Machine Learning Algorithms, Scikit-Learn Pipelines & Model Validation',
        l1: 'Linear/Logistic Regression, Decision Trees, Random Forests, Gradient Boosted Trees (XGBoost/LightGBM)',
        l2: 'Train/Validation/Test Splits, Cross-Validation, Precision, Recall, F1-Score, ROC-AUC & Confusion Matrices',
        deliverable: 'Tuned Machine Learning Model Pipeline with Cross-Validated Performance Benchmark Matrix',
      },
      {
        theme: 'Deep Neural Networks, Backpropagation & PyTorch Tensor Computation',
        l1: 'Artificial Neurons, Activation Functions (ReLU, GELU, Sigmoid), Loss Functions & Gradient Descent Solvers',
        l2: 'Building Multi-Layer Perceptrons (MLP) in PyTorch: Forward Pass, Autograd, Backprop & Weight Updates',
        deliverable: 'PyTorch Deep Neural Network Trained on Complex Tabular/Classification Dataset with Loss Curves',
      },
      {
        theme: 'Computer Vision Architectures, Convolutional Networks & Transfer Learning (YOLOv8)',
        l1: 'Convolutional Kernels, Pooling Layers, Receptive Fields, Feature Maps & Image Normalization Techniques',
        l2: 'Transfer Learning with Pretrained Vision Models & Fine-Tuning YOLOv8 for Custom Real-Time Object Detection',
        deliverable: 'Real-Time Object Detection Model Fine-Tuned on Custom Dataset with Mean Average Precision (mAP) Report',
      },
      {
        theme: 'Natural Language Processing, Transformer Architectures & Vector Embeddings',
        l1: 'Tokenization, Self-Attention Mechanisms, Multi-Head Attention, Positional Encoding & Transformer Encoders',
        l2: 'Generating High-Dimensional Vector Embeddings & Performing Semantic Similarity Search via Vector Databases',
        deliverable: 'Semantic Search Engine Indexing Technical Documentation Using High-Dimensional Dense Embeddings',
      },
      {
        theme: 'Generative AI Applications, Retrieval-Augmented Generation (RAG) & Agent Workflows',
        l1: 'Large Language Model (LLM) Inference, Context Windows, Chunking Strategies & Hybrid Keyword-Vector Search',
        l2: 'Building Production RAG Pipelines with LangChain/LlamaIndex, Prompt Templates & Source Citations',
        deliverable: 'Functional Enterprise Knowledge Base RAG Assistant Deploying Grounded Context Answers',
      },
    ],
    2: [
      {
        theme: 'Model Deployment, High-Throughput REST APIs & Docker Containerization',
        l1: 'Exporting Models to ONNX / TorchScript: Latency Optimization, Quantization & Batch Inference Logic',
        l2: 'Building Production Asynchronous APIs with FastAPI, Pydantic Schema Validation & Docker Packaging',
        deliverable: 'Containerized AI Inference Microservice with OpenAPI Documentation and Under-100ms Response Times',
      },
      {
        theme: 'LLM Fine-Tuning (LoRA / QLoRA), Instruction Tuning & Evaluation Benchmarks',
        l1: 'Parameter-Efficient Fine-Tuning (PEFT): Low-Rank Adaptation (LoRA), 4-bit Quantization (QLoRA) & Datasets',
        l2: 'Fine-Tuning Open-Source LLMs (Llama 3, Mistral) on Specialized Domain Instructions & Evaluation',
        deliverable: 'Domain-Specialized Fine-Tuned Language Model with Quantitative Win-Rate Evaluation Metrics',
      },
    ],
    3: [
      {
        theme: 'Multi-Agent Autonomous Systems, Tool Calling & Orchestration Frameworks',
        l1: 'ReAct Prompting, Tool Calling Protocols, Memory Scaffolding & Autonomous Error-Recovery Loops',
        l2: 'Orchestrating Multi-Agent Squads (Researcher, Coder, Reviewer) Using LangGraph or CrewAI',
        deliverable: 'Autonomous Multi-Agent Workflow Executing Complex Multi-Step Research and Code Tasks',
      },
    ],
    4: [
      {
        theme: 'Enterprise MLOps Architecture, Continuous Training Pipelines & Model Governance',
        l1: 'Feature Stores, Data Drift & Concept Drift Detection, Continuous Integration/Deployment (CI/CD) for ML',
        l2: 'Model Governance: Explainable AI (SHAP/LIME), Bias Auditing, Enterprise Safety Guardrails & SLAs',
        deliverable: 'End-to-End Enterprise MLOps Pipeline Specification, Drift Monitoring Dashboard & Governance Dossier',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. DATA ANALYTICS & BUSINESS INTELLIGENCE (AIDM-01, AIDM-02)
  // -------------------------------------------------------------------------
  data_science: {
    1: [
      {
        theme: 'Advanced Business Analytics, Excel Data Modeling & Executive KPI Dashboards',
        l1: 'Relational Data Modeling in Excel: Power Query ETL, Unpivoting Data, Multi-Table Data Models',
        l2: 'Advanced DAX Measures, Dynamic KPI Tiles, Slicers & Formatting Professional Executive Reports',
        deliverable: 'Executive Business Intelligence Report with Dynamic Multi-Filter Cash Flow Analytics',
      },
      {
        theme: 'Relational Database Querying with SQL: Joins, Aggregations & Subqueries',
        l1: 'SQL DDL/DML, Relational Schemas, Primary/Foreign Keys, Inner/Left/Right/Outer Joins & Filter Logic',
        l2: 'Aggregate Functions (SUM, AVG, COUNT), GROUP BY, HAVING Clauses & Complex Nested Subqueries',
        deliverable: 'Complex SQL Query Script Answering 10 Core Business Revenue and Retention Questions',
      },
      {
        theme: 'Advanced SQL: Window Functions, Common Table Expressions (CTEs) & Optimization',
        l1: 'Analytical Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LEAD(), LAG() & Running Totals',
        l2: 'Modular Common Table Expressions (WITH Clauses), Indexing Strategy & Analyzing EXPLAIN Query Plans',
        deliverable: 'Optimized Advanced SQL Analytical Script Calculating Customer Cohort Churn and Retention Rates',
      },
      {
        theme: 'Power BI Business Intelligence: Star Schemas, DAX Calculations & Visual Storytelling',
        l1: 'Data Warehousing Star Schema Design: Fact Tables, Dimension Tables, Surrogate Keys & Cardinality',
        l2: 'Complex DAX: CALCULATE(), FILTER(), ALL(), Time-Intelligence (YTD, QTD, MoM) & Visual Interactivity',
        deliverable: 'Interactive Power BI Commercial Dashboard with Year-Over-Year Sales Performance Decomposition',
      },
      {
        theme: 'Exploratory Python Analytics: Pandas Data Wrangling & Statistical Visualization',
        l1: 'Pandas DataFrames: Groupby Aggregations, Merging, Pivoting, Melting & Vectorized Calculations',
        l2: 'Statistical Storytelling with Seaborn and Matplotlib: Box Plots, Heatmaps, Scatter Trendlines & Distributions',
        deliverable: 'Python Analytical Notebook Delivering Statistical Insights on Customer Acquisition Costs',
      },
      {
        theme: 'Data-Driven Decision Making, Executive Presentations & Capstone Synthesis',
        l1: 'Translating Data Metrics into Strategic Business Decisions: Funnel Conversion, ROI, Churn & Margin Audits',
        l2: 'Structuring Compelling Data Storytelling Slide Decks for Executive Boards and Investors',
        deliverable: 'Complete Executive Business Intelligence Dossier with Strategic Growth Recommendations',
      },
    ],
    2: [
      {
        theme: 'Statistical Inference, Hypothesis Testing & A/B Experimentation Frameworks',
        l1: 'Probability Distributions, Central Limit Theorem, Confidence Intervals & Standard Error Estimation',
        l2: 'A/B Testing Methodology: Null Hypothesis, T-Tests, Chi-Square Tests, P-Values & Statistical Power Sizing',
        deliverable: 'A/B Experimentation Analysis Report Evaluating User Conversion Uplift with Statistical Significance',
      },
    ],
    3: [
      {
        theme: 'Predictive Business Analytics, Customer Lifetime Value (LTV) & Churn Modeling',
        l1: 'Feature Engineering for Business Data: Recency-Frequency-Monetary (RFM) Segmentation & Cohorts',
        l2: 'Building Predictive Customer Churn Classifiers & Lifetime Value Regression Models with Scikit-Learn',
        deliverable: 'Customer Churn Risk Prediction Engine with Proactive Retention Intervention Playbook',
      },
    ],
    4: [
      {
        theme: 'Modern Enterprise Data Stack: Snowflake/BigQuery, dbt Transformations & Data Governance',
        l1: 'Cloud Data Warehousing: Fact/Dimension Staging, ELT Pipelines & dbt (Data Build Tool) Modeling',
        l2: 'Data Quality Auditing, Role-Based Access Governance, Data Lineage & Enterprise Analytics SLAs',
        deliverable: 'Enterprise Data Warehouse Blueprint, dbt Transformation Pipeline & Data Governance Spec',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. CYBERSECURITY, CLOUD COMPUTING & DEVOPS (CSE-05, 06, 07, 09)
  // -------------------------------------------------------------------------
  cyber_cloud: {
    1: [
      {
        theme: 'Computer Systems Architecture, Linux Command Line & Operating System Security',
        l1: 'Linux Architecture: Kernel, Filesystem Hierarchy (FHS), User/Group Permissions & SSH Key Management',
        l2: 'Shell Scripting (Bash), Process Management (systemd), Cron Automation & Security Hardening Benchmarks',
        deliverable: 'Automated Linux Server Provisioning Script with SSH Hardening and Firewall Configuration',
      },
      {
        theme: 'Enterprise Computer Networking, OSI Model, Subnetting & Packet Analysis',
        l1: 'OSI 7-Layer and TCP/IP Models, IPv4/IPv6 CIDR Subnet Sizing, ARP, DNS, DHCP & NAT Mechanisms',
        l2: 'Wireshark Network Packet Inspection: Capturing TCP 3-Way Handshakes, Diagnosing Anomalies & DNS Latency',
        deliverable: 'Network Architecture Blueprint with Certified Subnetting Plan and Wireshark Packet Capture Analysis',
      },
      {
        theme: 'Cybersecurity Pillars, CIA Triad, Threat Modeling & Defensive Security Controls',
        l1: 'Confidentiality, Integrity, Availability: Authentication Factors (MFA), Access Control (RBAC) & Defense-in-Depth',
        l2: 'Configuring Host-Based Firewalls (UFW / iptables), Intrusion Prevention (Fail2ban) & Port Scanning with Nmap',
        deliverable: 'Host Defense Audit Report Demonstrating Blocked Brute-Force Attacks and Closed Attack Surface',
      },
      {
        theme: 'Containerization Fundamentals, Dockerfile Architecture & Multi-Container Networks',
        l1: 'Containers vs Virtual Machines: Namespaces, cgroups, Layered Image Architecture & Base Images',
        l2: 'Writing Production Multi-Stage Dockerfiles, Optimizing Image Sizes & Docker Compose Orchestration',
        deliverable: 'Multi-Container Application Stack (Web, API, Database, Redis) Orchestrated via Docker Compose',
      },
      {
        theme: 'Cloud Infrastructure, Amazon Web Services (AWS) Core Services & Virtual Networks',
        l1: 'AWS Global Infrastructure: Virtual Private Clouds (VPC), Public/Private Subnets, Internet Gateways & Route Tables',
        l2: 'Provisioning Scalable Compute (EC2), Elastic Load Balancers (ALB), Auto-Scaling Groups & S3 Storage',
        deliverable: 'Fault-Tolerant AWS VPC Infrastructure Architecture Hosting Load-Balanced Web Instances',
      },
      {
        theme: 'Continuous Integration & Continuous Deployment (CI/CD) with GitHub Actions',
        l1: 'CI/CD Pipelines: Automated Triggers, Branch Protection Rules, Secret Management & Test Workflows',
        l2: 'Writing GitHub Actions Workflows to Automatically Build, Test, and Deploy Docker Images to Cloud Servers',
        deliverable: 'Fully Automated GitHub Actions CI/CD Pipeline Deploying Verified Commits with Zero Downtime',
      },
    ],
    2: [
      {
        theme: 'Infrastructure as Code (IaC) with Terraform & Cloud Security Policies',
        l1: 'Declarative Infrastructure: Terraform State, Providers, Modules, Variables & Dependency Graphs',
        l2: 'Provisioning Complete Cloud Environments with Terraform & Implementing Strict IAM Least-Privilege Policies',
        deliverable: 'Production Terraform Module Provisioning Multi-Tier Cloud Infrastructure with Zero Drift',
      },
      {
        theme: 'Kubernetes Container Orchestration: Pods, Deployments, Services & Ingress',
        l1: 'Kubernetes Control Plane & Worker Architecture: Deployments, ReplicaSets, Rolling Updates & Health Probes',
        l2: 'Service Discovery: ClusterIP, NodePort, LoadBalancer, Ingress Controllers & TLS Termination with Let’s Encrypt',
        deliverable: 'Production Kubernetes Cluster Manifest Running Self-Healing Microservices with Ingress Routing',
      },
    ],
    3: [
      {
        theme: 'Penetration Testing, Ethical Hacking & Web Application Security (OWASP Top 10)',
        l1: 'Reconnaissance, Vulnerability Assessment, SQL Injection, Cross-Site Scripting (XSS), CSRF & Auth Flaws',
        l2: 'Exploitation Mitigation: Parameterized Queries, CSP Headers, Secure Session Cookies & WAF Rules',
        deliverable: 'Full Penetration Testing Audit Report on Vulnerable Web Target with Documented Remediation Patches',
      },
    ],
    4: [
      {
        theme: 'Enterprise Security Operations (SOC), SIEM Monitoring & Incident Response Governance',
        l1: 'Centralized Log Aggregation (Elastic/Splunk), Security Information and Event Management (SIEM) Rules',
        l2: 'Incident Response Playbooks: Containment, Eradication, Post-Mortem Analysis & Enterprise Cybersecurity SLAs',
        deliverable: 'SOC Incident Response Runbook, Automated SIEM Alert Rule Matrix & Disaster Recovery SLA Spec',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. FULL-STACK SOFTWARE ENGINEERING & MODERN WEB DEVELOPMENT (CSE-01..04)
  // -------------------------------------------------------------------------
  software: {
    1: [
      {
        theme: 'Software Engineering Foundations, Git Version Control & Modern Web Architecture',
        l1: 'Internet Mechanics: Client-Server Architecture, DNS, HTTP/HTTPS Request-Response Lifecycles & REST Verbs',
        l2: 'Git Collaborative Workflows: Branching Strategies (GitFlow), Merge Conflicts, Pull Requests & Code Reviews',
        deliverable: 'Clean Multi-Branch GitHub Repository with Continuous Commit Standards and Collaboration History',
      },
      {
        theme: 'Semantic HTML5, Accessible Web Standards & Modern CSS3 Layout Mechanics',
        l1: 'Semantic Document Outlining, Screen Reader Accessibility (ARIA Roles), Web Semantics & SEO Metadata',
        l2: 'CSS Flexbox 1D Layouts, CSS Grid 2D Systems, Custom Variables & Mobile-First Responsive Breakpoints',
        deliverable: 'Pixel-Perfect Responsive Multi-Page Web Platform Validated Against Accessibility Benchmarks',
      },
      {
        theme: 'Modern JavaScript (ES6+), DOM Manipulation & Asynchronous Programming',
        l1: 'JavaScript Engine Mechanics: Call Stack, Event Loop, Closures, Scoping & Array Transformation Methods',
        l2: 'DOM Traversal, Event Delegation, Fetch API, Promises, Async/Await Syntax & Error Handling Patterns',
        deliverable: 'Dynamic Web Application Consuming Third-Party REST APIs with Robust Error States and Loading Skeletons',
      },
      {
        theme: 'Component-Driven Frontend Architecture with React & State Management',
        l1: 'React Fundamentals: Virtual DOM, JSX Syntax, Functional Components, Props Contracts & Pure Functions',
        l2: 'React Hooks: useState State Machines, useEffect Lifecycle Synchronization & Custom Reusable Hooks',
        deliverable: 'Interactive Modular Single-Page React Application with Fluid State Transitions and Component Isolation',
      },
      {
        theme: 'Backend Architecture with Node.js, Express & RESTful API Engineering',
        l1: 'Node.js Runtime: Non-Blocking Event-Driven I/O, Module Systems & Express Router Middleware Pipelines',
        l2: 'RESTful API Design: Resource Naming, Status Codes, Input Validation with Zod & Centralized Error Handlers',
        deliverable: 'Production REST API Server with Robust Routing, Input Sanitization and Structured JSON Responses',
      },
      {
        theme: 'Relational Database Engineering with PostgreSQL & Prisma ORM',
        l1: 'Relational Schema Design: 1-to-1, 1-to-Many, Many-to-Many Relationships, Indexes & Foreign Key Constraints',
        l2: 'Database Modeling with Prisma ORM: Automated Migrations, Relational Queries & Transactional Safety',
        deliverable: 'Production Database Layer with Prisma Schema, Automated Migrations and Seed Scripts',
      },
    ],
    2: [
      {
        theme: 'User Authentication, Authorization (RBAC) & Secure JWT Session Architecture',
        l1: 'Cryptographic Password Hashing (bcrypt/argon2), JWT Token Lifecycles (Access vs Refresh Tokens)',
        l2: 'Role-Based Access Control (RBAC) Middleware Protecting Secured Endpoints Against Privilege Escalation',
        deliverable: 'Complete Secure Authentication System Supporting Registration, Login, Token Refresh & Role Verification',
      },
      {
        theme: 'Modern Full-Stack Frameworks (Next.js), Server Components & Tailwind CSS',
        l1: 'Next.js App Router: Server Components vs Client Components, Server Actions & Streaming Server-Side Rendering',
        l2: 'Rapid Utility-First Styling with Tailwind CSS: Dark Mode, Fluid Typography & Reusable Component Systems',
        deliverable: 'Full-Stack Next.js Web Application Utilizing Server Components for Optimized First Contentful Paint',
      },
    ],
    3: [
      {
        theme: 'Automated Testing Suites: Unit, Integration & End-to-End Verification (Jest/Playwright)',
        l1: 'Testing Pyramid: Unit Testing Pure Functions with Jest, Mocking External Services & Code Coverage Reports',
        l2: 'Integration Testing API Endpoints with Supertest & End-to-End User Journey Testing with Playwright',
        deliverable: 'Automated Test Suite Achieving Over 80% Code Coverage Across Frontend and Backend Services',
      },
    ],
    4: [
      {
        theme: 'Enterprise Microservices Architecture, Cloud Deployment & High-Availability SLAs',
        l1: 'Decoupled Microservices: Event-Driven Message Queues (RabbitMQ/Kafka), Redis Caching & Rate Limiting',
        l2: 'Deploying Full-Stack Applications to Production Cloud Environments with Health Checks and Uptime SLAs',
        deliverable: 'Enterprise High-Availability Full-Stack Web System with Caching, Health Telemetry & Service Level Spec',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 10. BUSINESS, ENTREPRENEURSHIP & STARTUP LAB (BIE-01..05, ISL-01..06)
  // -------------------------------------------------------------------------
  business: {
    1: [
      {
        theme: 'Entrepreneurial Mindset, Problem Discovery & Market Need Validation',
        l1: 'Identifying High-Impact Market Inefficiencies, Pain Points vs Niceties & Formulating Solution Hypotheses',
        l2: 'Conducting Customer Discovery Interviews: Avoiding Biases (The Mom Test) & Synthesizing Qualitative Evidence',
        deliverable: 'Validated Customer Problem Statement Dossier with Transcripts of 20+ Customer Interviews',
      },
      {
        theme: 'Business Model Canvas Architecture & Value Proposition Design',
        l1: 'The 9 Building Blocks: Customer Segments, Value Propositions, Channels, Revenue Streams & Cost Structure',
        l2: 'Designing Unique Value Propositions (UVP) That Outperform Alternatives & Defending Competitive Moats',
        deliverable: 'Comprehensive Business Model Canvas (BMC) with Detailed Strategic Justification for Each Block',
      },
      {
        theme: 'Minimum Viable Product (MVP) Scoping, Rapid Prototyping & Lean Validation',
        l1: 'Scoping an MVP: Distinguishing Core Features from Distractions, MoSCoW Prioritization & Wizard-of-Oz Testing',
        l2: 'Building Rapid No-Code / Low-Code Prototypes to Validate Market Demand Before Writing Full Code',
        deliverable: 'Deployed MVP Prototype Demonstrating First User Signups and Qualitative Feedback Loops',
      },
      {
        theme: 'Unit Economics, Pricing Strategies, Financial Projections & Cash Flow Runway',
        l1: 'Unit Economics: Customer Acquisition Cost (CAC), Lifetime Value (LTV), Payback Period & Gross Margins',
        l2: 'Building a 3-Year Pro-Forma Financial Model in Excel: Revenue Forecasts, Headcount & Burn Rate Scenarios',
        deliverable: 'Complete 3-Year Financial Model and Unit Economics Calculator with Sensitivity Analysis',
      },
      {
        theme: 'Go-To-Market (GTM) Strategy, Customer Acquisition Funnels & Sales Execution',
        l1: 'B2B vs B2C Customer Acquisition Channels: Inbound Content, Outbound Cold Email, Social Ads & Partnerships',
        l2: 'Designing Sales Pipelines: Lead Generation, Discovery Calls, Objection Handling & Closing Enterprise Deals',
        deliverable: '90-Day Go-To-Market Execution Plan with Multi-Channel CAC Estimates and Sales Playbook',
      },
      {
        theme: 'Investor Pitch Deck Architecture, Demo Day Defense & Seed Fundraising',
        l1: 'The 10-Slide Investor Deck Structure: Problem, Solution, Market Size (TAM/SAM/SOM), Traction & Team',
        l2: 'Delivering a High-Impact 3-Minute Verbal Pitch, Managing Tough Investor Q&A & Term Sheet Fundamentals',
        deliverable: 'Professional 10-Slide Investor Deck and Recorded 3-Minute Pitch Video Ready for Demo Day',
      },
    ],
    2: [
      {
        theme: 'Corporate Legal Structuring, Equity Cap Tables & Regulatory Compliance in Nigeria',
        l1: 'Incorporation Types (CAC Nigeria / Delaware C-Corp), Founders Agreements & Vesting Schedules with 1-Year Cliff',
        l2: 'Simulating Cap Tables: Dilution Across Pre-Seed, Seed, and Series A Funding Rounds & SAFE Notes',
        deliverable: 'Founder Equity Vesting Schedule, Cap Table Simulation Model & Regulatory Compliance Checklist',
      },
    ],
    3: [
      {
        theme: 'Growth Loops, Product-Led Growth (PLG) & Conversion Rate Optimization (CRO)',
        l1: 'Retention Loops vs Traditional Funnels: Viral Coefficients, Content Loops & Referral Mechanisms',
        l2: 'Onboarding Funnel Analytics: Identifying Activation Bottlenecks & Executing High-Impact A/B Experiments',
        deliverable: 'Product-Led Growth Architecture Map with Documented User Retention and Activation Funnel',
      },
    ],
    4: [
      {
        theme: 'Venture Scaling, Organizational Leadership & Post-Academic Venture Launch',
        l1: 'Hiring Key Leadership, Setting Objectives and Key Results (OKRs) & Cross-Functional Squad Management',
        l2: 'Structuring Governance Boards, Advisory Councils & Preparing for Institutional Venture Capital Due Diligence',
        deliverable: 'Complete Enterprise Venture Scaling Plan, Executive Governance Charter & Investor Due Diligence Room',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 11. STEMPACT KIDS & TEENS (SKT-01..06)
  // -------------------------------------------------------------------------
  junior: {
    1: [
      {
        theme: 'Creative Computing, Algorithmic Thinking & Digital Storytelling',
        l1: 'How Computers Think: Algorithms, Sequential Instructions, Decomposition & Digital Safety Guardrails',
        l2: 'Navigating Block Coding Platforms: Sprites, Stages, Costumes, Sounds & Building an Animated Digital Postcard',
        deliverable: 'Interactive Animated Digital Storybook Featuring Custom Characters and Sound Effects',
      },
      {
        theme: 'Block-Based Game Mechanics: Events, Movement & Collision Detection in Scratch',
        l1: 'XY Coordinate Plane Geometry: Moving Sprites, Glide Blocks & Keyboard Event Triggers for Player Controls',
        l2: 'Collision Detection with Sensing Blocks: Bounce Physics, Score Variables & Game Over Conditions',
        deliverable: 'Playable 2D Catch-the-Target Arcade Game with Real-Time Scoreboard and Sound Effects',
      },
      {
        theme: 'Conditional Logic, Loops & Game Physics: Platformer Game Development',
        l1: 'Conditional Branching: IF/THEN/ELSE Decisions, Repeat Until Loops & Controlling Game Speed',
        l2: 'Simulating Gravity and Jumping Physics in Scratch: Vertical Velocity Variables & Platform Landings',
        deliverable: 'Original 2-Level Platformer Adventure Game with Obstacles and Collectible Stars',
      },
      {
        theme: 'Physical Computing with Microcontrollers: BBC micro:bit & Circuit Tinkering',
        l1: 'Physical Electronics: LED 5x5 Matrix Displays, Push Buttons, Light Sensors & Micro:bit Pinouts',
        l2: 'Programming the Micro:bit Using MakeCode Blocks: Creating Digital Badges, Dice & Step Counters',
        deliverable: 'Interactive Wearable Micro:bit Gadget with Animated LED Icons and Button Responses',
      },
      {
        theme: 'Young Web Developers: Building First Web Pages with HTML & CSS',
        l1: 'What is the Web? HTML Headings, Paragraphs, Images, Hyperlinks & Structuring a Personal Page',
        l2: 'Styling with CSS: Colors, Fonts, Backgrounds, Borders & Making a Colorful Teen Portfolio Page',
        deliverable: 'Live Personal Teen Hobby / School Society Web Page Styled with Custom CSS',
      },
      {
        theme: 'Young AI & Digital Innovators: Machine Learning with Teachable Machine',
        l1: 'How AI Learns: Training Data vs Testing Data, Recognizing Patterns in Images, Sounds & Poses',
        l2: 'Training an AI Model with Google Teachable Machine & Exporting it into a Live Web Camera Application',
        deliverable: 'Interactive AI Camera App Classifying Hand Gestures or Household Objects with Live Predictions',
      },
    ],
    2: [
      {
        theme: 'Transitioning to Text Coding: Python Turtle Graphics & Interactive Coding',
        l1: 'Writing Real Text Code: Python Syntax, Indentation, Variables, Input Functions & Printing Text',
        l2: 'Python Turtle Graphics: Drawing Geometric Fractals, Spirals, Polygons & Creating Digital Artwork with Code',
        deliverable: 'Python Turtle Digital Art Gallery Generating Complex Geometric Patterns from Mathematical Loops',
      },
    ],
    3: [
      {
        theme: 'Python Arcade Game Design: Pygame Zero & Object-Oriented Sprites',
        l1: 'Game Loops in Python: Frame Rates, Updating Positions, Drawing Sprites & Detecting Mouse/Keyboard Inputs',
        l2: 'Building Classic Arcade Games (Pong / Space Invaders) with Sound Effects and High-Score Saving',
        deliverable: 'Fully Functional Python Arcade Video Game with Soundtracks, Enemy Spawning and Lives Tracker',
      },
    ],
    4: [
      {
        theme: 'Young Entrepreneurs: Junior Venture Project & Junior Demo Day Showcase',
        l1: 'Brainstorming Youth Inventions: Identifying School/Community Problems & Designing Simple Digital Solutions',
        l2: 'Preparing a 2-Minute Junior Pitch, Designing Marketing Posters in Canva & Presenting to Parents/Judges',
        deliverable: 'Complete Junior Tech Project Portfolio and 2-Minute Pitch Presentation for STEMPACT Youth Fair',
      },
    ],
  },
};
