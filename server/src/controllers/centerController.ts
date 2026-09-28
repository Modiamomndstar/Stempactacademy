import { Request, Response } from 'express';
import { CenterType, Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

/**
 * Get all active learning centers, with optional filtering by city, type, or country
 */
export const getCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, state, country, type, includeInactive } = req.query;

    const where: any = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }
    if (city) {
      where.cityOrTown = { contains: String(city), mode: 'insensitive' };
    }
    if (state) {
      where.stateOrRegion = { contains: String(state), mode: 'insensitive' };
    }
    if (country) {
      where.country = { contains: String(country), mode: 'insensitive' };
    }
    if (type && Object.values(CenterType).includes(type as CenterType)) {
      where.centerType = type as CenterType;
    }

    const centers = await prisma.learningCenter.findMany({
      where,
      orderBy: [{ centerType: 'asc' }, { cityOrTown: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { cohorts: true, applications: true },
        },
      },
    });

    res.status(200).json({ centers });
  } catch (error: any) {
    console.error('getCenters error:', error);
    res.status(500).json({ message: 'Failed to fetch learning centers.' });
  }
};

/**
 * Get a single learning center by ID or Code
 */
export const getCenterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const center = await prisma.learningCenter.findFirst({
      where: {
        OR: [{ id }, { code: id.toUpperCase() }],
      },
      include: {
        cohorts: {
          where: { status: { in: ['OPEN', 'ALMOST_FULL', 'UPCOMING', 'IN_PROGRESS'] } },
          include: { program: true },
        },
      },
    });

    if (!center) {
      res.status(404).json({ message: 'Learning center not found.' });
      return;
    }

    res.status(200).json({ center });
  } catch (error: any) {
    console.error('getCenterById error:', error);
    res.status(500).json({ message: 'Failed to fetch learning center details.' });
  }
};

/**
 * Create a new learning center - SUPER_ADMIN only
 */
export const createCenter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      name,
      centerType = CenterType.MAIN_CAMPUS,
      country = 'Nigeria',
      stateOrRegion = 'Osun State',
      cityOrTown = 'Ile-Ife',
      neighborhood,
      address,
      landmark,
      sponsorPartnerName,
      timezone = 'Africa/Lagos',
      capacity = 30,
    } = req.body;

    if (!code || !name || !address) {
      res.status(400).json({ message: 'Center code, name, and address are required.' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await prisma.learningCenter.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      res.status(400).json({ message: `A center with code "${normalizedCode}" already exists.` });
      return;
    }

    const center = await prisma.learningCenter.create({
      data: {
        code: normalizedCode,
        name: name.trim(),
        centerType: centerType as CenterType,
        country: country.trim(),
        stateOrRegion: stateOrRegion.trim(),
        cityOrTown: cityOrTown.trim(),
        neighborhood: neighborhood?.trim() || null,
        address: address.trim(),
        landmark: landmark?.trim() || null,
        sponsorPartnerName: sponsorPartnerName?.trim() || null,
        timezone: timezone.trim(),
        capacity: Number(capacity) || 30,
        isActive: true,
      },
    });

    res.status(201).json({ message: 'Learning center created successfully.', center });
  } catch (error: any) {
    console.error('createCenter error:', error);
    res.status(500).json({ message: 'Failed to create learning center.' });
  }
};

/**
 * Update an existing learning center - SUPER_ADMIN only
 */
export const updateCenter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      centerType,
      country,
      stateOrRegion,
      cityOrTown,
      neighborhood,
      address,
      landmark,
      sponsorPartnerName,
      timezone,
      capacity,
      isActive,
    } = req.body;

    const existing = await prisma.learningCenter.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Learning center not found.' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (centerType) updateData.centerType = centerType as CenterType;
    if (country) updateData.country = country.trim();
    if (stateOrRegion) updateData.stateOrRegion = stateOrRegion.trim();
    if (cityOrTown) updateData.cityOrTown = cityOrTown.trim();
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood?.trim() || null;
    if (address) updateData.address = address.trim();
    if (landmark !== undefined) updateData.landmark = landmark?.trim() || null;
    if (sponsorPartnerName !== undefined) updateData.sponsorPartnerName = sponsorPartnerName?.trim() || null;
    if (timezone) updateData.timezone = timezone.trim();
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.learningCenter.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ message: 'Learning center updated successfully.', center: updated });
  } catch (error: any) {
    console.error('updateCenter error:', error);
    res.status(500).json({ message: 'Failed to update learning center.' });
  }
};

/**
 * Auto-ensure standard initial centers exist
 */
export const ensureInitialCenters = async (): Promise<void> => {
  try {
    const initialCenters = [
      {
        code: 'IFE-MAIN',
        name: 'STEMPACT Innovation Hub — Fajuyi Main Campus',
        centerType: CenterType.MAIN_CAMPUS,
        country: 'Nigeria',
        stateOrRegion: 'Osun State',
        cityOrTown: 'Ile-Ife',
        neighborhood: 'Fajuyi / Central',
        address: '14 Fajuyi Road, Central District, Ile-Ife, Osun State',
        landmark: 'Opposite Innovation Circle',
        timezone: 'Africa/Lagos',
        capacity: 40,
      },
      {
        code: 'IFE-MAYFAIR',
        name: 'STEMPACT Satellite Center — Mayfair Wing',
        centerType: CenterType.SATELLITE_CENTER,
        country: 'Nigeria',
        stateOrRegion: 'Osun State',
        cityOrTown: 'Ile-Ife',
        neighborhood: 'Mayfair',
        address: '22 Mayfair Avenue, Off Ibadan Road, Ile-Ife, Osun State',
        landmark: 'Near Mayfair Roundabout',
        timezone: 'Africa/Lagos',
        capacity: 25,
      },
      {
        code: 'VIRTUAL-GLOBAL',
        name: 'STEMPACT Virtual Global Campus',
        centerType: CenterType.VIRTUAL_GLOBAL,
        country: 'Global',
        stateOrRegion: 'Worldwide',
        cityOrTown: 'Online Interactive',
        neighborhood: 'Digital Classrooms & Lab Cloud',
        address: 'STEMPACT Cloud Learning Infrastructure',
        landmark: 'https://stempactacademy.com/virtual',
        timezone: 'Africa/Lagos',
        capacity: 500,
      },
      {
        code: 'IFE-NITDA-PARTNER',
        name: 'STEMPACT Partner Hub — Osun Youth Innovation Center',
        centerType: CenterType.GOVERNMENT_SPONSORED,
        country: 'Nigeria',
        stateOrRegion: 'Osun State',
        cityOrTown: 'Ile-Ife',
        neighborhood: 'OAU Environs',
        address: 'Osun State Innovation Complex, Road 1, Ile-Ife',
        landmark: 'State ICT Center',
        sponsorPartnerName: 'Osun State Ministry of Innovation & Digital Economy',
        timezone: 'Africa/Lagos',
        capacity: 35,
      },
    ];

    for (const c of initialCenters) {
      await prisma.learningCenter.upsert({
        where: { code: c.code },
        create: c,
        update: {
          name: c.name,
          centerType: c.centerType,
          address: c.address,
        },
      });
    }
  } catch (err: any) {
    console.warn('Initial centers seeding warning:', err.message);
  }
};

export const seedDefaultCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureInitialCenters();
    const centers = await prisma.learningCenter.findMany();
    res.status(200).json({ message: 'Default learning centers seeded successfully.', centers });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to seed centers' });
  }
};
