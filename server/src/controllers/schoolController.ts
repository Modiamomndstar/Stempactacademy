import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { programs: true },
        },
      },
    });
    res.status(200).json({ schools });
  } catch (error: any) {
    console.error('getSchools error:', error);
    res.status(500).json({ message: 'Failed to fetch schools' });
  }
};

export const getSchoolByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const school = await prisma.school.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        programs: {
          include: {
            cohorts: {
              where: { status: { in: ['OPEN', 'ALMOST_FULL'] } },
            },
          },
        },
      },
    });

    if (!school) {
      res.status(404).json({ message: 'School not found' });
      return;
    }

    res.status(200).json({ school });
  } catch (error: any) {
    console.error('getSchoolByCode error:', error);
    res.status(500).json({ message: 'Failed to fetch school details' });
  }
};

/**
 * Create a new School/Faculty - SUPER_ADMIN or ACADEMIC_ADMIN only
 */
export const createSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, description, color, icon, order } = req.body;

    if (!code || !name) {
      res.status(400).json({ message: 'School code and name are required.' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await prisma.school.findUnique({ where: { code: normalizedCode } });
    if (existing) {
      res.status(400).json({ message: `A school with code "${normalizedCode}" already exists.` });
      return;
    }

    const school = await prisma.school.create({
      data: {
        code: normalizedCode,
        name: name.trim(),
        description: description?.trim() || `School of ${name.trim()} at STEMPACT Academy.`,
        color: color || '#2563eb',
        icon: icon || 'BookOpen',
        order: Number(order) || 0,
      },
    });

    res.status(201).json({ message: 'School created successfully.', school });
  } catch (error: any) {
    console.error('createSchool error:', error);
    res.status(500).json({ message: error.message || 'Failed to create school.' });
  }
};

/**
 * Update an existing School/Faculty - SUPER_ADMIN or ACADEMIC_ADMIN only
 */
export const updateSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, order } = req.body;

    const existing = await prisma.school.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }] },
    });

    if (!existing) {
      res.status(404).json({ message: 'School not found.' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (color) updateData.color = color;
    if (icon) updateData.icon = icon;
    if (order !== undefined) updateData.order = Number(order);

    const updated = await prisma.school.update({
      where: { id: existing.id },
      data: updateData,
    });

    res.status(200).json({ message: 'School updated successfully.', school: updated });
  } catch (error: any) {
    console.error('updateSchool error:', error);
    res.status(500).json({ message: error.message || 'Failed to update school.' });
  }
};

/**
 * Delete a School/Faculty - SUPER_ADMIN only
 */
export const deleteSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.school.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }] },
      include: { _count: { select: { programs: true } } },
    });

    if (!existing) {
      res.status(404).json({ message: 'School not found.' });
      return;
    }

    if (existing._count.programs > 0) {
      res.status(400).json({
        message: `Cannot delete school "${existing.name}" because it contains ${existing._count.programs} active programs. Reassign or remove programs first.`,
      });
      return;
    }

    await prisma.school.delete({ where: { id: existing.id } });
    res.status(200).json({ message: `School "${existing.name}" deleted successfully.` });
  } catch (error: any) {
    console.error('deleteSchool error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete school.' });
  }
};

